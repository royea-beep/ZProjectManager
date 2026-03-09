# KEYDROP LAUNCH COPY
**Ready to post:** 2026-03-09

---

## Product Hunt

**Tagline:** Stop getting API keys over WhatsApp

**Description:**
KeyDrop lets you collect API keys and credentials from clients through encrypted, one-time links.

Pick from 30+ pre-built templates (Stripe, AWS, Firebase, Google, etc.), share a secure link, and get credentials delivered to your dashboard — encrypted with AES-256-GCM, with a full audit trail.

**Free tier:** 5 requests/month. **Pro:** $19/mo. **Team:** $49/mo.

**Maker comment:**
"I built this because I was tired of getting API keys in WhatsApp messages. Now I send a link, the client fills in the form, and I get the credentials encrypted in my dashboard. No more screenshots, no more 'which key was that?' — just a clean, secure handoff."

**Category:** Developer Tools, Security, SaaS

---

## Dev.to Article

**Title:** "I built a tool to stop getting API keys over WhatsApp"

**Tags:** webdev, security, saas, productivity

**Body:**

Every freelancer knows this flow:

> "Hey, can you send me your Stripe API keys?"
> *Client sends them over WhatsApp.*

Or worse — in a Slack DM. Or an email with the subject "API keys" sitting in plaintext forever.

I built **KeyDrop** to fix this.

### How it works

1. **Create a request** — Pick a template (Stripe, AWS, Firebase, etc.) or build a custom form
2. **Share the link** — Send a one-time encrypted link to your client
3. **Receive securely** — Credentials arrive in your dashboard, encrypted with AES-256-GCM

The link expires after the client submits. No one else can access it. You get a full audit trail of who submitted what, when, from where.

### Why I built it

I manage multiple client projects. Every onboarding starts with "send me your API keys." The credentials always ended up in:
- WhatsApp messages (no encryption at rest)
- Email threads (searchable, forwardable)
- Slack DMs (visible to workspace admins)
- Google Docs (!!)

None of these are designed for secrets. So I built something that is.

### The stack

- Next.js 16 + React 19
- AES-256-GCM encryption (per-field, unique IV)
- Prisma + Postgres
- LemonSqueezy for billing
- Zero external dependencies for crypto (Node.js built-in)

### Templates

KeyDrop comes with 30+ pre-built templates for popular services:
- Stripe (publishable + secret key)
- AWS (access key + secret + region)
- Firebase (project ID, API key, service account)
- Google Cloud, Twilio, SendGrid, and more

Each template has field validation, hints, and step-by-step instructions so your client knows exactly what to send.

### Pricing

- **Free:** 5 requests/month (enough to try it)
- **Pro ($19/mo):** 100 requests, all templates
- **Team ($49/mo):** Unlimited requests, priority support

### Try it

[Link to KeyDrop]

I'd love feedback — what templates are missing? What would make you switch from "just WhatsApp it to me"?

---

## Hacker News (Show HN)

**Title:** Show HN: KeyDrop — Collect API keys from clients through encrypted, one-time links

**Body:**
I built KeyDrop because I was tired of receiving API keys over WhatsApp and email. It creates encrypted, one-time links that clients fill in — credentials are stored with AES-256-GCM and viewable only in your dashboard.

Comes with 30+ templates (Stripe, AWS, Firebase, etc.) so clients know exactly what to send.

Free tier: 5 requests/month. Pro: $19/mo.

---

## Reddit r/webdev

**Title:** I made a free tool for collecting API keys from clients securely (no more WhatsApp screenshots)

**Body:**
Hey r/webdev — if you freelance or work with clients, you've probably had this conversation:

"Can you send me your Stripe keys?"
*[client sends screenshot over WhatsApp]*

I built KeyDrop to replace this. You create a request, pick a template (Stripe, AWS, Firebase, etc.), and send a one-time encrypted link. Client fills it in, you get the credentials encrypted in your dashboard.

Free tier: 5 requests/month. No credit card needed.

Would love to know: what services do you collect credentials for most often?

---

## Reddit r/freelance

**Title:** How I solved the "send me your API keys" problem

**Body:**
Every client onboarding involves collecting credentials — API keys, passwords, access tokens. And every time, the client sends them over WhatsApp, email, or Slack.

I built KeyDrop to make this secure:
1. Create a request with pre-built templates
2. Share a one-time encrypted link
3. Client fills it in, credentials arrive encrypted in your dashboard
4. Link expires after use

Free for up to 5 requests/month. Built this for myself, figured other freelancers might find it useful.

---

## Twitter/X Thread

**Tweet 1:**
I just launched KeyDrop — a tool that replaces "send me your API keys over WhatsApp" with encrypted, one-time links.

Create a request. Share a link. Client fills it in. Done.

AES-256 encrypted. Audit trail. 30+ templates.

[link]

**Tweet 2:**
The problem:
- Client sends Stripe keys over WhatsApp
- Another sends AWS creds in an email
- A third puts them in a shared Google Doc

None of these are designed for secrets.

KeyDrop is.

**Tweet 3:**
How it works:
1. Pick a template (Stripe, AWS, Firebase...)
2. Share a one-time link with your client
3. Client fills in the form
4. You get credentials encrypted in your dashboard
5. Link expires after submission

**Tweet 4:**
Free tier: 5 requests/month
Pro: $19/mo (100 requests)
Team: $49/mo (unlimited)

Built with Next.js 16 + AES-256-GCM encryption.

Try it free: [link]
