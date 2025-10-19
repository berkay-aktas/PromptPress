import mongoose from "mongoose";

export async function connectMongo(uri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
  return mongoose.connection;
}