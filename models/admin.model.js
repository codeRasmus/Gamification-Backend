const mongoose = require("mongoose");

// Mongoose schema for Admin-oprettelse
const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { collection: "admins" }
);

module.exports = mongoose.model("Admin", adminSchema);
