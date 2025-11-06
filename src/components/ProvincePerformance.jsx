import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '../utils/dataProcessor';

function ProvincePerformance({ provincePerformance }) {
  const [showCount, setShowCount] = useState(10);

  if (!provincePerformance || provincePerformance.length === 0) return null;

  // Check if customer data is available
  const hasCustomerData = provincePerformance.length > 0 &&
    provincePerformance[0].totalCustomers !== undefined;

  // Get top N provinces
  const topProvinces = provincePerformance.slice(0, showCount);

  // Prepare data for bar chart
  const chartData = topProvinces.map(prov => ({
    name: prov.province_name.replace('Thành phố ', '').replace('Tỉnh ', ''),
    orders: prov.orders,
    revenue: prov.revenue
  }));

  // Color gradient for bars
  const getColor = (index) => {
    const colors = [
      '#4264fb', '#5b7cff', '#7494ff', '#8dacff', '#a6c4ff',
      '#bfdcff', '#d8f4ff', '#e1f0ff', '#eaf6ff', '#f3fbff'
    ];
    return colors[index] || '#f3fbff';
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '20px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Bar Chart */}
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            color: '#1f2937',
            fontWeight: 'bold'
          }}>
            📍 Top Provinces by Orders
          </h3>
          
          <select
            value={showCount}
            onChange={(e) => setShowCount(Number(e.target.value))}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={provincePerformance.length}>All ({provincePerformance.length})</option>
          </select>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={90} style={{ fontSize: '12px' }} />
            <Tooltip
              formatter={(value, name) => {
                if (name === 'orders') return [formatNumber(value), 'Orders'];
                if (name === 'revenue') return [formatCurrency(value), 'Revenue'];
                return value;
              }}
            />
            <Bar dataKey="orders" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Provinces Table */}
      <div>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          color: '#1f2937',
          fontWeight: 'bold'
        }}>
          🏆 Top 10 Provinces
        </h3>
        
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f3f4f6', zIndex: 1 }}>
              <tr>
                <th style={headerStyle}>#</th>
                <th style={headerStyle}>Province</th>
                <th style={headerStyle}>Orders</th>
                {hasCustomerData && <th style={headerStyle}>Customers</th>}
              </tr>
            </thead>
            <tbody>
              {provincePerformance.slice(0, 10).map((prov, index) => (
                <tr
                  key={prov.province_name}
                  style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <td style={cellStyle}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: index < 3 ? '#fbbf24' : '#e5e7eb',
                      color: index < 3 ? 'white' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }}>
                      {index + 1}
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontSize: '12px', fontWeight: '500' }}>
                      {prov.province_name.replace('Thành phố ', '').replace('Tỉnh ', '')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {formatCurrency(prov.revenue)}
                    </div>
                  </td>
                  <td style={{ ...cellStyle, fontWeight: 'bold', color: '#4264fb' }}>
                    {formatNumber(prov.orders)}
                  </td>
                  {hasCustomerData && (
                    <td style={{ ...cellStyle, fontWeight: 'bold', color: '#8b5cf6' }}>
                      {formatNumber(prov.totalCustomers)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const headerStyle = {
  padding: '10px',
  textAlign: 'left',
  fontWeight: 'bold',
  color: '#374151',
  borderBottom: '2px solid #d1d5db'
};

const cellStyle = {
  padding: '10px',
  color: '#4b5563'
};

export default ProvincePerformance;

