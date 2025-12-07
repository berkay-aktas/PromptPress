import { Schema, model, type Document } from "mongoose";

export interface TagDoc extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<TagDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      minlength: 1,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

// Generate slug from name before saving
TagSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

export default model("Tag", TagSchema);

