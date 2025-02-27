const express = require("express");
const authenticateJWT = require("../middleware/authMiddleware");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");

const router = express.Router();

// GET /quizzes → Get all quizzes
router.get("/", authenticateJWT, async (req, res) => {
  const quizzes = await Quiz.find({}, "title totalScore duration");
  res.json(quizzes);
});

// POST /quizzes → Create a new quiz
router.post("/", authenticateJWT, async (req, res) => {
  const { title, numberOfQuestions, totalScore, duration } = req.body;

  const quiz = new Quiz({ title, numberOfQuestions, totalScore, duration, questions: [] });
  await quiz.save();

  res.status(201).json({ message: "Quiz created successfully", quiz });
});

// POST /quizzes/:id/questions → Add questions to quiz
router.post("/:id/questions", authenticateJWT, async (req, res) => {
  const { id } = req.params;
  const { questionText, options, correctAnswer, marks } = req.body;

  const quiz = await Quiz.findById(id);
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  quiz.questions.push({ questionText, options, correctAnswer, marks });
  await quiz.save();

  res.json({ message: "Question added to quiz", quiz });
});

// GET /quizzes/:id/participants → Get participants of a quiz
router.get("/:id/participants", authenticateJWT, async (req, res) => {
    const { id } = req.params;
  
    const attempts = await QuizAttempt.find({ quiz: id }).populate("user", "username");
  
    if (!attempts.length) return res.status(404).json({ message: "No participants found for this quiz" });
  
    const participants = attempts.map(attempt => ({
      userId: attempt.user._id,
      username: attempt.user.username, // Ensure username is stored in User model
      score: attempt.score,
      status: attempt.status,
    }));
  
    res.json(participants);
  });
  

// GET /quizzes/:id/response/:userId → Get a participant’s responses
router.get("/:id/response/:userId", authenticateJWT, async (req, res) => {
    const { id, userId } = req.params;
  
    const attempt = await QuizAttempt.findOne({ quiz: id, user: userId }).populate("quiz");
  
    if (!attempt) return res.status(404).json({ message: "User has not attempted this quiz" });
  
    res.json({
      userId,
      score: attempt.score,
      status: attempt.status,
      responses: attempt.responses,
    });
  });
  


router.get("/my-quizzes", authenticateJWT, async (req, res) => {
    
    const userId = req.user?.id;
    
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const quizzes = await Quiz.find({}, "title duration totalScore").lean();
    const attempts = await QuizAttempt.find({ user: userId });

    const quizStatus = quizzes.map((quiz) => {
      const attempt = attempts.find((att) => att.quiz.toString() === quiz._id.toString());
      return {
        ...quiz,
        status: attempt ? attempt.status : "Not Started",
      };
    });

    res.json(quizStatus);
});

  
  router.post("/:id/start", authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
  
    const quiz = await Quiz.findById(id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  
    let attempt = await QuizAttempt.findOne({ quiz: id, user: userId });
    if (!attempt) {
      attempt = new QuizAttempt({ quiz: id, user: userId, status: "In-Progress" });
      await attempt.save();
    }
  
    res.json({ message: "Quiz started", attempt });
  });

  
  router.post("/:id/submit", authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const { responses } = req.body; // Array of { questionId, selectedOption }
    const userId = req.user.id;
  
    const quiz = await Quiz.findById(id).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  
    let score = 0;
    responses.forEach((response) => {
      const question = quiz.questions.find((q) => q._id.toString() === response.questionId);
      if (question && question.correctAnswer === response.selectedOption) {
        score += question.marks;
      }
    });
  
    await QuizAttempt.findOneAndUpdate(
      { quiz: id, user: userId },
      { score, status: "Completed", responses },
      { upsert: true }
    );
  
    res.json({ message: "Quiz submitted successfully", score });
  });

  
  router.get("/:id/response", authenticateJWT, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
  
    const attempt = await QuizAttempt.findOne({ quiz: id, user: userId }).populate("quiz");
    if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  
    res.json({
      quizTitle: attempt.quiz.title,
      score: attempt.score,
      status: attempt.status,
      responses: attempt.responses,
    });
  });

  router.get("/:id/questions", authenticateJWT, async (req, res) => {
    const { id } = req.params;
  
    const quiz = await Quiz.findById(id).populate("questions");
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    res.json({ 
        quizTitle: quiz.title,
        duration: quiz.duration,
        totalScore: quiz.totalScore,
        questions: quiz.questions.map(q => ({
            id: q._id,
            title: q.title,  // Ensure the question title is included
            options: q.options
        }))
    });
});


  

module.exports = router;
