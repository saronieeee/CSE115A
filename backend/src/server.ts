// server.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import publicRouter from "./routes/clothing_items_test";
import outfitRouter from "./routes/outfits";
import closetRouter from "./routes/closet_items";
import createUserRouter from "./routes/auth/createUser";
import loginRouter from "./routes/auth/login";
import addUserDataRouter from "./routes/auth/addUserData";

const app = express();
app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ origin: process.env.ORIGIN || "http://localhost:3000", credentials: true }));

app.use("/api/public", publicRouter);
app.use("/api/outfits", outfitRouter);
app.use("/api/auth/create-user", createUserRouter);
app.use("/api/auth/login", loginRouter);
app.use("/api/auth/add-user-data", addUserDataRouter);
app.use("/api/clothing-items", closetRouter);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
