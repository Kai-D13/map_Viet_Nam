import { useState, useEffect } from 'react';
import VietnamMap from './components/VietnamMap';
import VietnamDashboard from './components/VietnamDashboard';
import RouteManagement from './components/RouteManagement';
import PasswordProtection from './components/PasswordProtection';
import './App.css';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1Ijoia2FpZHJvZ2VyIiwiYSI6ImNtaDM4bnB2cjBuN28ybnM5NmV0ZTluZHEifQ.YHW9Erg1h5egssNhthQiZw';

function VietnamApp() {
  // Tab state
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' or 'routes'

  // Data states
  const [destinations, setDestinations] = useState([]);
  const [districts, setDistricts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI states
  const [showBoundaries, setShowBoundaries] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showClusters, setShowClusters] = useState(true);
  const [showMarkers, setShowMarkers] = useState(false); // Default OFF to avoid clutter

  // Filter states
  const [provinceFilter, setProvinceFilter] = useState('');
  const [minOrders, setMinOrders] = useState(0);
  const [maxOrders, setMaxOrders] = useState(1135);

  // Load data
  useEffect(() => {
    console.log('Loading Vietnam data...');
    
    Promise.all([
      fetch('/vietnam_destinations.json').then(res => {
        if (!res.ok) throw new Error('Failed to load destinations');
        return res.json();
      }),
      fetch('/vietnam_districts.json').then(res => {
        if (!res.ok) throw new Error('Failed to load districts');
        return res.json();
      })
    ])
      .then(([destinationsData, districtsData]) => {
        console.log('Destinations loaded:', destinationsData.length);
        console.log('Districts loaded:', districtsData.features?.length || 0);
        
        setDestinations(destinationsData);
        setDistricts(districtsData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '24px',
        color: '#4264fb',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="spinner" style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #4264fb',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <div>Loading Vietnam logistics data...</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#dc3545',
        flexDirection: 'column',
        gap: '10px',
        padding: '20px'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <div>Error loading data</div>
        <div style={{ fontSize: '14px', color: '#666' }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#4264fb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Calculate statistics for header
  const validDestinations = destinations.filter(d => d.validation_status === 'valid');
  // Use ALL destinations for total orders (including the 1 failed destination with 68 orders)
  const totalOrders = destinations.reduce((sum, d) => sum + (d.orders_per_month || 0), 0);

  return (
    <PasswordProtection>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          backgroundColor: '#1f2937',
          borderBottom: '2px solid #374151',
          zIndex: 2000
        }}>
          <button
            onClick={() => setActiveTab('heatmap')}
            style={{
              padding: '15px 30px',
              backgroundColor: activeTab === 'heatmap' ? '#3b82f6' : 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'heatmap' ? 'bold' : 'normal',
              transition: 'all 0.3s',
              borderBottom: activeTab === 'heatmap' ? '3px solid #60a5fa' : '3px solid transparent'
            }}
          >
            📊 Heatmap & Clustering
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            style={{
              padding: '15px 30px',
              backgroundColor: activeTab === 'routes' ? '#3b82f6' : 'transparent',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'routes' ? 'bold' : 'normal',
              transition: 'all 0.3s',
              borderBottom: activeTab === 'routes' ? '3px solid #60a5fa' : '3px solid transparent'
            }}
          >
            🚚 Route Management
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'heatmap' ? (
          <div style={{ display: 'flex', height: 'calc(100vh - 53px)', overflow: 'hidden' }}>
            {/* Dashboard Sidebar */}
            <VietnamDashboard
              destinations={destinations}
              showBoundaries={showBoundaries}
              onToggleBoundaries={setShowBoundaries}
              showHeatmap={showHeatmap}
              onToggleHeatmap={setShowHeatmap}
              showClusters={showClusters}
              onToggleClusters={setShowClusters}
              showMarkers={showMarkers}
              onToggleMarkers={setShowMarkers}
              provinceFilter={provinceFilter}
              onProvinceFilterChange={setProvinceFilter}
              minOrders={minOrders}
              maxOrders={maxOrders}
              onMinOrdersChange={setMinOrders}
              onMaxOrdersChange={setMaxOrders}
            />

            {/* Map Container */}
            <div style={{ flex: 1, position: 'relative' }}>
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
                    🇻🇳 Vietnam Logistics Heatmap
                  </h1>
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                    Order Distribution & Clustering Analysis
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '15px',
                  alignItems: 'center',
                  marginRight: '10px'
                }}>
                  <div style={{
                    backgroundColor: '#4264fb',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {validDestinations.length.toLocaleString()} Destinations
                  </div>
                  <div style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {totalOrders.toLocaleString()} Orders
                  </div>
                </div>
          </div>

          {/* Map */}
          <div style={{ height: '100%', paddingTop: '80px' }}>
            <VietnamMap
              destinations={destinations}
              districts={districts}
              showBoundaries={showBoundaries}
              showHeatmap={showHeatmap}
              showClusters={showClusters}
              showMarkers={showMarkers}
              provinceFilter={provinceFilter}
              minOrders={minOrders}
              maxOrders={maxOrders}
            />
          </div>

          {/* Legend */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '200px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>
              Legend
            </h4>
            
            {showHeatmap && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Heatmap Intensity
                </div>
                <div style={{
                  height: '20px',
                  background: 'linear-gradient(to right, rgba(139,0,0,0.4), rgba(220,20,60,0.6), rgba(255,99,71,0.7), rgba(255,165,0,0.85), rgba(255,215,0,0.9), rgba(255,255,224,1))',
                  borderRadius: '4px',
                  marginBottom: '5px',
                  boxShadow: '0 0 15px rgba(255,165,0,0.6)' // Orange glow effect
                }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            )}

            {showClusters && (
              <div style={{ marginBottom: showMarkers ? '10px' : '0' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Cluster Size
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#4169E1',
                      border: '2px solid #fff'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#666' }}>{'< 100 destinations'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: '#1E90FF',
                      border: '2px solid #fff'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#666' }}>100 - 500 destinations</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#00BFFF',
                      border: '2px solid #fff'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#666' }}>{'>'}500 destinations</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '5px', fontStyle: 'italic' }}>
                    Shows total orders in cluster
                  </div>
                </div>
              </div>
            )}

            {showMarkers && (
              <div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  Individual Points
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#4169E1',
                      border: '1px solid #fff'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#666' }}>Low orders</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#1E90FF',
                      border: '1px solid #fff'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#666' }}>Medium orders</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#00BFFF',
                      border: '1px solid #fff'
                    }}></div>
                    <span style={{ fontSize: '11px', color: '#666' }}>High orders</span>
                  </div>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
        ) : (
          <RouteManagement />
        )}
      </div>
    </PasswordProtection>
  );
}

export default VietnamApp;

