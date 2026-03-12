import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Groq from "groq-sdk";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Groq API Proxy Route
  app.post("/api/groq", async (req, res) => {
    try {
      const { message, model } = req.body;
      const apiKey = process.env.GROQ_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
      }

      const groq = new Groq({ apiKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: message }],
        model: model || "llama-3.3-70b-versatile",
      });

      res.json({ text: chatCompletion.choices[0]?.message?.content || "" });
    } catch (error: any) {
      console.error("Groq API Error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch from Groq" });
    }
  });

  const distPath = path.join(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === "production" && fs.existsSync(distPath);

  console.log(`Starting server. NODE_ENV: ${process.env.NODE_ENV}, isProd: ${isProd}`);

  // Vite middleware for development
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

