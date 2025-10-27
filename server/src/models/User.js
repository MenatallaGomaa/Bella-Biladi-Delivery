import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema(
  {
    label: { type: String, default: "Zuhause" },
    name: String,
    phone: String,
    street: String,
    postalCity: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);
