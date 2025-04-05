const UniqueVisitorSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  visits: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      deviceType: {
        type: String,
        enum: ["mobile", "desktop"],
        required: true,
      },
    },
  ],
});

export const UniqueVisitor = mongoose.model("UniqueVisitor", UniqueVisitorSchema);
