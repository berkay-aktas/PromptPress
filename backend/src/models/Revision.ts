import { Schema, model, type Document, Types } from "mongoose";

export interface RevisionDoc extends Document {
  blog: Types.ObjectId;
  user: Types.ObjectId | null;
  what: string;
  how: string;
  createdAt: Date;
  updatedAt: Date;
}

const RevisionSchema = new Schema<RevisionDoc>(
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
    what: {
      type: String,
      required: true,
      trim: true,
    },
    how: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default model("Revision", RevisionSchema);

