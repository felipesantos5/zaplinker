import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  phone: String,
  createdAt: { type: Date, default: Date.now },
  personalHash: { type: Date, default: Date.now },
  role: { type: String, default: "free", enum: ["free", "pro", "premium"] },
});

const User = mongoose.model("User", userSchema);

export default User;
