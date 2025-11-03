#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vietnam Destinations Geocoding Script - AUTO MODE
Runs full geocoding without prompts
"""

import json
import time
import requests
import math
from typing import Dict, List, Tuple, Optional

# API Keys
MAPBOX_TOKEN = "pk.eyJ1Ijoia2FpZHJvZ2VyIiwiYSI6ImNtaDM4bnB2cjBuN28ybnM5NmV0ZTluZHEifQ.YHW9Erg1h5egssNhthQiZw"
GOONG_API_KEY = "VYR8zAMikg0tGeAsctVonUdORmOXF60ltw8rPM6E"

# Vietnam bounds
VIETNAM_BOUNDS = {
    'min_lat': 8.0,
    'max_lat': 23.5,
    'min_lng': 102.0,
    'max_lng': 110.0
}

# Province centers for validation (comprehensive list)
PROVINCE_CENTERS = {
    'Hà Nội': (21.0285, 105.8542),
    'Hồ Chí Minh': (10.8231, 106.6297),
    'Đà Nẵng': (16.0544, 108.2022),
    'Cần Thơ': (10.0452, 105.7469),
    'Hải Phòng': (20.8449, 106.6881),
    'An Giang': (10.5216, 105.1258),
    'Bà Rịa - Vũng Tàu': (10.5417, 107.2429),
    'Bắc Giang': (21.2819, 106.1975),
    'Bắc Kạn': (22.1474, 105.8348),
    'Bạc Liêu': (9.2940, 105.7215),
    'Bắc Ninh': (21.1861, 106.0763),
    'Bến Tre': (10.2433, 106.3757),
    'Bình Định': (13.7830, 109.2196),
    'Bình Dương': (11.3254, 106.4770),
    'Bình Phước': (11.7511, 106.7234),
    'Bình Thuận': (10.9273, 108.0720),
    'Cà Mau': (9.1526, 105.1960),
    'Cao Bằng': (22.6356, 106.2522),
    'Đắk Lắk': (12.7100, 108.2378),
    'Đắk Nông': (12.2646, 107.6098),
    'Điện Biên': (21.8042, 103.1076),
    'Đồng Nai': (11.0686, 107.1676),
    'Đồng Tháp': (10.4938, 105.6881),
    'Gia Lai': (13.8078, 108.1094),
    'Hà Giang': (22.8025, 104.9784),
    'Hà Nam': (20.5835, 105.9230),
    'Hà Tĩnh': (18.3559, 105.8877),
    'Hải Dương': (20.9373, 106.3145),
    'Hậu Giang': (9.7579, 105.6412),
    'Hòa Bình': (20.6861, 105.3131),
    'Hưng Yên': (20.6464, 106.0511),
    'Khánh Hòa': (12.2585, 109.0526),
    'Kiên Giang': (10.0125, 105.0808),
    'Kon Tum': (14.3497, 108.0005),
    'Lai Châu': (22.3864, 103.4702),
    'Lâm Đồng': (11.5753, 108.1429),
    'Lạng Sơn': (21.8537, 106.7610),
    'Lào Cai': (22.4809, 103.9755),
    'Long An': (10.6956, 106.4336),
    'Nam Định': (20.4388, 106.1621),
    'Nghệ An': (19.2342, 104.9200),
    'Ninh Bình': (20.2506, 105.9745),
    'Ninh Thuận': (11.6738, 108.8629),
    'Phú Thọ': (21.2680, 105.2045),
    'Phú Yên': (13.0882, 109.0929),
    'Quảng Bình': (17.6102, 106.3487),
    'Quảng Nam': (15.5394, 108.0191),
    'Quảng Ngãi': (15.1214, 108.8044),
    'Quảng Ninh': (21.0064, 107.2925),
    'Quảng Trị': (16.7943, 107.1854),
    'Sóc Trăng': (9.6037, 105.9739),
    'Sơn La': (21.1022, 103.7289),
    'Tây Ninh': (11.3351, 106.0988),
    'Thái Bình': (20.4464, 106.3365),
    'Thái Nguyên': (21.5671, 105.8252),
    'Thanh Hóa': (19.8067, 105.7851),
    'Thừa Thiên Huế': (16.4637, 107.5909),
    'Tiền Giang': (10.4493, 106.3420),
    'Trà Vinh': (9.8124, 106.2992),
    'Tuyên Quang': (21.7767, 105.2280),
    'Vĩnh Long': (10.2397, 105.9571),
    'Vĩnh Phúc': (21.3609, 105.5474),
    'Yên Bái': (21.7168, 104.8986),
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km"""
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    return R * c

