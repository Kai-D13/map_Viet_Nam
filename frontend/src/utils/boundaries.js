// Utility to fetch commune boundaries from OpenStreetMap
// Using Nominatim API for geocoding and Overpass API for boundaries

/**
 * Fetch boundary polygon for a commune from OpenStreetMap
 * @param {string} communeName - Name of the commune (e.g., "Banteay Neang")
 * @param {string} district - District name (e.g., "Mongkol Borei")
 * @param {string} province - Province name (e.g., "Banteay Meanchey")
 * @returns {Promise<Object|null>} GeoJSON polygon or null
 */
export async function fetchCommuneBoundary(communeName, district, province) {
  try {
    // First, search for the commune using Nominatim
    const searchQuery = `${communeName}, ${district}, ${province}, Cambodia`;
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&polygon_geojson=1&limit=1`;
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'LogisticsMapApp/1.0'
      }
    });
    
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].geojson) {
      return {
        type: 'Feature',
        properties: {
          name: communeName,
          district: district,
          province: province
        },
        geometry: data[0].geojson
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching boundary for ${communeName}:`, error);
    return null;
  }
}

/**
 * Parse address to extract commune, district, province
 * @param {string} address - Full address (e.g., "Banteay Neang, Mongkol Borei, Banteay Meanchey")
 * @returns {Object} Parsed address components
 */
export function parseAddress(address) {
  const parts = address.split(',').map(p => p.trim());
  return {
    commune: parts[0] || '',
    district: parts[1] || '',
    province: parts[2] || ''
  };
}

/**
 * Generate a color based on commune name (for consistent coloring)
 * @param {string} name - Commune name
 * @returns {string} Hex color
 */
export function getColorForCommune(name) {
  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate pastel colors for better visibility
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
}

/**
 * Fetch all boundaries for markers
 * @param {Array} markers - Array of marker objects
 * @returns {Promise<Array>} Array of GeoJSON features
 */
export async function fetchAllBoundaries(markers) {
  const boundaries = [];
  const processedCommunes = new Set();
  
  for (const marker of markers) {
    const { commune, district, province } = parseAddress(marker.address_destination);
    
    // Skip if already processed
    if (processedCommunes.has(commune)) {
      continue;
    }
    
    processedCommunes.add(commune);
    
    // Add delay to respect API rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const boundary = await fetchCommuneBoundary(commune, district, province);
    
    if (boundary) {
      boundaries.push({
        ...boundary,
        properties: {
          ...boundary.properties,
          color: getColorForCommune(commune)
        }
      });
    }
  }
  
  return boundaries;
}

/**
 * Create a simplified boundary (circle) around a point
 * This is a fallback when OSM data is not available
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} GeoJSON polygon
 */
export function createCircleBoundary(lng, lat, radiusKm = 5) {
  const points = 64;
  const coords = [];
  const distanceX = radiusKm / (111.320 * Math.cos(lat * Math.PI / 180));
  const distanceY = radiusKm / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = lng + (distanceX * Math.cos(theta));
    const y = lat + (distanceY * Math.sin(theta));
    coords.push([x, y]);
  }
  
  coords.push(coords[0]); // Close the polygon

  return {
    type: 'Polygon',
    coordinates: [coords]
  };
}

/**
 * Calculate area of a polygon in square kilometers
 * @param {Object} geometry - GeoJSON geometry
 * @returns {number} Area in km²
 */
export function calculateArea(geometry) {
  if (!geometry || geometry.type !== 'Polygon') {
    return 0;
  }

  // Simple approximation using shoelace formula
  const coords = geometry.coordinates[0];
  let area = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  
  area = Math.abs(area) / 2;
  
  // Convert to km² (rough approximation)
  // 1 degree ≈ 111 km at equator
  const kmPerDegree = 111;
  return area * kmPerDegree * kmPerDegree;
}

