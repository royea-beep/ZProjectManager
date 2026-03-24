// src/lib/twilio.ts
// Server-side only — never import in client components

export async function sendSMS(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.warn('[Twilio] Missing credentials — SMS not sent');
    return false;
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    console.log(`[Twilio] SMS sent to ${to}`);
    return true;
  } catch (err) {
    console.error('[Twilio] SMS failed:', err);
    return false;
  }
}

export async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !whatsappFrom) {
    console.warn('[Twilio] Missing credentials — WhatsApp not sent');
    return false;
  }

  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(sid, token);
    await client.messages.create({
      from: `whatsapp:${whatsappFrom}`,
      to: `whatsapp:${to}`,
      body,
    });
    console.log(`[Twilio] WhatsApp sent to ${to}`);
    return true;
  } catch (err) {
    console.error('[Twilio] WhatsApp failed:', err);
    return false;
  }
}

/** SMS fallback when push notification fails for a user */
export async function sendPushFallbackSMS(
  phone: string,
  playerName: string,
  mode: string
): Promise<boolean> {
  return sendSMS(
    phone,
    `⚽ ${playerName}, משחק חדש מחכה לך ב-9Soccer! כנס ל-${mode} עכשיו`
  );
}
