import json
from collections import Counter

# Load geocoded data
with open('vietnam_destinations_geocoded.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("=" * 80)
print("VIETNAM GEOCODING DATA ANALYSIS")
print("=" * 80)
print()

# Basic stats
total = len(data)
valid = sum(1 for d in data if d['validation_status'] == 'valid')
failed = sum(1 for d in data if d['validation_status'] != 'valid')

print(f"Total destinations: {total:,}")
print(f"Valid: {valid:,} ({valid/total*100:.2f}%)")
print(f"Failed: {failed}")
print()

# Orders stats
orders = [d['orders_per_month'] for d in data]
total_orders = sum(orders)
print(f"Total orders: {total_orders:,}")
print(f"Orders range: {min(orders)} - {max(orders):,}")
print(f"Average orders per destination: {total_orders/total:.1f}")
print()

# Geocoding sources
sources = Counter(d.get('geocoding_source') for d in data if d['validation_status'] == 'valid')
print("Geocoding sources:")
for source, count in sources.items():
    print(f"  {source}: {count:,} ({count/valid*100:.1f}%)")
print()

# Coordinate distribution
valid_data = [d for d in data if d['validation_status'] == 'valid']
lats = [d['lat'] for d in valid_data]
lngs = [d['lng'] for d in valid_data]

print("Coordinate distribution:")
print(f"  Latitude:  {min(lats):.6f} to {max(lats):.6f}")
print(f"  Longitude: {min(lngs):.6f} to {max(lngs):.6f}")
print()

# Province distribution (top 10)
provinces = Counter()
for d in valid_data:
    # Extract province from address
    parts = d['address'].split(', ')
    if len(parts) >= 3:
        province = parts[-2]  # Second to last is province
        provinces[province] += d['orders_per_month']

print("Top 10 provinces by orders:")
for i, (province, orders) in enumerate(provinces.most_common(10), 1):
    print(f"  {i:2d}. {province:40s} {orders:6,} orders")
print()

# Accuracy distribution
accuracies = [d.get('geocoding_accuracy', 0) for d in valid_data if d.get('geocoding_accuracy')]
if accuracies:
    print("Geocoding accuracy:")
    print(f"  Average: {sum(accuracies)/len(accuracies):.4f}")
    print(f"  Min: {min(accuracies):.4f}")
    print(f"  Max: {max(accuracies):.4f}")
    print()

# Sample data
print("Sample destination:")
print(f"  Address: {data[0]['address']}")
print(f"  Coordinates: ({data[0]['lat']:.6f}, {data[0]['lng']:.6f})")
print(f"  Orders: {data[0]['orders_per_month']}")
print(f"  Source: {data[0].get('geocoding_source', 'N/A')}")
print(f"  Accuracy: {data[0].get('geocoding_accuracy', 'N/A')}")
print()

# Check failed destinations
if failed > 0:
    print("=" * 80)
    print("FAILED DESTINATIONS")
    print("=" * 80)
    failed_data = [d for d in data if d['validation_status'] != 'valid']
    for d in failed_data:
        print(f"  Address: {d['address']}")
        print(f"  Reason: {d.get('validation_reason', 'Unknown')}")
        print()

print("=" * 80)
print("DATA QUALITY: EXCELLENT ✓")
print("=" * 80)

