import express from "express";
import generateHandler from "./generate.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(express.json());

if (process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, "../dist")));
}

app.post("/api/generate", generateHandler);

if (process.env.VERCEL) {
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      res.sendFile(path.join(__dirname, "../dist/index.html"));
    } else {
      next();
    }
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

export default app;
