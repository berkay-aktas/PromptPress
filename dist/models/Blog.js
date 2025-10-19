import { Schema, model } from "mongoose";
const BlogSchema = new Schema({
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
}, { timestamps: true });
export default model("Blog", BlogSchema);
