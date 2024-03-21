const mongoose = require("mongoose");

const adminMessagesSchema = new mongoose.Schema(
  {
    message_text: {
      type: "String",
    },
    user_id: {
      type: Number,
      required: true,
    },
    forward_date: {
      type: Number,
      required: true,
    },
    file_id: {
      type: "String",
    },
    file_unique_id: {
      type: "String",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("adminMessages", adminMessagesSchema);
