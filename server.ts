import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getGigaChatToken() {
  const authString = Buffer.from(`${process.env.GIGACHAT_CLIENT_ID}:${process.env.GIGACHAT_CLIENT_SECRET}`).toString('base64');
  const response = await axios.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', 'scope=GIGACHAT_API_PERS', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${authString}`,
      'RqUID': '550e8400-e29b-41d4-a716-446655440000' // Should be a unique UUID
    },
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }) // GigaChat uses Sber's CA
  });
  return response.data.access_token;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/gigachat", async (req, res) => {
    try {
      const token = await getGigaChatToken();
      const response = await axios.post('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', req.body, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
      });
      res.json(response.data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to call GigaChat" });
    }
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
