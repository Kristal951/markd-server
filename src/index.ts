import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from './routes/auth.js'

const PORT = Number(process.env.PORT) || 4000;

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes)

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
