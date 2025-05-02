const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  Spørgsmål: { type: String, required: true },
  Kategori: { type: String, required: true },
  Kompetencetype: { type: String, required: true },
  Sværhedsgrad: { type: String, required: true },
  Opgavetype: { type: String, required: true },
  Medie: { type: String, required: true },
  Tid: { type: Number, required: true },
});

module.exports = mongoose.model("Task", taskSchema);
