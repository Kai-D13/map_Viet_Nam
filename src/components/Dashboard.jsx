import React, { useState, useEffect, useMemo } from 'react';

const Dashboard = ({
  hubs,
  destinations,
  selectedHub,
  onHubChange,
  getFilteredDestinations,
  selectedDestinations,
  onDestinationsChange,
  onCalculateDistance,
  calculateDistance,
  provinceFilter,
  districtFilter,
  wardFilter,
  carrierTypeFilter,
  distanceFilter,
  onProvinceFilterChange,
  onDistrictFilterChange,
  onWardFilterChange,
  onCarrierTypeFilterChange,
  onDistanceFilterChange,
  showBoundaries,
  onToggleBoundaries,
  showRoutes,
  onToggleRoutes,
  showHeatmap,
  onToggleHeatmap
}) => {
  const [calculatedRoutes, setCalculatedRoutes] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('distance'); // 'distance' or 'settings'
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [showAllDestinations, setShowAllDestinations] = useState(false); // Cross-hub mode

  // Get available destinations based on mode
  const availableDestinations = useMemo(() => {
    if (showAllDestinations) {
      return destinations; // All destinations (cross-hub mode)
    } else {
      if (!selectedHub) return [];
      return destinations.filter(d => d.hub_id === selectedHub.id);
    }
  }, [selectedHub, destinations, showAllDestinations]);

  // Filtered hubs based on search query
  const filteredHubs = useMemo(() => {
    if (!hubSearchQuery) return hubs;
    const query = hubSearchQuery.toLowerCase();
    return hubs.filter(h =>
      h.name.toLowerCase().includes(query) ||
      h.province_name.toLowerCase().includes(query)
    );
  }, [hubs, hubSearchQuery]);

  const provinces = useMemo(() => {
    return [...new Set(availableDestinations.map(d => d.province_name))].sort();
  }, [availableDestinations]);

  const districts = useMemo(() => {
    let filtered = availableDestinations;
    if (provinceFilter) {
      filtered = filtered.filter(d => d.province_name === provinceFilter);
    }
    return [...new Set(filtered.map(d => d.district_name))].sort();
  }, [availableDestinations, provinceFilter]);

  const wards = useMemo(() => {
    let filtered = availableDestinations;
    if (provinceFilter) {
      filtered = filtered.filter(d => d.province_name === provinceFilter);
    }
    if (districtFilter) {
      filtered = filtered.filter(d => d.district_name === districtFilter);
    }
    return [...new Set(filtered.map(d => d.ward_name))].sort();
  }, [availableDestinations, provinceFilter, districtFilter]);

  // Filter destinations locally (support cross-hub mode)
  const filteredDestinations = useMemo(() => {
    let filtered = availableDestinations;

    if (provinceFilter) {
      filtered = filtered.filter(d => d.province_name === provinceFilter);
    }

    if (districtFilter) {
      filtered = filtered.filter(d => d.district_name === districtFilter);
    }

    if (wardFilter) {
      filtered = filtered.filter(d => d.ward_name === wardFilter);
    }

    return filtered;
  }, [availableDestinations, provinceFilter, districtFilter, wardFilter]);

  const handleToggleDestination = (destId) => {
    onDestinationsChange(prev => {
      if (prev.includes(destId)) {
        return prev.filter(id => id !== destId);
      } else {
        return [...prev, destId];
      }
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredDestinations.map(d => d.id);
    onDestinationsChange(allIds);
  };

  const handleClearAll = () => {
    onDestinationsChange([]);
    setCalculatedRoutes([]);
  };

  const handleResetAll = () => {
    // Reset hub selection
    onHubChange(null);
    // Reset destinations
    onDestinationsChange([]);
    // Reset filters
    onProvinceFilterChange('');
    onDistrictFilterChange('');
    onWardFilterChange('');
    // Reset cross-hub mode
    setShowAllDestinations(false);
    // Reset search
    setHubSearchQuery('');
    // Reset routes
    setCalculatedRoutes([]);
    // Dispatch event to reset map view
    window.dispatchEvent(new CustomEvent('reset-map'));
  };

  const handleCalculate = async () => {
    if (selectedDestinations.length === 0) {
      alert('Vui lòng chọn ít nhất 1 điểm đến');
      return;
    }

    // In cross-hub mode, check if user selected hub
    if (showAllDestinations && !selectedHub) {
      alert('⚠️ Trong chế độ xem tất cả destinations, vui lòng chọn 1 hub để tính khoảng cách');
      return;
    }

    setIsCalculating(true);
    const results = await onCalculateDistance(selectedDestinations);
    setCalculatedRoutes(results);
    setIsCalculating(false);
  };

  const handleExportCSV = () => {
    if (calculatedRoutes.length === 0) {
      alert('Không có dữ liệu để xuất. Vui lòng tính khoảng cách trước.');
      return;
    }

    // Prepare CSV data
    const csvRows = [];

    // Header with metadata
    csvRows.push('# LOGISTICS HUB OPTIMIZATION - ROUTE CALCULATION EXPORT');
    csvRows.push(`# Ngày xuất: ${new Date().toLocaleString('vi-VN')}`);
    csvRows.push('');

    // Hub information
    csvRows.push('# THÔNG TIN HUB XUẤT PHÁT');
    csvRows.push(`Hub ID,Hub Name,Province,Latitude,Longitude`);
    csvRows.push(`${selectedHub.id},${selectedHub.name},${selectedHub.province_name},${selectedHub.lat},${selectedHub.long}`);
    csvRows.push('');

    // Filter information
    csvRows.push('# BỘ LỌC ĐÃ ÁP DỤNG');
    csvRows.push(`Mode,${showAllDestinations ? 'Cross-hub (Tất cả destinations)' : 'Single-hub'}`);
    csvRows.push(`Tỉnh/Thành phố,${provinceFilter || 'Tất cả'}`);
    csvRows.push(`Quận/Huyện,${districtFilter || 'Tất cả'}`);
    csvRows.push(`Xã/Phường,${wardFilter || 'Tất cả'}`);
    csvRows.push(`Carrier Type,${carrierTypeFilter || 'Tất cả carrier types'}`);
    csvRows.push(`Khoảng cách tối đa,${distanceFilter ? `<= ${distanceFilter}km` : 'Không giới hạn'}`);
    csvRows.push('');

    // Summary
    csvRows.push('# TỔNG KẾT');
    csvRows.push(`Tổng số destinations,${calculatedRoutes.length}`);
    csvRows.push(`Tổng khoảng cách,${totalDistance.toFixed(2)} km`);
    csvRows.push(`Tổng thời gian,${(totalDuration / 60).toFixed(2)} giờ`);
    csvRows.push(`Tổng orders,${totalOrders} orders/tháng`);
    csvRows.push('');

    // Route details header
    csvRows.push('# CHI TIẾT TUYẾN ĐƯỜNG');
    csvRows.push('STT,Destination ID,Destination Name,Ward,District,Province,Carrier Type,Distance (km),Duration (minutes),Orders/Month,Hub ID,Hub Name');

    // Route details data
    calculatedRoutes.forEach((route, index) => {
      // Find destination details
      const dest = destinations.find(d => d.name === route.destination);
      if (dest) {
        csvRows.push([
          index + 1,
          dest.id,
          `"${route.destination}"`,
          `"${dest.ward_name}"`,
          `"${dest.district_name}"`,
          `"${dest.province_name}"`,
          route.carrier_type,
          route.distance.toFixed(2),
          route.duration.toFixed(0),
          route.orders,
          dest.hub_id,
          `"${hubs.find(h => h.id === dest.hub_id)?.name || 'N/A'}"`
        ].join(','));
      }
    });

    // Convert to CSV string
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const hubName = selectedHub.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `route_calculation_${hubName}_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalDistance = calculatedRoutes.reduce((sum, r) => sum + r.distance, 0);
  const totalDuration = calculatedRoutes.reduce((sum, r) => sum + r.duration, 0);
  const totalOrders = calculatedRoutes.reduce((sum, r) => sum + r.orders, 0);

  return (
    <div style={{
      width: '420px',
      height: '100%',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#fff',
        borderBottom: '2px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#333' }}>
          📊 Dashboard
        </h2>
        <button
          onClick={handleResetAll}
          title="Reset tất cả về trạng thái ban đầu"
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
        >
          🔄 Reset
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        backgroundColor: '#fff',
        borderBottom: '1px solid #e9ecef'
      }}>
        <button
          onClick={() => setActiveTab('distance')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'distance' ? '#4264fb' : 'transparent',
            color: activeTab === 'distance' ? '#fff' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'distance' ? 'bold' : 'normal',
            fontSize: '14px'
          }}
        >
          Tính khoảng cách
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: activeTab === 'settings' ? '#4264fb' : 'transparent',
            color: activeTab === 'settings' ? '#fff' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === 'settings' ? 'bold' : 'normal',
            fontSize: '14px'
          }}
        >
          Hiển thị
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {activeTab === 'distance' ? (
          <>
            {/* Hub Selection with Search */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                📍 Điểm xuất phát (Hub)
              </label>

              {/* Search Input */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm hub (tên hoặc tỉnh)..."
                  value={hubSearchQuery}
                  onChange={(e) => setHubSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    paddingRight: hubSearchQuery ? '30px' : '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px 6px 0 0',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    borderBottom: 'none'
                  }}
                />
                {hubSearchQuery && (
                  <button
                    onClick={() => setHubSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px',
                      color: '#999',
                      padding: '0 4px'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Hub Dropdown */}
              <select
                value={selectedHub?.id || ''}
                onChange={(e) => {
                  const hubId = e.target.value;
                  if (!hubId) {
                    onHubChange(null);
                    return;
                  }
                  const hub = hubs.find(h => h.id === hubId);
                  if (hub) {
                    // Check if hub has destinations
                    const hubDests = destinations.filter(d => d.hub_id === hub.id);
                    if (hubDests.length === 0) {
                      const confirmSelect = window.confirm(
                        `⚠️ Hub "${hub.name}" chưa có destinations nào.\n\n` +
                        `Bạn vẫn muốn chọn hub này không?\n\n` +
                        `(Bạn sẽ không thể tính khoảng cách cho hub này)`
                      );
                      if (!confirmSelect) {
                        return; // Don't select this hub
                      }
                    }

                    onHubChange(hub);
                    setHubSearchQuery(''); // Clear search after selection
                    // Reset filters when changing hub
                    onProvinceFilterChange('');
                    onDistrictFilterChange('');
                    onWardFilterChange('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '0 0 6px 6px',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  color: filteredHubs.length === 0 ? '#999' : '#333'
                }}
              >
                <option value="">
                  {hubSearchQuery
                    ? `${filteredHubs.length} hub tìm thấy`
                    : `-- Chọn hub (${hubs.length} hubs) --`}
                </option>
                {filteredHubs.map(hub => {
                  const hubDestCount = destinations.filter(d => d.hub_id === hub.id).length;
                  const isEmpty = hubDestCount === 0;
                  return (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} - {hub.province_name} {isEmpty ? '⚠️ (Chưa có destinations)' : `(${hubDestCount} dests)`}
                    </option>
                  );
                })}
              </select>

              {/* Search hint */}
              {hubSearchQuery && filteredHubs.length > 0 && (
                <div style={{
                  fontSize: '11px',
                  color: '#28a745',
                  marginTop: '4px',
                  padding: '4px 8px',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  border: '1px solid #c3e6cb'
                }}>
                  ✓ Tìm thấy {filteredHubs.length} hub. Click dropdown để chọn.
                </div>
              )}
              {hubSearchQuery && filteredHubs.length === 0 && (
                <div style={{
                  fontSize: '11px',
                  color: '#dc3545',
                  marginTop: '4px',
                  padding: '4px 8px',
                  backgroundColor: '#f8d7da',
                  borderRadius: '4px',
                  border: '1px solid #f5c6cb'
                }}>
                  ✕ Không tìm thấy hub nào. Thử từ khóa khác.
                </div>
              )}

              {/* Warning for empty hub */}
              {selectedHub && availableDestinations.length === 0 && !showAllDestinations && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#856404'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚠️ Hub này chưa có destinations
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    Vui lòng chọn hub khác hoặc thêm destinations vào file destinations.json
                  </div>
                </div>
              )}

              {/* Cross-hub mode toggle */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: '10px',
                padding: '8px',
                backgroundColor: showAllDestinations ? '#fff3cd' : '#e7f3ff',
                borderRadius: '6px',
                cursor: 'pointer',
                border: showAllDestinations ? '1px solid #ffc107' : '1px solid #4264fb'
              }}>
                <input
                  type="checkbox"
                  checked={showAllDestinations}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setShowAllDestinations(isChecked);
                    // Reset selections and filters
                    onDestinationsChange([]);
                    setCalculatedRoutes([]);
                    onProvinceFilterChange('');
                    onDistrictFilterChange('');
                    onWardFilterChange('');
                  }}
                  style={{ marginRight: '8px' }}
                />
                <span style={{
                  fontSize: '12px',
                  color: showAllDestinations ? '#856404' : '#0056b3',
                  fontWeight: showAllDestinations ? 'bold' : 'normal'
                }}>
                  {showAllDestinations ? '🌐' : '🏠'} {showAllDestinations
                    ? 'Đang xem TẤT CẢ destinations (cross-hub mode)'
                    : 'Chỉ xem destinations của hub được chọn'}
                </span>
              </label>
            </div>

            {/* Filters */}
            <div style={{
              marginBottom: '20px',
              padding: '15px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              opacity: !selectedHub ? 0.6 : 1
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#333' }}>
                🔍 Lọc điểm đến
                {selectedHub && (
                  <span style={{ fontSize: '11px', color: '#27AE60', fontWeight: 'normal', marginLeft: '8px' }}>
                    (Showing {filteredDestinations.length}/{availableDestinations.length})
                  </span>
                )}
                {!selectedHub && (
                  <span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal', marginLeft: '8px' }}>
                    (Chọn hub trước)
                  </span>
                )}
              </h3>

              {/* Province Filter */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  Tỉnh/Thành phố
                </label>
                <select
                  value={provinceFilter}
                  onChange={(e) => {
                    onProvinceFilterChange(e.target.value);
                    onDistrictFilterChange('');
                    onWardFilterChange('');
                  }}
                  disabled={!selectedHub}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    backgroundColor: !selectedHub ? '#f5f5f5' : '#fff',
                    cursor: !selectedHub ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">
                    {!selectedHub
                      ? '-- Chọn hub trước --'
                      : `Tất cả tỉnh (${provinces.length})`}
                  </option>
                  {provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* District Filter */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  Quận/Huyện
                </label>
                <select
                  value={districtFilter}
                  onChange={(e) => {
                    onDistrictFilterChange(e.target.value);
                    onWardFilterChange('');
                  }}
                  disabled={!provinceFilter}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    backgroundColor: !provinceFilter ? '#f5f5f5' : '#fff'
                  }}
                >
                  <option value="">Tất cả quận ({districts.length})</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Ward Filter */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  Xã/Phường
                </label>
                <select
                  value={wardFilter}
                  onChange={(e) => onWardFilterChange(e.target.value)}
                  disabled={!districtFilter}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    backgroundColor: !districtFilter ? '#f5f5f5' : '#fff'
                  }}
                >
                  <option value="">Tất cả xã ({wards.length})</option>
                  {wards.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* Divider */}
              <div style={{
                borderTop: '1px dashed #ddd',
                margin: '12px 0',
                paddingTop: '12px'
              }}>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '10px', fontWeight: 'bold' }}>
                  🔧 LỌC NÂNG CAO
                </div>
              </div>

              {/* Carrier Type Filter */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  🚚 Carrier Type
                </label>
                <select
                  value={carrierTypeFilter}
                  onChange={(e) => onCarrierTypeFilterChange(e.target.value)}
                  disabled={!selectedHub}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    backgroundColor: !selectedHub ? '#f5f5f5' : '#fff',
                    cursor: !selectedHub ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="">Tất cả carrier types</option>
                  <option value="1PL">🔴 1PL</option>
                  <option value="2PL">🟢 2PL</option>
                  <option value="3PL">🟠 3PL</option>
                </select>
              </div>

              {/* Distance Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#666' }}>
                  📏 Khoảng cách từ hub
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={distanceFilter}
                  onChange={(e) => onDistanceFilterChange(Number(e.target.value))}
                  disabled={!selectedHub}
                  style={{
                    width: '100%',
                    cursor: !selectedHub ? 'not-allowed' : 'pointer'
                  }}
                />
                <div style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  color: !selectedHub ? '#999' : '#333',
                  marginTop: '5px'
                }}>
                  ≤ <span style={{
                    fontWeight: 'bold',
                    color: !selectedHub ? '#999' : '#E74C3C',
                    fontSize: '15px'
                  }}>{distanceFilter}</span> km
                </div>
              </div>

              {/* Filter Summary Badge */}
              {selectedHub && (carrierTypeFilter || distanceFilter < 100) && (() => {
                const totalDests = availableDestinations.length;
                const matchingDests = filteredDestinations.length;
                const filteredOutCount = totalDests - matchingDests;

                // Calculate breakdown
                let filteredByCarrier = 0;
                let filteredByDistance = 0;
                let filteredByBoth = 0;

                if (filteredOutCount > 0) {
                  availableDestinations.forEach(dest => {
                    const matchesCarrier = !carrierTypeFilter || dest.carrier_type === carrierTypeFilter;
                    const distance = calculateDistance(
                      selectedHub.lat, selectedHub.long,
                      dest.lat, dest.long
                    );
                    const matchesDistance = !distanceFilter || distance <= distanceFilter;

                    if (!matchesCarrier && !matchesDistance) {
                      filteredByBoth++;
                    } else if (!matchesCarrier) {
                      filteredByCarrier++;
                    } else if (!matchesDistance) {
                      filteredByDistance++;
                    }
                  });
                }

                return (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    backgroundColor: filteredOutCount > 0 ? '#fff3cd' : '#d4edda',
                    border: `1px solid ${filteredOutCount > 0 ? '#ffc107' : '#28a745'}`,
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#333' }}>
                      📊 Filter Summary
                    </div>
                    <div style={{ color: '#666', lineHeight: '1.6' }}>
                      <div>✅ Matching: <strong style={{ color: '#28a745' }}>{matchingDests}</strong></div>
                      {filteredOutCount > 0 && (
                        <>
                          <div>❌ Filtered out: <strong style={{ color: '#dc3545' }}>{filteredOutCount}</strong></div>
                          <div style={{ marginLeft: '20px', fontSize: '11px', marginTop: '4px' }}>
                            {filteredByCarrier > 0 && <div>• {filteredByCarrier} wrong carrier type</div>}
                            {filteredByDistance > 0 && <div>• {filteredByDistance} too far (&gt;{distanceFilter}km)</div>}
                            {filteredByBoth > 0 && <div>• {filteredByBoth} both reasons</div>}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Destination List */}
            <div style={{ marginBottom: '15px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                  📦 Chọn điểm đến ({selectedDestinations.length}/{filteredDestinations.length})
                </label>
                <div>
                  <button
                    onClick={handleSelectAll}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: '1px solid #4264fb',
                      backgroundColor: '#fff',
                      color: '#4264fb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginRight: '5px'
                    }}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    onClick={handleClearAll}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: '1px solid #dc3545',
                      backgroundColor: '#fff',
                      color: '#dc3545',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                backgroundColor: '#fff'
              }}>
                {!selectedHub ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    ⬆️ Vui lòng chọn hub trước
                  </div>
                ) : filteredDestinations.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                    {showAllDestinations
                      ? '🔍 Không tìm thấy destinations. Thử thay đổi filters.'
                      : '📭 Hub này chưa có destinations hoặc không match với filters.'}
                  </div>
                ) : (
                  filteredDestinations.map(dest => {
                    const carrierColor = dest.carrier_type === '1PL' ? '#dc3545' : dest.carrier_type === '2PL' ? '#4264fb' : '#ff8c00';
                    const carrierBg = dest.carrier_type === '1PL' ? '#f8d7da' : dest.carrier_type === '2PL' ? '#e3f2fd' : '#fff3e0';

                    // Calculate distance and get color zone
                    let distance = null;
                    let distanceColor = '#999';
                    let distanceLabel = '';

                    if (selectedHub && dest.lat && dest.long) {
                      distance = calculateDistance(
                        selectedHub.lat, selectedHub.long,
                        dest.lat, dest.long
                      );

                      // Color-coded zones
                      if (distance <= 10) {
                        distanceColor = '#28a745'; // Green - Very close
                        distanceLabel = '🟢';
                      } else if (distance <= 20) {
                        distanceColor = '#ffc107'; // Yellow - Close
                        distanceLabel = '🟡';
                      } else if (distance <= 30) {
                        distanceColor = '#ff8c00'; // Orange - Medium
                        distanceLabel = '🟠';
                      } else if (distance <= 50) {
                        distanceColor = '#dc3545'; // Red - Far
                        distanceLabel = '🔴';
                      } else {
                        distanceColor = '#6c757d'; // Gray - Very far
                        distanceLabel = '⚫';
                      }
                    }

                    return (
                      <label
                        key={dest.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px',
                          borderBottom: '1px solid #f0f0f0',
                          cursor: 'pointer',
                          backgroundColor: selectedDestinations.includes(dest.id) ? '#f0f7ff' : 'transparent',
                          borderLeft: `4px solid ${carrierColor}`
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDestinations.includes(dest.id)}
                          onChange={() => handleToggleDestination(dest.id)}
                          style={{ marginRight: '10px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '4px'
                          }}>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#333' }}>
                              {dest.name}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '3px',
                              backgroundColor: carrierBg,
                              color: carrierColor,
                              fontWeight: 'bold'
                            }}>
                              {dest.carrier_type}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#666' }}>
                            {dest.ward_name}, {dest.district_name}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: '#999',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexWrap: 'wrap'
                          }}>
                            <span>📦 {dest.orders_per_month || 0} orders/tháng</span>
                            {distance !== null && (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                backgroundColor: `${distanceColor}15`,
                                color: distanceColor,
                                fontWeight: 'bold'
                              }}>
                                {distanceLabel} {distance.toFixed(1)}km
                              </span>
                            )}
                            {showAllDestinations && (
                              <span style={{ color: '#666' }}>
                                • Hub: {hubs.find(h => h.id === dest.hub_id)?.name || 'N/A'}
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Calculate Button */}
            <button
              onClick={handleCalculate}
              disabled={isCalculating || selectedDestinations.length === 0}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: (isCalculating || selectedDestinations.length === 0) ? '#ccc' : '#4264fb',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: (isCalculating || selectedDestinations.length === 0) ? 'not-allowed' : 'pointer',
                marginBottom: '15px',
                opacity: (selectedDestinations.length === 0) ? 0.6 : 1
              }}
            >
              {isCalculating
                ? '⏳ Đang tính toán...'
                : selectedDestinations.length === 0
                  ? '⚠️ Chọn destinations trước'
                  : !selectedHub && showAllDestinations
                    ? `⚠️ Chọn hub để tính (${selectedDestinations.length} destinations)`
                    : `🧮 Tính khoảng cách (${selectedDestinations.length})`}
            </button>

            {/* Results */}
            {calculatedRoutes.length > 0 && (
              <div style={{
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#333' }}>
                  📊 Kết quả
                </h3>
                <div style={{ marginBottom: '12px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                    Tổng khoảng cách: <strong>{totalDistance.toFixed(2)} km</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                    Tổng thời gian: <strong>{(totalDuration / 60).toFixed(1)} giờ</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Tổng orders: <strong>{totalOrders} orders/tháng</strong>
                  </div>
                </div>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportCSV}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  📥 Xuất file CSV
                </button>

                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {calculatedRoutes.map((route, idx) => {
                    // Determine carrier type badge color
                    const carrierBadgeStyle = {
                      display: 'inline-block',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      marginLeft: '6px',
                      backgroundColor: route.carrier_type === '1PL' ? '#f8d7da' : route.carrier_type === '2PL' ? '#d4edda' : route.carrier_type === '3PL' ? '#d1ecf1' : '#e2e3e5',
                      color: route.carrier_type === '1PL' ? '#721c24' : route.carrier_type === '2PL' ? '#155724' : route.carrier_type === '3PL' ? '#0c5460' : '#383d41'
                    };

                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '8px',
                          marginBottom: '8px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '3px' }}>
                          {route.destination}
                          <span style={carrierBadgeStyle}>{route.carrier_type}</span>
                        </div>
                        <div style={{ color: '#666' }}>
                          📏 {route.distance.toFixed(2)} km • ⏱️ {route.duration.toFixed(0)} phút • 📦 {route.orders} orders
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Settings Tab */
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid #e9ecef'
              }}>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => onToggleHeatmap(e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>
                  🔥 Hiển thị Heatmap (Kepler.gl style)
                </span>
              </label>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid #e9ecef'
              }}>
                <input
                  type="checkbox"
                  checked={showBoundaries}
                  onChange={(e) => onToggleBoundaries(e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>
                  Hiển thị ranh giới quận
                </span>
              </label>
            </div>
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                backgroundColor: '#fff',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid #e9ecef'
              }}>
                <input
                  type="checkbox"
                  checked={showRoutes}
                  onChange={(e) => onToggleRoutes(e.target.checked)}
                  style={{ marginRight: '10px' }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>
                  Hiển thị tuyến đường
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

