\# Sweety – Blood Glucose Tracker



Sweety is a full-stack blood glucose tracking application that helps users securely record, manage, and monitor their daily blood glucose readings.



\## Features



\- User registration and login

\- Password hashing using bcrypt

\- JWT-based authentication

\- Secure user-specific reading management

\- Add, view, update, and delete glucose readings

\- Four daily reading slots:

&#x20; - Morning (fasting)

&#x20; - After breakfast

&#x20; - After lunch

&#x20; - After dinner

\- Input validation:

&#x20; - Blood glucose values between 40 and 600 mg/dL

&#x20; - No future reading dates

&#x20; - No duplicate slots for the same date

\- Daily, month-to-date, and previous-month reports

\- Summary statistics: highest, lowest, average, and reading count

\- Responsive React frontend



\## Technology Stack



\*\*Frontend\*\*

\- React

\- Vite

\- JavaScript

\- CSS



\*\*Backend\*\*

\- Node.js

\- Express.js

\- PostgreSQL

\- JWT

\- bcrypt



\## Project Structure



```text

Sweety/

├── backend/

│   ├── routes/

│   ├── db.js

│   ├── server.js

│   ├── schema.sql

│   ├── seed.js

│   ├── test-db.js

│   ├── .env.example

│   └── package.json

│

├── frontend/

│   ├── src/

│   │   ├── App.jsx

│   │   └── App.css

│   └── package.json

│

├── .gitignore

└── README.md

```



\## Prerequisites



Install the following before running the project:



\- Node.js

\- npm

\- PostgreSQL



\## Installation and Setup



\### 1. Clone the repository



```bash

git clone https://github.com/karadireddy06-lab/Sweety.git

cd Sweety

```



\### 2. Create the PostgreSQL database



Open PostgreSQL or pgAdmin and create a database:



```sql

CREATE DATABASE sweety\_db;

```



\### 3. Configure the database schema



Open the `backend/schema.sql` file and execute its SQL statements in the `sweety\_db` database.



\### 4. Configure environment variables



Navigate to the backend directory:



```bash

cd backend

```



Create a `.env` file using `.env.example` as a reference.



Configure your own PostgreSQL credentials and JWT secret:



```env

PORT=5000

DB\_USER=your\_database\_user

DB\_HOST=localhost

DB\_NAME=sweety\_db

DB\_PASSWORD=your\_database\_password

DB\_PORT=5432

JWT\_SECRET=your\_long\_random\_secret

```



Do not commit your actual `.env` file to GitHub.



\### 5. Install backend dependencies



From the `backend` directory:



```bash

npm install

```



\### 6. Start the backend server



```bash

npm start

```



The backend API runs at:



```text

http://localhost:5000

```



\### 7. Install frontend dependencies



Open a new terminal and navigate to the frontend directory:



```bash

cd Sweety/frontend

npm install

```



\### 8. Start the frontend



```bash

npm run dev

```



Open the local URL displayed in the terminal by Vite.



\## Demo Account



A demo account can be created by running the seed script from the backend directory:



```bash

node seed.js

```



Demo login credentials:



\- \*\*Email:\*\* demo@sweety.com

\- \*\*Password:\*\* SweetyDemo123!



\## API Endpoints



\### Authentication



| Method | Endpoint | Description |

|---|---|---|

| POST | `/api/auth/register` | Register a new user |

| POST | `/api/auth/login` | Log in a user |



\### Blood Glucose Readings



| Method | Endpoint | Description |

|---|---|---|

| GET | `/api/readings` | Retrieve user readings |

| POST | `/api/readings` | Create a reading |

| PUT | `/api/readings/:id` | Update a reading |

| DELETE | `/api/readings/:id` | Delete a reading |



Reading endpoints require JWT authentication.



\## Database Design



The application uses two main PostgreSQL tables:



\- \*\*users:\*\* Stores registered user information and hashed passwords.

\- \*\*readings:\*\* Stores glucose readings linked to individual users.



Each user can record a maximum of four readings per day, one for each supported time slot.



\## Validation Rules



\- Reading values must be integers between 40 and 600 mg/dL.

\- Reading dates cannot be in the future.

\- Duplicate reading slots for the same user and date are not allowed.

\- Users can access only their own readings.



\## Database Connection Check



From the backend directory, run:



```bash

node test-db.js

```



This checks whether the application can connect to PostgreSQL.



\## Repository



GitHub: https://github.com/karadireddy06-lab/Sweety



\## Notes



This project was developed as a Junior Full Stack Developer assignment using React, Node.js, Express.js, and PostgreSQL.



