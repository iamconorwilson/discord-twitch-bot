import crypto from 'crypto';

export function generateTwitchSignature(
  messageId: string,
  timestamp: string,
  body: string,
  secret: string
): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(messageId);
  hmac.update(timestamp);
  hmac.update(body);
  return `sha256=${hmac.digest('hex')}`;
}

export function createTwitchLivestreamPayload(broadcasterId: string) {
  return {
    subscription: {
      id: "f1c2a387-161a-49f9-a165-0f21d7a4e1c4",
      status: "enabled",
      type: "stream.online",
      version: "1",
      condition: {
        broadcaster_user_id: broadcasterId
      },
      transport: {
        method: "webhook",
        callback: "null"
      },
      created_at: new Date().toISOString()
    },
    event: {
      id: "9001",
      broadcaster_user_id: broadcasterId,
      broadcaster_user_login: "testuser",
      broadcaster_user_name: "TestUser",
      type: "live",
      started_at: new Date().toISOString()
    }
  };
}
