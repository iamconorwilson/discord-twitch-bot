import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DEBUG_DIR = path.resolve(process.cwd(), 'debug');
const KEYS_DIR = path.join(DEBUG_DIR, 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');
const ENV_DEV_PATH = path.resolve(process.cwd(), '.env.dev');

async function generateKeys() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  console.log('Generating RSA key pair...');

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);

  console.log('Keys generated and saved to debug/keys/');

  updateEnvDev(publicKey);
}

function updateEnvDev(publicKey: string) {
  let envContent = '';
  if (fs.existsSync(ENV_DEV_PATH)) {
    envContent = fs.readFileSync(ENV_DEV_PATH, 'utf-8');
  }

  // Remove existing KICK_PUBLIC_KEY if present
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => !line.startsWith('KICK_PUBLIC_KEY='));

  // Format the public key so it can be stored on a single line safely if needed,
  // or just store the PEM format directly depending on dotenv parser support.
  // Standard dotenv supports multiline if wrapped in quotes.
  const formattedKey = publicKey.replace(/\n/g, '\\n');
  filteredLines.push(`KICK_PUBLIC_KEY="${formattedKey}"`);

  fs.writeFileSync(ENV_DEV_PATH, filteredLines.join('\n'));
  console.log('Updated KICK_PUBLIC_KEY in .env.dev');
}

generateKeys().catch(console.error);
