#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generate Route Calculation CSV Export
Tính khoảng cách từ mỗi hub đến tất cả destinations tương ứng
"""

import json
import csv
import math
from datetime import datetime
import sys
import os

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in km)"""
    R = 6371  # Earth radius in km
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def estimate_duration(distance_km):
    """Estimate driving duration in minutes (assuming 40 km/h average speed)"""
    avg_speed_kmh = 40
    return (distance_km / avg_speed_kmh) * 60

def load_json_data(hubs_file, destinations_file):
    """Load hubs and destinations data"""
    with open(hubs_file, 'r', encoding='utf-8') as f:
        hubs = json.load(f)
    
    with open(destinations_file, 'r', encoding='utf-8') as f:
        destinations_data = json.load(f)
        # Handle Sheet1 wrapper for Thailand data
        if isinstance(destinations_data, dict) and 'Sheet1' in destinations_data:
            destinations = destinations_data['Sheet1']
        else:
            destinations = destinations_data
    
    return hubs, destinations

def generate_csv_for_hub(hub, destinations, output_file, filters=None):
    """Generate CSV export for a specific hub"""
    
    # Filter destinations for this hub
    hub_destinations = [d for d in destinations if d.get('hub_id') == hub['id']]
    
    # Apply additional filters if provided
    if filters:
        if filters.get('province'):
            hub_destinations = [d for d in hub_destinations if filters['province'].lower() in d.get('province_name', '').lower()]
        if filters.get('district'):
            hub_destinations = [d for d in hub_destinations if filters['district'].lower() in d.get('district_name', '').lower()]
        if filters.get('ward'):
            hub_destinations = [d for d in hub_destinations if filters['ward'].lower() in d.get('ward_name', '').lower()]
        if filters.get('carrier_type'):
            hub_destinations = [d for d in hub_destinations if d.get('carrier_type') == filters['carrier_type']]
        if filters.get('max_distance'):
            # Will filter after calculating distances
            pass
    
    # Calculate routes
    routes = []
    skipped = []
    
    for dest in hub_destinations:
        # Check if destination has coordinates
        if not dest.get('lat') or not dest.get('long') or dest['lat'] == '' or dest['long'] == '':
            skipped.append(dest.get('name', 'Unknown'))
            continue
        
        try:
            # Calculate distance
            distance = haversine_distance(
                float(hub['lat']), float(hub['long']),
                float(dest['lat']), float(dest['long'])
            )
            
            # Apply distance filter
            if filters and filters.get('max_distance') and distance > filters['max_distance']:
                continue
            
            # Estimate duration
            duration = estimate_duration(distance)
            
            routes.append({
                'dest_id': dest.get('id', ''),
                'dest_name': dest.get('name', ''),
                'ward': dest.get('ward_name', ''),
                'district': dest.get('district_name', ''),
                'province': dest.get('province_name', ''),
                'carrier_type': dest.get('carrier_type', 'N/A'),
                'distance': distance,
                'duration': duration,
                'orders': dest.get('orders_per_month', 0),
                'hub_id': hub['id'],
                'hub_name': hub['name']
            })
        except (ValueError, TypeError) as e:
            skipped.append(dest.get('name', 'Unknown'))
            continue
    
    # Sort by distance
    routes.sort(key=lambda x: x['distance'])
    
    # Calculate statistics
    total_destinations = len(routes)
    total_distance = sum(r['distance'] for r in routes)
    total_duration = sum(r['duration'] for r in routes)
    total_orders = sum(r['orders'] for r in routes)
    
    # Write CSV
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        
        # Header section
        writer.writerow(['# LOGISTICS HUB OPTIMIZATION - ROUTE CALCULATION EXPORT'])
        writer.writerow([f'# Ngày xuất: {datetime.now().strftime("%d-%m-%Y %H:%M:%S")}'])
        writer.writerow([])
        
        # Hub info
        writer.writerow(['# TUYẾN TỪ HUB XUẤT PHÁT'])
        writer.writerow(['Hub ID', 'Hub Name', 'Province', 'Latitude', 'Longitude'])
        writer.writerow([hub['id'], hub['name'], hub.get('province_name', ''), hub['lat'], hub['long']])
        writer.writerow([])
        
        # Filters applied
        writer.writerow(['# BỘ LỌC ĐÃ ÁP DỤNG'])
        writer.writerow(['Tỉnh/Thành phố', filters.get('province', 'Tất cả') if filters else 'Tất cả'])
        writer.writerow(['Quận/Huyện', filters.get('district', 'Tất cả') if filters else 'Tất cả'])
        writer.writerow(['Xã/Phường', filters.get('ward', 'Tất cả') if filters else 'Tất cả'])
        writer.writerow(['Carrier Type', filters.get('carrier_type', 'Tất cả carrier types') if filters else 'Tất cả carrier types'])
        writer.writerow(['Khoảng cách tối đa', f"<= {filters['max_distance']}km" if filters and filters.get('max_distance') else 'Không giới hạn'])
        writer.writerow([])
        
        # Statistics
        writer.writerow(['# TỔNG QUAN'])
        writer.writerow(['Tổng số destinations', total_destinations])
        writer.writerow(['Tổng khoảng cách', f'{total_distance:.2f} km'])
        writer.writerow(['Tổng thời gian', f'{total_duration:.2f} phút'])
        writer.writerow(['Tổng orders', f'{total_orders} orders/tháng'])
        writer.writerow([])
        
        # Route details header
        writer.writerow(['# CHI TIẾT TUYẾN ĐƯỜNG'])
        writer.writerow(['STT', 'Destination ID', 'Destination Name', 'Ward', 'District', 'Province', 
                        'Carrier Type', 'Distance (km)', 'Duration (minutes)', 'Orders/Month', 'Hub ID', 'Hub Name'])
        
        # Route details data
        for idx, route in enumerate(routes, 1):
            writer.writerow([
                idx,
                route['dest_id'],
                route['dest_name'],
                route['ward'],
                route['district'],
                route['province'],
                route['carrier_type'],
                f"{route['distance']:.2f}",
                f"{route['duration']:.0f}",
                route['orders'],
                route['hub_id'],
                route['hub_name']
            ])
    
    return {
        'total_routes': total_destinations,
        'total_distance': total_distance,
        'total_duration': total_duration,
        'total_orders': total_orders,
        'skipped': len(skipped),
        'skipped_names': skipped
    }

