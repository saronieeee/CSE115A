import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import publicRouter from "./routes/clothing_items_test";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ origin: process.env.ORIGIN || "http://localhost:3000", credentials: true }));

app.use("/api/public", publicRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
