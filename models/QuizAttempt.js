const mongoose = require("mongoose");

const quizAttemptSchema = new mongoose.Schema({
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  score: { type: Number, default: 0 },
  status: { type: String, enum: ["Not Started", "In-Progress", "Completed"], default: "Not Started" },
  responses: [
    {
      questionId: mongoose.Schema.Types.ObjectId, // No need for ref
      selectedOption: String,
    },
  ],
});

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
