import { Schema, model, type Document, Types } from "mongoose";

export interface CommentDoc extends Document {
  blog: Types.ObjectId;
  user: Types.ObjectId | null;
  text: string;
  status: "visible" | "hidden";
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<CommentDoc>(
  {
    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },
    status: {
      type: String,
      enum: ["visible", "hidden"],
      default: "visible",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default model("Comment", CommentSchema);

