const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  photoURL: String,
  customUrl: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  personalHash: {
    type: String,
    unique: true,
    sparse: true,
    default: null,
  },
});

UserSchema.index({ personalHash: 1 }, { unique: false });

module.exports = mongoose.model("User", UserSchema);
