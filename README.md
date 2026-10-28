# 🎬 iMovies - Amazon Prime Video Themed Movie Ticket Booking Platform

A modern, production-ready full-stack movie booking application featuring a sleek, dark **Amazon Prime Video aesthetic** (deep dark blue-black `#0f171e` and `#1a242f` surfaces, crisp typography, and vibrant cyan `#00a8e1` highlights), multi-tiered seating, real-time seat locking with TTL countdown expiration via WebSockets, and comprehensive user and admin portals.

---

## 🚀 Quick Start (Zero External Setup Required)

The backend features a **Dual-Mode Persistence Layer**: it seamlessly connects to live MongoDB if available, or activates an embedded, file-persisted JSON database (`server/data/db.json`) pre-populated with blockbuster movies, theatres, and showtimes so you can run and grade the project instantly!

### 1. Start the Backend API (Port 5000)
```bash
cd server
node server.js
```

### 2. Start the Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Prime Member (User)** | `user@imovies.com` | `User@123` | Browse catalog, lock seats, book tickets, watchlist, reviews |
| **Platform Administrator** | `admin@imovies.com` | `Admin@123` | Analytics dashboard, add movies, add theatres, schedule shows, moderation |

> 💡 **Tip:** Both login forms feature 1-click **"Auto-Fill Demo User"** and **"Auto-Fill Demo Admin"** buttons for immediate testing!

---

## ✨ Key Features & Architecture

### 🎨 Sleek Amazon Prime Video Aesthetic
- **Color Palette:** Authentic Prime Video navy `#0f171e`, surface slate `#1a242f`, and vibrant cyan accent `#00a8e1`.
- **Horizontal Carousels:** Smooth card hover scaling (`scale(1.06)`), trailer previews, and instant watchlist toggles.
- **Prime Badges:** `PRIME`, `U/A 16+`, `IMDb ★ 8.8`, and audio/format badges.

### 💺 Core Feature: Real-Time Seat Locking with TTL Expiration
- **Multi-Tier Seat Maps:**
  - 👑 **Balcony Tier:** Premium plush recliner seating (₹300 - ₹380)
  - ⭐ **Middle Tier:** Standard executive cinema comfort (₹200 - ₹280)
  - 🎟️ **Lower Tier:** Budget front row viewing (₹140 - ₹180)
- **10-Minute Lock TTL:** Seats are temporarily held in real time to prevent double-booking. A live MM:SS countdown warning timer displays the remaining hold time.
- **WebSocket Synchronization:** Powered by Socket.io (`seats:locked`, `seats:booked`, `seats:unlocked`) so multi-tab clients update instantaneously.
- **Automated Cleanup Service:** Background node-cron job releases expired seat holds every 30 seconds.

### 📱 Digital Cinema Tickets & Sharing
- High-fidelity digital ticket with perforated cinema receipt visual.
- High-resolution scannable QR code generated per booking.
- 1-click **WhatsApp Share**, **Print Pass**, and automated cancellation policy check (cancellations permitted up to 2 hours before showtime).

---

## 🛠️ Tech Stack

- **Client:** React 18, Vite, React Router DOM (Lazy loaded routes), Tailwind & Prime Video CSS system, FontAwesome, React-Toastify, Axios, Socket.io-client.
- **Server:** Node.js, Express.js REST API, JWT Authentication, Bcrypt.js, Socket.io, Node-cron.
- **Database:** MongoDB (Mongoose ODM) with Dual-Mode embedded file persistence fallback.

---

## 📁 Application Routes

### Public Views
- `/landing`: Hero billboard carousel with Prime Video gradient overlays and feature highlights.
- `/login` & `/register`: Clean centered dark card forms with 1-click demo credential autofill.

### User Protected Views (`UserProtection.jsx`)
- `/home`: Prime Video homepage with genre carousels, instant search, and spotlight banner.
- `/moviedetails/:movieId`: Full overview with wide backdrop, trailer modal, cast list, and user reviews.
- `/movieshows/:movieId`: Showtimes grouped by venue/theatre with date tabs.
- `/seatslug/:showId`: Interactive tier-based seat selector with real-time TTL timer and cinema screen.
- `/bookings`: Digital ticket history with printable pass and QR view.
- `/watchlist`: Saved movie collection.

### Admin Protected Views (`AdminProtection.jsx`)
- `/admin`: Analytics dashboard with revenue, tickets, active venues, and live charts.
- `/addmovie`: Movie creation form with poster preview and genre tags.
- `/addtheatre`: Multiplex registration with tier pricing setup.
- `/addshow`: Showtime scheduler linking movies, dates, and venues.
- `/adminbookings`: All platform reservations with refund/moderation tools.

---

## ✨ Features

