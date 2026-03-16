import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Groq Proxy to avoid CORS and "Load failed" in browser
  app.post("/api/groq", async (req, res) => {
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    
    if (!apiKey) {
      console.error("Groq API key is missing");
      return res.status(500).json({ error: { message: "Groq API key is missing on server." } });
    }

    const groq = new Groq({ apiKey });

    try {
      const { model, messages, stream, temperature, max_tokens } = req.body;

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const chatCompletion = await groq.chat.completions.create({
          messages,
          model,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 4096,
          stream: true,
        });

        for await (const chunk of chatCompletion) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        const chatCompletion = await groq.chat.completions.create({
          messages,
          model,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 4096,
          stream: false,
        });
        res.json(chatCompletion);
      }
    } catch (error: any) {
      console.error("Groq Proxy Error:", error);
      const status = error.status || 500;
      res.status(status).json({ 
        error: { 
          message: error.message || "Internal Server Error",
          type: error.type,
          code: error.code
        } 
      });
    }
  });

  // Handle GET requests to /api/groq with a helpful message
  app.get("/api/groq", (req, res) => {
    res.status(405).json({ error: { message: "Method Not Allowed. Please use POST." } });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
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
