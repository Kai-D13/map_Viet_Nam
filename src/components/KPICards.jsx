import { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/dataProcessor';

function KPICards({ summary, fcPerformance }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'packages', 'revenue', 'customers'

  if (!summary || !fcPerformance) return null;

  // Sort FC by code for consistent display
  const sortedFC = [...fcPerformance].sort((a, b) => a.fc_code.localeCompare(b.fc_code));

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        <TabButton
          active={activeTab === 'orders'}
          onClick={() => setActiveTab('orders')}
          icon="📦"
          label="Total Orders"
          value={formatNumber(summary.totalOrders)}
        />
        <TabButton
          active={activeTab === 'packages'}
          onClick={() => setActiveTab('packages')}
          icon="📦"
          label="Total Packages"
          value={formatNumber(summary.totalPackages)}
        />
        <TabButton
          active={activeTab === 'revenue'}
          onClick={() => setActiveTab('revenue')}
          icon="💰"
          label="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
        />
        <TabButton
          active={activeTab === 'customers'}
          onClick={() => setActiveTab('customers')}
          icon="👥"
          label="Total Customers"
          value={formatNumber(summary.totalCustomers)}
        />
      </div>

      {/* Tab Content */}
      <div style={{ padding: '30px' }}>
        {activeTab === 'orders' && <OrdersTab fcPerformance={sortedFC} />}
        {activeTab === 'packages' && <PackagesTab fcPerformance={sortedFC} />}
        {activeTab === 'revenue' && <RevenueTab fcPerformance={sortedFC} />}
        {activeTab === 'customers' && <CustomersTab fcPerformance={sortedFC} />}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, icon, label, value }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '20px',
        border: 'none',
        backgroundColor: active ? 'white' : 'transparent',
        borderBottom: active ? '3px solid #3b82f6' : '3px solid transparent',
        cursor: 'pointer',
        transition: 'all 0.3s',
        textAlign: 'center'
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = '#f3f4f6';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: '6px'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '18px',
        fontWeight: 'bold',
        color: active ? '#3b82f6' : '#1f2937'
      }}>
        {value}
      </div>
    </button>
  );
}

