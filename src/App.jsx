import { useState, useEffect } from 'react'
import Map from './components/Map'
import Dashboard from './components/Dashboard'
import PasswordProtection from './components/PasswordProtection'
import CountrySwitcher from './components/CountrySwitcher'
import './App.css'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = 'pk.eyJ1Ijoia2FpZHJvZ2VyIiwiYSI6ImNtaDM4bnB2cjBuN28ybnM5NmV0ZTluZHEifQ.YHW9Erg1h5egssNhthQiZw';

function App() {
  // Data states
  const [hubs, setHubs] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [districts, setDistricts] = useState([]); // GeoJSON districts
  const [loading, setLoading] = useState(true);

  // UI states
  const [selectedHub, setSelectedHub] = useState(null);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true); // Heatmap toggle
  const [calculatedRoutes, setCalculatedRoutes] = useState([]); // Store calculated routes

  // Filter states
  const [provinceFilter, setProvinceFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [carrierTypeFilter, setCarrierTypeFilter] = useState(''); // '' = all, '2PL', '3PL'
  const [distanceFilter, setDistanceFilter] = useState(30); // km

  // Load hubs, destinations, and districts
  useEffect(() => {
    Promise.all([
      fetch('/hubs.json').then(res => res.json()),
      fetch('/destinations.json').then(res => res.json()),
      fetch('/districts.geojson').then(res => res.json())
    ])
      .then(([hubsData, destinationsData, districtsData]) => {
        setHubs(hubsData);
        setDestinations(destinationsData.Sheet1 || destinationsData);
        setDistricts(districtsData.features || []);
        // Set default hub to first one
        if (hubsData.length > 0) {
          setSelectedHub(hubsData[0]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  }, []);

  // Handle hub selection from map (when clicking "Xem khu vực phủ sóng")
  useEffect(() => {
    const handleSelectHubFromMap = (event) => {
      const { hubId } = event.detail;
      const hub = hubs.find(h => h.id === hubId);
      if (hub) {
        setSelectedHub(hub);
        setSelectedDestinations([]);
        setCalculatedRoutes([]);
        // Reset filters
        setProvinceFilter('');
        setDistrictFilter('');
        setWardFilter('');
      }
    };

    window.addEventListener('select-hub-from-map', handleSelectHubFromMap);

    return () => {
      window.removeEventListener('select-hub-from-map', handleSelectHubFromMap);
    };
  }, [hubs]);

  // Calculate straight-line distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get destinations for selected hub
  const getHubDestinations = () => {
    if (!selectedHub) return [];
    return destinations.filter(dest => dest.hub_id === selectedHub.id);
  };

  // Get filtered destinations based on province/district/ward/carrier/distance
  const getFilteredDestinations = () => {
    let filtered = getHubDestinations();

    // Province filter
    if (provinceFilter) {
      filtered = filtered.filter(d =>
        d.province_name.toLowerCase().includes(provinceFilter.toLowerCase())
      );
    }

    // District filter
    if (districtFilter) {
      filtered = filtered.filter(d =>
        d.district_name.toLowerCase().includes(districtFilter.toLowerCase())
      );
    }

    // Ward filter
    if (wardFilter) {
      filtered = filtered.filter(d =>
        d.ward_name.toLowerCase().includes(wardFilter.toLowerCase())
      );
    }

    // Carrier type filter
    if (carrierTypeFilter) {
      filtered = filtered.filter(d => d.carrier_type === carrierTypeFilter);
    }

    // Distance filter
    if (selectedHub && distanceFilter) {
      filtered = filtered.filter(d => {
        // Skip destinations without coordinates
        if (!d.lat || !d.long || d.lat === '' || d.long === '') {
          return false;
        }
        const distance = calculateDistance(
          selectedHub.lat, selectedHub.long,
          d.lat, d.long
        );
        return distance <= distanceFilter;
      });
    }

    return filtered;
  };

  const handleHubChange = (hub) => {
    setSelectedHub(hub);
    setSelectedDestinations([]);
    setCalculatedRoutes([]); // Clear routes
    // Reset filters
    setProvinceFilter('');
    setDistrictFilter('');
    setWardFilter('');
    setCarrierTypeFilter('');
    // Don't reset distance filter - keep it at 30km
  };

  const handleCalculateDistance = async (destIds) => {
    if (!selectedHub) {
      console.warn('No hub selected');
      return [];
    }

    console.log('🧮 Starting distance calculation...');
    console.log('Selected hub:', selectedHub.name);
    console.log('Destination IDs:', destIds);

    // Auto-enable routes when calculating
    setShowRoutes(true);

    const hubCoords = [selectedHub.long, selectedHub.lat];
    const results = [];
    const skippedDests = [];

    for (const destId of destIds) {
      const dest = destinations.find(d => d.id === destId);

      if (!dest) {
        console.warn(`Destination ${destId} not found`);
        continue;
      }

      // Check if destination has coordinates
      if (!dest.lat || !dest.long || dest.lat === '' || dest.long === '') {
        console.warn(`⚠️ Destination "${dest.name}" missing coordinates (lat: "${dest.lat}", long: "${dest.long}")`);
        skippedDests.push(dest.name);
        continue;
      }

      const destCoords = [dest.long, dest.lat];
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${hubCoords[0]},${hubCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      try {
        console.log(`Fetching route for ${dest.name}...`);
        const response = await fetch(url);
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
          results.push({
            destId: destId,
            destination: dest.name,
            address: dest.address,
            distance: data.routes[0].distance / 1000,
            duration: data.routes[0].duration / 60,
            orders: dest.orders_per_month || 0,
            carrier_type: dest.carrier_type || 'N/A', // Add carrier type
            geometry: data.routes[0].geometry // Store geometry for map
          });
          console.log(`✅ Route calculated for ${dest.name}: ${(data.routes[0].distance / 1000).toFixed(2)} km`);
        } else {
          console.warn(`No route found for ${dest.name}`);
        }
      } catch (error) {
        console.error(`❌ Error fetching route for ${dest.name}:`, error);
      }
    }

    console.log(`📊 Calculation complete: ${results.length} routes calculated, ${skippedDests.length} skipped`);

    if (skippedDests.length > 0) {
      console.warn('⚠️ Skipped destinations (missing coordinates):', skippedDests);
      alert(`⚠️ CẢNH BÁO: ${skippedDests.length}/${destIds.length} destinations không có tọa độ!\n\nBị bỏ qua:\n${skippedDests.slice(0, 5).join('\n')}${skippedDests.length > 5 ? `\n... và ${skippedDests.length - 5} destinations khác` : ''}\n\nVui lòng cập nhật tọa độ (lat/long) trong file destinations.json`);
    }

    if (results.length === 0) {
      alert('❌ Không thể tính khoảng cách!\n\nTất cả destinations được chọn đều thiếu tọa độ (lat/long).\n\nVui lòng cập nhật file destinations.json với tọa độ chính xác.');
    }

    setCalculatedRoutes(results); // Store in state
    return results;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#4264fb'
      }}>
        Loading map data...
      </div>
    );
  }

  return (
    <PasswordProtection>
      <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Dashboard Sidebar */}
        <Dashboard
        hubs={hubs}
        destinations={destinations}
        selectedHub={selectedHub}
        onHubChange={handleHubChange}
        getFilteredDestinations={getFilteredDestinations}
        selectedDestinations={selectedDestinations}
        onDestinationsChange={setSelectedDestinations}
        onCalculateDistance={handleCalculateDistance}
        calculateDistance={calculateDistance}
        provinceFilter={provinceFilter}
        districtFilter={districtFilter}
        wardFilter={wardFilter}
        carrierTypeFilter={carrierTypeFilter}
        distanceFilter={distanceFilter}
        onProvinceFilterChange={setProvinceFilter}
        onDistrictFilterChange={setDistrictFilter}
        onWardFilterChange={setWardFilter}
        onCarrierTypeFilterChange={setCarrierTypeFilter}
        onDistanceFilterChange={setDistanceFilter}
        showBoundaries={showBoundaries}
        onToggleBoundaries={setShowBoundaries}
        showRoutes={showRoutes}
        onToggleRoutes={setShowRoutes}
        showHeatmap={showHeatmap}
        onToggleHeatmap={setShowHeatmap}
      />

      {/* Map Container */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Country Switcher */}
        <CountrySwitcher currentCountry="thailand" />

        {/* Header */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '15px 20px',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
              🗺️ Logistics Hub Optimization - Thailand
            </h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
              {selectedHub ? `${selectedHub.province_name} - ${selectedHub.name}` : 'Select a hub'}
            </p>
          </div>
          <div style={{
            backgroundColor: '#4264fb',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {hubs.length} Hubs • {destinations.length} Destinations
          </div>
        </div>

        {/* Map */}
        <div style={{ height: '100%', paddingTop: '80px' }}>
          <Map
            hubs={hubs}
            destinations={destinations}
            districts={districts}
            selectedHub={selectedHub}
            selectedDestinations={selectedDestinations}
            showBoundaries={showBoundaries}
            showRoutes={showRoutes}
            showHeatmap={showHeatmap}
            calculatedRoutes={calculatedRoutes}
            carrierTypeFilter={carrierTypeFilter}
            distanceFilter={distanceFilter}
          />
        </div>
      </div>
      </div>
    </PasswordProtection>
  )
}

export default App
