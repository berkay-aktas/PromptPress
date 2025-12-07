import { Schema, model, type Document } from "mongoose";

export interface UserDoc extends Document {
  email: string;
  name: string;
  role: "admin" | "author";
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["admin", "author"],
      default: "author",
      required: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export default model("User", UserSchema);

