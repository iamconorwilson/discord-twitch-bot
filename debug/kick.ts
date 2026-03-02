import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DEBUG_DIR = path.resolve(process.cwd(), 'debug');
const PRIVATE_KEY_PATH = path.join(DEBUG_DIR, 'keys', 'private.pem');

let privateKey: string | null = null;

export function loadPrivateKey(): string {
  if (privateKey) return privateKey;

  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error('Private key not found. Please run `npm run generate-keys` first.');
  }

  privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf-8');
  return privateKey;
}

export function generateKickSignature(
  messageId: string,
  timestamp: string,
  body: string
): string {
  const key = loadPrivateKey();
  const dataToSign = `${messageId}.${timestamp}.${body}`;
  const sign = crypto.createSign('SHA256');
  sign.update(dataToSign);
  sign.end();
  return sign.sign(key, 'base64');
}

export function createKickLivestreamPayload(broadcasterId: number | string, isLive: boolean) {
  return {
    broadcaster_user_id: String(broadcasterId),
    is_live: isLive,
    broadcaster: {
      id: Number(broadcasterId),
      user_id: Number(broadcasterId),
      slug: "testuser",
      username: "TestUser",
      profile_picture: "https://placehold.co/128x128"
    },
    stream: isLive ? {
      id: 12345,
      session_title: "Test Stream",
      thumbnail: {
        url: "https://placehold.co/1280x720"
      }
    } : null
  };
}
