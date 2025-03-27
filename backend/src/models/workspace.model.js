const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 25,
    },
    customUrl: {
      type: String,
      required: true,
      unique: true,
      maxlength: 35,
      match: /^[a-zA-Z0-9_-]+$/,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
    desktopAccessCount: {
      type: Number,
      default: 0,
    },
    mobileAccessCount: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: [String], // Array de IPs únicos
      default: [],
    },
    accessDetails: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        deviceType: {
          type: String,
          enum: ["mobile", "desktop"],
        },
        ipAddress: String,
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice para garantir IPs únicos
workspaceSchema.index({ uniqueVisitors: 1 }, { unique: true, sparse: true });

// Campo virtual para contar IPs únicos
workspaceSchema.virtual("uniqueVisitorCount").get(function () {
  return this.uniqueVisitors;
});

const Workspace = mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;
