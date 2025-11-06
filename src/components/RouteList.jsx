import './RouteList.css';

function RouteList({ 
  routes, 
  hubs,
  hubFilter, 
  setHubFilter, 
  searchQuery, 
  setSearchQuery,
  hubDeparters,
  onSelectRoute 
}) {
  
  const getDeliveryTypeColor = (type) => {
    if (type === 'D') return '#10b981'; // Green
    if (type === 'D+1') return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getDeliveryTypeEmoji = (type) => {
    if (type === 'D') return '🟢';
    if (type === 'D+1') return '🟡';
    return '🔴';
  };

  return (
    <div className="route-list-container">
      <div className="route-list-header">
        <h2>📋 Route List</h2>
        
        <div className="route-filters">
          <div className="filter-group">
            <label>Hub Departure:</label>
            <select
              value={hubFilter}
              onChange={(e) => setHubFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Hubs</option>
              {hubDeparters.map(hub => (
                <option key={hub} value={hub}>{hub}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search route name..."
              className="filter-input"
            />
          </div>
        </div>
      </div>

      <div className="route-list-body">
        {routes.length === 0 ? (
          <div className="no-routes">
            <p>No routes found matching your filters.</p>
          </div>
        ) : (
          <div className="routes-grid">
            {routes.map((route, index) => (
              <div 
                key={index} 
                className="route-card"
                onClick={() => onSelectRoute(route)}
              >
                <div className="route-card-header">
                  <h3 className="route-name">{route.route_name}</h3>
                  <span 
                    className="delivery-type"
                    style={{ color: getDeliveryTypeColor(route.delivery_type) }}
                  >
                    {getDeliveryTypeEmoji(route.delivery_type)} {route.delivery_type}
                  </span>
                </div>

                <div className="route-card-body">
                  <div className="route-info-row">
                    <span className="info-label">📦 Departure:</span>
                    <span className="info-value">{route.hub_departer}</span>
                  </div>

                  <div className="route-info-row">
                    <span className="info-label">🎯 Stops:</span>
                    <span className="info-value">{route.stops.length}</span>
                  </div>

                  {route.total_distance > 0 && (
                    <div className="route-info-row">
                      <span className="info-label">📏 Distance:</span>
                      <span className="info-value">{route.total_distance.toFixed(2)} km</span>
                    </div>
                  )}

                  {route.total_duration > 0 && (
                    <div className="route-info-row">
                      <span className="info-label">⏱️ Duration:</span>
                      <span className="info-value">
                        {Math.floor(route.total_duration / 60)}h {Math.round(route.total_duration % 60)}m
                      </span>
                    </div>
                  )}
                </div>

                <div className="route-card-footer">
                  <button className="view-details-btn">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="route-list-footer">
        <p>Showing {routes.length} route{routes.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}

export default RouteList;

