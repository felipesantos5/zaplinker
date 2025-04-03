import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true }, // Hash único (cookie + IP)
  ip: { type: String, required: true },
  userAgent: String,
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
  country: { type: String },
});

const utmSchema = new mongoose.Schema(
  {
    utm_source: { type: String, trim: true, maxlength: 255 },
    utm_medium: { type: String, trim: true, maxlength: 255 },
    utm_campaign: { type: String, trim: true, maxlength: 255 },
    utm_term: { type: String, trim: true, maxlength: 255 },
    utm_content: { type: String, trim: true, maxlength: 255 },
  },
  { _id: false }
);

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
    utmParameters: {
      utm_source: { type: String, default: null },
      utm_medium: { type: String, default: null },
      utm_campaign: { type: String, default: null },
      utm_term: { type: String, default: null },
      utm_content: { type: String, default: null },
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
        country: String,
        utmParameters: utmSchema,
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

export default mongoose.model("Workspace", workspaceSchema);
