const mongoose = require("mongoose");

const analyticsDailySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    page: { type: String, required: true },
    views: { type: Number, default: 0 },
    visitors: [{ type: String }],
  },
  { timestamps: true },
);

analyticsDailySchema.index({ date: 1, page: 1 }, { unique: true });

module.exports = mongoose.model("AnalyticsDaily", analyticsDailySchema);
