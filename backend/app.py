from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"departments": [], "transactions": []}
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def seed_data():
    """Seed with realistic demo data if file doesn't exist."""
    if os.path.exists(DATA_FILE):
        return
    data = {
        "departments": [
            {"id": 1, "name": "Engineering",    "annual_budget": 500000},
            {"id": 2, "name": "Marketing",      "annual_budget": 200000},
            {"id": 3, "name": "Operations",     "annual_budget": 150000},
            {"id": 4, "name": "HR",             "annual_budget": 100000},
            {"id": 5, "name": "Finance",        "annual_budget": 80000},
        ],
        "transactions": [
            {"id": 1,  "dept_id": 1, "description": "AWS Cloud Infrastructure",    "amount": 45000, "month": "2024-01", "type": "actual"},
            {"id": 2,  "dept_id": 1, "description": "Developer Salaries Q1",       "amount": 90000, "month": "2024-01", "type": "actual"},
            {"id": 3,  "dept_id": 1, "description": "Software Licenses",           "amount": 12000, "month": "2024-02", "type": "actual"},
            {"id": 4,  "dept_id": 1, "description": "DevOps Tools",                "amount": 8000,  "month": "2024-02", "type": "actual"},
            {"id": 5,  "dept_id": 2, "description": "Ad Campaign - Q1",            "amount": 30000, "month": "2024-01", "type": "actual"},
            {"id": 6,  "dept_id": 2, "description": "Event Sponsorship",           "amount": 15000, "month": "2024-01", "type": "actual"},
            {"id": 7,  "dept_id": 2, "description": "Content Creation Tools",      "amount": 5000,  "month": "2024-02", "type": "actual"},
            {"id": 8,  "dept_id": 3, "description": "Office Rent - Jan",           "amount": 18000, "month": "2024-01", "type": "actual"},
            {"id": 9,  "dept_id": 3, "description": "Office Rent - Feb",           "amount": 18000, "month": "2024-02", "type": "actual"},
            {"id": 10, "dept_id": 3, "description": "Utilities",                   "amount": 4000,  "month": "2024-01", "type": "actual"},
            {"id": 11, "dept_id": 4, "description": "Recruitment Drive",           "amount": 20000, "month": "2024-01", "type": "actual"},
            {"id": 12, "dept_id": 4, "description": "Training Programs",           "amount": 8000,  "month": "2024-02", "type": "actual"},
            {"id": 13, "dept_id": 5, "description": "Audit Fees",                  "amount": 12000, "month": "2024-01", "type": "actual"},
            {"id": 14, "dept_id": 5, "description": "Accounting Software",         "amount": 3000,  "month": "2024-02", "type": "actual"},
            {"id": 15, "dept_id": 1, "description": "Q1 Budget Plan - Engineering","amount": 170000,"month": "2024-01", "type": "forecast"},
            {"id": 16, "dept_id": 2, "description": "Q1 Budget Plan - Marketing",  "amount": 55000, "month": "2024-01", "type": "forecast"},
            {"id": 17, "dept_id": 3, "description": "Q1 Budget Plan - Operations", "amount": 42000, "month": "2024-01", "type": "forecast"},
            {"id": 18, "dept_id": 4, "description": "Q1 Budget Plan - HR",         "amount": 30000, "month": "2024-01", "type": "forecast"},
            {"id": 19, "dept_id": 5, "description": "Q1 Budget Plan - Finance",    "amount": 16000, "month": "2024-01", "type": "forecast"},
        ]
    }
    save_data(data)


seed_data()


# ──────────────────────────────────────────
# DEPARTMENTS
# ──────────────────────────────────────────

@app.route("/api/departments", methods=["GET"])
def get_departments():
    data = load_data()
    return jsonify(data["departments"])


@app.route("/api/departments", methods=["POST"])
def add_department():
    body = request.get_json()
    if not body or not body.get("name") or not body.get("annual_budget"):
        return jsonify({"error": "name and annual_budget are required"}), 400
    data = load_data()
    new_id = max((d["id"] for d in data["departments"]), default=0) + 1
    dept = {"id": new_id, "name": body["name"], "annual_budget": float(body["annual_budget"])}
    data["departments"].append(dept)
    save_data(data)
    return jsonify(dept), 201


@app.route("/api/departments/<int:dept_id>", methods=["DELETE"])
def delete_department(dept_id):
    data = load_data()
    data["departments"] = [d for d in data["departments"] if d["id"] != dept_id]
    data["transactions"] = [t for t in data["transactions"] if t["dept_id"] != dept_id]
    save_data(data)
    return jsonify({"message": "deleted"})


