const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options) => options.length === 4,
        message: "Each question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

questionSchema.pre("validate", function validateCorrectAnswer(next) {
  if (Array.isArray(this.options) && !this.options.includes(this.correctAnswer)) {
    this.invalidate("correctAnswer", "correctAnswer must match one of the options");
  }
  next();
});

const skillTestSchema = new mongoose.Schema({
  skillName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  questions: {
    type: [questionSchema],
    required: true,
    validate: {
      validator: (questions) => questions.length > 0,
      message: "A skill test must contain at least one question",
    },
  },
});

module.exports = mongoose.model("SkillTest", skillTestSchema);
