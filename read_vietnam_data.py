#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Read Vietnam destinations Excel file
"""

import pandas as pd
import json

# Read Excel file
df = pd.read_excel('destinations_viet_nam.xlsx')

print("=" * 80)
print("📊 VIETNAM DESTINATIONS - FILE ANALYSIS")
print("=" * 80)
print()

print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print()

print("First 20 rows:")
print(df.head(20))
print()

print("Data types:")
print(df.dtypes)
print()

print("Missing values:")
print(df.isnull().sum())
print()

print("Statistics:")
if 'orders_per_month' in df.columns:
    print(f"Total orders: {df['orders_per_month'].sum():.0f}")
    print(f"Average orders per location: {df['orders_per_month'].mean():.2f}")
    print(f"Max orders: {df['orders_per_month'].max():.0f}")
    print(f"Min orders: {df['orders_per_month'].min():.0f}")
print()

print("Sample addresses (first 30):")
if 'address' in df.columns:
    for i in range(min(30, len(df))):
        addr = df.iloc[i]['address']
        orders = df.iloc[i].get('orders_per_month', 'N/A')
        print(f"{i+1}. {addr} - Orders: {orders}")
else:
    print("No 'address' column found")
    print("Available columns:", list(df.columns))

print()
print("=" * 80)

# Save to JSON
output = df.to_dict('records')
with open('vietnam_destinations_raw.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ Saved to: vietnam_destinations_raw.json")
print(f"Total destinations: {len(output)}")

