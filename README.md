# 🏠 NestFind – Property Rental Management Platform

A full-stack property rental platform built with **Node.js**, **Express.js**, **MongoDB**, and **Vanilla JavaScript**. Features role-based authentication, dynamic dashboards for tenants and landlords, property listings with advanced search filters, booking management with date conflict validation, and maintenance request tracking.

---

## Features

### Authentication
- User registration and login (Tenant / Landlord roles)
- Role-based dashboard routing
- Demo accounts for quick access

### Tenant
- Browse and search properties by location, type, and rent range
- View property details — beds, baths, area, amenities
- Book properties with start/end date (conflict detection)
- Track booking status (Pending / Confirmed / Cancelled)
- Raise maintenance requests with category and description
- Dashboard with stats — total bookings, active, pending, open maintenance

### Landlord
- Add new property listings with full details and amenities
- Delete existing listings
- View and manage all booking requests (Confirm / Reject)
- Manage maintenance requests (Open → In Progress → Resolved)
- Dashboard with stats — total properties, bookings, revenue, open maintenance

---

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Backend    | Node.js, Express.js         |
| Database   | MongoDB, Mongoose           |
| Frontend   | HTML5, CSS3, Vanilla JS     |
| API Style  | RESTful API                 |
| Fonts      | Google Fonts (DM Sans)      |

---

## Project Structure

```
nestfind/
├── server.js       ← Backend (Express + Mongoose + REST API)
├── index.html      ← Frontend (HTML + CSS + JS)
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed locally **or** a MongoDB Atlas account

### 1. Clone the repository
```bash
git clone https://github.com/naveena-zen/nestfind.git
cd nestfind
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure MongoDB

**Option A – Local MongoDB:**
```bash
# MongoDB runs by default at mongodb://localhost:27017/nestfind
node server.js
```

**Option B – MongoDB Atlas (Cloud):**
```bash
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nestfind node server.js
```

### 4. Run the server
```bash
node server.js
```

Open **http://localhost:3000** in your browser.

---

## 🔑 Demo Credentials

| Role     | Email                  | Password |
|----------|------------------------|----------|
| Tenant   | tenant@demo.com        | demo123  |
| Landlord | landlord@demo.com      | demo123  |

> Demo data is automatically seeded on first run.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint        | Description       |
|--------|-----------------|-------------------|
| POST   | /api/register   | Register new user |
| POST   | /api/login      | Login user        |

### Properties
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/properties       | Get all / filtered props |
| POST   | /api/properties       | Add new property         |
| DELETE | /api/properties/:id   | Delete property          |

### Bookings
| Method | Endpoint           | Description              |
|--------|--------------------|--------------------------|
| GET    | /api/bookings      | Get bookings             |
| POST   | /api/bookings      | Create booking           |
| PATCH  | /api/bookings/:id  | Update booking status    |

### Maintenance
| Method | Endpoint              | Description               |
|--------|-----------------------|---------------------------|
| GET    | /api/maintenance      | Get maintenance requests  |
| POST   | /api/maintenance      | Submit new request        |
| PATCH  | /api/maintenance/:id  | Update request status     |

---

## 🌱 Future Scope

- JWT-based authentication with secure sessions
- Image upload for property listings
- Google Maps integration for location-based search
- Email notifications for booking confirmations
- Payment gateway integration
- Mobile responsive PWA version

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---
