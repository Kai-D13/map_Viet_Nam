#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Read Excel file and convert to JSON
"""

import pandas as pd
import json

# Read Excel file
df = pd.read_excel('destinations_viet_nam.json.xlsx')

print("=" * 80)
print("📊 EXCEL FILE ANALYSIS")
print("=" * 80)
print()

print(f"Total rows: {len(df)}")
print(f"Columns: {list(df.columns)}")
print()

print("First 10 rows:")
print(df.head(10))
print()

print("Data types:")
print(df.dtypes)
print()

print("Missing values:")
print(df.isnull().sum())
print()

print("Sample addresses:")
for i in range(min(20, len(df))):
    print(f"{i+1}. {df.iloc[i]['address']}")

print()
print("=" * 80)

# Save to JSON
output = df.to_dict('records')
with open('vietnam_destinations_raw.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"✅ Saved to: vietnam_destinations_raw.json")
print(f"Total destinations: {len(output)}")

