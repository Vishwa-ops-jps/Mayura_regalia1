# MAYURA REGALIA Backend

Express.js + MySQL backend for the MAYURA REGALIA jewellery store MVP.

## Stack

- Node.js
- Express.js
- MySQL / mysql2
- JWT authentication
- bcryptjs password hashing
- CORS + dotenv

## Setup

1. Make sure MySQL is running.
2. Create `backend/.env` from `.env.example`.
3. Set your MySQL credentials and a strong `JWT_SECRET`.
4. Install dependencies:

```bash
npm install
```

5. Start the API:

```bash
npm start
```

On startup the API:
- creates the `mayura_regalia` database if it does not exist,
- creates `admins` and `products` tables,
- creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD` if that email does not exist,
- seeds the initial 20 catalogue products when the products table is empty.

## Admin Login

`POST /api/auth/login`

```json
{
  "email": "admin@mayuraregalia.com",
  "password": "Admin@123"
}
```

The response contains a JWT. Send it as:

```text
Authorization: Bearer <token>
```

## Product API

- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products?category=Earrings`
- `GET /api/products?search=kundan`
- `POST /api/products` — admin only
- `PUT /api/products/:id` — admin only
- `DELETE /api/products/:id` — admin only

Product create/update/delete operations are persisted directly in MySQL.
