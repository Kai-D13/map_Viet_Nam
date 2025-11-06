/**
 * Process raw Excel data and calculate KPIs
 */
export function processLogisticsData(rawData) {
  if (!rawData || rawData.length === 0) {
    return null;
  }

  // Filter out rows with missing fc_code
  const validData = rawData.filter(row => row.fc_code && row.fc_code.trim() !== '');

  // Check if new schema (has customer_id and no_bins fields)
  const hasCustomerData = validData.length > 0 && 'customer_id' in validData[0];
  const hasBinData = validData.length > 0 && 'no_bins' in validData[0];

  // Calculate overall KPIs
  const totalOrders = validData.length;
  const totalPackages = validData.reduce((sum, row) => sum + (row.total_packages || 0), 0);
  const totalRevenue = validData.reduce((sum, row) => sum + (row.delivery_amount || 0), 0);
  const avgOrderValue = totalRevenue / totalOrders;
  const avgPackagesPerOrder = totalPackages / totalOrders;

  // Calculate customer metrics (new schema)
  let totalCustomers = 0;
  let avgOrdersPerCustomer = 0;

  if (hasCustomerData) {
    const customerIds = validData
      .map(row => row.customer_id)
      .filter(id => id !== null && id !== undefined && !isNaN(id));

    totalCustomers = new Set(customerIds).size;
    avgOrdersPerCustomer = totalCustomers > 0 ? validData.length / totalCustomers : 0;
  }

  // Calculate bin metrics (new schema)
  let totalBins = 0;
  let cartonOrders = 0;
  let binOrders = 0;

  if (hasBinData) {
    validData.forEach(row => {
      const bins = parseFloat(row.no_bins);
      if (isNaN(bins) || bins === null || bins === undefined) {
        cartonOrders++;
      } else {
        binOrders++;
        totalBins += bins;
      }
    });
  }

  // Get unique provinces and districts
  const uniqueProvinces = new Set(validData.map(row => row.province_name).filter(Boolean));
  const uniqueDistricts = new Set(validData.map(row => row.district_name).filter(Boolean));
  const uniqueWards = new Set(validData.map(row => row.ward_name).filter(Boolean));

  // Calculate FC (Warehouse) performance
  const fcStats = {};
  validData.forEach(row => {
    const fc = row.fc_code;
    if (!fcStats[fc]) {
      fcStats[fc] = {
        fc_code: fc,
        orders: 0,
        packages: 0,
        revenue: 0
      };
    }
    fcStats[fc].orders += 1;
    fcStats[fc].packages += row.total_packages || 0;
    fcStats[fc].revenue += row.delivery_amount || 0;
  });

  // Convert to array and calculate percentages
  const fcPerformance = Object.values(fcStats).map(fc => ({
    ...fc,
    avgOrderValue: fc.revenue / fc.orders,
    marketShare: (fc.orders / totalOrders) * 100,
    revenueShare: (fc.revenue / totalRevenue) * 100
  })).sort((a, b) => b.orders - a.orders);

  // Calculate province performance
  const provinceStats = {};
  validData.forEach(row => {
    const province = row.province_name;
    if (!province) return;

    if (!provinceStats[province]) {
      provinceStats[province] = {
        province_name: province,
        orders: 0,
        packages: 0,
        revenue: 0,
        customers: new Set() // Track unique customers per province
      };
    }
    provinceStats[province].orders += 1;
    provinceStats[province].packages += row.total_packages || 0;
    provinceStats[province].revenue += row.delivery_amount || 0;

    // Add customer ID if available
    if (hasCustomerData && row.customer_id) {
      provinceStats[province].customers.add(row.customer_id);
    }
  });

  // Convert to array and sort by orders
  const provincePerformance = Object.values(provinceStats).map(prov => ({
    ...prov,
    avgOrderValue: prov.revenue / prov.orders,
    totalCustomers: prov.customers.size, // Convert Set to count
    customers: undefined // Remove Set from output
  })).sort((a, b) => b.orders - a.orders);

  // Calculate district performance
  const districtStats = {};
  validData.forEach(row => {
    const district = row.district_name;
    const province = row.province_name;
    if (!district || !province) return;
    
    const key = `${province}|${district}`;
    if (!districtStats[key]) {
      districtStats[key] = {
        province_name: province,
        district_name: district,
        orders: 0,
        packages: 0,
        revenue: 0
      };
    }
    districtStats[key].orders += 1;
    districtStats[key].packages += row.total_packages || 0;
    districtStats[key].revenue += row.delivery_amount || 0;
  });

  const districtPerformance = Object.values(districtStats).map(dist => ({
    ...dist,
    avgOrderValue: dist.revenue / dist.orders
  })).sort((a, b) => b.orders - a.orders);

  // Calculate order value distribution
  const valueRanges = {
    'under_2M': 0,
    '2M_to_3M': 0,
    '3M_to_5M': 0,
    '5M_to_10M': 0,
    'over_10M': 0
  };

  validData.forEach(row => {
    const value = row.delivery_amount || 0;
    if (value < 2000000) valueRanges.under_2M++;
    else if (value < 3000000) valueRanges['2M_to_3M']++;
    else if (value < 5000000) valueRanges['3M_to_5M']++;
    else if (value < 10000000) valueRanges['5M_to_10M']++;
    else valueRanges.over_10M++;
  });

  return {
    summary: {
      totalOrders,
      totalPackages,
      totalRevenue,
      avgOrderValue,
      avgPackagesPerOrder,
      uniqueProvinces: uniqueProvinces.size,
      uniqueDistricts: uniqueDistricts.size,
      uniqueWards: uniqueWards.size,
      // New metrics
      totalCustomers,
      avgOrdersPerCustomer,
      totalBins,
      cartonOrders,
      binOrders,
      avgBinsPerOrder: binOrders > 0 ? totalBins / binOrders : 0,
      hasCustomerData,
      hasBinData
    },
    fcPerformance,
    provincePerformance,
    districtPerformance,
    valueDistribution: valueRanges,
    rawData: validData
  };
}

/**
 * Detect month/year from data timestamps
 */
export function detectDatasetMonth(rawData) {
  if (!rawData || rawData.length === 0) return 'Unknown';

  // Try to find timestamp field
  const firstRow = rawData[0];
  let timestamp = null;

  if (firstRow.order_created_ts) {
    timestamp = new Date(firstRow.order_created_ts);
  } else if (firstRow.carrier_delivered_ts) {
    timestamp = new Date(firstRow.carrier_delivered_ts);
  }

  if (timestamp && !isNaN(timestamp.getTime())) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[timestamp.getMonth()]} ${timestamp.getFullYear()}`;
  }

  return 'Unknown';
}

/**
 * Format number as Vietnamese currency
 */
export function formatCurrency(value) {
  if (!value && value !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value) {
  if (!value && value !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  if (!value && value !== 0) return 'N/A';
  return `${value.toFixed(decimals)}%`;
}

