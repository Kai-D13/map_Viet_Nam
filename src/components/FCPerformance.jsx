import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '../utils/dataProcessor';

function FCPerformance({ fcPerformance }) {
  if (!fcPerformance || fcPerformance.length === 0) return null;

  // Colors for different FCs
  const COLORS = {
    'BD': '#4264fb',
    'BN': '#10b981',
    'HN': '#f59e0b',
    'DN': '#8b5cf6',
    'TA': '#ec4899'
  };

  // Prepare data for pie chart
  const pieData = fcPerformance.map(fc => ({
    name: fc.fc_code,
    value: fc.orders,
    percentage: fc.marketShare
  }));

  // Custom label for pie chart
  const renderLabel = (entry) => {
    return `${entry.name} (${entry.percentage.toFixed(1)}%)`;
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 2fr',
      gap: '20px',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Pie Chart */}
      <div>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          color: '#1f2937',
          fontWeight: 'bold'
        }}>
          🏭 Warehouse Distribution
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#6b7280'} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${formatNumber(value)} orders (${props.payload.percentage.toFixed(1)}%)`,
                props.payload.name
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Table */}
      <div>
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '18px',
          color: '#1f2937',
          fontWeight: 'bold'
        }}>
          📊 Warehouse Performance
        </h3>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={headerStyle}>FC</th>
                <th style={headerStyle}>Orders</th>
                <th style={headerStyle}>Packages</th>
                <th style={headerStyle}>Revenue</th>
                <th style={headerStyle}>Avg Order</th>
                <th style={headerStyle}>Market Share</th>
              </tr>
            </thead>
            <tbody>
              {fcPerformance.map((fc, index) => (
                <tr
                  key={fc.fc_code}
                  style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                >
                  <td style={cellStyle}>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      backgroundColor: COLORS[fc.fc_code] || '#6b7280',
                      color: 'white',
                      borderRadius: '6px',
                      fontWeight: 'bold'
                    }}>
                      {fc.fc_code}
                    </div>
                  </td>
                  <td style={cellStyle}>{formatNumber(fc.orders)}</td>
                  <td style={cellStyle}>{formatNumber(fc.packages)}</td>
                  <td style={cellStyle}>{formatCurrency(fc.revenue)}</td>
                  <td style={cellStyle}>{formatCurrency(fc.avgOrderValue)}</td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        flex: 1,
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${fc.marketShare}%`,
                          height: '100%',
                          backgroundColor: COLORS[fc.fc_code] || '#6b7280',
                          transition: 'width 0.3s'
                        }}></div>
                      </div>
                      <span style={{ fontWeight: 'bold', color: COLORS[fc.fc_code] || '#6b7280' }}>
                        {formatPercent(fc.marketShare)}
                      </span>
                    </div>
                  </td>
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
  padding: '12px',
  textAlign: 'left',
  fontWeight: 'bold',
  color: '#374151',
  borderBottom: '2px solid #d1d5db'
};

const cellStyle = {
  padding: '12px',
  color: '#4b5563'
};

export default FCPerformance;

