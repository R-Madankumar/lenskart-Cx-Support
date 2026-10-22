# 👓 Lenskart Executive Dashboard (Post-Purchase CX Engine)

A custom, high-speed, lightweight workflow management application designed specifically for Lenskart store executives and customer care teams to eliminate manual calendar tracking, proactively monitor eyewear adaptation, prioritize urgent deliveries, and secure 9–10 NPS ratings.

---

## 📱 How to Use on Your Mobile Phone (Zero Database / Zero Render!)

You have **3 instant ways** to use this dashboard on your mobile phone:

### 1️⃣ Option A: Instant Local Wi-Fi (Recommended)
1. Double-click [`start_mobile_server.bat`](file:///c:/Users/Madan/Downloads/Cx%20support%20app/start_mobile_server.bat) on your PC.
2. Make sure your phone is connected to the same Wi-Fi network as your PC.
3. Open Chrome or Safari on your phone and go to:
   ```
   http://192.168.1.6:8080
   ```
4. **Tap "Add to Home Screen"**:
   - **Android Chrome**: Tap `⋮` (menu) → **"Add to Home screen"** / **"Install App"**.
   - **iPhone Safari**: Tap **Share** (square with up arrow) → **"Add to Home Screen"**.
5. It will appear on your phone home screen just like a native mobile app! Tapping any WhatsApp button immediately opens the official WhatsApp app on your phone with the pre-filled message!

---

### 2️⃣ Option B: Standalone File (100% Offline, No PC needed after sending!)
1. Send the file [`lenskart_mobile.html`](file:///c:/Users/Madan/Downloads/Cx%20support%20app/lenskart_mobile.html) to your phone (via WhatsApp document to yourself, Telegram, or Google Drive).
2. Download and open it directly in Chrome or Safari on your phone.
3. It has all styles and scripts bundled into a single file and runs 100% locally on your phone without internet (except when launching WhatsApp).

---

### 3️⃣ Option C: Free 1-Click Online Link (No Render, No Database)
If you want an `https://...` link to open on your phone anywhere (even when you're away from your PC's Wi-Fi):
1. Go to [Netlify Drop](https://app.netlify.com/drop) on your PC browser.
2. Drag and drop this folder (`Cx support app`).
3. You will immediately get a free, permanent link (e.g. `https://lenskart-cx.netlify.app`).
4. Bookmark this link on your phone. All data is saved directly in your phone's browser `localStorage`!

---

## 📌 Feature Summary by Roadmap Phase

### 📌 Phase 1: Core Foundation & Date Automation
- **Customer Intake Form**: Captures Name, Phone (`+91`), Order ID, Lens Type dropdown, Billing Date, and Urgent toggle.
- **Mobile-Friendly Drawer**: On mobile screens, the intake form is neatly collapsed with a **➕ Add Customer** toggle button so your task queue is front and center.
- **Automated Milestone Logic**:
  - **Single Vision**: Automatically calculates Mid-Way Check-in for **Day 7** and NPS Reminder for **Day 14**.
  - **Progressive Lenses**: Automatically calculates Adaptation Check-in for **Day 15** and NPS Reminder for **Day 30**.
- **Live Timeline Preview**: See the exact milestone calendar dates update dynamically as you pick the billing date and lens type.

### 📌 Phase 2: Actionable Task Queues & Live Search
- **🔥 Today's Action Queue**: Automatically filters records that require a touchpoint today (Day 7/15 check-in call due or Day 14/30 NPS survey dropping today, including overdue alerts).
- **⚡ Urgent Deliveries Pipeline**: High-priority feed aggregating all orders flagged as "Urgent" with glowing alerts and instant 1-click Lenskart CRM detail copying.
- **Live Search & Multi-Filters**: Instant search across customer name, phone number, order number, and frame notes. Filter by Single Vision vs. Progressive, or by milestone status.
- **Executive Metric Cards**: Real-time KPI summaries for Active Orders, Due Today, Urgent Deliveries, and NPS window open this week.

### 📌 Phase 3: One-Click WhatsApp API Integrations (`wa.me`)
- **Official WhatsApp Deep Linking**: Automatically formats numbers (+91 for India) and opens the WhatsApp app directly on your phone with 1 tap.
- **Context-Aware Message Generators**:
  1. **⚡ Status Update Button**: Generates expedited lab tracking updates for urgent orders.
  2. **💬 Mid-Way Check-In Script**: Distinct scripts tailored for Single Vision comfort vs. Progressive corridor adaptation.
  3. **⭐ NPS Reminder Button**: Auto-populates a polite reminder targeting a 9 or 10 rating.
- **Message Preview & Quick Edit Modal**: Review and tweak the wording or add custom store remarks before sending, with automatic milestone completion checkboxes.

### 📌 Phase 4: Data Management & Backup Controls
- **1-Click CSV Export**: Downloads your entire database into an Excel-ready `.csv` file formatted with UTF-8 BOM encoding.
- **JSON Backup & Restore**: Full JSON backup and file upload restore.
- **Archiving & Cleanup Utilities**: Easily move completed customers into an Archived queue to keep your active workspace lean and fast.
- **Demo Data Loader**: Pre-loaded with 6 realistic customer scenarios to test and showcase all workflows immediately.

---

## 📂 File Directory

```
Cx support app/
├── index.html               # Main dashboard UI (Optimized for Desktop & Mobile)
├── app.js                   # Application state, date calculations & WhatsApp logic
├── styles.css               # Styling, glowing badges, responsive layout
├── lenskart_mobile.html     # All-in-one standalone file for offline phone use
├── start_mobile_server.bat  # 1-Click local Wi-Fi launcher for phone access
├── server.ps1               # Lightweight non-admin local web server
└── README.md                # Documentation & usage guide
```
