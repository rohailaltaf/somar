# Somar Architecture

This document describes the architecture of Somar, a personal finance tracking application with **true end-to-end encryption (E2EE)**.

## Overview

Somar uses **client-side E2EE** - all user financial data is encrypted and decrypted **in the browser**. The server only stores opaque encrypted blobs and can **never** read user data.

**Key principle:** All SQLite queries run client-side using `wa-sqlite`. The Next.js server is a thin API for authentication and blob storage.

## High-Level Architecture

```mermaid
flowchart TB
    subgraph clients [Client Apps - WHERE DATA LIVES]
        WebApp[Web App<br/>wa-sqlite in browser]
        MobileApp[Mobile App<br/>expo-sqlite]
    end
    
    subgraph server [Server - CANNOT READ DATA]
        BetterAuth[Better Auth]
        CentralDB[(Central DB<br/>PostgreSQL)]
        BlobStorage[Blob Storage<br/>Encrypted blobs only]
    end
    
    WebApp -->|"Auth only"| BetterAuth
    MobileApp -->|"Auth only"| BetterAuth
    BetterAuth -->|"Users, Sessions"| CentralDB
    
    WebApp <-->|"Upload/Download<br/>encrypted blobs"| BlobStorage
    MobileApp <-->|"Upload/Download<br/>encrypted blobs"| BlobStorage
```

## Data Flow

### Login & Load Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser as Browser (wa-sqlite)
    participant Server as API Server
    participant Storage as Blob Storage
    
    User->>Browser: Enter email + password
    Browser->>Server: POST /api/auth/sign-in
    Server-->>Browser: Session token
    
    Browser->>Browser: Derive encryption key
    Note over Browser: Key = PBKDF2(password, email, 100k iterations)
    Note over Browser: Key NEVER leaves browser
    
    Browser->>Server: GET /api/db/download
    Server->>Storage: Fetch user blob
    Storage-->>Server: Encrypted bytes
    Server-->>Browser: Encrypted blob
    Note over Server: Server sees only<br/>encrypted bytes
    
    Browser->>Browser: AES-256-GCM decrypt
    Browser->>Browser: Load into wa-sqlite
    Note over Browser: Full SQLite database<br/>running in browser
    
    Browser->>Browser: Execute Prisma queries
    Browser-->>User: Display transactions
```

### Save Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser as Browser (wa-sqlite)
    participant Server as API Server
    participant Storage as Blob Storage
    
    User->>Browser: Edit transaction
    Browser->>Browser: Update wa-sqlite
    
    Note over Browser: Auto-save triggers...
    
    Browser->>Browser: Export SQLite to bytes
    Browser->>Browser: AES-256-GCM encrypt
    Browser->>Server: POST /api/db/upload
    Note over Server: Server receives<br/>encrypted bytes only
    Server->>Storage: Store encrypted blob
    Server-->>Browser: Success + version
```

### Device Session Locking

Only one device can edit at a time to prevent conflicts:

```mermaid
sequenceDiagram
    participant Phone
    participant Server
    participant Laptop
    
    Phone->>Server: POST /api/session/acquire
    Server-->>Phone: Lock granted
    
    Note over Phone: Phone is editing...
    
    Phone->>Server: POST /api/session/heartbeat
    Note over Server: Lock refreshed (every 10s)
    
    Laptop->>Server: POST /api/session/acquire
    Server-->>Laptop: LOCKED by "iPhone"
    
    Note over Laptop: Shows "In use on iPhone" banner
    Note over Laptop: Read-only mode available
    
    Phone->>Server: POST /api/session/release
    Laptop->>Server: POST /api/session/acquire
    Server-->>Laptop: Lock granted
```

## Database Architecture

### Two-Database Model

| Database | Type | Location | Purpose |
|----------|------|----------|---------|
| **Central DB** | PostgreSQL | Server | Auth, sessions, Plaid tokens |
| **User Data** | SQLite | Browser (wa-sqlite) | Transactions, accounts, budgets |

### What Runs Where

| Component | Runs On | Notes |
|-----------|---------|-------|
| Authentication | Server | Better Auth handles sessions |
| Plaid sync | Server | Plaid requires server-side tokens |
| User queries | **Browser** | All Prisma queries run in wa-sqlite |
| Encryption | **Browser** | Key derivation and crypto |
| Data storage | Server | Encrypted blobs only |

### Central Database Schema (Server)

The central database stores only what the server needs:

- **users** - Email, name (Better Auth)
- **sessions** - Active sessions with device tracking
- **accounts** - OAuth accounts (Google, etc.)
- **plaid_items** - Plaid connections (access tokens)
- **encrypted_databases** - Blob metadata (size, version)
- **pending_plaid_syncs** - Encrypted Plaid data queue