def is_in_vietnam(lat: float, lng: float) -> bool:
    """Check if coordinates are within Vietnam bounds"""
    return (VIETNAM_BOUNDS['min_lat'] <= lat <= VIETNAM_BOUNDS['max_lat'] and
            VIETNAM_BOUNDS['min_lng'] <= lng <= VIETNAM_BOUNDS['max_lng'])

def extract_province(address: str) -> Optional[str]:
    """Extract province name from address"""
    parts = [p.strip() for p in address.split(',')]
    if len(parts) >= 3:
        province = parts[-2]
        for prefix in ['Thành phố ', 'Tỉnh ', 'TP. ', 'TP ', 'T. ']:
            if province.startswith(prefix):
                province = province[len(prefix):]
        return province
    return None

def validate_coordinates(lat: float, lng: float, address: str) -> Tuple[bool, str]:
    """Validate geocoded coordinates with multiple checks"""
    if not is_in_vietnam(lat, lng):
        return False, f"Outside Vietnam bounds (lat={lat:.4f}, lng={lng:.4f})"
    
    if lng < 102.0 or lng > 110.0:
        return False, f"Suspicious longitude: {lng:.4f}"
    
    province = extract_province(address)
    if province:
        province_normalized = province
        for prefix in ['Thành phố ', 'Tỉnh ', 'TP. ', 'TP ', 'T. ']:
            if province_normalized.startswith(prefix):
                province_normalized = province_normalized[len(prefix):]
        
        if province_normalized in PROVINCE_CENTERS:
            center_lat, center_lng = PROVINCE_CENTERS[province_normalized]
            distance = haversine_distance(lat, lng, center_lat, center_lng)
            
            if distance > 200:
                return False, f"Too far from {province_normalized} center ({distance:.1f}km)"
            
            if distance > 100:
                return True, f"Valid (far from center: {distance:.1f}km)"
        else:
            return True, f"Valid (province '{province_normalized}' not in validation DB)"
    
    lat_decimals = len(str(lat).split('.')[-1]) if '.' in str(lat) else 0
    lng_decimals = len(str(lng).split('.')[-1]) if '.' in str(lng) else 0
    
    if lat_decimals < 3 or lng_decimals < 3:
        return False, f"Suspiciously low precision (lat:{lat_decimals}, lng:{lng_decimals} decimals)"
    
    return True, "Valid"

