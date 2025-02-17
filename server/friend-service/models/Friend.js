const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
    },
    isConfirmed: {
      type: Boolean,
      default: false,
    },
    blockedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.status === "blocked";
      },
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Friend = mongoose.model("Friend", friendSchema);

module.exports = Friend;