# ──────────────────────────────────────────
# TRANSACTIONS
# ──────────────────────────────────────────

@app.route("/api/transactions", methods=["GET"])
def get_transactions():
    data = load_data()
    dept_id = request.args.get("dept_id", type=int)
    month = request.args.get("month")
    txns = data["transactions"]
    if dept_id:
        txns = [t for t in txns if t["dept_id"] == dept_id]
    if month:
        txns = [t for t in txns if t["month"] == month]
    return jsonify(txns)


@app.route("/api/transactions", methods=["POST"])
def add_transaction():
    body = request.get_json()
    required = ["dept_id", "description", "amount", "month", "type"]
    for field in required:
        if field not in body:
            return jsonify({"error": f"{field} is required"}), 400
    data = load_data()
    new_id = max((t["id"] for t in data["transactions"]), default=0) + 1
    txn = {
        "id": new_id,
        "dept_id": int(body["dept_id"]),
        "description": body["description"],
        "amount": float(body["amount"]),
        "month": body["month"],
        "type": body["type"],
    }
    data["transactions"].append(txn)
    save_data(data)
    return jsonify(txn), 201


@app.route("/api/transactions/<int:txn_id>", methods=["DELETE"])
def delete_transaction(txn_id):
    data = load_data()
    data["transactions"] = [t for t in data["transactions"] if t["id"] != txn_id]
    save_data(data)
    return jsonify({"message": "deleted"})


# ──────────────────────────────────────────
# REPORTS & ANALYTICS
# ──────────────────────────────────────────

@app.route("/api/report/summary", methods=["GET"])
def summary_report():
    data = load_data()
    dept_map = {d["id"]: d for d in data["departments"]}
    result = []
    for dept in data["departments"]:
        actuals = sum(
            t["amount"] for t in data["transactions"]
            if t["dept_id"] == dept["id"] and t["type"] == "actual"
        )
        forecast = sum(
            t["amount"] for t in data["transactions"]
            if t["dept_id"] == dept["id"] and t["type"] == "forecast"
        )
        budget = dept["annual_budget"]
        variance = actuals - forecast
        variance_pct = round((variance / forecast * 100), 1) if forecast else 0
        utilisation = round((actuals / budget * 100), 1) if budget else 0
        alert = None
        if utilisation > 80:
            alert = "critical"
        elif utilisation > 60:
            alert = "warning"
        result.append({
            "dept_id": dept["id"],
            "dept_name": dept["name"],
            "annual_budget": budget,
            "total_actuals": round(actuals, 2),
            "total_forecast": round(forecast, 2),
            "variance": round(variance, 2),
            "variance_pct": variance_pct,
            "utilisation_pct": utilisation,
            "alert": alert,
        })
    return jsonify(result)


@app.route("/api/report/monthly", methods=["GET"])
def monthly_report():
    data = load_data()
    dept_id = request.args.get("dept_id", type=int)
    txns = data["transactions"]
    if dept_id:
        txns = [t for t in txns if t["dept_id"] == dept_id]
    monthly = {}
    for t in txns:
        m = t["month"]
        if m not in monthly:
            monthly[m] = {"month": m, "actuals": 0, "forecast": 0}
        if t["type"] == "actual":
            monthly[m]["actuals"] += t["amount"]
        else:
            monthly[m]["forecast"] += t["amount"]
    result = sorted(monthly.values(), key=lambda x: x["month"])
    for r in result:
        r["actuals"] = round(r["actuals"], 2)
        r["forecast"] = round(r["forecast"], 2)
        r["variance"] = round(r["actuals"] - r["forecast"], 2)
    return jsonify(result)


@app.route("/api/alerts", methods=["GET"])
def get_alerts():
    data = load_data()
    alerts = []
    for dept in data["departments"]:
        actuals = sum(
            t["amount"] for t in data["transactions"]
            if t["dept_id"] == dept["id"] and t["type"] == "actual"
        )
        utilisation = round((actuals / dept["annual_budget"] * 100), 1) if dept["annual_budget"] else 0
        if utilisation > 60:
            alerts.append({
                "dept_name": dept["name"],
                "utilisation_pct": utilisation,
                "severity": "critical" if utilisation > 80 else "warning",
                "message": f"{dept['name']} has used {utilisation}% of its annual budget."
            })
    return jsonify(alerts)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
