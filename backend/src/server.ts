// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import publicRouter from "./routes/clothing_items_test";
import outfitRouter from "./routes/outfits";
import closetRouter from "./routes/closet_items";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
const ALLOW_ORIGINS = [
  "http://localhost:3000", // CRA
  "http://localhost:5173", // Vite
];

app.use(cors({
  origin: (origin, cb) => {
    // allow same-origin (like curl/Postman) and known dev origins
    if (!origin || ALLOW_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use("/api/public", publicRouter);
app.use("/api/outfits", outfitRouter);
app.use("/api", closetRouter);    

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
