# SECRETSAUCE DEMO PLAN
**Updated:** 2026-03-09

---

## Terminal Recording (30 min)

Record a terminal session using **asciinema** or **ttyrec** (or just screen record + crop).

### Script

```
# 1. Install
$ npm install -g @royea/secret-sauce

# 2. Show version
$ secret-sauce --version
1.0.0

# 3. Show help
$ secret-sauce --help

# 4. Scan a real project (use your own SaaS project)
$ secret-sauce analyze ./src

# 5. Show the output — highlight:
#    - Star ratings (⭐⭐⭐⭐⭐ = very unique)
#    - Protection levels (SERVER-ONLY, CACHE-LONG, etc.)
#    - Actionable recommendations

# 6. Scan a second project for variety
$ secret-sauce analyze ../other-project/src
```

### Key moments to highlight
- The scan completing in <2 seconds
- A 4-5 star finding (pricing/AI prompt)
- The protection level recommendation
- Zero dependencies message

---

## Open-Source Project Scans

Run SecretSauce against 3-5 popular open-source projects and document findings (anonymized if needed):

### Targets
1. **Any Next.js SaaS template** (likely has pricing logic)
2. **An AI chatbot project** (likely has system prompts in client code)
3. **A game/gamification project** (scoring logic)
4. **A fintech dashboard** (fee calculations)

### How to use findings
- Blog post: "I scanned 5 popular open-source projects. Here's what I found."
- Twitter thread: "5 real examples of business logic shipped to the browser"
- Each finding becomes social proof for the tool

---

## GIF for README/npm

1. Record terminal with `asciinema rec demo.cast`
2. Convert to GIF with `agg demo.cast demo.gif --cols 80 --rows 24`
3. Add to README.md at top
4. Re-publish with `npm version patch && npm publish`

---

## Demo Checklist

| Asset | Tool | Time |
|-------|------|------|
| Terminal recording | asciinema or screen record | 15 min |
| GIF conversion | agg or gifski | 5 min |
| Open-source scans (3 projects) | secret-sauce CLI | 10 min |
| Findings write-up | Text editor | 15 min |
