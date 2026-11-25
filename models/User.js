const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 60 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 200 },
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Activity info (everything is saved in MongoDB)
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date },
    lastIp: { type: String },
    lastUserAgent: { type: String },
    registeredIp: { type: String },
  },
  { timestamps: true } // createdAt + updatedAt
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
