const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true }, // Hash único (cookie + IP)
  ip: { type: String, required: true },
  userAgent: String,
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
});

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 25 },
    customUrl: {
      type: String,
      required: true,
      unique: true,
      maxlength: 35,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    accessCount: { type: Number, default: 0 },
    desktopAccessCount: { type: Number, default: 0 },
    mobileAccessCount: { type: Number, default: 0 },
    visitors: [visitorSchema], // Array de visitantes únicos
    accessDetails: [
      {
        timestamp: { type: Date, default: Date.now },
        deviceType: { type: String, enum: ["mobile", "desktop"] },
        ipAddress: String,
        visitorId: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para otimização
workspaceSchema.index({ customUrl: 1 });
workspaceSchema.index({ "visitors.visitorId": 1 });

// Campo virtual para contagem
workspaceSchema.virtual("uniqueVisitorCount").get(function () {
  return this.visitors.length;
});

const Workspace = mongoose.model("Workspace", workspaceSchema);
module.exports = Workspace;