### User Data Schema (Browser)

Each user has a SQLite database that runs **entirely in the browser**:

- **accounts** - Bank/credit card accounts
- **transactions** - All transactions
- **categories** - Spending/income categories  
- **category_budgets** - Monthly budgets
- **categorization_rules** - Auto-categorization patterns

## Security Model

### Encryption Scheme

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2-SHA256 with 100,000 iterations
- **Key Location**: Browser only - **never** sent to server

### Key Derivation

```
User's Password
      │
      └──▶ PBKDF2(password, "somar:encrypt:" + email, 100000, SHA-256)
           │
           └──▶ 256-bit encryption key
                │
                └──▶ Used for AES-256-GCM
```

### What the Server CAN See

- User email and name
- When user logged in
- Which Plaid institutions are connected
- Size of encrypted blob
- When blob was last updated

### What the Server CANNOT See

- ❌ Transaction amounts or descriptions
- ❌ Account balances
- ❌ Spending categories
- ❌ Budget information
- ❌ **Any financial data**

## Plaid Integration

Plaid access tokens must stay server-side (Plaid security requirement). We use asymmetric encryption so the server can encrypt data for the user without being able to decrypt it:

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server
    participant Plaid
    
    Note over Browser: User generates RSA keypair
    Note over Browser: Private key stays in browser
    Browser->>Server: Send PUBLIC key only
    
    Server->>Plaid: Sync transactions
    Plaid-->>Server: Transaction data
    
    Server->>Server: Encrypt with user's PUBLIC key
    Server->>Server: Store in pending_plaid_syncs
    Note over Server: Server CANNOT decrypt<br/>(no private key)
    
    Browser->>Server: GET /api/plaid/pending
    Server-->>Browser: RSA-encrypted data
    
    Browser->>Browser: Decrypt with PRIVATE key
    Browser->>Browser: Merge into wa-sqlite
    Browser->>Browser: Save and upload encrypted DB
```

## Client-Side Tech Stack

### Web (Browser)

- **wa-sqlite** - SQLite compiled to WebAssembly
- **@prisma/client** - Query builder (runs against wa-sqlite)
- **React Query** - Data fetching and caching
- **Web Crypto API** - AES-256-GCM and PBKDF2

### Mobile

- **expo-sqlite** - Native SQLite
- **@prisma/client** - Same queries as web
- **expo-secure-store** - Key storage

## Project Structure

```
somar/
├── apps/
│   ├── web/
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Local SQLite (legacy dev)
│   │   │   └── central-schema.prisma    # PostgreSQL (auth, Plaid)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/              # Login, register
│   │   │   │   └── api/
│   │   │   │       ├── auth/            # Better Auth
│   │   │   │       └── db/              # Blob upload/download
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts              # Better Auth config
│   │   │   │   ├── db/
│   │   │   │   │   └── central.ts       # Central DB client
│   │   │   │   └── storage/             # Blob storage
│   │   │   └── hooks/
│   │   │       └── use-database.ts      # wa-sqlite + React Query
│   │   └── data/                        # Encrypted blobs (gitignored)
│   │
│   └── mobile/
│       └── (similar structure)
│
└── packages/
    └── shared/
        └── src/crypto/                  # Encryption utilities
```

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL (for central database)
- Google OAuth credentials (optional)

### Environment Variables

```bash
# Central Database
CENTRAL_DATABASE_URL="postgresql://user:pass@localhost:5432/somar_central"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Storage
STORAGE_TYPE="filesystem"
DATA_DIR="./data"
```

### Database Setup

```bash
# Generate Prisma clients
pnpm --filter web db:generate

# Push central schema to PostgreSQL
pnpm --filter web db:central:push

# Open Prisma Studio for central DB
pnpm --filter web db:central:studio
```

## Security Considerations

### Threat Model

| Threat | Protection |
|--------|------------|
| Server breach | Data is encrypted, attacker gets useless blobs |
| Server operator snooping | Mathematically impossible without user password |
| Man-in-the-middle | TLS for transport, E2EE for data at rest |
| Password guessing | PBKDF2 with 100k iterations |
| Key extraction | Keys never leave browser, derived on-demand |

### Limitations

- **Password recovery**: If user forgets password, data is **unrecoverable** (by design)
- **Server-side search**: Not possible - server can't read data
- **Real-time collaboration**: Not supported (single-device lock model)
- **Initial load time**: Entire database downloaded on login (~1-2 seconds for typical use)

## References

- [wa-sqlite](https://github.com/nicozirr/nicozirr-wa-sqlite) - SQLite for WebAssembly
- [Better Auth Documentation](https://www.better-auth.com/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Prisma Documentation](https://www.prisma.io/docs)
