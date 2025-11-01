import React, { useState, useEffect } from 'react';

const Dashboard = ({ markers, onCalculateDistance, onToggleBoundaries, showBoundaries, onToggleRoutes, showRoutes, focusMode, onExitFocusMode }) => {
  const [stats, setStats] = useState({
    totalHubs: 0,
    totalOrders: 0,
    farthestHub: null,
    topHubs: [],
    totalDistance: 0
  });

  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [calculatedRoutes, setCalculatedRoutes] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!markers || markers.length === 0) return;

    const totalOrders = markers.reduce((sum, m) => sum + m.order, 0);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    let farthest = null;
    let maxDistance = 0;
    let totalDist = 0;

    markers.forEach(marker => {
      const dist = calculateDistance(
        marker.departer_lat,
        marker.departer_long,
        marker.destination_lat,
        marker.destination_long
      );
      totalDist += dist;
      if (dist > maxDistance) {
        maxDistance = dist;
        farthest = { ...marker, distance: dist };
      }
    });

    const sortedByOrders = [...markers].sort((a, b) => b.order - a.order);
    const topHubs = sortedByOrders.slice(0, 3);

    setStats({
      totalHubs: markers.length,
      totalOrders,
      farthestHub: farthest,
      topHubs,
      totalDistance: totalDist
    });

  }, [markers]);

  const handleToggleDestination = (destination) => {
    setSelectedDestinations(prev => {
      if (prev.includes(destination)) {
        return prev.filter(d => d !== destination);
      } else {
        return [...prev, destination];
      }
    });
  };

  const handleCalculate = async () => {
    if (selectedDestinations.length === 0) {
      alert('Vui lòng chọn ít nhất 1 điểm đến');
      return;
    }
    setIsCalculating(true);
    const results = await onCalculateDistance(selectedDestinations);
    setCalculatedRoutes(results);
    setIsCalculating(false);
  };

  const handleClearSelection = () => {
    setSelectedDestinations([]);
    setCalculatedRoutes([]);
  };

  const totalCalculatedDistance = calculatedRoutes.reduce((sum, route) => sum + (route.distance || 0), 0);

  return (
    <div style={{
      width: '380px',
      height: '100%',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      overflowY: 'auto',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        margin: '0 0 20px 0',
        fontSize: '24px',
        color: '#333',
        borderBottom: '3px solid #4264fb',
        paddingBottom: '10px'
      }}>
        📊 Dashboard
      </h2>

      {/* Focus Mode Alert */}
      {focusMode && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #ffc107',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#856404', marginBottom: '4px' }}>
                🎯 Chế độ Focus Mode
              </div>
              <div style={{ fontSize: '12px', color: '#856404' }}>
                Chỉ hiển thị các điểm đã chọn
              </div>
            </div>
            <button
              onClick={onExitFocusMode}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ✕ Thoát
            </button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '12px', fontWeight: 'bold' }}>
          🗺️ Điều khiển bản đồ
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showBoundaries}
              onChange={(e) => onToggleBoundaries(e.target.checked)}
              style={{ marginRight: '8px', cursor: 'pointer' }}
              disabled={focusMode}
            />
            Hiển thị vùng xã (màu)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={showRoutes}
              onChange={(e) => onToggleRoutes(e.target.checked)}
              style={{ marginRight: '8px', cursor: 'pointer' }}
              disabled={focusMode}
            />
            Hiển thị routes
          </label>
        </div>
      </div>

      {/* Distance Calculator */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '12px', fontWeight: 'bold' }}>
          📏 Tính khoảng cách
        </h3>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
          <strong>Điểm xuất phát:</strong> Hub Poipet
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
          Chọn điểm đến:
        </div>
        <div style={{
          maxHeight: '200px',
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '10px'
        }}>
          {markers.map((marker, idx) => (
            <label key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '4px 0',
              cursor: 'pointer',
              fontSize: '13px'
            }}>
              <input
                type="checkbox"
                checked={selectedDestinations.includes(marker.hub_destination)}
                onChange={() => handleToggleDestination(marker.hub_destination)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              {marker.hub_destination} ({marker.order} đơn)
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            onClick={handleCalculate}
            disabled={isCalculating || selectedDestinations.length === 0}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#4264fb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedDestinations.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              opacity: selectedDestinations.length === 0 ? 0.5 : 1
            }}
          >
            {isCalculating ? 'Đang tính...' : 'Tính toán'}
          </button>
          <button
            onClick={handleClearSelection}
            style={{
              flex: 1,
              padding: '8px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold'
            }}
          >
            Xóa chọn
          </button>
        </div>
        {calculatedRoutes.length > 0 && (
          <div style={{
            backgroundColor: '#e7f3ff',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #4264fb'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#004085' }}>
              Kết quả:
            </div>
            {calculatedRoutes.map((route, idx) => (
              <div key={idx} style={{ fontSize: '12px', color: '#004085', marginBottom: '4px' }}>
                • {route.destination}: <strong>{route.distance.toFixed(2)} km</strong> ({Math.round(route.duration)} phút)
              </div>
            ))}
            <div style={{
              fontSize: '13px',
              fontWeight: 'bold',
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid #4264fb',
              color: '#004085'
            }}>
              Tổng: {totalCalculatedDistance.toFixed(2)} km
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
            📍 Tổng số điểm giao hàng
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4264fb' }}>
            {stats.totalHubs}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
            📦 Tổng số đơn hàng/tháng
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {stats.totalOrders}
          </div>
        </div>
      </div>

      {/* Top 3 Hubs */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{
          fontSize: '15px',
          color: '#333',
          marginBottom: '10px',
          fontWeight: 'bold'
        }}>
          🏆 Top 3 điểm có đơn hàng nhiều nhất
        </h3>
        {stats.topHubs.map((hub, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px', marginRight: '8px' }}>
                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#333', fontSize: '13px' }}>
                  {hub.hub_destination}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745', textAlign: 'right' }}>
              {hub.order} đơn
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

