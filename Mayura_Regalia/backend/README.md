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

## Payment gateway (Razorpay)

Online payments (debit/credit cards, UPI, netbanking, wallets) go through Razorpay.
Unlike the JWT secret and DB credentials, the Razorpay keys are **not** set via `.env`
— they're entered by the store admin at runtime in **Admin → Settings → Payment gateway**
and stored in the `settings` table, the same way the existing API keys work.

1. Create a Razorpay account and get your **Key ID** and **Key Secret** from
   Dashboard → Settings → API Keys.
2. In the admin panel, go to Settings, paste both keys in, add a merchant UPI ID if you
   want it shown at checkout, and flip "Enable online payments" on.
3. (Optional but recommended) In Razorpay Dashboard → Settings → Webhooks, add a webhook
   pointing at `POST /api/payments/razorpay/webhook` for the `payment.captured` and
   `payment.failed` events, and paste the webhook secret into the same Settings page.
   This is a safety net so a payment still gets reconciled even if the customer's
   browser closes right after paying, before the normal verify call runs.

Relevant endpoints:
- `GET /api/payments/config` — public; tells the storefront which payment methods are live
- `POST /api/payments/razorpay/create-order` — public; creates a Razorpay order for an existing order
- `POST /api/payments/razorpay/verify` — public; verifies the signature Razorpay returns and marks the order paid
- `POST /api/payments/razorpay/webhook` — Razorpay calls this directly
- `POST /api/payments/direct-upi/reference` — public; records the UTR a customer reports after a direct UPI payment
- `GET /api/payments` / `PUT /api/payments/:id/status` — admin only, existing Payments screen

## Direct UPI (no gateway)

A second way to accept UPI, alongside Razorpay: the customer scans a QR code (or taps a link on mobile)
built from the admin's own UPI ID, pays in their own UPI app, and reports back the reference/UTR number.
Money goes straight to whichever bank account that UPI ID is linked to — there's no Razorpay account
involved in this path at all.

The catch: there is no gateway to verify the payment against, so it is **not automatically confirmed**.
The order is created with `paymentStatus: pending` and the customer's UTR is stored as the payment's
`transactionId` purely as a cross-check. The admin still has to open their own UPI app/bank statement,
confirm the money actually arrived, and mark the order **Paid** from the existing admin Payments screen.

To turn it on: Admin → Settings → Payment gateway → Direct UPI → enable it and fill in your UPI ID
(the same UPI ID field is shared with the Razorpay section's "shown to customers" note).
