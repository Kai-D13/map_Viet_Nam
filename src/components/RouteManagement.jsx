import { useState, useEffect } from 'react';
import RouteList from './RouteList';
import RouteMap from './RouteMap';
import RouteDetail from './RouteDetail';
import './RouteManagement.css';

function RouteManagement() {
  // Data states
  const [routes, setRoutes] = useState([]);
  const [hubs, setHubs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI states
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [hubFilter, setHubFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load data
  useEffect(() => {
    console.log('Loading route data...');
    
    Promise.all([
      fetch('/routes_with_directions.json').then(res => {
        if (!res.ok) throw new Error('Failed to load routes');
        return res.json();
      }),
      fetch('/geocoded_hubs.json').then(res => {
        if (!res.ok) throw new Error('Failed to load hubs');
        return res.json();
      })
    ])
      .then(([routesData, hubsData]) => {
        console.log('Routes loaded:', routesData.length);
        console.log('Hubs loaded:', Object.keys(hubsData).length);
        
        setRoutes(routesData);
        setHubs(hubsData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  // Organize routes by route_name
  const organizeRoutes = () => {
    const routesByName = {};
    
    routes.forEach(route => {
      const routeName = route.route_name;
      if (!routesByName[routeName]) {
        routesByName[routeName] = {
          route_name: routeName,
          hub_departer: route.hub_departer,
          stops: [],
          total_distance: 0,
          total_duration: 0,
          delivery_type: route.note || 'D'
        };
      }
      
      routesByName[routeName].stops.push(route);

      // Calculate totals from segments
      if (route.segment_distance_km) {
        routesByName[routeName].total_distance += route.segment_distance_km;
      }
      if (route.segment_duration_minutes) {
        routesByName[routeName].total_duration += route.segment_duration_minutes;
      }
    });
    
    // Sort stops by STT
    Object.values(routesByName).forEach(route => {
      route.stops.sort((a, b) => (a.STT || 0) - (b.STT || 0));
    });
    
    return Object.values(routesByName);
  };

  const organizedRoutes = organizeRoutes();

  // Filter routes
  const filteredRoutes = organizedRoutes.filter(route => {
    // Hub filter
    if (hubFilter !== 'all' && route.hub_departer !== hubFilter) {
      return false;
    }
    
    // Search filter
    if (searchQuery && !route.route_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Get unique hub departers for filter
  const hubDeparters = [...new Set(routes.map(r => r.hub_departer))].sort();

  if (loading) {
    return (
      <div className="route-management loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading route data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="route-management error">
        <div className="error-message">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="route-management">
      <header className="route-header">
        <h1>🚚 Route Management</h1>
        <div className="route-stats">
          <div className="stat-item">
            <span className="stat-value">{organizedRoutes.length}</span>
            <span className="stat-label">Total Routes</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Object.keys(hubs).length}</span>
            <span className="stat-label">Total Hubs</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{routes.length}</span>
            <span className="stat-label">Total Stops</span>
          </div>
        </div>
      </header>

      <div className="route-content">
        {!selectedRoute ? (
          <div className="route-overview">
            <RouteList
              routes={filteredRoutes}
              hubs={hubs}
              hubFilter={hubFilter}
              setHubFilter={setHubFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              hubDeparters={hubDeparters}
              onSelectRoute={setSelectedRoute}
            />
            <RouteMap
              routes={filteredRoutes}
              hubs={hubs}
              selectedRoute={selectedRoute}
            />
          </div>
        ) : (
          <RouteDetail
            route={selectedRoute}
            hubs={hubs}
            onBack={() => setSelectedRoute(null)}
          />
        )}
      </div>
    </div>
  );
}

export default RouteManagement;

