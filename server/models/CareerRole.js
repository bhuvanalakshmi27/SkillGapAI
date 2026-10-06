const mongoose = require("mongoose");

const careerRoleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
    trim: true,
  },
  skills: [
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      requiredLevel: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      importance: {
        type: String,
        enum: ["High", "Medium", "Low"],
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("CareerRole", careerRoleSchema);