def geocode_mapbox(address: str) -> Optional[Dict]:
    """Geocode using Mapbox API"""
    try:
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{requests.utils.quote(address)}.json"
        params = {
            'access_token': MAPBOX_TOKEN,
            'country': 'vn',
            'limit': 1,
            'language': 'vi'
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('features'):
            feature = data['features'][0]
            lng, lat = feature['geometry']['coordinates']
            
            return {
                'lat': lat,
                'lng': lng,
                'place_name': feature.get('place_name', ''),
                'accuracy': feature.get('relevance', 0),
                'source': 'mapbox'
            }
        
        return None
        
    except Exception as e:
        print(f"  ⚠️  Mapbox error: {str(e)}")
        return None

def geocode_goong(address: str) -> Optional[Dict]:
    """Geocode using Goong.io API"""
    try:
        url = "https://rsapi.goong.io/geocode"
        params = {
            'address': address,
            'api_key': GOONG_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('results'):
            result = data['results'][0]
            location = result['geometry']['location']
            
            return {
                'lat': location['lat'],
                'lng': location['lng'],
                'place_name': result.get('formatted_address', ''),
                'accuracy': 1.0,
                'source': 'goong'
            }
        
        return None
        
    except Exception as e:
        print(f"  ⚠️  Goong error: {str(e)}")
        return None

def geocode_address(address: str, index: int, total: int) -> Dict:
    """Geocode a single address with multi-API fallback"""
    print(f"\n[{index}/{total}] {address[:80]}...")

    result = {
        'address': address,
        'lat': None,
        'lng': None,
        'geocoding_source': None,
        'geocoding_accuracy': None,
        'geocoding_place_name': None,
        'validation_status': 'failed',
        'validation_reason': 'Not geocoded'
    }

    # Try Mapbox first
    print("  Mapbox...", end=' ')
    mapbox_result = geocode_mapbox(address)

    if mapbox_result:
        lat, lng = mapbox_result['lat'], mapbox_result['lng']
        is_valid, reason = validate_coordinates(lat, lng, address)

        if is_valid:
            print(f"OK ({lat:.6f}, {lng:.6f})")
            result.update({
                'lat': lat,
                'lng': lng,
                'geocoding_source': 'mapbox',
                'geocoding_accuracy': mapbox_result['accuracy'],
                'geocoding_place_name': mapbox_result['place_name'],
                'validation_status': 'valid',
                'validation_reason': reason
            })
            return result
        else:
            print(f"WARN Invalid: {reason}")

    # Try Goong as fallback
    print("  Goong...", end=' ')
    time.sleep(0.5)

    goong_result = geocode_goong(address)

    if goong_result:
        lat, lng = goong_result['lat'], goong_result['lng']
        is_valid, reason = validate_coordinates(lat, lng, address)

        if is_valid:
            print(f"OK ({lat:.6f}, {lng:.6f})")
            result.update({
                'lat': lat,
                'lng': lng,
                'geocoding_source': 'goong',
                'geocoding_accuracy': goong_result['accuracy'],
                'geocoding_place_name': goong_result['place_name'],
                'validation_status': 'valid',
                'validation_reason': reason
            })
            return result
        else:
            print(f"WARN Invalid: {reason}")
            result['validation_reason'] = f"Goong: {reason}"

    print(f"  FAILED")
    return result

def main():
    print("=" * 80)
    print("VIETNAM DESTINATIONS GEOCODING - AUTO MODE")
    print("=" * 80)
    print()

    # Load data
    with open('vietnam_destinations_raw.json', 'r', encoding='utf-8') as f:
        destinations = json.load(f)

    print(f"Total destinations: {len(destinations)}")
    print(f"Estimated time: ~{len(destinations)/1.5/60:.0f} minutes")
    print()
    print("Starting geocoding in 3 seconds...")
    time.sleep(3)
    print()
    print("=" * 80)
    
    # Geocode
    results = []
    stats = {
        'total': len(destinations),
        'success': 0,
        'failed': 0,
        'mapbox': 0,
        'goong': 0
    }
    
    start_time = time.time()
    
    for i, dest in enumerate(destinations, 1):
        address = dest['address']
        orders = dest['orders_per_month']
        
        result = geocode_address(address, i, len(destinations))
        result['orders_per_month'] = orders
        
        if result['validation_status'] == 'valid':
            stats['success'] += 1
            if result['geocoding_source'] == 'mapbox':
                stats['mapbox'] += 1
            elif result['geocoding_source'] == 'goong':
                stats['goong'] += 1
        else:
            stats['failed'] += 1
        
        results.append(result)
        
        # Rate limiting
        time.sleep(0.2)
        
        # Progress update every 100
        if i % 100 == 0:
            elapsed = time.time() - start_time
            rate = i / elapsed
            remaining = (len(destinations) - i) / rate
            print(f"\nProgress: {i}/{len(destinations)} ({i/len(destinations)*100:.1f}%)")
            print(f"   Success: {stats['success']}, Failed: {stats['failed']}")
            print(f"   Rate: {rate:.1f} req/s, ETA: {remaining/60:.1f} min")
            print("=" * 80)

    # Final validation
    print()
    print("=" * 80)
    print("FINAL VALIDATION")
    print("=" * 80)

    valid_results = [r for r in results if r['validation_status'] == 'valid']
    failed_results = [r for r in results if r['validation_status'] != 'valid']

    if valid_results:
        lats = [r['lat'] for r in valid_results]
        lngs = [r['lng'] for r in valid_results]

        print(f"\nCoordinate Distribution:")
        print(f"   Latitude:  {min(lats):.4f} to {max(lats):.4f}")
        print(f"   Longitude: {min(lngs):.4f} to {max(lngs):.4f}")

        in_vietnam = sum(1 for lat, lng in zip(lats, lngs) if is_in_vietnam(lat, lng))
        print(f"   In Vietnam bounds: {in_vietnam}/{len(valid_results)} ({in_vietnam/len(valid_results)*100:.1f}%)")

    # Summary
    elapsed = time.time() - start_time
    print()
    print("=" * 80)
    print("GEOCODING COMPLETE")
    print("=" * 80)
    print()
    print(f"Total: {stats['total']}")
    print(f"Success: {stats['success']} ({stats['success']/stats['total']*100:.1f}%)")
    print(f"Failed: {stats['failed']} ({stats['failed']/stats['total']*100:.1f}%)")
    print(f"Mapbox: {stats['mapbox']}")
    print(f"Goong: {stats['goong']}")
    print(f"Time: {elapsed/60:.1f} minutes")
    print(f"Rate: {stats['total']/elapsed:.2f} addresses/second")

    # Save results
    output_file = 'vietnam_destinations_geocoded.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print()
    print(f"Saved to: {output_file}")

    if failed_results:
        failed_file = 'vietnam_failed_geocoding.json'
        with open(failed_file, 'w', encoding='utf-8') as f:
            json.dump(failed_results, f, ensure_ascii=False, indent=2)
        print(f"Failed: {failed_file} ({len(failed_results)} addresses)")

if __name__ == '__main__':
    main()

