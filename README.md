# Balancer — Agent Banking & Mobile Money Capital Balancing App

**Balancer** is a specialized, responsive web application designed for mobile money agents and agent banking kiosk operators in Uganda. It streamlines shift and daily balancing by automatically tracking float, physical cash, agent phone holdings, commissions, and temporary stakeholder withdrawals/injections against preset or prior capital targets.

**Live Demo:** [balancer-gamma.vercel.app](https://balancer-gamma.vercel.app)

## Screenshots

### Desktop Interface

**Capital Balancing Dashboard**
<img width="1440" height="869" alt="Screenshot 2026-10-19 at 14 29 33" src="https://github.com/user-attachments/assets/0090083d-0ae1-4742-8e3c-59cc644730f3" />

**Session History Archive**
<img width="1440" height="869" alt="Screenshot 2026-10-19 at 14 30 12" src="https://github.com/user-attachments/assets/33637186-6b19-4fed-89f8-77ee7464bfe8" />

**Secure Login Portal**
<img width="1440" height="868" alt="Screenshot 2026-10-19 at 14 31 10" src="https://github.com/user-attachments/assets/722e11fe-42e1-4b61-b62e-03feaa29dab3" />

### Mobile-First Experience

**Mobile Float Accounting**
<img width="585" height="1266" alt="IMG_1412" src="https://github.com/user-attachments/assets/4a9f7bbd-20c2-4356-a4f3-176827cf5d77" />

**Mobile Authentication**
<img width="585" height="1266" alt="IMG_1411" src="https://github.com/user-attachments/assets/bb547256-3ee2-449d-a911-2be485fc52b8" />
<img width="585" height="1266" alt="IMG_1410" src="https://github.com/user-attachments/assets/709f954a-956d-4eb5-80ce-d6273d7ac72d" />

---

## Key Features

### 1. Dynamic Baseline Capital
- **Carry Forward from Last Balancing:** Automatically loads the net capital from your most recent saved balancing record.
- **Preset Baseline Capital:** Configure a fixed starting capital (e.g., `UGX 25,000,000`) in Settings.
- **One-Click Switch:** Toggle between preset baseline and previous session total, or edit directly.

### 2. Complete Float Accounting (13 Configured Accounts)
Tracks all active telecom SIMs and banking accounts with live subtotal calculation:
- **MTN Lines:** MTN 1, MTN 2, MTN 3
- **Airtel Lines:** Airtel 1, Airtel 2
- **Agent Banks:** Bank of Africa 1, Bank of Africa 2, Centenary Bank, Stanbic Bank 1, Stanbic Bank 2, Equity Bank, DFCU Bank
- **Bill Aggregator:** PayWay
- **Clean Tactile Inputs:** Polished, uncluttered whole number inputs with instant mobile number pad and comma formatting.

### 3. Physical Cash in Drawer + Denominations Calculator
- Quick single-field entry for total physical cash.
- **Built-in Banknote Counter:** Tap **"Denominations Counter"** to count 50k, 20k, 10k, 5k, 2k, 1k notes and coins. The tool auto-sums and applies the total to the cash field.

### 4. Money on Personal Phones (Agent Lines)
- Supports **Agent 1**, **Agent 2**, and **Agent 3**.
- Real agent names configured in Settings (e.g., *Amina*, *Kato*, *Joseph*) appear dynamically across all inputs, reports, and ledgers.

### 5. Earned Commissions (Non-Business Money)
- Optional toggle: **"Include Earned Commissions"**.
- When turned ON, inputs smoothly reveal:
  - MTN 1 Commission
  - MTN 2 Commission
  - MTN 3 Commission
  - Airtel 1 Commission
  - Airtel 2 Commission
- **Important Note:** Commission earned does **not** belong to the business (it belongs to the tellers/agents or is earnings to be withdrawn). When included, it is removed/deducted from counted assets so it does not falsely inflate the business's baseline working capital.

### 6. In & Out Stakeholder Movement Tracking
- **Money Taken Out (Drawings):** Funds temporarily taken out by business stakeholders during the day. Added back to business capital because the money belongs to the business.
- **Money Added (Injections):** Funds temporarily injected by stakeholders (e.g., emergency cash). Deducted from calculated capital so it doesn't inflate actual business capital.
- **Configurable Names:** Assign real stakeholder names (e.g., *Director David*, *Director Grace*, *Partner Brian*, *Manager Sarah*).

---

## The Balancing Mathematical Formula

$$\text{Counted Assets} = \text{Total Float} + \text{Physical Cash} + \text{Agent Phones}$$

$$\text{Gross Capital} = \text{Counted Assets} + \sum \text{Stakeholder Money Taken Out}$$

$$\text{Deductions} = \sum \text{Stakeholder Money Injected} + \text{Commission Earned (if included)}$$

$$\text{Net Actual Capital} = \text{Gross Capital} - \text{Deductions}$$

$$\text{Variance / Discrepancy} = \text{Net Actual Capital} - \text{Target Capital}$$

### Status Results
- **Balanced (UGX 0):** Net capital exactly matches expected target.
- **Surplus (+UGX X,XXX):** Net capital exceeds expected target (profit/excess cash).
- **Shortage (-UGX X,XXX):** Net capital is below expected target (unaccounted deficit).

---

## Mobile-First Experience
- **Auto Numeric Keypad:** All numeric inputs use `inputmode="numeric"` to trigger the numeric keypad on iOS and Android.
- **Automatic UGX Comma Formatting:** Digits format live as you type (`1500000` -> `1,500,000`).
- **Sticky Status Bar:** A persistent bottom summary bar keeps live variance, net capital, and save/share buttons accessible at all times while scrolling.
- **Zero Decimals:** All numbers strictly whole integers in UGX currency.
- **Custom Assets & SVGs:** Clean, vector-sharp icons using official assets and SVG graphics throughout (zero emojis).
- **Custom Brand Typography:** Includes Prime Nordic typography and Balancer logo favicon.
- **Dark & Light Mode:** Toggleable theme with memory.

---

## History & Ledgers
- **Agent Ledger:** Tracks personal phone float held by each agent over time.
- **Sharing & Export:**
  - **Share WhatsApp Report:** Formats a clean executive summary ready to paste directly into WhatsApp.
  - **Print Slip:** Clean print stylesheet for receipts/slips.
  - **Export to CSV:** Download historical records for Excel.
  - **Backup & Restore (.json):** Backup all settings and records to a JSON file.

---

## Live Access

The app is deployed and accessible at:

**[https://balancer-gamma.vercel.app](https://balancer-gamma.vercel.app)**

Sign in with your registered email and password, or create a new account from the login screen.

---

## How to Run Locally

### Local Server with Node.js
```bash
npm start
```
The server will start at:
```
http://localhost:3030
```

> **Note:** Firebase Authentication requires the app to be served over HTTP/HTTPS — do not open `index.html` directly as a file (`file://`) as authentication will not work.

### Running Tests
To verify all calculations, state storage, and app integrity:
```bash
npm test
```
