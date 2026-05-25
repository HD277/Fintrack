# Fintrack
# 💰 FinTrack — Departmental Budget Monitoring System

A full-stack web application that helps organisations track departmental budgets, compare actual spending against forecasts, and automatically flag overspends before they become a problem.

Built with **Python (Flask)** on the backend and **React.js** on the frontend.

---

## Screenshots

### Dashboard — Budget Overview
<img width="1357" height="605" alt="Screenshot (17)" src="https://github.com/user-attachments/assets/7e0286f4-34f6-4888-8181-7cf0f3efb348" />

### Departments — Budget Management
<img width="1361" height="603" alt="Screenshot (20)" src="https://github.com/user-attachments/assets/d87662ea-44f7-4ef3-90fa-5d58432a15c4" />

### Transactions — Expense Tracking
<img width="1361" height="587" alt="Screenshot (19)" src="https://github.com/user-attachments/assets/d1e9645d-e1f5-4292-9796-39aa9580db1f" />

### Monthly Reports — Actuals vs Forecast
<img width="1359" height="593" alt="Screenshot (18)" src="https://github.com/user-attachments/assets/54e7b3e1-bf2c-4d46-85f1-254e2fda9a9b" />


---

## What it does

Every department in a company gets a yearly budget. Someone has to track every expense, compare it against what was planned, and raise a flag when things go off course. FinTrack handles all of that in one place.

- **Dashboard** — see all departments at a glance with total budget, actuals spent, forecast, and a side-by-side bar chart so you can spot outliers immediately
- **Departments** — add or remove departments and set their annual budget cap
- **Transactions** — log individual expenses or forecast entries by department and month, with filters to drill into specific departments or time periods
- **Monthly Reports** — a line chart showing actuals vs forecast month by month, with a variance breakdown table below
- **Alerts** — automatically flags any department that has crossed 60% or 80% of its annual budget
- **CSV Import** — bulk-upload transactions from a spreadsheet for loading historical data quickly

---

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask, Flask-CORS |
| Frontend | React.js 18, Recharts, PapaParse |
| Storage | JSON file (no database setup needed) |
| Charts | Recharts (bar chart, line chart) |
| CSV parsing | PapaParse |

---

## Project structure

```
fintrack/
├── backend/
│   ├── app.py              # Flask REST API — all routes and business logic
│   ├── requirements.txt    # Python dependencies
│   └── data.json           # Auto-generated on first run with demo data
└── frontend/
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js          # All React components and page logic
        ├── index.js        # React entry point
        └── index.css       # Global styles
```

---

## Getting started

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/fintrack.git
cd fintrack
```

### 2. Start the backend

Open a terminal and run:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The Flask server starts at `http://localhost:5000`. On first run it creates `data.json` automatically, pre-loaded with demo data across five departments so you can see the dashboard working immediately.

### 3. Start the frontend

Open a **second terminal** and run:

```bash
cd frontend
npm install
npm start
```

This opens `http://localhost:3000` in your browser automatically. Both terminals need to stay open while using the app.

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/departments` | List all departments |
| POST | `/api/departments` | Add a department |
| DELETE | `/api/departments/:id` | Remove a department and its transactions |
| GET | `/api/transactions` | List transactions (filter by dept\_id, month) |
| POST | `/api/transactions` | Add a transaction |
| DELETE | `/api/transactions/:id` | Remove a transaction |
| GET | `/api/report/summary` | Per-department budget summary with variance and alert status |
| GET | `/api/report/monthly` | Month-by-month actuals vs forecast breakdown |
| GET | `/api/alerts` | Departments that have crossed the 60% or 80% utilisation threshold |

---

## CSV import format

To bulk-import transactions, upload a `.csv` file with these columns:

```
department,description,amount,month,type
Engineering,AWS Servers,45000,2024-03,actual
Marketing,Ad Campaign Q2,25000,2024-03,actual
Operations,Office Rent,18000,2024-03,forecast
```

The `department` value must match an existing department name (case-insensitive). The `type` field accepts `actual` or `forecast`.

---

## How the alert system works

The backend calculates utilisation as `(total actuals / annual budget) × 100` for each department on every summary request.

- Above **60%** → warning alert
- Above **80%** → critical alert

The Alerts page shows a real-time list of departments that have crossed either threshold, with a visual progress bar showing how much of the budget has been consumed.

---

## Things I'd add with more time

- User authentication so different department heads can only see their own data
- Export to PDF or Excel for period-end reporting
- PostgreSQL backend for larger datasets
- Email or Slack notifications when an alert triggers
- Year-over-year comparison view

---

## Local development notes

- The frontend runs on port 3000 and proxies all `/api/...` requests to port 5000 (configured in `package.json`)
- All data is stored in `backend/data.json` — you can delete this file to reset to a clean state, it will be recreated with demo data on the next server start
- No environment variables or `.env` files needed to run locally

---

## Author

**Harshal Daf**
[linkedin.com/in/harshal-daf](https://linkedin.com/in/harshal-daf) · harshaldaf627@gmail.com

---

*Feel free to fork and adapt for your own use.*