// Tab 1: Total Orders
function OrdersTab({ fcPerformance }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '20px'
    }}>
      {fcPerformance.map(fc => (
        <div key={fc.fc_code} style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          {/* FC Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #e5e7eb'
          }}>
            <div style={{
              padding: '10px 20px',
              backgroundColor: fc.fc_code === 'BD' ? '#3b82f6' : '#f59e0b',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              FC {fc.fc_code}
            </div>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {formatNumber(fc.orders)}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              fontWeight: '600'
            }}>
              orders
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Orders vs Packages */}
            <MetricCard
              icon="📦"
              label="Orders vs Packages"
              value={`1 order = ${fc.avgPackagesPerOrder.toFixed(2)} packages`}
              color="#10b981"
            />

            {/* Orders vs BIN */}
            <MetricCard
              icon="🗃️"
              label="Orders vs BIN"
              value={fc.avgBinsPerOrder > 0 
                ? `1 order = ${fc.avgBinsPerOrder.toFixed(2)} bins`
                : 'No bin data'}
              color="#8b5cf6"
            />

            {/* Orders vs Revenue */}
            <MetricCard
              icon="💰"
              label="Orders vs Revenue"
              value={`1 order = ${formatCurrency(fc.avgRevenuePerOrder)}`}
              color="#f59e0b"
            />

            {/* Orders vs Customer (Median) */}
            <MetricCard
              icon="👤"
              label="Orders vs Customer"
              value={`1 customer = ${fc.medianOrdersPerCustomer.toFixed(2)} orders`}
              sublabel="(median, outliers removed)"
              color="#3b82f6"
            />

            {/* Customer vs Revenue (Median) */}
            <MetricCard
              icon="💵"
              label="Customer vs Revenue"
              value={`1 customer = ${formatCurrency(fc.medianRevenuePerCustomer)}`}
              sublabel="(median, outliers removed)"
              color="#ec4899"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Metric Card Component (for Tab 1)
function MetricCard({ icon, label, value, sublabel, color }) {
  return (
    <div style={{
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      transition: 'all 0.3s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          fontSize: '24px',
          backgroundColor: `${color}15`,
          borderRadius: '6px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '12px',
            color: '#6b7280',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px'
          }}>
            {label}
          </div>
          <div style={{
            fontSize: '15px',
            fontWeight: 'bold',
            color: color
          }}>
            {value}
          </div>
          {sublabel && (
            <div style={{
              fontSize: '10px',
              color: '#9ca3af',
              fontStyle: 'italic',
              marginTop: '2px'
            }}>
              {sublabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tab 2: Total Packages
function PackagesTab({ fcPerformance }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px'
    }}>
      {fcPerformance.map(fc => (
        <div key={fc.fc_code} style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{
              padding: '8px 16px',
              backgroundColor: fc.fc_code === 'BD' ? '#3b82f6' : '#f59e0b',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              FC {fc.fc_code}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {formatNumber(fc.packages)} packages
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <MetricRow
              label="🗃️ Bins vs Packages"
              value={fc.avgBinPerPackage > 0 
                ? `1 bin = ${fc.avgBinPerPackage.toFixed(2)} packages` 
                : 'No bin data'}
              highlight={true}
            />
            {fc.binOrders > 0 && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#6b7280' }}>
                • Bin orders: {formatNumber(fc.binOrders)}<br />
                • Carton orders: {formatNumber(fc.cartonOrders)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tab 3: Total Revenue
function RevenueTab({ fcPerformance }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
      gap: '20px'
    }}>
      {fcPerformance.map(fc => (
        <div key={fc.fc_code} style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{
              padding: '8px 16px',
              backgroundColor: fc.fc_code === 'BD' ? '#3b82f6' : '#f59e0b',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              FC {fc.fc_code}
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              {formatCurrency(fc.revenue)}
            </div>
          </div>

          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <MetricRow
              label="💵 Avg Revenue/Order"
              value={formatCurrency(fc.avgOrderValue)}
              highlight={true}
            />
            <MetricRow
              label="👤 Avg Revenue/Customer"
              value={formatCurrency(fc.avgRevenuePerCustomer)}
              highlight={true}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Tab 4: Total Customers
function CustomersTab({ fcPerformance }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '20px'
    }}>
      {fcPerformance.map(fc => (
        <div key={fc.fc_code} style={{
          padding: '20px',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px solid #e5e7eb'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '15px'
          }}>
            <div style={{
              padding: '8px 16px',
              backgroundColor: fc.fc_code === 'BD' ? '#3b82f6' : '#f59e0b',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '16px'
            }}>
              FC {fc.fc_code}
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '# 1f2937'
            }}>
              {formatNumber(fc.totalCustomers)} customers
            </div>
          </div>

          {/* Top Provinces by Repeat Customers */}
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
            marginBottom: '15px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              📍 Top Provinces (Repeat Customers)
            </div>
            {fc.topProvincesByRepeatCustomers && fc.topProvincesByRepeatCustomers.slice(0, 3).map((prov, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: idx < 2 ? '1px solid #f3f4f6' : 'none'
              }}>
                <span style={{ fontSize: '12px', color: '#4b5563', fontWeight: '500' }}>
                  {idx + 1}. {prov.province_name.replace('Thành phố ', '').replace('Tỉnh ', '')}
                </span>
                <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 'bold' }}>
                  {prov.repeat_customers} repeat
                </span>
              </div>
            ))}
          </div>

          {/* Top 3 Customers by Revenue */}
          <div style={{
            padding: '15px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#6b7280',
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🏆 Top 3 Customers (Revenue)
            </div>
            {fc.topCustomers && fc.topCustomers.map((customer, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                backgroundColor: idx === 0 ? '#fef3c7' : idx === 1 ? '#e0e7ff' : '#fce7f3',
                borderRadius: '6px',
                marginBottom: idx < 2 ? '8px' : '0'
              }}>
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#1f2937'
                  }}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} Customer #{customer.customer_id}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                    {customer.order_count} orders
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#f59e0b'
                }}>
                  {formatCurrency(customer.total_revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Metric Row Component
function MetricRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: highlight ? '10px' : '5px 0'
    }}>
      <span style={{
        fontSize: '13px',
        color: '#6b7280',
        fontWeight: '500'
      }}>
        {label}
      </span>
      <span style={{
        fontSize: highlight ? '15px' : '13px',
        color: '#1f2937',
        fontWeight: 'bold'
      }}>
        {value}
      </span>
    </div>
  );
}

export default KPICards;