### 🌟 Customer Experience
- **Live Market Movies from TMDB:** Fetches the latest blockbusters, trailers, synopsis, cast, and ratings directly from The Movie Database (TMDB) API.
- **Dynamic Filtering:** Filter movies by **Genre** (Action, Comedy, Drama, Sci-Fi, Horror, etc.) and **Country/Location** (India, USA, South Korea, UK, Japan, etc.).
- **Real-Time Seat Booking:** Interactive multi-tiered cinema layout (Balcony, Middle, Lower).
- **10-Minute Hold Locking:** Powered by **Socket.io** to prevent double-booking. Locked seats expire automatically if payment is not completed within 10 minutes.
- **Direct Payment Engine & Stored Transactions:** Seamless direct checkout supporting Mock UPI (Google Pay, PhonePe, Paytm, QR), Cash at Box Office, Debit/Credit Cards, and NetBanking with automated MongoDB transaction history logging.
- **Automated Email Confirmations:** Sends styled HTML tickets to customer emails upon booking confirmation via Nodemailer.
- **Digital Ticket & WhatsApp Sharing:** Printable tickets with simulated QR pass and a 1-click **Share to WhatsApp** action.
- **Dark & Light Mode:** Seamless theme toggling with persistent state management across the app.
- **User Profile Management:** Edit personal details and manage booking histories.

### 🛡️ Admin Suite & Role-Based Access Control (RBAC)
- **Role Isolation:** Strict role validation (`admin` vs `user`). Public signups are strictly constrained to `role: 'user'`, preventing privilege escalation.
- **Admin Dashboard & Analytics:** Real-time metrics for total revenue, active theatres, scheduled shows, and user base.
- **Movie, Theatre & Showtime Management:** Create, edit, and schedule shows across custom seating configurations and price tiers.
- **Transactions & Refund Management:** View all user payments, audit transaction histories, and issue instant direct refunds from the admin panel, automatically freeing up reserved seats in real time.
- **Protected Admin Provisioning:** Super-admin protected route (`POST /api/admin/create-admin`) to securely provision new administrator accounts.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, React Router DOM v6, Bootstrap 5, FontAwesome, React Toastify, Axios, Socket.io-client
- **Backend:** Node.js, Express.js, MongoDB with Mongoose, Socket.io, JWT (JSON Web Tokens), Bcrypt.js
- **Integrations:**
  - **TMDB API** (Movie Discovery & Metadata)
  - **Direct Payment Engine** (Atomic Direct Checkout & Transaction History)
  - **Brevo / Nodemailer** (Transactional Confirmation Emails)

---

## 📁 Project Structure

```text
iMovies/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Navbar, MovieCard, Modals, Checkout, Legenda
│   │   ├── context/            # ThemeContext (Dark / Light)
│   │   ├── hooks/              # Custom data fetching hooks
│   │   ├── pages/              # Landing, Home, SeatSlug, Bookings, Admin, etc.
│   │   └── utils/              # API interceptors, guards, whatsapp helpers
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express Backend
│   ├── controllers/            # Auth, Movie, Theatre, Show, Booking, Admin
│   ├── middlewares/            # fetchUser, fetchAdmin RBAC guards
│   ├── models/                 # User, Admin, Movie, Theatre, Show, Booking
│   ├── routes/                 # Express API endpoints
│   ├── services/               # TMDB & Nodemailer services
│   ├── utils/                  # Cron seat-cleanup & show reminders
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/ritik2209verma-ai/iMovies.git
cd iMovies
```

### 2. Configure Backend Environment
Navigate to `server/` and create `.env` based on `.env.example`:
```bash
cd server
cp .env.example .env
```
Fill in your credentials:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/imovies
JWT_SECRET=your_secret_key
TMDB_API_KEY=your_tmdb_api_key
BREVO_API_KEY=your_brevo_api_key
SENDER_EMAIL=your_sender_email
SENDER_NAME=iMovies
```

Install backend dependencies and start the server:
```bash
npm install
npm run dev   # or: node server.js
```

### 3. Configure Frontend Environment
Navigate to `client/` and create `.env` based on `.env.example`:
```bash
cd ../client
cp .env.example .env
```
Fill in your configuration:
```env
VITE_API_URL=http://localhost:5000/api
```

Install frontend dependencies and start the Vite dev server:
```bash
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser!

---

## 🔒 Security & RBAC Enforcement

- Public signup `/api/auth/register` and `/api/auth/signup` will always default to `role: 'user'`, ignoring any client-injected role fields.
- Admin creation `/api/admin/create-admin` requires both a verified admin JWT and active record check in MongoDB.
- Direct checkout atomic validation guarantees seat availability, updates booking status to `Completed`, logs immutable transaction history records, and dispatches automated Brevo e-tickets.

---

## 📜 License
MIT License. Created by [ritik2209verma-ai](https://github.com/ritik2209verma-ai).
