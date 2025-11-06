import { formatCurrency, formatNumber } from '../utils/dataProcessor';

function KPICards({ summary }) {
  if (!summary) return null;

  const cards = [
    {
      icon: '📦',
      label: 'Total Orders',
      value: formatNumber(summary.totalOrders),
      color: '#4264fb',
      bgColor: '#eff6ff'
    },
    {
      icon: '📦',
      label: 'Total Packages',
      value: formatNumber(summary.totalPackages),
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      icon: '💰',
      label: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      icon: '👥',
      label: summary.hasCustomerData ? 'Total Customers' : 'Province Coverage',
      value: summary.hasCustomerData
        ? formatNumber(summary.totalCustomers)
        : `${summary.uniqueProvinces} provinces`,
      subValue: summary.hasCustomerData
        ? `Avg: ${summary.avgOrdersPerCustomer.toFixed(2)} orders/customer`
        : `${summary.uniqueDistricts} districts`,
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    },
    {
      icon: '⚡',
      label: 'Avg Packages/Order',
      value: summary.avgPackagesPerOrder.toFixed(2),
      subValue: summary.hasBinData
        ? `🗃️ Bins: ${formatNumber(summary.binOrders)} | 📦 Carton: ${formatNumber(summary.cartonOrders)}`
        : null,
      extraValue: summary.hasBinData && summary.binOrders > 0
        ? `Avg bins/order: ${summary.avgBinsPerOrder.toFixed(2)}`
        : null,
      color: '#ec4899',
      bgColor: '#fce7f3'
    },
    {
      icon: '💵',
      label: 'Avg Order Value',
      value: formatCurrency(summary.avgOrderValue),
      color: '#06b6d4',
      bgColor: '#cffafe'
    }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      padding: '20px',
      backgroundColor: '#f9fafb'
    }}>
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: `2px solid ${card.bgColor}`,
            transition: 'all 0.3s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div style={{
              fontSize: '32px',
              backgroundColor: card.bgColor,
              borderRadius: '8px',
              width: '50px',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {card.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {card.label}
              </div>
            </div>
          </div>
          
          <div style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: card.color,
            marginBottom: card.subValue || card.extraValue ? '4px' : '0'
          }}>
            {card.value}
          </div>

          {card.subValue && (
            <div style={{
              fontSize: '13px',
              color: '#9ca3af',
              fontWeight: '500',
              marginBottom: card.extraValue ? '4px' : '0'
            }}>
              {card.subValue}
            </div>
          )}

          {card.extraValue && (
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              fontWeight: '500'
            }}>
              {card.extraValue}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default KPICards;

