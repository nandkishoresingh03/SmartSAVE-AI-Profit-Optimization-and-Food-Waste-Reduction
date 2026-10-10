# SmartSave AI — Grocery Waste Intelligence Platform

**SmartSave AI** is a full-stack grocery waste intelligence and dynamic markdown platform built to help supermarkets, organic grocery chains, and local markets eliminate food waste, preserve retail margins, and track verified sustainability impact.

---

## 1. Hackathon Presentation & Overview

### Key Value Propositions
1. **Perishable Pipeline Management**: Automated classification into **Critical (<24h)**, **Urgent (1–3d)**, **Upcoming (4–7d)**, and **Safe (>7d)** expiry urgency windows.
2. **Deterministic Markdown Engine**: Transparent mathematical discounting with strict cost floors (never recommends prices below cost plus margin floor without authorized override).
3. **Google Gemini Explanations**: Gemini 3.8 Flash model synthesizes shelf-life, department elasticity, and consumer psychology to provide actionable retail rationales for store associates.
4. **Verified Sustainability Accounting**: EPA WARM standard calculation attributing **2.5 kg CO₂e offset** for every kilogram of edible grocery diverted from organic landfill disposal.
5. **Full Operational Workflows**: One-click markdown application, clearance sales logging, charity food bank donations, and spoilage incident write-offs.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Visual Design**: Linear & Stripe-inspired aesthetic with 60-30-10 color discipline, Plus Jakarta Sans typography, and JetBrains Mono tabular figures
- **Data Visualization**: Recharts (Revenue recovery trends, Expiry distribution, Sales vs Forecast, Valuation by Category)
- **Form & Input Validation**: Zod runtime schema validation
- **Backend**: Express + Vite middleware full-stack server (`server.ts`)
- **AI Integration**: Google GenAI SDK (`@google/genai`) with `gemini-3.8-flash` on server-side
- **Database & Architecture**:
  - **Demo Mode**: Instant local persistence with pre-seeded realistic store (`GreenOak Harvest Market`)
  - **Connected Mode**: Supabase PostgreSQL schema with 9 normalized tables, Row Level Security (RLS) policies, and foreign keys (`/supabase/migrations/20261009000000_smartsave_schema.sql`)

---

## 3. Architecture & Data Model

The database contains 9 normalized tables:
- `stores`: Store branches, locations, and currency configuration.
- `profiles`: Authenticated users and roles (Store Manager, Operations Lead, Shift Supervisor, Sustainability Officer).
- `store_members`: Association table for store-level access control.
- `products`: Catalog tracking SKU, category, stock quantity, cost price, original price, dynamic selling price, expiry timestamp, and sales velocity.
- `sales`: Clearance transactions recording salvaged units, revenue, and discount applied.
- `pricing_recommendations`: Deterministic calculations, AI rationales, status (`pending`, `accepted`, `rejected`, `modified`).
- `waste_records`: Spoilage write-offs, units lost, cost impact, and root cause.
- `inventory_events`: Audit trail for stock changes and markdown triggers.
- `activity_logs`: Chronological log with user attribution and timestamps.

---

## 4. Environment Variables Setup

Create a `.env` file in the root directory:

```bash
# Google Gemini AI API (Required for AI insights & dynamic explanations)
GEMINI_API_KEY="your-gemini-api-key"

# Application URL
APP_URL="http://localhost:3000"

# Optional: Supabase PostgreSQL (For Connected Mode)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
```

---

## 5. Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Full-Stack Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

### 3. Build for Production
```bash
npm run build
```

### 4. Run Linter & Typechecks
```bash
npm run lint
```

---

## 6. How to Demo During a Hackathon

1. **Operations Overview**:
   - Inspect the KPI cards (Tracked Inventory, At-Risk Batches, Waste Diverted, Salvage Revenue).
   - View the deep forest green **Verified Sustainability Impact** panel showing kg food saved and CO₂e emissions offset.
   - Click **AI Waste Scan** in the header to run an automated inventory scan.
2. **Inventory Management**:
   - Filter by Department (e.g. *Produce*, *Bakery*, *Dairy*).
   - Click **+ Add Product** to test Zod validation and cost-floor checks.
   - Select multiple rows to trigger the **Bulk Markdown** toolbar.
   - Use **Export CSV** to download a spreadsheet manifest.
3. **Expiry Alerts**:
   - Navigate to **Expiry Management** to see items grouped by urgency (<24h, 1-3d, 4-7d).
   - Test actions: **Apply Markdown**, **Mark Sold** (salvages revenue), **Donate** (transfers to food bank), or **Log Waste**.
4. **AI Dynamic Pricing Engine**:
   - Open **AI Dynamic Pricing**. Inspect the deterministic math, margin floor enforcement, and Gemini explanation.
   - Compare alternative discount scenarios (*Conservative*, *Balanced*, *Rapid Clearance*).
   - Click **Configure Safeguards** to adjust minimum gross margin floor (default 5%) and maximum allowable discount (default 70%).
5. **Demand Forecast**:
   - View 7-day projected demand, stockout risk alerts, and automated replenishment quantities.
6. **Diagnostics & Test Suite**:
   - Open **Engine Test Suite** to run and inspect the 6 automated unit tests validating margin safety and expiry urgency classification.
