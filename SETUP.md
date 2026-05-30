# LogiFlow Hub Setup Guide 🪐

This guide walks you through setting up LogiFlow Hub from scratch on your local machine.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Prerequisites
Ensure you have the following installed:
- **Node.js 18+**
- **npm** or **bun** package manager
- A Supabase account (or local Supabase emulator)

### Step 2: Clone and Install
```bash
git clone https://github.com/Hubrisdog/logiflow-hub.git
cd logiflow-hub
npm install
```

### Step 3: Supabase Setup

#### 3.1 Create a Supabase Project
1. Visit the [Supabase Console](https://supabase.com/).
2. Create a new project called `logiflow-hub`.
3. Set your database region and administrative password.

#### 3.2 Apply SQL Migration Schemas
LogiFlow Hub features sequential schemas. Open the **SQL Editor** on your Supabase dashboard, create a new query, copy the contents of the files in `/supabase/migrations/` in order, and click **Run**:
1. Apply the main schema, multi-location inventory, and purchase order tables:
   [20260530000000_phase1_enterprise.sql](file:///c:/Users/alphl/Downloads/logistx-inventory-hub-main/supabase/migrations/20260530000000_phase1_enterprise.sql)
2. Apply the supplier logistics tracking and supplier pricing tables:
   [20260530000100_phase2_automation.sql](file:///c:/Users/alphl/Downloads/logistx-inventory-hub-main/supabase/migrations/20260530000100_phase2_automation.sql)

---

## 🖥️ Running the Web Application

To run the Vite development server:
```bash
npm run dev
```
The application will launch on your local host at **`http://localhost:8080/`**. 

Open this address in your browser to view the interface.

### Demo Authentication Fallbacks
If your Supabase instance is not configured, LogiFlow Hub includes simulated credentials. You can click on the demo buttons on the authentication screen to load mock credentials stored in local storage:
* **Administrator:** Full permissions to restocks, locations, and accounting.
* **Staff:** Access to inventory adjustments, locations, and low-stock notification triggers.
* **Supplier:** Dedicated supplier portal for shipping tracking updates and catalog updates.

---

## 📱 Running the Mobile Companion App (Expo)

To run the on-the-floor warehouse scanning app:

### 1. Install Expo CLI and Node modules
```bash
cd mobile
npm install
```

### 2. Launch the Metro Bundler
```bash
npx expo start
```

### 3. Open on your device
- **iOS/Android Devices:** Download the **Expo Go** application from the App Store or Google Play Store. Scan the QR code printed in your terminal.
- **Web View:** Press **`w`** in the terminal to view the mobile app mockup in your local browser window.

---

## 🔧 Environment Configuration

For development, credentials can be set inside `.env` or parsed inside `src/integrations/supabase/client.ts`. 

Ensure you do not commit production Supabase administrative credentials to your repository.

---

Built with 🪐 by Hubris
