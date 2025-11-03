import { useState, useMemo } from 'react';

const VietnamDashboard = ({
  destinations,
  showBoundaries,
  onToggleBoundaries,
  showHeatmap,
  onToggleHeatmap,
  showClusters,
  onToggleClusters,
  showMarkers,
  onToggleMarkers,
  provinceFilter,
  onProvinceFilterChange,
  minOrders,
  maxOrders,
  onMinOrdersChange,
  onMaxOrdersChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Get all provinces
  const provinces = useMemo(() => {
    const provinceSet = new Set();
    destinations.forEach(d => {
      if (d.validation_status === 'valid') {
        const parts = d.address.split(', ');
        if (parts.length >= 2) {
          provinceSet.add(parts[parts.length - 2]); // Second to last
        }
      }
    });
    return Array.from(provinceSet).sort();
  }, [destinations]);

  // Calculate statistics
  const stats = useMemo(() => {
    const valid = destinations.filter(d => d.validation_status === 'valid');
    
    let filtered = valid;
    if (provinceFilter) {
      filtered = filtered.filter(d => {
        const parts = d.address.split(', ');
        const province = parts[parts.length - 2];
        return province.includes(provinceFilter);
      });
    }
    if (minOrders !== null) {
      filtered = filtered.filter(d => d.orders_per_month >= minOrders);
    }
    if (maxOrders !== null) {
      filtered = filtered.filter(d => d.orders_per_month <= maxOrders);
    }

    const totalOrders = filtered.reduce((sum, d) => sum + d.orders_per_month, 0);
    const avgOrders = filtered.length > 0 ? totalOrders / filtered.length : 0;
    const maxOrderDest = filtered.reduce((max, d) => 
      d.orders_per_month > max.orders_per_month ? d : max, 
      { orders_per_month: 0 }
    );

    // Province distribution
    const provinceOrders = {};
    filtered.forEach(d => {
      const parts = d.address.split(', ');
      const province = parts[parts.length - 2];
      if (!provinceOrders[province]) {
        provinceOrders[province] = { count: 0, orders: 0 };
      }
      provinceOrders[province].count++;
      provinceOrders[province].orders += d.orders_per_month;
    });

    const topProvinces = Object.entries(provinceOrders)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);

    return {
      total: valid.length,
      filtered: filtered.length,
      totalOrders,
      avgOrders,
      maxOrderDest,
      topProvinces
    };
  }, [destinations, provinceFilter, minOrders, maxOrders]);

  // Search destinations
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    return destinations
      .filter(d => 
        d.validation_status === 'valid' &&
        d.address.toLowerCase().includes(query)
      )
      .slice(0, 20); // Limit to 20 results
  }, [destinations, searchQuery]);

  return (
    <div style={{
      width: '400px',
      height: '100%',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #dee2e6',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderBottom: '2px solid #4264fb'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
          Vietnam Logistics
        </h2>
        <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
          Heatmap & Clustering Analysis
        </p>
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        
        {/* Statistics */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>
            Statistics
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Total Destinations</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4264fb' }}>
                {stats.total.toLocaleString()}
              </div>
            </div>
            
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Filtered</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                {stats.filtered.toLocaleString()}
              </div>
            </div>
            
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Total Orders</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b6b' }}>
                {stats.totalOrders.toLocaleString()}
              </div>
            </div>
            
            <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>Avg Orders</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffa500' }}>
                {stats.avgOrders.toFixed(1)}
              </div>
            </div>
          </div>

          {stats.maxOrderDest.orders_per_month > 0 && (
            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '6px', border: '1px solid #ffc107' }}>
              <div style={{ fontSize: '11px', color: '#856404', marginBottom: '4px' }}>Highest Orders</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#856404' }}>
                {stats.maxOrderDest.orders_per_month} orders
              </div>
              <div style={{ fontSize: '11px', color: '#856404', marginTop: '4px' }}>
                {stats.maxOrderDest.address}
              </div>
            </div>
          )}
        </div>

        {/* Map Controls */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>
            Map Layers
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => onToggleHeatmap(e.target.checked)}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>Show Heatmap</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showClusters}
                onChange={(e) => onToggleClusters(e.target.checked)}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>Show Clusters</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showMarkers}
                onChange={(e) => onToggleMarkers(e.target.checked)}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>
                Show Individual Points
                <span style={{ fontSize: '11px', color: '#999', marginLeft: '5px' }}>(may be slow)</span>
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showBoundaries}
                onChange={(e) => onToggleBoundaries(e.target.checked)}
                style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>Show District Boundaries</span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>
            Filters
          </h3>
          
          {/* Province Filter */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '5px' }}>
              Province
            </label>
            <select
              value={provinceFilter}
              onChange={(e) => onProvinceFilterChange(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ced4da',
                fontSize: '14px'
              }}
            >
              <option value="">All Provinces</option>
              {provinces.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Orders Range */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '5px' }}>
              Min Orders: {minOrders || 0}
            </label>
            <input
              type="range"
              min="0"
              max="1135"
              value={minOrders || 0}
              onChange={(e) => onMinOrdersChange(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '5px' }}>
              Max Orders: {maxOrders || 1135}
            </label>
            <input
              type="range"
              min="0"
              max="1135"
              value={maxOrders || 1135}
              onChange={(e) => onMaxOrdersChange(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {(provinceFilter || minOrders > 0 || maxOrders < 1135) && (
            <button
              onClick={() => {
                onProvinceFilterChange('');
                onMinOrdersChange(0);
                onMaxOrdersChange(1135);
              }}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                marginTop: '10px'
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Top Provinces */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>
            Top 10 Provinces
          </h3>
          
          <div style={{ fontSize: '12px' }}>
            {stats.topProvinces.map((p, i) => (
              <div
                key={p.name}
                style={{
                  padding: '8px',
                  marginBottom: '5px',
                  backgroundColor: i === 0 ? '#fff3cd' : '#f8f9fa',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: provinceFilter === p.name ? '2px solid #4264fb' : '1px solid #dee2e6'
                }}
                onClick={() => onProvinceFilterChange(provinceFilter === p.name ? '' : p.name)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>
                    {i + 1}. {p.name.replace('Thành phố ', '').replace('Tỉnh ', '')}
                  </span>
                  <span style={{ color: '#4264fb', fontWeight: 'bold' }}>
                    {p.orders.toLocaleString()}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {p.count} destinations • {(p.orders / p.count).toFixed(1)} avg
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '15px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#333' }}>
            Search Destinations
          </h3>
          
          <input
            type="text"
            placeholder="Search by address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ced4da',
              fontSize: '14px',
              marginBottom: '10px'
            }}
          />

          {searchResults.length > 0 && (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {searchResults.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px',
                    marginBottom: '5px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                    {d.address}
                  </div>
                  <div style={{ color: '#4264fb' }}>
                    {d.orders_per_month} orders/month
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VietnamDashboard;

