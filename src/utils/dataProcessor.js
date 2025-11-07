/**
 * Process raw Excel data and calculate KPIs
 */
export function processLogisticsData(rawData) {
  if (!rawData || rawData.length === 0) {
    return null;
  }

  // Helper function: Calculate median
  const calculateMedian = (values) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  // Helper function: Remove outliers using IQR method
  const removeOutliers = (values) => {
    if (values.length < 4) return values; // Need at least 4 values for IQR
    
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return values.filter(v => v >= lowerBound && v <= upperBound);
  };

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

  // Calculate FC (Warehouse) performance with customer data
  const fcStats = {};
  const fcCustomerRevenue = {}; // Track revenue per customer per FC
  const fcProvinceCustomerFrequency = {}; // Track repeat customers per province per FC

  validData.forEach(row => {
    const fc = row.fc_code;
    const customerId = row.customer_id;
    const province = row.province_name;

    if (!fcStats[fc]) {
      fcStats[fc] = {
        fc_code: fc,
        orders: 0,
        packages: 0,
        revenue: 0,
        customers: new Set(),
        bins: 0,
        binOrders: 0,
        cartonOrders: 0,
        provinceCustomers: {} // Track customers per province
      };
    }
    fcStats[fc].orders += 1;
    fcStats[fc].packages += row.total_packages || 0;
    fcStats[fc].revenue += row.delivery_amount || 0;

    // Track customers per FC
    if (hasCustomerData && customerId) {
      fcStats[fc].customers.add(customerId);

      // Track customer revenue
      if (!fcCustomerRevenue[fc]) {
        fcCustomerRevenue[fc] = {};
      }
      if (!fcCustomerRevenue[fc][customerId]) {
        fcCustomerRevenue[fc][customerId] = {
          customer_id: customerId,
          total_revenue: 0,
          order_count: 0
        };
      }
      fcCustomerRevenue[fc][customerId].total_revenue += row.delivery_amount || 0;
      fcCustomerRevenue[fc][customerId].order_count += 1;

      // Track province customer frequency
      if (province) {
        if (!fcStats[fc].provinceCustomers[province]) {
          fcStats[fc].provinceCustomers[province] = {};
        }
        if (!fcStats[fc].provinceCustomers[province][customerId]) {
          fcStats[fc].provinceCustomers[province][customerId] = 0;
        }
        fcStats[fc].provinceCustomers[province][customerId] += 1;
      }
    }

    // Track bins per FC
    if (hasBinData) {
      const bins = parseFloat(row.no_bins);
      if (isNaN(bins) || bins === null || bins === undefined) {
        fcStats[fc].cartonOrders++;
      } else {
        fcStats[fc].binOrders++;
        fcStats[fc].bins += bins;
      }
    }
  });

  // Convert to array and calculate percentages
  const fcPerformance = Object.values(fcStats).map(fc => {
    // Get top 3 customers by revenue for this FC
    const topCustomers = fcCustomerRevenue[fc.fc_code]
      ? Object.values(fcCustomerRevenue[fc.fc_code])
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 3)
      : [];

    // Get top provinces by repeat customer frequency
    const provinceFrequency = Object.keys(fc.provinceCustomers).map(province => {
      const customerOrders = fc.provinceCustomers[province];
      const repeatCustomers = Object.values(customerOrders).filter(count => count > 1).length;
      const totalCustomers = Object.keys(customerOrders).length;
      return {
        province_name: province,
        repeat_customers: repeatCustomers,
        total_customers: totalCustomers,
        repeat_rate: totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0
      };
    }).sort((a, b) => b.repeat_customers - a.repeat_customers);

    // Calculate median orders per customer (without outliers)
    const customerOrderCounts = fcCustomerRevenue[fc.fc_code]
      ? Object.values(fcCustomerRevenue[fc.fc_code]).map(c => c.order_count)
      : [];
    const cleanedOrderCounts = removeOutliers(customerOrderCounts);
    const medianOrdersPerCustomer = calculateMedian(cleanedOrderCounts);

    // Calculate median revenue per customer (without outliers)
    const customerRevenueValues = fcCustomerRevenue[fc.fc_code]
      ? Object.values(fcCustomerRevenue[fc.fc_code]).map(c => c.total_revenue)
      : [];
    const cleanedRevenueValues = removeOutliers(customerRevenueValues);
    const medianRevenuePerCustomer = calculateMedian(cleanedRevenueValues);

    return {
      ...fc,
      totalCustomers: fc.customers.size,
      // Orders vs metrics
      avgPackagesPerOrder: fc.orders > 0 ? fc.packages / fc.orders : 0,
      avgBinsPerOrder: fc.orders > 0 ? fc.bins / fc.orders : 0,
      avgRevenuePerOrder: fc.orders > 0 ? fc.revenue / fc.orders : 0,
      // Customer metrics (median - without outliers)
      medianOrdersPerCustomer: medianOrdersPerCustomer,
      medianRevenuePerCustomer: medianRevenuePerCustomer,
      // Legacy metrics (mean - with outliers)
      avgBinPerPackage: fc.packages > 0 ? fc.bins / fc.packages : 0,
      avgOrderValue: fc.revenue / fc.orders,
      avgRevenuePerCustomer: fc.customers.size > 0 ? fc.revenue / fc.customers.size : 0,
      avgOrdersPerCustomer: fc.customers.size > 0 ? fc.orders / fc.customers.size : 0,
      marketShare: (fc.orders / totalOrders) * 100,
      revenueShare: (fc.revenue / totalRevenue) * 100,
      topCustomers: topCustomers,
      topProvincesByRepeatCustomers: provinceFrequency.slice(0, 5),
      customers: undefined, // Remove Set
      provinceCustomers: undefined // Remove detailed data
    };
  }).sort((a, b) => b.orders - a.orders);

  // Calculate province performance with FC mapping
  const provinceStats = {};
  validData.forEach(row => {
    const province = row.province_name;
    const fc = row.fc_code;
    if (!province) return;

    if (!provinceStats[province]) {
      provinceStats[province] = {
        province_name: province,
        fc_code: fc, // Track which FC this province belongs to
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
    avgRevenuePerCustomer: prov.customers.size > 0 ? prov.revenue / prov.customers.size : 0,
    avgOrdersPerCustomer: prov.customers.size > 0 ? prov.orders / prov.customers.size : 0,
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

