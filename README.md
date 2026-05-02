# Fortune Teller — x402 on Solana

Pay 0.1 SOL. Get your AI-generated fortune. That's it.

A web app that gates access to an AI fortune telling service behind a real Solana payment. Built with the x402 payment pattern — the server returns `402 Payment Required` until a valid on-chain transaction is verified.

---

## What It Does

1. User connects their Phantom wallet
2. Sends 1 SOL to the receiver wallet (devnet)
3. Transaction signature is attached to the API request as proof of payment
4. Server verifies the payment on-chain — if not valid, returns `402`
5. Once verified, GPT generates a personalized fortune based on birth details
6. Fortune is displayed to the user

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Wallet | Phantom via `@solana/wallet-adapter` |
| Blockchain | Solana Devnet |
| Payment Pattern | x402 — HTTP 402 + on-chain tx verification |
| AI | OpenAI GPT-3.5 |
| Styling | Tailwind CSS + inline styles |

---

## How the x402 Pattern Works

x402 is an HTTP payment protocol. The standard `402 Payment Required` status code — which has been reserved since HTTP/1.1 but rarely used — is repurposed here as a real payment gate.

```
Client                        Server
  |                              |
  |-- POST /api/fortune -------->|
  |                              |-- no txSig? --> 402 Payment Required
  |
  | [user pays 1 SOL on-chain]
  |
  |-- POST /api/fortune -------->|
  |   + txSig in body            |-- verify tx on Solana devnet
  |                              |-- confirmed + correct amount?
  |                              |-- call GPT --> return fortune
  |<-- 200 { fortune } ----------|
```

The transaction signature IS the payment proof. No session tokens, no accounts, no database.

---

## Project Structure

```
fortune-teller/
├── app/
│   ├── layout.tsx              # Root layout with wallet providers
│   ├── providers.tsx           # Solana wallet adapter setup
│   ├── globals.css             # Base styles
│   ├── globals.d.ts            # CSS module type declaration
│   ├── page.tsx                # Main UI — all steps in one page
│   └── api/
│       └── fortune/
│           └── route.ts        # x402 verification + GPT call
├── .env.local                  # Secrets (never committed)
├── .gitignore
└── tsconfig.json
```

---

## Limitations

- No persistent accounts — payment is per session, refresh = pay again
- Devnet only by default — no real money involved
- No refunds — blockchain payments are irreversible
- Fortune is AI-generated for entertainment only

---

## License

MIT
