import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, unique: true, required: true },
  displayName: String,
  phone: String,
  createdAt: { type: Date, default: Date.now },
  personalHash: { type: Date, default: Date.now },
  role: { type: String, default: "free", enum: ["free", "mensal", "anual"] },
  stripeId: { type: String, default: null },
});

const User = mongoose.model("User", userSchema);

export default User;
