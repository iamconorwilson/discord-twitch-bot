import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateTwitchSignature, createTwitchLivestreamPayload } from './twitch.js';
import { generateKickSignature, createKickLivestreamPayload } from './kick.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.dev'), quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.MOCK_SERVER_PORT || 3001;
const BOT_URL = process.env.BOT_URL || 'http://localhost:3000';
const EVENTSUB_SECRET = process.env.EVENTSUB_SECRET || 'test_secret_123';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// DISPATCH TWITCH WEBHOOK
app.post('/api/dispatch/twitch', async (req, res) => {
  try {
    const { broadcasterId, isLive } = req.body;

    // Construct payload body
    const payload = createTwitchLivestreamPayload(broadcasterId);

    if (!isLive) {
      payload.event.type = "offline";
    }

    const bodyString = JSON.stringify(payload);
    const messageId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Generate signature
    const signature = generateTwitchSignature(messageId, timestamp, bodyString, EVENTSUB_SECRET);

    // Send payload to bot
    const botRes = await fetch(`${BOT_URL}/events/twitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'twitch-eventsub-message-id': messageId,
        'twitch-eventsub-message-timestamp': timestamp,
        'twitch-eventsub-message-signature': signature,
        'twitch-eventsub-message-type': 'notification'
      },
      body: bodyString
    });

    res.json({ success: botRes.ok, status: botRes.status });
  } catch (error: any) {
    console.error('Error dispatching Twitch webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DISPATCH KICK WEBHOOK
app.post('/api/dispatch/kick', async (req, res) => {
  try {
    const { broadcasterId, isLive } = req.body;

    const payload = createKickLivestreamPayload(broadcasterId, isLive);
    const bodyString = JSON.stringify(payload);

    const messageId = crypto.randomUUID();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = generateKickSignature(messageId, timestamp, bodyString);

    const botRes = await fetch(`${BOT_URL}/events/kick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'kick-event-message-id': messageId,
        'kick-event-message-timestamp': timestamp,
        'kick-event-signature': signature,
        'kick-event-type': 'livestream.status.updated'
      },
      body: bodyString
    });

    res.json({ success: botRes.ok, status: botRes.status });
  } catch (error: any) {
    console.error('Error dispatching Kick webhook:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Mock Webhook Server dashboard available at http://localhost:${PORT}`);
});
