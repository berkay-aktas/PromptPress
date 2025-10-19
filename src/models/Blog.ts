import { Schema, model, type Document } from "mongoose";

export interface BlogDoc extends Document {
  prompt: string;
  aiResult?: string;
  status: "pending" | "created" | "published" | "error";
  errorMessage?: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
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
  },
  { timestamps: true }
);

export default model("Blog", BlogSchema);