def generate_all_hubs_csv(hubs, destinations, output_file):
    """Generate CSV with all hubs and their destinations"""
    
    all_routes = []
    
    for hub in hubs:
        hub_destinations = [d for d in destinations if d.get('hub_id') == hub['id']]
        
        for dest in hub_destinations:
            if not dest.get('lat') or not dest.get('long') or dest['lat'] == '' or dest['long'] == '':
                continue
            
            try:
                distance = haversine_distance(
                    float(hub['lat']), float(hub['long']),
                    float(dest['lat']), float(dest['long'])
                )
                duration = estimate_duration(distance)
                
                all_routes.append({
                    'hub_id': hub['id'],
                    'hub_name': hub['name'],
                    'hub_province': hub.get('province_name', ''),
                    'dest_id': dest.get('id', ''),
                    'dest_name': dest.get('name', ''),
                    'ward': dest.get('ward_name', ''),
                    'district': dest.get('district_name', ''),
                    'province': dest.get('province_name', ''),
                    'carrier_type': dest.get('carrier_type', 'N/A'),
                    'distance': distance,
                    'duration': duration,
                    'orders': dest.get('orders_per_month', 0)
                })
            except (ValueError, TypeError):
                continue
    
    # Sort by hub, then distance
    all_routes.sort(key=lambda x: (x['hub_id'], x['distance']))
    
    # Write CSV
    with open(output_file, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        
        writer.writerow(['# LOGISTICS HUB OPTIMIZATION - ALL ROUTES EXPORT'])
        writer.writerow([f'# Ngày xuất: {datetime.now().strftime("%d-%m-%Y %H:%M:%S")}'])
        writer.writerow([])
        writer.writerow(['Hub ID', 'Hub Name', 'Hub Province', 'Destination ID', 'Destination Name', 
                        'Ward', 'District', 'Province', 'Carrier Type', 'Distance (km)', 
                        'Duration (minutes)', 'Orders/Month'])
        
        for route in all_routes:
            writer.writerow([
                route['hub_id'],
                route['hub_name'],
                route['hub_province'],
                route['dest_id'],
                route['dest_name'],
                route['ward'],
                route['district'],
                route['province'],
                route['carrier_type'],
                f"{route['distance']:.2f}",
                f"{route['duration']:.0f}",
                route['orders']
            ])
    
    return len(all_routes)

if __name__ == '__main__':
    # Example usage
    print("🚀 Route Calculation CSV Generator")
    print("=" * 50)

    # Load data
    hubs_file = '../public/hubs.json'
    destinations_file = '../public/destinations.json'

    if not os.path.exists(hubs_file) or not os.path.exists(destinations_file):
        print("❌ Error: Data files not found!")
        print(f"   Looking for: {hubs_file} and {destinations_file}")
        sys.exit(1)

    hubs, destinations = load_json_data(hubs_file, destinations_file)
    print(f"✅ Loaded {len(hubs)} hubs and {len(destinations)} destinations")

    # Create output directory
    output_dir = '../data_exports/route_calculations'
    os.makedirs(output_dir, exist_ok=True)
    print(f"📁 Output directory: {output_dir}")

    # Generate CSV for all hubs combined
    output_all = f'{output_dir}/route_calculation_all_hubs.csv'
    total_routes = generate_all_hubs_csv(hubs, destinations, output_all)
    print(f"✅ Generated: {output_all} ({total_routes} routes)")

    # Generate individual CSV for each hub
    for hub in hubs:
        output_file = f"{output_dir}/route_calculation_{hub['id']}.csv"
        result = generate_csv_for_hub(hub, destinations, output_file)
        print(f"✅ {hub['name']}: {result['total_routes']} routes, {result['total_distance']:.2f} km")
        if result['skipped'] > 0:
            print(f"   ⚠️  Skipped {result['skipped']} destinations (missing coordinates)")

    print("\n🎉 Done!")
    print(f"📂 All files saved to: {output_dir}")

