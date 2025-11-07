import { useState } from 'react';
import FileUpload from './FileUpload';
import KPICards from './KPICards';
import FCPerformance from './FCPerformance';
import ProvincePerformance from './ProvincePerformance';
import { processLogisticsData } from '../utils/dataProcessor';

function FulfillmentAnalytics() {
  const [processedData, setProcessedData] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [provinceFilter, setProvinceFilter] = useState(''); // Add province filter state

  const handleDataLoaded = (rawData, uploadedFileName) => {
    console.log('Processing data...', rawData.length, 'rows');

    const processed = processLogisticsData(rawData);
    console.log('Processed data:', processed);

    setProcessedData(processed);
    setFileName(uploadedFileName);
  };

  const handleReset = () => {
    setProcessedData(null);
    setFileName(null);
    setProvinceFilter('');
  };

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      backgroundColor: '#f3f4f6'
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px 30px',
        borderBottom: '2px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              color: '#1f2937',
              fontWeight: 'bold'
            }}>
              📦 Fulfillment Analytics
            </h1>
            <p style={{
              margin: '5px 0 0 0',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {fileName ? `Analyzing: ${fileName}` : 'Upload Excel file to analyze logistics data'}
            </p>
          </div>

          {processedData && (
            <button
              onClick={handleReset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              🔄 Upload New File
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '30px' }}>
        {!processedData ? (
          // File Upload Screen
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'start',
            minHeight: 'calc(100vh - 200px)'
          }}>
            <FileUpload onDataLoaded={handleDataLoaded} />
          </div>
        ) : (
          // Dashboard Screen
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Province Filter */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  🔍 Filter by Province:
                </label>
                <select
                  value={provinceFilter}
                  onChange={(e) => setProvinceFilter(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    color: '#1f2937',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    minWidth: '250px',
                    outline: 'none',
                    transition: 'border-color 0.3s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                  <option value="">All Provinces</option>
                  {processedData.provincePerformance.map(prov => (
                    <option key={prov.province_name} value={prov.province_name}>
                      {prov.province_name} ({prov.fc_code})
                    </option>
                  ))}
                </select>
                {provinceFilter && (
                  <button
                    onClick={() => setProvinceFilter('')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
                  >
                    ✕ Clear Filter
                  </button>
                )}
              </div>
              {provinceFilter && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#eff6ff',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#1e40af'
                }}>
                  📍 Showing data for: <strong>{provinceFilter}</strong>
                </div>
              )}
            </div>

            {/* KPI Cards */}
            <KPICards 
              summary={processedData.summary} 
              fcPerformance={processedData.fcPerformance}
            />

            {/* FC Performance */}
            <FCPerformance fcPerformance={processedData.fcPerformance} />

            {/* Province Performance */}
            <ProvincePerformance 
              provincePerformance={processedData.provincePerformance}
              provinceFilter={provinceFilter}
            />

            {/* Additional Info */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{
                margin: '0 0 15px 0',
                fontSize: '18px',
                color: '#1f2937',
                fontWeight: 'bold'
              }}>
                📊 Data Summary
              </h3>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                <InfoCard
                  label="Total Warehouses"
                  value={processedData.fcPerformance.length}
                  icon="🏭"
                />
                <InfoCard
                  label="Total Provinces"
                  value={processedData.summary.uniqueProvinces}
                  icon="📍"
                />
                <InfoCard
                  label="Total Districts"
                  value={processedData.summary.uniqueDistricts}
                  icon="🗺️"
                />
                <InfoCard
                  label="Total Wards"
                  value={processedData.summary.uniqueWards}
                  icon="📌"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value, icon }) {
  return (
    <div style={{
      padding: '15px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '8px'
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        marginBottom: '4px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#1f2937'
      }}>
        {value}
      </div>
    </div>
  );
}

export default FulfillmentAnalytics;

