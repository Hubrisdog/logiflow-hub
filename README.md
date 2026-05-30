# LogiFlow Hub 🪐

LogiFlow Hub is a premium, dark-mode-first, enterprise-grade inventory intelligence and logistics orchestration platform. Built with **React 18**, **TypeScript**, **Vite**, and **Supabase (PostgreSQL)**, it delivers a sleek, high-contrast dashboard aesthetic powered by a custom **Volt Orange & Electric Cyan** color system.

The project is fully modular, type-safe, resilient to offline network drops, GAAP compliant, and includes a **React Native (Expo)** companion mobile app for on-the-floor warehouse scanning.

---

## 🌌 Modern Visual Experience
LogiFlow Hub is styled with custom Tailwind CSS integrations for a tactile, dark-mode-first interface:
* **Branding:** Replaced generic imagery with a minimalist geometric **Orbit** branding symbol, representing fluid supply channels and connected inventories.
* **Palette:** Utilizes a custom **Volt Orange** (Primary) and **Electric Cyan** (Accent) theme, providing a glowing high-contrast look over deep charcoal-slate canvases.
* **Tactile CTAs:** Landing buttons and cards feature transition scaling (`hover:scale-105 active:scale-95`) and hover glows (`hover:ring-2 hover:ring-primary/40`).
* **Theme Switching:** IntegratesSun/Moon toggles inside the navigation panel to dynamically shift between dark and light themes with local preference caching.

---

## 🛠️ Key Enterprise Systems (Roadmap Progress)

All components of the LogiFlow Enterprise roadmap have been successfully implemented and compiled:

### 🏢 1. Multi-Tenant SaaS Workspace Scoping
- Scopes profiles, catalogs, locations, and transactions by an active `organization_id`.
- Features a header workspace selector dropdown to switch active tenants instantly.
- Enforces data security boundaries via multi-tenant PostgreSQL Row Level Security (RLS) rules.

### 📴 2. Offline Resilient Sync Queue
- Automatically intercepts database write errors or network drops, serializing transactions inside a local storage queue.
- Reconciles the database sequentially once the browser detects restored connectivity.
- Displays a glowing header status badge (Green = Connected, Yellow = Reconciling, Orange = Pending Queue, Red = Offline).

### 📈 3. GAAP Compliant FIFO Accounting Ledger
- Computes valuation ledgers using First-In-First-Out costing. Dedicates oldest stock batches first on item removals to calculate precise compliance Cost of Goods Sold (COGS).
- Displays side-by-side comparison tables inside the Accounting Hub mapping Average Projections vs FIFO valuations and audit variances.

### 🔔 4. Header Notification Center
- Generates real-time alerts based on low safety stock levels, incoming purchase dispatches, and ledger sync states.
- Incorporates a **Web Audio API** synthesizer that issues a soft triangle-wave chime alert for low-stock warnings on page load.
- Features a dropdown notifications drawer with action endpoints that route users directly to relevant control panels.

### 📊 5. Predictive Run-out Velocity Forecasting
- Computes average consumption velocity (`removals / timeRange` days) for each product based on historical transaction logs.
- Divides current stock by daily velocity to project days of supply remaining with warning badges (**Critical** <= 10d, **Warning** <= 30d, **Safe** > 30d).
- Plots a projected 30-day stock depletion path (`Quantity - Velocity * Day`) for top critical items on a custom Recharts Line Chart.

### ⚙️ 6. Automated Restock Hub
- Offers a safety-stock multiplier slider to scale reorder quantities dynamically.
- Runs a suggestion engine that highlights products below minimum limits, letting admins check and dispatch bulk draft Purchase Orders in one click.

### 💼 7. Partner Supplier Portal & Automated Timeline
- A dedicated dashboard for vendor accounts to manage incoming POs, declare shipping carrier and tracking IDs, and manage catalog unit pricing.
- Renders an interactive shipping timeline tracker (Draft Approval ➡️ Ordered ➡️ In Transit ➡️ Delivered) with client-side SMTP invoice dispatch simulation.

### 📷 8. Web Camera Barcode Scanner
- Activates the device camera viewport with scanning laser line animation loops.
- Synthesizes audio beeps on successful scans and triggers automated item edits or stock updates.

### 💵 9. Accounting & Financial Sync Hub
- Computes Cost of Goods Sold (COGS) dynamically across transaction logs.
- Exports formatted valuation lists matching QuickBooks Online (Inventory Valuation) and Xero (Bills/Accounts Payable) CSV schemas.

### 📱 10. Mobile Companion Hub
- A React Native companion app located in `/mobile`, built with Expo SDK 51, providing a synced mobile experience.

---

## 📁 Repository Layout
```
├── mobile/                   # React Native Expo Mobile Companion App
├── supabase/
│   └── migrations/           # PostgreSQL Schema DDL Migrations
├── src/
│   ├── components/
│   │   ├── accounting/       # Financial metrics, FIFO grids, & CSV Exporters
│   │   ├── analytics/        # Restock suggested grids & depletion line charts
│   │   ├── inventory/        # Camera scan overlays & inventory grids
│   │   └── layout/           # Shared sidebars & header bell alert drawer
│   ├── hooks/                # Supabase Auth, PO events, and Locations allocation hooks
│   └── pages/                # Landing views and dashboard shells
```

---

## 🚀 Quick Start

### 1. Clone & Set Up Web Application
```bash
# Clone the repository
git clone https://github.com/Hubrisdog/logiflow-hub.git
cd logiflow-hub

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
The application will launch on your local viewport at `http://localhost:8080/`.

### 2. Set Up Mobile App (Expo)
```bash
# Navigate to the mobile app directory
cd mobile

# Install mobile dependencies
npm install

# Launch the Expo bundler
npx expo start
```
* Press **`w`** to open inside your local browser.
* Scan the console QR code using the **Expo Go** application on your physical device.

---

## 📊 Database Schema DDL
The PostgreSQL database is managed via Supabase. Apply the migration scripts in the `/supabase/migrations/` directory in the following order:
1. **Multi-Location Inventory & POs:** `20260530000000_phase1_enterprise.sql`
2. **Supplier Dispatch & Logistics:** `20260530000100_phase2_automation.sql`
3. **SaaS Multi-Tenancy & RLS:** `20260531000000_phase6_saas_multi_tenant.sql`

---

Built by Hubris