// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import publicRouter from "./routes/clothing_items_test";
import outfitRouter from "./routes/outfits";
import closetRouter from "./routes/closet_items";
import uploadRouter from "./routes/uploads";
import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import aiRouter from "./routes/ai";

const app = express();
app.use(morgan("dev"));
app.use(express.json());

const ORIGIN = (process.env.ORIGIN || "http://localhost:3000").replace(/\/+$/, "");
app.use(
  cors({
    origin: ORIGIN,
    credentials: true, // keep true only if you actually use cookies/auth
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, port: Number(process.env.PORT) || 4000, time: new Date().toISOString() });
});

// (Optional but good) Help caches/CDNs vary on Origin
app.use((req, res, next) => {
  res.setHeader("Vary", "Origin");
  next();
});

app.use("/api/public", publicRouter);
app.use("/api/outfits", outfitRouter);
app.use("/api/uploads", uploadRouter);
app.use("/api", closetRouter);    
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/ai", aiRouter);

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || "0.0.0.0";
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
