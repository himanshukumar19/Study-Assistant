import express from "express";
import generateHandler from "./generate.js";

const app = express();
const PORT = 3001;

app.use(express.json());

app.post("/api/generate", generateHandler);

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
