# LogiFlow Hub 🪐

LogiFlow Hub is a premium, dark-mode-first, enterprise-grade inventory intelligence and logistics orchestration platform. Built with **React 18**, **TypeScript**, **Vite**, and **Supabase (PostgreSQL)**, it delivers a sleek, high-contrast dashboard aesthetic powered by a custom **Volt Orange & Electric Cyan** color system.

The project is fully modular, type-safe, and includes a **React Native (Expo)** companion mobile app for on-the-floor warehouse scanning.

---

## 🌌 Modern Visual Experience
LogiFlow Hub is styled with custom Tailwind CSS integrations for a tactile, dark-mode-first interface:
* **Branding:** Replaced generic imagery with a minimalist geometric **Orbit** branding symbol, representing fluid supply channels and connected inventories.
* **Palette:** Utilizes a custom **Volt Orange** (Primary) and **Electric Cyan** (Accent) theme, providing a glowing high-contrast look over deep charcoal-slate canvases.
* **Tactile CTAs:** Landing buttons and cards feature transition scaling (`hover:scale-105 active:scale-95`) and hover glows (`hover:ring-2 hover:ring-primary/40`).

---

## 🛠️ Key Enterprise Systems (Roadmap Progress)

All five phases of the LogiFlow Enterprise roadmap have been successfully implemented and compiled:

### 🔔 1. Header Notification Center (Phase 5)
* Generates real-time alerts based on low safety stock levels, incoming purchase dispatches, and ledger sync states.
* Incorporates a **Web Audio API** synthesizer that issues a soft triangle-wave chime alert for low-stock warnings on page load.
* Features a dropdown notifications drawer with action endpoints that route users directly to relevant control panels.

### 📈 2. Predictive Run-out Velocity Forecasting (Phase 5)
* Computes average consumption velocity (`removals / timeRange` days) for each product based on historical transaction logs.
* Divides current stock by daily velocity to project days of supply remaining with warning badges (**Critical** <= 10d, **Warning** <= 30d, **Safe** > 30d).
* Plots a projected 30-day stock depletion path (`Quantity - Velocity * Day`) for top critical items on a custom Recharts Line Chart.

### ⚙️ 3. Automated Restock Hub (Phase 2)
* Offers a safety-stock multiplier slider to scale reorder quantities dynamically.
* Runs a suggestion engine that highlights products below minimum limits, letting admins check and dispatch bulk draft Purchase Orders in one click.

### 💼 4. Partner Supplier Portal (Phase 2)
* A dedicated dashboard for vendor accounts to manage incoming POs, declare shipping carrier and tracking IDs, and manage catalog unit pricing.

### 📷 5. Web Camera Barcode Scanner (Phase 3)
* Activates the device camera viewport with scanning laser line animation loops.
* Synthesizes audio feedback on successful scans and triggers automated item edits or stock updates.

### 💵 6. Accounting & Financial Sync Hub (Phase 3)
* Computes Cost of Goods Sold (COGS) dynamically across transaction logs.
* Exports formatted valuation lists matching QuickBooks Online (Inventory Valuation) and Xero (Bills/Accounts Payable) CSV schemas.

### 📱 7. Mobile Companion Hub (Phase 4)
* A React Native companion app located in `/mobile`, built with Expo SDK 51, providing a synced mobile experience.

---

## 📁 Repository Layout
```
├── mobile/                   # React Native Expo Mobile Companion App
├── supabase/
│   └── migrations/           # PostgreSQL Schema DDL Migrations
├── src/
│   ├── components/
│   │   ├── accounting/       # Financial metrics & CSV Exporters
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

This sets up:
* `public.profiles`: Extends access roles (`admin`, `staff`, `supplier`).
* `public.locations`: Warehouses list (Aisle/Shelf allocations).
* `public.purchase_orders`: Tracks orders status (`draft`, `sent`, `received`, `cancelled`).
* `public.item_stock_locations`: Tracks exact product distribution across multiple physical locations.

---

Built with 🪐 by Hubris