const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  title: String,
  numberOfQuestions: Number,
  totalScore: Number,
  duration: Number, // in minutes
  questions: [
    {
      questionText: String,
      options: [String],
      correctAnswer: String,
      marks: Number,
    },
  ],
  participants: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      username: String,
      score: Number,
      status: { type: String, enum: ["In-Progress", "Completed"], default: "In-Progress" },
      responses: [
        {
          questionText: String,
          selectedAnswer: String,
          correctAnswer: String,
          marksObtained: Number,
        },
      ],
    },
  ],
});

module.exports = mongoose.model("Quiz", quizSchema);
