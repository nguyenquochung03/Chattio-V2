const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    muteNotifications: {
      type: Map,
      of: new Schema({
        duration: {
          type: Number,
          enum: [15, 60, 480, 1440, -1],
          default: null,
        },
        muteUntil: {
          type: Date,
          default: null,
        },
      }),
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;
