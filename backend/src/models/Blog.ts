import { Schema, model, type Document, Types } from "mongoose";

export interface BlogDoc extends Document {
  prompt: string;
  aiResult?: string;
  status: "pending" | "created" | "published" | "error";
  errorMessage?: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  author?: string | null;
  authorId?: Types.ObjectId | null;
  tags?: Types.ObjectId[];
}

const BlogSchema = new Schema<BlogDoc>(
  {
    prompt: { type: String, required: true },
    aiResult: { type: String, required: false, default: "" },
    status: {
        type: String,
        enum: ["pending", "created", "published", "error"],
        default: "pending",
        required: true,
        index: true,
      },
    errorMessage: { type: String, default: null },
    publishedAt: { type: Date, default: null },

    author: { type: String, default: null },
    authorId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    tags: {
      type: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
      default: [],
      index: true,
    },
  },
  { timestamps: true }
);

export default model("Blog", BlogSchema);
