const mongoose = require("mongoose");

const postSettingSchema = new mongoose.Schema(
  {
    caption: {
      type: "String",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("postSetting", postSettingSchema);
