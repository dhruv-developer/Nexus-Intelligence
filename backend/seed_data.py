"""
Seed script — generates 1 year of realistic NatWest-style banking data and
uploads it through the live API (so it goes through the full processing pipeline).

Usage (with backend running on port 8000):

    cd nexus-intelligence/backend
    source venv/bin/activate
    python seed_data.py

You need at least one registered user. The script will log in with the
credentials below and upload the datasets on their behalf.
Edit USER_EMAIL / USER_PASSWORD if needed.
"""

import csv
import io
import random
import math
import requests
from datetime import date, timedelta, datetime, timezone

# ── Config ──────────────────────────────────────────────────────────────────
BASE_URL     = "http://localhost:8000"
USER_EMAIL   = "dhruvdawar11022006@gmail.com"
USER_PASSWORD = "dd110206"
REGISTER_IF_MISSING = True              # auto-create user if login fails
# ─────────────────────────────────────────────────────────────────────────────

random.seed(42)   # reproducible

# ── Date range ───────────────────────────────────────────────────────────────
END_DATE   = date.today()
START_DATE = END_DATE - timedelta(days=365)

def daterange(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)

# ── Helpers ──────────────────────────────────────────────────────────────────

def upload_csv(token: str, name: str, description: str, csv_content: str) -> dict:
    """POST a CSV string to the upload endpoint."""
    headers = {"Authorization": f"Bearer {token}"}
    files = {
        "file": (f"{name.replace(' ', '_')}.csv", io.BytesIO(csv_content.encode()), "text/csv")
    }
    data = {"name": name, "description": description}
    resp = requests.post(f"{BASE_URL}/api/v1/datasets/upload", headers=headers, files=files, data=data, timeout=60)
    if resp.status_code not in (200, 201):
        print(f"  ✗ Upload failed [{resp.status_code}]: {resp.text[:300]}")
        return {}
    return resp.json()


