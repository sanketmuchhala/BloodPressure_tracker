# Architecture

This document describes how the Blood Pressure Tracker is structured, how data flows, and what runs where.  
Diagrams use Mermaid with a single, consistent style.

---

## High-level system

```mermaid
flowchart TB
  A[Mobile Browser] -->|HTTPS| B[Vite + React App]
  B -->|Reads/Writes| C[Supabase APIs]
  C --> D[(Postgres: bp_logs)]
  C --> E[(Storage: bp-photos)]
  B --> F[Client OCR: tesseract.js]
```

---

## Request and data flow

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Frontend (Mobile Web)
  participant OCR as OCR (tesseract.js)
  participant SB as Supabase
  participant DB as Postgres (bp_logs)
  participant ST as Storage (bp-photos)

  U->>UI: Enter PIN
  UI-->>U: Unlock session (local)

  U->>UI: Capture BP photo
  UI->>UI: Compress image (client)
  UI->>OCR: Optional OCR
  OCR-->>UI: Extract text + numbers

  U->>UI: Confirm / edit values
  UI->>ST: Upload compressed image
  ST-->>UI: photo_path

  UI->>DB: Insert bp_logs row
  DB-->>UI: Saved record

  U->>UI: Open Logs
  UI->>DB: Fetch last N logs
  DB-->>UI: List of readings + photo_path
  UI->>SB: Get signed URLs (if private bucket)
  SB-->>UI: Signed URLs
  UI-->>U: Render cards + photos
```

---

## Frontend modules

```mermaid
flowchart LR
  App[App Router] --> PR[Protected Route Gate]
  PR --> L[Layout: Header + Nav + Language Toggle]

  L --> P1[/login: PIN Screen/]
  L --> P2[/entry: New Reading/]
  L --> P3[/logs: History/]

  P2 --> IC[Image Compression]
  P2 --> OCR[OCR Utility]
  P2 --> SB1[Supabase: Insert Log]
  P2 --> SB2[Supabase: Upload Photo]

  P3 --> SB3[Supabase: Fetch Logs]
  P3 --> IM[Image Modal]
```

---

## Storage layout

```mermaid
flowchart TB
  ST[(Supabase Storage: bp-photos)]
  ST --> P[Path Convention]
  P --> EX1["{user or single}/YYYY-MM/{uuid}.jpg"]
  P --> EX2["Example: single/2026-02/7c2b...a1.jpg"]
```

---

## Database model

```mermaid
erDiagram
  BP_LOGS {
    uuid id
    timestamptz reading_at
    int systolic
    int diastolic
    int pulse
    text photo_path
    timestamptz created_at
  }
```

---

## Security boundary (PIN-based single user)

```mermaid
flowchart TB
  U[User] --> PIN[PIN Gate (Frontend)]
  PIN --> UI[Unlocked App UI]
  UI --> SB[Supabase APIs]
  SB --> DB[(Postgres)]
  SB --> ST[(Storage)]

  note1[PIN protects device-level access only
Network/API access depends on Supabase rules]:::note
  PIN -.-> note1

  classDef note fill:#ffffff,stroke:#111827,stroke-width:1px,color:#111827;
```

---

## Operational notes

- OCR runs on-device in the browser; no OCR server.
- Images are compressed client-side and stored compressed.
- Supabase is the only backend; no Render or custom server required.
- If your bucket is private, Logs should use signed URLs for photos.

