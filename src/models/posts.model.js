const mongoose = require("mongoose");

const postsSchema = new mongoose.Schema(
  {
    admin_id: {
      type: Number,
      required: true,
    },
    message_id: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("posts", postsSchema);
