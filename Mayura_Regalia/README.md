# MAYURA REGALIA - Jewellery E-Commerce MVP

MAYURA REGALIA is a React.js + Express.js + MySQL jewellery e-commerce MVP with a separate admin panel.

## Project Structure

```text
MAYURA-REGALIA/
├── frontend/                 # React storefront + admin UI
│   ├── public/products/      # Jewellery images
│   └── src/
│       ├── admin/            # Admin login + dashboard
│       ├── components/       # Storefront components
│       ├── pages/            # Storefront pages
│       ├── services/         # API/auth/product services
│       └── ...
└── backend/                  # Express API
    ├── config/              # MySQL connection
    ├── controllers/         # Auth/product logic
    ├── middleware/          # JWT admin protection
    ├── models/              # MySQL queries
    ├── routes/              # REST routes
    └── utils/               # Seed helpers
```

## Run the project

### 1. Backend

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and set your MySQL credentials.

```bash
npm start
```

The backend creates the `mayura_regalia` database/tables and seeds the initial catalogue if required.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm start
```

The storefront runs on `http://localhost:3000` and the API runs on `http://localhost:5000`.

## Admin Panel

Open:

`http://localhost:3000/admin/login`

The credentials come from `backend/.env`:

```env
ADMIN_EMAIL=admin@mayuraregalia.com
ADMIN_PASSWORD=Admin@123
```

After login, the admin dashboard can add, edit and delete products. These changes are saved in MySQL and immediately become available to the React storefront through `/api/products`.

## Database

The backend uses MySQL database `mayura_regalia` and automatically creates:

- `admins`
- `products`

Do not commit `.env` to source control. Change the default admin password and JWT secret before deployment.
