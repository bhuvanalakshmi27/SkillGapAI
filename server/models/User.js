const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    college: {
      type: String,
      default: "",
    },

    branch: {
      type: String,
      default: "",
    },

    graduationYear: {
      type: Number,
      default: null,
    },

    targetRole: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);