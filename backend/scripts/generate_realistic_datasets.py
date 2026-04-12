#!/usr/bin/env python3
"""
Script to generate realistic dummy datasets for testing and development.
Creates datasets that look like real business data with proper relationships,
patterns, and realistic distributions.
"""

import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import csv
import os
from typing import List, Dict, Any
import faker

# Initialize faker for generating realistic data
fake = faker.Faker()

class RealisticDatasetGenerator:
    """Generate realistic dummy datasets that look like actual business data."""
    
    def __init__(self):
        self.output_dir = "generated_datasets"
        os.makedirs(self.output_dir, exist_ok=True)
        
    def generate_sales_data(self, num_records: int = 1000) -> pd.DataFrame:
        """Generate realistic sales transaction data."""
        print(f"Generating sales data with {num_records} records...")
        
        # Generate realistic product categories and prices
        categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys']
        products = {
            'Electronics': [('Laptop', 899.99, 1299.99), ('Smartphone', 299.99, 999.99), 
                           ('Tablet', 199.99, 599.99), ('Headphones', 49.99, 299.99)],
            'Clothing': [('T-Shirt', 19.99, 49.99), ('Jeans', 39.99, 89.99), 
                        ('Dress', 59.99, 199.99), ('Jacket', 79.99, 299.99)],
            'Home & Garden': [('Coffee Maker', 29.99, 149.99), ('Blender', 39.99, 99.99),
                              ('Vacuum Cleaner', 99.99, 499.99), ('Air Purifier', 79.99, 299.99)],
            'Sports': [('Running Shoes', 49.99, 199.99), ('Yoga Mat', 19.99, 79.99),
                      ('Dumbbells', 29.99, 149.99), ('Tennis Racket', 59.99, 299.99)],
            'Books': [('Fiction Book', 12.99, 29.99), ('Textbook', 49.99, 149.99),
                     ('Cookbook', 19.99, 39.99), ('Magazine', 4.99, 12.99)],
            'Toys': [('Board Game', 19.99, 49.99), ('Action Figure', 9.99, 29.99),
                     ('Puzzle', 14.99, 39.99), ('LEGO Set', 29.99, 99.99)]
        }
        
        data = []
        start_date = datetime.now() - timedelta(days=365)
        
        for i in range(num_records):
            # Select random category and product
            category = random.choice(categories)
            product_name, min_price, max_price = random.choice(products[category])
            
            # Generate realistic price variation
            base_price = random.uniform(min_price, max_price)
            
            # Add seasonal and trend effects
            date = start_date + timedelta(days=random.randint(0, 365))
            if date.month in [11, 12]:  # Holiday season
                price_multiplier = random.uniform(1.1, 1.3)
            elif date.month in [1, 2]:  # Post-holiday
                price_multiplier = random.uniform(0.8, 0.95)
            else:
                price_multiplier = random.uniform(0.95, 1.05)
            
            final_price = round(base_price * price_multiplier, 2)
            
            # Generate realistic quantity (most sales are 1-3 items)
            quantity = np.random.choice([1, 2, 3, 4, 5], p=[0.6, 0.25, 0.1, 0.04, 0.01])
            
            # Add some discount logic
            discount = 0
            if random.random() < 0.15:  # 15% of transactions have discounts
                discount = random.choice([0.1, 0.15, 0.2, 0.25])
            
            total_amount = final_price * quantity * (1 - discount)
            
            data.append({
                'transaction_id': f'TXN{100000 + i:06d}',
                'date': date.strftime('%Y-%m-%d'),
                'time': date.strftime('%H:%M:%S'),
                'customer_id': f'CUST{random.randint(1000, 9999)}',
                'customer_name': fake.name(),
                'customer_email': fake.email(),
                'category': category,
                'product_name': product_name,
                'quantity': quantity,
                'unit_price': round(final_price, 2),
                'discount_percent': round(discount * 100, 1) if discount > 0 else 0,
                'total_amount': round(total_amount, 2),
                'payment_method': random.choice(['Credit Card', 'Debit Card', 'PayPal', 'Cash', 'Apple Pay']),
                'store_location': random.choice(['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']),
                'sales_rep': fake.name(),
                'customer_segment': random.choice(['New', 'Returning', 'VIP', 'At Risk'])
            })
        
        return pd.DataFrame(data)
    
    def generate_customer_data(self, num_records: int = 500) -> pd.DataFrame:
        """Generate realistic customer data."""
        print(f"Generating customer data with {num_records} records...")
        
        data = []
        for i in range(num_records):
            # Generate realistic age distribution
            age_groups = list(range(18, 80))
            # Create a more realistic age distribution
            age_probs = []
            for age in age_groups:
                if 18 <= age <= 25:
                    age_probs.append(0.015)  # Young adults
                elif 26 <= age <= 35:
                    age_probs.append(0.025)  # Young professionals
                elif 36 <= age <= 45:
                    age_probs.append(0.020)  # Mid-career
                elif 46 <= age <= 55:
                    age_probs.append(0.018)  # Late career
                elif 56 <= age <= 65:
                    age_probs.append(0.010)  # Pre-retirement
                else:  # 66-79
                    age_probs.append(0.005)  # Retirement
            
            # Normalize probabilities
            total_prob = sum(age_probs)
            age_probs = [p / total_prob for p in age_probs]
            
            age = np.random.choice(age_groups, p=age_probs)
            
            # Generate income based on age (correlated)
            if age < 25:
                income_range = (25000, 45000)
            elif age < 35:
                income_range = (35000, 65000)
            elif age < 45:
                income_range = (50000, 85000)
            elif age < 55:
                income_range = (60000, 95000)
            else:
                income_range = (45000, 80000)
            
            annual_income = random.randint(*income_range)
            
            # Generate registration date (older customers registered earlier)
            days_ago = random.randint(30, 1095)  # 1 month to 3 years
            registration_date = datetime.now() - timedelta(days=days_ago)
            
            # Generate realistic customer metrics
            total_purchases = random.randint(1, 50)
            avg_purchase_value = random.uniform(50, 500)
            total_spent = total_purchases * avg_purchase_value
            
            # Customer satisfaction based on spending and frequency
            if total_spent > 5000 and total_purchases > 10:
                satisfaction = random.uniform(4.0, 5.0)
            elif total_spent > 1000 and total_purchases > 5:
                satisfaction = random.uniform(3.5, 4.5)
            else:
                satisfaction = random.uniform(2.5, 4.0)
            
            data.append({
                'customer_id': f'CUST{1000 + i:04d}',
                'first_name': fake.first_name(),
                'last_name': fake.last_name(),
                'email': fake.email(),
                'phone': fake.phone_number(),
                'age': age,
                'gender': random.choice(['Male', 'Female', 'Other']),
                'city': fake.city(),
                'state': fake.state(),
                'zip_code': fake.zipcode(),
                'country': 'USA',
                'registration_date': registration_date.strftime('%Y-%m-%d'),
                'last_purchase_date': (datetime.now() - timedelta(days=random.randint(1, 90))).strftime('%Y-%m-%d'),
                'total_purchases': total_purchases,
                'total_spent': round(total_spent, 2),
                'avg_purchase_value': round(avg_purchase_value, 2),
                'annual_income': annual_income,
                'customer_segment': self._determine_customer_segment(total_spent, total_purchases),
                'satisfaction_score': round(satisfaction, 1),
                'loyalty_points': random.randint(0, 5000),
                'preferred_category': random.choice(['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys']),
                'marketing_opt_in': random.choice([True, False, True, True])  # 75% opt-in
            })
        
        return pd.DataFrame(data)
    
    def generate_inventory_data(self, num_records: int = 200) -> pd.DataFrame:
        """Generate realistic inventory data."""
        print(f"Generating inventory data with {num_records} records...")
        
        categories = ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys']
        brands = ['TechPro', 'StyleCo', 'HomeBase', 'SportMax', 'BookWorld', 'ToyLand', 'Premium', 'Budget', 'EcoFriendly']
        
        data = []
        for i in range(num_records):
            category = random.choice(categories)
            brand = random.choice(brands)
            
            # Generate SKU
            sku = f'{category[:3].upper()}-{brand[:3].upper()}-{1000 + i:04d}'
            
            # Generate realistic stock levels
            if random.random() < 0.1:  # 10% out of stock
                stock_quantity = 0
                reorder_level = random.randint(5, 20)
            elif random.random() < 0.2:  # 20% low stock
                stock_quantity = random.randint(1, 10)
                reorder_level = random.randint(15, 25)
            else:  # Normal stock
                stock_quantity = random.randint(20, 200)
                reorder_level = random.randint(10, 30)
            
            # Generate cost and price with realistic margins
            cost = random.uniform(5.00, 100.00)
            margin = random.uniform(0.3, 0.7)  # 30-70% margin
            price = round(cost * (1 + margin), 2)
            
            # Generate supplier info
            supplier_lead_time = random.randint(3, 21)  # 3-21 days
            
            data.append({
                'product_id': f'PROD{1000 + i:04d}',
                'sku': sku,
                'product_name': f'{brand} {category} Product {i+1}',
                'category': category,
                'brand': brand,
                'description': fake.sentence(),
                'cost': round(cost, 2),
                'selling_price': price,
                'margin_percent': round(margin * 100, 1),
                'stock_quantity': stock_quantity,
                'reorder_level': reorder_level,
                'supplier': fake.company(),
                'supplier_lead_time_days': supplier_lead_time,
                'warehouse_location': random.choice(['A1', 'B2', 'C3', 'D4', 'E5', 'F6']),
                'last_restocked_date': (datetime.now() - timedelta(days=random.randint(1, 60))).strftime('%Y-%m-%d'),
                'product_status': 'Active' if stock_quantity > 0 else 'Out of Stock',
                'weight_kg': round(random.uniform(0.1, 10.0), 2),
                'dimensions_cm': f'{random.randint(5, 50)}x{random.randint(5, 50)}x{random.randint(5, 50)}',
                'barcode': f'{random.randint(100000000000, 999999999999)}',
                'created_date': (datetime.now() - timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d')
            })
        
        return pd.DataFrame(data)
    
    def generate_employee_data(self, num_records: int = 100) -> pd.DataFrame:
        """Generate realistic employee data."""
        print(f"Generating employee data with {num_records} records...")
        
        departments = ['Sales', 'Marketing', 'Engineering', 'HR', 'Finance', 'Operations', 'Customer Service', 'IT']
        positions = {
            'Sales': ['Sales Representative', 'Sales Manager', 'Account Executive', 'Sales Director'],
            'Marketing': ['Marketing Coordinator', 'Marketing Manager', 'Digital Marketer', 'Content Creator'],
            'Engineering': ['Software Engineer', 'Senior Engineer', 'Tech Lead', 'Engineering Manager'],
            'HR': ['HR Assistant', 'HR Specialist', 'HR Manager', 'HR Director'],
            'Finance': ['Accountant', 'Financial Analyst', 'Finance Manager', 'CFO'],
            'Operations': ['Operations Coordinator', 'Operations Manager', 'Supply Chain Analyst', 'Operations Director'],
            'Customer Service': ['Customer Service Rep', 'Team Lead', 'Customer Service Manager'],
            'IT': ['IT Support', 'System Administrator', 'Network Engineer', 'IT Manager']
        }
        
        data = []
        for i in range(num_records):
            department = random.choice(departments)
            position = random.choice(positions[department])
            
            # Generate realistic salary based on position
            if 'Director' in position or 'CFO' in position:
                salary_range = (120000, 200000)
            elif 'Manager' in position:
                salary_range = (80000, 120000)
            elif 'Senior' in position or 'Lead' in position:
                salary_range = (70000, 100000)
            else:
                salary_range = (45000, 80000)
            
            salary = random.randint(*salary_range)
            
            # Generate hire date (some employees have been there longer)
            years_employed = random.randint(0, 15)
            hire_date = datetime.now() - timedelta(days=years_employed * 365)
            
            # Generate performance score (correlated with years employed)
            if years_employed < 1:
                performance = random.uniform(2.5, 4.0)
            elif years_employed < 3:
                performance = random.uniform(3.0, 4.5)
            else:
                performance = random.uniform(3.5, 5.0)
            
            data.append({
                'employee_id': f'EMP{1000 + i:04d}',
                'first_name': fake.first_name(),
                'last_name': fake.last_name(),
                'email': fake.email(),
                'phone': fake.phone_number(),
                'department': department,
                'position': position,
                'salary': salary,
                'hire_date': hire_date.strftime('%Y-%m-%d'),
                'years_employed': years_employed,
                'performance_score': round(performance, 1),
                'status': random.choice(['Active', 'Active', 'Active', 'On Leave', 'Terminated']),
                'work_location': random.choice(['Office', 'Remote', 'Hybrid']),
                'manager_id': f'MGR{random.randint(1000, 1010):04d}' if random.random() < 0.7 else None,
                'skills': ', '.join(random.sample(['Communication', 'Leadership', 'Technical', 'Analytical', 'Creative', 'Problem Solving'], 3)),
                'certifications': random.choice(['None', 'PMP', 'AWS', 'Google Analytics', 'Six Sigma', 'Scrum Master']),
                'last_review_date': (datetime.now() - timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d')
            })
        
        return pd.DataFrame(data)
    
    def generate_financial_data(self, num_records: int = 36) -> pd.DataFrame:
        """Generate realistic monthly financial data."""
        print(f"Generating financial data with {num_records} months...")
        
        data = []
        base_date = datetime.now() - timedelta(days=num_records * 30)
        
        # Base metrics with growth trend
        base_revenue = 500000
        base_expenses = 350000
        growth_rate = 0.02  # 2% monthly growth
        
        for i in range(num_records):
            current_date = base_date + timedelta(days=i * 30)
            
            # Add seasonal variations
            if current_date.month in [11, 12]:  # Holiday season
                seasonal_multiplier = 1.3
            elif current_date.month in [1, 2]:  # Post-holiday
                seasonal_multiplier = 0.8
            elif current_date.month in [6, 7, 8]:  # Summer
                seasonal_multiplier = 1.1
            else:
                seasonal_multiplier = 1.0
            
            # Calculate metrics with growth and seasonal effects
            revenue = base_revenue * ((1 + growth_rate) ** i) * seasonal_multiplier
            revenue += random.uniform(-revenue * 0.1, revenue * 0.1)  # Add random variation
            
            expenses = base_expenses * ((1 + growth_rate * 0.8) ** i) * seasonal_multiplier
            expenses += random.uniform(-expenses * 0.05, expenses * 0.05)
            
            gross_profit = revenue - expenses
            operating_expenses = revenue * random.uniform(0.15, 0.25)
            net_profit = gross_profit - operating_expenses
            
            data.append({
                'period': current_date.strftime('%Y-%m'),
                'year': current_date.year,
                'month': current_date.month,
                'revenue': round(revenue, 2),
                'cost_of_goods_sold': round(expenses, 2),
                'gross_profit': round(gross_profit, 2),
                'operating_expenses': round(operating_expenses, 2),
                'net_profit': round(net_profit, 2),
                'profit_margin': round((net_profit / revenue) * 100, 2),
                'revenue_growth': round(((revenue / base_revenue) - 1) * 100, 2) if i > 0 else 0,
                'customers_acquired': random.randint(50, 500),
                'customer_churn_rate': round(random.uniform(0.02, 0.08), 3),
                'average_order_value': round(random.uniform(75, 150), 2)
            })
        
        return pd.DataFrame(data)
    
    def _determine_customer_segment(self, total_spent: float, total_purchases: int) -> str:
        """Determine customer segment based on spending and purchase frequency."""
        avg_order = total_spent / total_purchases if total_purchases > 0 else 0
        
        if total_spent > 5000 and total_purchases > 20:
            return 'VIP'
        elif total_spent > 2000 and total_purchases > 10:
            return 'Premium'
        elif total_spent > 500 and total_purchases > 5:
            return 'Regular'
        elif total_purchases <= 2:
            return 'New'
        else:
            return 'Standard'
    
    def save_dataset(self, df: pd.DataFrame, filename: str, format: str = 'csv'):
        """Save dataset in specified format."""
        filepath = os.path.join(self.output_dir, filename)
        
        if format == 'csv':
            df.to_csv(f"{filepath}.csv", index=False)
        elif format == 'json':
            df.to_json(f"{filepath}.json", orient='records', indent=2)
        elif format == 'excel':
            df.to_excel(f"{filepath}.xlsx", index=False)
        elif format == 'parquet':
            df.to_parquet(f"{filepath}.parquet", index=False)
        
        print(f"Saved {filename} in {format.upper()} format")
    
    def generate_all_datasets(self):
        """Generate all realistic datasets."""
        print("Starting realistic dataset generation...")
        
        # Generate all datasets
        datasets = {
            'sales_data': self.generate_sales_data(2000),
            'customers': self.generate_customer_data(800),
            'inventory': self.generate_inventory_data(300),
            'employees': self.generate_employee_data(150),
            'financial_monthly': self.generate_financial_data(48)
        }
        
        # Save in multiple formats
        for name, df in datasets.items():
            print(f"\nDataset: {name}")
            print(f"Shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")
            print(f"Sample data:\n{df.head()}\n")
            
            # Save in different formats
            self.save_dataset(df, name, 'csv')
            self.save_dataset(df, name, 'json')
            self.save_dataset(df, name, 'excel')
        
        print(f"\nAll datasets generated successfully in '{self.output_dir}' directory!")
        
        # Generate summary statistics
        self.generate_summary_report(datasets)
    
    def generate_summary_report(self, datasets: Dict[str, pd.DataFrame]):
        """Generate a summary report of all datasets."""
        report = {
            'generation_date': datetime.now().isoformat(),
            'datasets': {}
        }
        
        for name, df in datasets.items():
            report['datasets'][name] = {
                'shape': df.shape,
                'columns': list(df.columns),
                'data_types': df.dtypes.to_dict(),
                'null_values': df.isnull().sum().to_dict(),
                'sample_data': df.head().to_dict('records')
            }
        
        with open(os.path.join(self.output_dir, 'dataset_summary.json'), 'w') as f:
            json.dump(report, f, indent=2, default=str)
        
        print("Summary report generated: dataset_summary.json")

def main():
    """Main function to run the dataset generator."""
    generator = RealisticDatasetGenerator()
    generator.generate_all_datasets()

if __name__ == "__main__":
    main()
