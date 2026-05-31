# Two-step E-Commerce

A full-stack e-commerce platform built with React, Express.js, PostgreSQL, and Cloudinary.

## Tech Stack

- **Frontend**: React 18 + Vite + SCSS
- **Backend**: Express.js + PostgreSQL
- **Image Storage**: Cloudinary
- **Authentication**: JWT with httpOnly cookies
- **Payment**: Cash on Delivery

## Features

### Storefront
- Product listing with filters and search
- Product detail pages with size/color selection
- Shopping cart (context-based)
- Checkout with Cash on Delivery
- Responsive design (mobile-first)

### Admin Dashboard
- Dashboard with stats (revenue, orders, users)
- Product CRUD with image upload
- Order management with status tracking
- User management with role-based access
- Category management

### Authentication & Authorization
- JWT authentication with refresh tokens
- Three-tier RBAC: Admin, Moderator, Customer
- Protected routes and API endpoints

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Cloudinary account (free tier)

### Database Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE twostep;
```

2. Run the schema:
```bash
psql -U postgres -d twostep -f server/config/schema.sql
```

### Environment Variables

Create `.env` file in `/server` directory:

```env
PORT=5000
CLIENT_URL=http://localhost:5173

DB_USER=postgres
DB_HOST=localhost
DB_NAME=twostep
DB_PASSWORD=admin
DB_PORT=5432

JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Installation

1. Install server dependencies:
```bash
cd server
npm install
```

2. Install client dependencies:
```bash
cd client
npm install
```

### Running the App

1. Start the server:
```bash
cd server
npm run dev
```

2. Start the client:
```bash
cd client
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

### Default Admin Account

After setting up the database, create an admin user:

```sql
INSERT INTO users (email, password_hash, first_name, last_name, role)
VALUES ('admin@twostep.com', '$2a$10$YourHashedPasswordHere', 'Admin', 'User', 'admin');
```

## Deployment

### Vercel (Frontend)

1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `client`
4. Deploy

### Railway (Backend)

1. Push to GitHub
2. Create new project in Railway
3. Add PostgreSQL database
4. Set environment variables
5. Deploy

## Project Structure

```
twostep/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── context/        # Auth & Cart context
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── styles/         # SCSS styles
│   └── public/
├── server/                 # Express backend
│   ├── config/             # DB, Cloudinary config
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth, RBAC, upload
│   ├── routes/             # API routes
│   └── utils/              # Helpers
└── package.json
```

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

### Products
- GET /api/products
- GET /api/products/:slug
- POST /api/products (admin/moderator)
- PUT /api/products/:id (admin/moderator)
- DELETE /api/products/:id (admin)

### Orders
- POST /api/orders
- GET /api/orders
- GET /api/orders/:id
- PUT /api/orders/:id/status (admin/moderator)

### Users
- GET /api/users (admin/moderator)
- PUT /api/users/:id/role (admin)
- DELETE /api/users/:id (admin)

### Categories
- GET /api/categories
- POST /api/categories (admin/moderator)
- PUT /api/categories/:id (admin/moderator)
- DELETE /api/categories/:id (admin)