def get_token() -> str:
    """Login and return access token, registering demo user if needed."""
    resp = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
    if resp.status_code == 200:
        token = resp.json().get("access_token") or resp.json().get("token")
        if token:
            print(f"✓ Logged in as {USER_EMAIL}")
            return token

    if REGISTER_IF_MISSING:
        print(f"  Login failed ({resp.status_code}). Attempting registration …")
        reg = requests.post(f"{BASE_URL}/api/v1/auth/register", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD,
            "full_name": "Demo User"
        })
        if reg.status_code in (200, 201):
            print("  ✓ Registered. Logging in …")
            resp2 = requests.post(f"{BASE_URL}/api/v1/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD})
            token = resp2.json().get("access_token") or resp2.json().get("token")
            if token:
                return token

    raise RuntimeError(f"Could not authenticate. Register a user first at {BASE_URL}/docs\n"
                       f"  Set USER_EMAIL / USER_PASSWORD in this script to match.")


# ── Dataset 1: Daily Transactions ────────────────────────────────────────────

def generate_transactions() -> str:
    """365 days × 8-25 rows/day of retail banking transactions."""
    categories    = ["Groceries", "Transport", "Utilities", "Entertainment", "Healthcare",
                     "Dining", "Travel", "Insurance", "Salary", "Savings Transfer",
                     "Mortgage", "Investment", "Online Shopping", "Education"]
    channels      = ["ATM", "Online Banking", "Mobile App", "Branch", "POS Terminal"]
    regions       = ["London", "Manchester", "Birmingham", "Edinburgh", "Leeds",
                     "Bristol", "Cardiff", "Liverpool", "Glasgow", "Newcastle"]
    segments      = ["Retail", "SME", "Corporate", "Premier", "Student"]
    trans_types   = ["credit", "debit"]

    # seasonal + weekly multipliers
    def seasonal(d: date) -> float:
        doy = d.timetuple().tm_yday
        return 1.0 + 0.35 * math.sin(2 * math.pi * (doy - 80) / 365)

    def weekly(d: date) -> float:
        # higher mid-week
        return {0: 0.9, 1: 1.0, 2: 1.05, 3: 1.05, 4: 1.1, 5: 1.3, 6: 0.8}[d.weekday()]

    rows = [["date", "transaction_id", "transaction_type", "amount_gbp",
             "category", "channel", "region", "customer_segment",
             "account_type", "merchant_name", "is_flagged"]]

    tx_id = 100000
    for d in daterange(START_DATE, END_DATE):
        n = int(random.gauss(14, 4) * seasonal(d) * weekly(d))
        n = max(5, min(35, n))
        for _ in range(n):
            tx_type = random.choices(trans_types, weights=[30, 70])[0]
            cat     = random.choice(categories)
            # salary/savings always credit
            if cat in ("Salary", "Savings Transfer", "Investment"):
                tx_type = "credit"
            base = {"Salary": 2800, "Mortgage": 1200, "Investment": 500,
                    "Groceries": 65, "Utilities": 90, "Dining": 45,
                    "Travel": 350, "Transport": 25, "Entertainment": 30,
                    "Healthcare": 55, "Insurance": 75, "Online Shopping": 85,
                    "Education": 200, "Savings Transfer": 400}.get(cat, 60)
            amount = round(abs(random.gauss(base, base * 0.3)), 2)
            amount = max(1.0, amount)

            rows.append([
                d.isoformat(),
                f"TXN{tx_id}",
                tx_type,
                amount,
                cat,
                random.choice(channels),
                random.choice(regions),
                random.choice(segments),
                random.choice(["Current", "Savings", "Business", "ISA"]),
                f"Merchant_{random.randint(1, 200):03d}",
                "Y" if (amount > 2000 and tx_type == "debit" and random.random() < 0.05) else "N"
            ])
            tx_id += 1

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerows(rows)
    return buf.getvalue()


# ── Dataset 2: Monthly Revenue KPIs ─────────────────────────────────────────

def generate_monthly_kpis() -> str:
    rows = [["month", "year", "total_revenue_gbp", "net_interest_income",
             "fee_income", "operating_costs", "net_profit", "customer_count",
             "new_accounts", "closed_accounts", "nps_score", "loan_book_gbp",
             "deposit_book_gbp", "cost_income_ratio"]]

    base_rev   = 28_000_000
    customers  = 85_000
    loan_book  = 420_000_000
    deposit    = 510_000_000

    current = date(START_DATE.year, START_DATE.month, 1)
    while current <= END_DATE:
        month_growth = 1.0 + random.gauss(0.008, 0.004)
        rev        = round(base_rev * month_growth, 2)
        nii        = round(rev * random.uniform(0.55, 0.65), 2)
        fee        = round(rev * random.uniform(0.20, 0.28), 2)
        op_cost    = round(rev * random.uniform(0.48, 0.58), 2)
        net_profit = round(rev - op_cost, 2)
        new_acc    = int(random.gauss(1200, 200))
        closed     = int(random.gauss(400, 80))
        customers += new_acc - closed
        ci_ratio   = round((op_cost / rev) * 100, 1)
        nps        = round(random.gauss(42, 5), 1)
        loan_book  = round(loan_book * random.uniform(1.003, 1.012), 2)
        deposit    = round(deposit * random.uniform(1.001, 1.009), 2)
        base_rev   = rev

        rows.append([
            current.strftime("%B"), current.year,
            rev, nii, fee, op_cost, net_profit,
            customers, new_acc, closed,
            nps, loan_book, deposit, ci_ratio
        ])

        # advance month
        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerows(rows)
    return buf.getvalue()


# ── Dataset 3: Risk & Credit Metrics ────────────────────────────────────────

def generate_risk_metrics() -> str:
    rows = [["date", "week", "npls_gbp", "provision_coverage_pct",
             "capital_adequacy_ratio", "liquidity_coverage_ratio",
             "var_1day_gbp", "credit_score_avg", "default_rate_pct",
             "loan_to_deposit_ratio", "fraud_cases", "fraud_loss_gbp"]]

    npls        = 8_200_000
    credit_avg  = 682.0
    d = START_DATE
    week = 1
    while d <= END_DATE:
        npls        = max(5_000_000, npls * random.uniform(0.995, 1.008))
        credit_avg  = max(620, min(750, credit_avg + random.gauss(0, 1.5)))
        fraud_cases = int(random.gauss(38, 8))
        fraud_loss  = round(fraud_cases * random.uniform(800, 2200), 2)

        rows.append([
            d.isoformat(), week,
            round(npls, 2),
            round(random.uniform(72, 89), 1),      # provision coverage %
            round(random.uniform(15.2, 18.8), 2),  # CET1 ratio
            round(random.uniform(130, 165), 1),    # LCR
            round(random.gauss(1_800_000, 200_000), 2),  # 1-day VaR
            round(credit_avg, 1),
            round(random.uniform(0.8, 2.1), 2),    # default rate %
            round(random.uniform(72, 88), 1),      # LTD ratio
            max(0, fraud_cases),
            fraud_loss
        ])

        d += timedelta(weeks=1)
        week += 1

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerows(rows)
    return buf.getvalue()


# ── Dataset 4: Branch Performance ───────────────────────────────────────────

def generate_branch_performance() -> str:
    branches = [
        ("London City", "London"), ("Canary Wharf", "London"),
        ("Manchester Piccadilly", "Manchester"), ("Birmingham Bull Ring", "Birmingham"),
        ("Edinburgh Royal Mile", "Edinburgh"), ("Leeds City Centre", "Leeds"),
        ("Bristol Harbourside", "Bristol"), ("Cardiff Central", "Cardiff"),
        ("Liverpool James St", "Liverpool"), ("Glasgow Buchanan St", "Glasgow"),
    ]

    rows = [["month", "branch_name", "region", "total_transactions",
             "new_customers", "loan_applications", "loans_approved",
             "deposits_gbp", "withdrawals_gbp", "customer_complaints",
             "avg_wait_time_mins", "staff_count", "digital_adoption_pct"]]

    current = date(START_DATE.year, START_DATE.month, 1)
    while current <= END_DATE:
        for branch, region in branches:
            digital = random.uniform(55, 82)
            rows.append([
                current.strftime("%Y-%m"), branch, region,
                int(random.gauss(4200, 600)),
                int(random.gauss(85, 20)),
                int(random.gauss(140, 30)),
                int(random.gauss(95, 20)),
                round(random.gauss(3_200_000, 400_000), 2),
                round(random.gauss(1_800_000, 250_000), 2),
                int(random.gauss(12, 4)),
                round(random.uniform(4.5, 18.0), 1),
                int(random.gauss(22, 4)),
                round(digital, 1)
            ])

        if current.month == 12:
            current = date(current.year + 1, 1, 1)
        else:
            current = date(current.year, current.month + 1, 1)

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerows(rows)
    return buf.getvalue()


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f"\n{'='*60}")
    print("  Nexus Intelligence — 1-Year Data Seeder")
    print(f"  Period: {START_DATE} → {END_DATE}")
    print(f"{'='*60}\n")

    token = get_token()

    datasets = [
        {
            "name": "Daily Banking Transactions",
            "description": "365 days of retail banking transaction records including "
                           "category, channel, region, customer segment and fraud flags.",
            "generator": generate_transactions,
        },
        {
            "name": "Monthly Revenue KPIs",
            "description": "12 months of monthly financial KPIs: revenue, net interest income, "
                           "operating costs, net profit, NPS, loan book and deposit book.",
            "generator": generate_monthly_kpis,
        },
        {
            "name": "Weekly Risk & Credit Metrics",
            "description": "52 weeks of risk metrics: NPLs, capital adequacy, liquidity coverage, "
                           "VaR, credit scores, default rates and fraud losses.",
            "generator": generate_risk_metrics,
        },
        {
            "name": "Monthly Branch Performance",
            "description": "12 months × 10 branches: transaction volumes, new customers, loan approvals, "
                           "deposits, complaints, wait times and digital adoption rates.",
            "generator": generate_branch_performance,
        },
    ]

    for i, ds in enumerate(datasets, 1):
        print(f"[{i}/{len(datasets)}] Generating '{ds['name']}' …", end=" ", flush=True)
        csv_content = ds["generator"]()
        row_count = csv_content.count("\n") - 1
        print(f"{row_count:,} rows  →  uploading …", end=" ", flush=True)
        result = upload_csv(token, ds["name"], ds["description"], csv_content)
        if result:
            print(f"✓  (id: {result.get('id', '?')}, status: {result.get('processing_status', '?')})")
        else:
            print("✗")

    print(f"\n✅ Done! Open the Nexus Intelligence dashboard to see your data.\n")


if __name__ == "__main__":
    main()
