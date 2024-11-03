const mongoose = require("mongoose");

const WhatsappNumberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  number: { type: String, required: true },
  text: String,
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model("WhatsappNumber", WhatsappNumberSchema);
