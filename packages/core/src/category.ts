/**
 * Vendor → category mapping. Hand-curated common SaaS + entertainment + utility.
 * Anything missing falls back to LLM classification (cached forever).
 */

const TABLE: Array<[RegExp, string]> = [
  // Streaming
  [/^(NETFLIX|HBO|DISNEY|PRIME VIDEO|HULU|YOUTUBE PREMIUM|SPOTIFY|APPLE MUSIC|TIDAL|VIU|VIDIO|IFLIX)/i, 'streaming'],
  // Productivity
  [/^(NOTION|LINEAR|FIGMA|CANVA|DROPBOX|GOOGLE WORKSPACE|MICROSOFT 365|ZOOM|SLACK|ASANA|MONDAY|CLICKUP)/i, 'productivity'],
  // Dev / cloud
  [/^(VERCEL|NETLIFY|GITHUB|GITLAB|DIGITALOCEAN|AWS|GCP|AZURE|RAILWAY|RENDER|FLY\.IO|CLOUDFLARE|SENTRY|DATADOG)/i, 'devtools'],
  // AI
  [/^(OPENAI|ANTHROPIC|MIDJOURNEY|RUNWAY|ELEVENLABS|PERPLEXITY|GROQ|REPLICATE)/i, 'ai'],
  // Comms
  [/^(VONAGE|TWILIO|SENDGRID|MAILGUN|POSTMARK)/i, 'comms'],
  // Utility
  [/^(PLN|TELKOM|INDIHOME|XL |TELKOMSEL|INDOSAT|TRI|SMARTFREN|PAM|PDAM|PGN)/i, 'utility-id'],
  [/^(CON ED|PG&E|SOCAL|VERIZON|AT&T|T-MOBILE|COMCAST|XFINITY)/i, 'utility-us'],
  // Banking / fintech fees
  [/^(GOPAY|OVO|DANA|SHOPEEPAY|JENIUS|JAGO|BCA|MANDIRI|BNI|BRI|CIMB|VENMO|PAYPAL|WISE)/i, 'fintech'],
  // Fitness
  [/^(STRAVA|MYFITNESSPAL|PELOTON|CLASSPASS|FITNESSFIRST|GOLD'?S GYM)/i, 'fitness'],
  // News
  [/^(NYT|WSJ|FT|ECONOMIST|BLOOMBERG|KOMPAS|DETIK|TEMPO)/i, 'news'],
  // Gaming
  [/^(STEAM|XBOX|PLAYSTATION|NINTENDO|EA |UBISOFT|RIOT|EPIC GAMES|GENSHIN|MOBILE LEGENDS)/i, 'gaming'],
  // Insurance
  [/^(BPJS|ALLIANZ|PRUDENTIAL|AXA|MANULIFE|CIGNA|AIA)/i, 'insurance'],
];

export function categorize(vendor: string): string | null {
  const v = vendor.toUpperCase();
  for (const [re, cat] of TABLE) if (re.test(v)) return cat;
  return null;
}
