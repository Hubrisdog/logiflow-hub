# LogiFlow Mobile Hub 📱

Welcome to the **LogiFlow Mobile Hub** codebase! This is the React Native + Expo companion application designed to give administrators and warehouse staff real-time inventory metrics, search capabilities, and camera-based barcode scanning on mobile devices.

---

## 🚀 Quick Start

Ensure you have [Node.js](https://nodejs.org/) installed, then run:

```bash
# 1. Navigate to the mobile directory
cd mobile

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start
```

### Running on Devices
* **Physical Device (Expo Go):** Install the "Expo Go" app on your iOS or Android device. Scan the QR code printed in the terminal console to load the application instantly.
* **Android Emulator:** Press `a` in the terminal to load the app in an active Android virtual device.
* **iOS Simulator:** Press `i` in the terminal to load the app in Xcode's iOS Simulator.
* **Web Viewport:** Press `w` in the terminal to compile and open the app inside your local web browser.

---

## 📋 Features Implemented

1. **Simulated Mobile Authentication**
   * Secure form entries and instant developer shortcuts for **Admin Demo**, **Staff Demo**, and **Supplier Demo** roles.
2. **Dynamic Live Dashboard**
   * Real-time metrics tracking: Total Stock Valuation (USD), Active SKU Count, and Low Stock Warning indices.
   * Direct routing triggers to Scanner and Inventory screens.
3. **Searchable Inventory Catalog**
   * Filter items instantly by categories or search queries (product name or SKU numbers).
   * Dialog modal details showing suppliers, prices, categories, and description fields.
   * Role-based stock manipulation: staff and administrators can increment or decrement stock counts, while supplier partners receive read-only alerts.
4. **Barcode scanner Viewfinder**
   * Camera viewfinder simulation displaying neon laser scan animations, corner overlay anchors, and success feedback.
   * Dropdown simulator panel to test scanning real product SKUs and incrementing quantities.

---

## 📁 Directory Layout

```
mobile/
├── assets/             # Splash screens, icons, and logo assets
├── src/
│   ├── hooks/          # Custom state hooks (useMobileInventory)
│   └── screens/        # Screen views (Login, Dashboard, Inventory, Scanner)
├── App.tsx             # Main entry point, routing tabs & authentication
├── app.json            # Expo project configuration 
├── tsconfig.json       # TypeScript options
└── package.json        # Node scripts and dependencies
```
