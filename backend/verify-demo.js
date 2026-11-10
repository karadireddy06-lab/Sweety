# Sweety – Blood Glucose Tracker

Sweety is a full-stack web application that helps users record, manage, and monitor their blood glucose readings.

## Features

- User registration and login
- Secure password hashing using bcrypt
- JWT-based authentication
- Add, view, edit, and delete glucose readings
- Four daily reading slots:
  - Morning fasting
  - After breakfast
  - After lunch
  - After dinner
- Input validation (40–600 mg/dL)
- Prevent duplicate readings for the same user, date, and slot
- Daily, month-to-date, and previous-month reports
- Highest, lowest, average, and total reading count
- User-specific reading history

## Technology Stack

**Frontend**
- React
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- PostgreSQL
- bcrypt
- JSON Web Token

## Project Structure

```text
Sweety/
├── backend/
│   ├── routes/
│   ├── middleware/
│   ├── db.js
│   ├── server.js
│   ├── seed.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js
- PostgreSQL
- npm

## Backend Setup

1. Open the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file using `.env.example` as a reference and configure your PostgreSQL credentials and JWT secret.

4. Start the backend:

```bash
npm run dev
```

Backend runs on:

`http://localhost:5000`

## Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Demo Account

Email: `demo@sweety.com`

Password: `SweetyDemo123!`

The demo account can be populated by running the backend seed script:

```bash
cd backend
node seed.js
```

## Validation Rules

- Glucose readings must be integers between 40 and 600 mg/dL.
- Only the four supported daily slots are accepted.
- Future dates are not allowed.
- Duplicate readings for the same user, date, and slot are prevented.
- Users can access only their own readings.

## API Routes

**Authentication**
- `POST /api/auth/register`
- `POST /api/auth/login`

**Readings**
- `GET /api/readings`
- `POST /api/readings`
- `PUT /api/readings/:id`
- `DELETE /api/readings/:id`

**Health**
- `GET /api/health`

## Testing

Backend database connection check:

```bash
node test-db.js
```

## Notes

This project was developed as part of the Kenpath Junior Full Stack Developer – JavaScript & AI assignment.