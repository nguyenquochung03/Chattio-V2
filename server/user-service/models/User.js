const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      lowercase: true,
      match: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
      default: "",
    },
    facebookId: {
      type: String,
      unique: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    lastActiveAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: false },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    subscription: {
      type: Object,
      default: null,
    },
    inCall: { type: Boolean, default: false },
    callWith: { type: Schema.Types.ObjectId, ref: "User", default: null },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ["public", "friends", "private"],
        default: "public",
      },
      chatPermission: {
        type: String,
        enum: ["everyone", "friends", "no one"],
        default: "everyone",
      },
      callPermission: {
        type: String,
        enum: ["everyone", "friends", "no one"],
        default: "everyone",
      },
    },
    twoFactorSecret: { type: String, default: null },
    loginHistory: [
      {
        ipAddress: { type: String, default: "" },
        device: { type: Object, default: "" },
        loggedAt: { type: Date, default: Date.now },
      },
    ],
    isRemember: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
