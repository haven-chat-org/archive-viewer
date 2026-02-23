# Haven Archive Viewer

  <p align="center">
    <img width="49%" alt="Backup" src="https://github.com/user-attachments/assets/2f069b05-0472-4e5d-a505-a12a9a5f431d" />
    <img width="49%" alt="Landing Page" src="https://github.com/user-attachments/assets/1826cd29-8172-4e6b-9544-9839982271c2" />
  </p>

A standalone, offline-first web app for viewing [Haven](https://github.com/haven-chat-org) chat export archives. Everything runs in-browser — no server required, no data leaves your machine.

## Features

- **Drag-and-drop** `.haven` or `.json` export files to view
- **Full-text search** across all channels with jump-to-message
- **Integrity verification** — SHA-256 hash checks and Ed25519 signature validation via Web Crypto API
- **Rich message rendering** — formatting, replies, reactions, pins, attachments, and system messages
- **Server metadata** — members, roles, categories, and export details
- **Zero dependencies on Haven infrastructure** — fully standalone, no API calls

## Supported Formats

| Format | Description |
|--------|-------------|
| `.haven` | ZIP archive with manifest, channels, server metadata, and attachments |
| `.json` | Legacy single-channel or multi-channel JSON exports |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

Opens at [http://localhost:5174](http://localhost:5174).

### Build

```bash
npm run build
```

Outputs a static site to `dist/` — deploy anywhere (GitHub Pages, Netlify, Cloudflare Pages, etc).

## Tech Stack

- **React 19** — UI framework
- **TypeScript** — type safety
- **Vite** — build tool
- **fflate** — ZIP decompression (synchronous, fast)
- **Web Crypto API** — SHA-256 hashing and Ed25519 signature verification

## How It Works

1. User drops a `.haven` file (or `.json` fallback)
2. ZIP archives are decompressed client-side via fflate
3. Manifest, channels, server metadata, and audit logs are parsed
4. File hashes are verified against the manifest using Web Crypto SHA-256
5. Ed25519 signatures are validated if present
6. Messages render with full formatting (TipTap JSON AST to React elements)

## License

[GNU Affero General Public License v3.0](LICENSE)

## Part of Haven

Haven is a privacy-focused, end-to-end encrypted chat platform. Learn more at [github.com/haven-chat-org](https://github.com/haven-chat-org).
