# Architecture

This document describes how the Blood Pressure Tracker is structured, how data flows, and what runs where.  
Diagrams use Mermaid with a single, consistent single-color scheme (blue) for clarity and readability.

---

## High-Level System

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#eff6ff', 'primaryTextColor': '#1e3a8a', 'primaryBorderColor': '#3b82f6', 'lineColor': '#3b82f6', 'secondaryColor': '#eff6ff', 'tertiaryColor': '#eff6ff'}}}%%
flowchart TB
  classDef default fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;

  A[Mobile Browser] -->|HTTPS| B[Vite + React App]
  B -->|Reads/Writes| C[Supabase APIs]
  C --> D[(Postgres: bp_logs & bp_sessions)]
  C --> E[(Storage: bp-photos)]
  B -.->|Local Processing| F[Client OCR: tesseract.js]
```

---

## Request and Data Flow

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#eff6ff', 'primaryTextColor': '#1e3a8a', 'primaryBorderColor': '#3b82f6', 'lineColor': '#3b82f6', 'secondaryColor': '#eff6ff', 'tertiaryColor': '#eff6ff', 'actorLineColor': '#3b82f6'}}}%%
sequenceDiagram
  participant U as User
  participant UI as Frontend (Mobile Web)
  participant OCR as OCR (tesseract.js)
  participant SB as Supabase API
  participant DB as Postgres
  participant ST as Storage

  U->>UI: Enter PIN
  UI-->>U: Unlock session (local)

  U->>UI: Capture BP photo
  UI->>UI: Compress image (client-side)
  UI->>OCR: Extract text + numbers (optional)
  OCR-->>UI: Return parsed values

  U->>UI: Confirm / edit values
  UI->>ST: Upload compressed image
  ST-->>UI: Return photo_path

  UI->>DB: Insert into bp_logs (and bp_sessions)
  DB-->>UI: Confirm saved record

  U->>UI: Open Logs tab
  UI->>DB: Fetch recent logs and sessions
  DB-->>UI: Return log data + photo_paths
  UI->>SB: Request signed URLs (private bucket)
  SB-->>UI: Return signed URLs
  UI-->>U: Render trend chart and cards
```

---

## Frontend Modules

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#eff6ff', 'primaryTextColor': '#1e3a8a', 'primaryBorderColor': '#3b82f6', 'lineColor': '#3b82f6', 'secondaryColor': '#eff6ff', 'tertiaryColor': '#eff6ff'}}}%%
flowchart LR
  classDef default fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;

  App[App Router] --> PR[Protected Route Gate]
  PR --> L[Layout: Header + Nav + Context]
  
  L --> P1[/login: PIN Screen/]
  L --> P2[/entry: New Reading/]
  L --> P3[/logs: History/]

  P2 --> IC[Image Compression]
  P2 --> OCR[OCR Utility]
  P2 --> SB1[Supabase: Save Logs]
  P2 --> SB2[Supabase: Upload Photo]

  P3 --> SB3[Supabase: Fetch Logs]
  P3 --> IM[Image Modal]
```

---

## Storage Layout

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#eff6ff', 'primaryTextColor': '#1e3a8a', 'primaryBorderColor': '#3b82f6', 'lineColor': '#3b82f6', 'secondaryColor': '#eff6ff', 'tertiaryColor': '#eff6ff'}}}%%
flowchart TB
  classDef default fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;

  ST[(Supabase Storage: bp-photos)]
  ST --> P[Path Convention]
  P --> EX1["{SINGLE_USER_ID}/YYYY-MM/{uuid}.jpg"]
  P --> EX2["Example: 0000...0001/2026-02/7c2b...a1.jpg"]
```

---

## Database Model

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#eff6ff', 'primaryTextColor': '#1e3a8a', 'primaryBorderColor': '#3b82f6', 'lineColor': '#3b82f6', 'secondaryColor': '#eff6ff', 'tertiaryColor': '#eff6ff'}}}%%
erDiagram
  BP_SESSIONS ||--o{ BP_LOGS : contains
  
  BP_SESSIONS {
    uuid id PK
    uuid user_id
    timestamptz session_at
    int reading_count
    int avg_systolic
    int avg_diastolic
    int avg_pulse
    text photo_path
    timestamptz created_at
  }
  
  BP_LOGS {
    uuid id PK
    uuid user_id
    timestamptz reading_at
    int systolic
    int diastolic
    int pulse
    text photo_path
    uuid session_id FK
    timestamptz created_at
  }
```

---

## Security Boundary (PIN-based single user)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#eff6ff', 'primaryTextColor': '#1e3a8a', 'primaryBorderColor': '#3b82f6', 'lineColor': '#3b82f6', 'secondaryColor': '#eff6ff', 'tertiaryColor': '#eff6ff'}}}%%
flowchart TB
  classDef default fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
  classDef note fill:#eff6ff,stroke:#3b82f6,stroke-width:1px,color:#1e3a8a;

  U[User] --> PIN[PIN Gate: Frontend]
  PIN --> UI[Unlocked App UI]
  UI --> SB[Supabase APIs]
  SB --> DB[(Postgres: RLS Protected)]
  SB --> ST[(Storage: Policy Protected)]

  note1[PIN protects device-level access only. Network/API access is secured by Supabase RLS scoped to the SINGLE_USER_ID.]:::note
  PIN -.-> note1
```

---

## Operational Notes

- OCR runs on-device in the browser; there is no OCR server.
- Images are compressed client-side and stored compressed in the bucket.
- Supabase is the only backend; no custom server is required.
- Logs use signed URLs for photos since the storage bucket is private.

