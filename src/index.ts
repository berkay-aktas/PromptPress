import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectMongo } from "./db/mongo.js";
import blogRoutes from "./routes/blogs.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/blogs", blogRoutes);

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/blogwebsiteai"

connectMongo(MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`)))
  .catch((err) => {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  });
