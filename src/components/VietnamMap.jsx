import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const VietnamMap = ({
  destinations,
  districts,
  showBoundaries,
  showHeatmap,
  showClusters,
  showMarkers,
  provinceFilter,
  minOrders,
  maxOrders
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Dark theme like Kepler.gl
      center: [106.0, 16.0], // Center of Vietnam
      zoom: 5.5,
      minZoom: 5,
      maxZoom: 18
    });

    map.current.on('load', () => {
      console.log('Map loaded');
      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Filter destinations
  const getFilteredDestinations = () => {
    let filtered = destinations.filter(d => d.validation_status === 'valid');

    if (provinceFilter) {
      filtered = filtered.filter(d => {
        const parts = d.address.split(', ');
        const province = parts[parts.length - 2]; // Second to last
        return province.includes(provinceFilter);
      });
    }

    if (minOrders !== null) {
      filtered = filtered.filter(d => d.orders_per_month >= minOrders);
    }

    if (maxOrders !== null) {
      filtered = filtered.filter(d => d.orders_per_month <= maxOrders);
    }

    return filtered;
  };

  // Group destinations by district and calculate stats
  const getDistrictStats = (filtered) => {
    const districtMap = {};

    filtered.forEach(d => {
      const parts = d.address.split(', ');
      const district = parts.length >= 3 ? parts[parts.length - 3] : 'Unknown'; // Third from last
      const province = parts.length >= 2 ? parts[parts.length - 2] : 'Unknown';

      const key = `${district}, ${province}`;

      if (!districtMap[key]) {
        districtMap[key] = {
          district,
          province,
          destinations: [],
          totalOrders: 0,
          count: 0
        };
      }

      districtMap[key].destinations.push(d);
      districtMap[key].totalOrders += d.orders_per_month;
      districtMap[key].count++;
    });

    return districtMap;
  };

  // Add/update heatmap layer
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const filtered = getFilteredDestinations();

    // Create GeoJSON for heatmap
    const heatmapData = {
      type: 'FeatureCollection',
      features: filtered.map(d => ({
        type: 'Feature',
        properties: {
          orders: d.orders_per_month,
          address: d.address
        },
        geometry: {
          type: 'Point',
          coordinates: [d.lng, d.lat]
        }
      }))
    };

    // Remove existing heatmap
    if (map.current.getLayer('heatmap-layer')) {
      map.current.removeLayer('heatmap-layer');
    }
    if (map.current.getSource('destinations-heat')) {
      map.current.removeSource('destinations-heat');
    }

    if (showHeatmap && filtered.length > 0) {
      // Add heatmap source
      map.current.addSource('destinations-heat', {
        type: 'geojson',
        data: heatmapData
      });

      // Add heatmap layer (ORIGINAL VERSION - Better visualization)
      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'destinations-heat',
        paint: {
          // Increase weight based on orders
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'orders'],
            0, 0,
            1135, 1 // Max orders from data
          ],
          // Increase intensity as zoom level increases
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 1,
            10, 2.5,
            15, 3
          ],
          // Color ramp: Kepler.gl style - Red → Orange → Yellow glow
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',           // Transparent
            0.1, 'rgba(139,0,0,0.3)',     // Dark Red (faint)
            0.2, 'rgba(178,34,34,0.4)',   // Firebrick
            0.3, 'rgba(220,20,60,0.5)',   // Crimson
            0.4, 'rgba(255,69,0,0.6)',    // Red-Orange
            0.5, 'rgba(255,99,71,0.7)',   // Tomato
            0.6, 'rgba(255,140,0,0.8)',   // Dark Orange
            0.7, 'rgba(255,165,0,0.85)',  // Orange
            0.8, 'rgba(255,215,0,0.9)',   // Gold
            0.9, 'rgba(255,255,0,0.95)',  // Yellow
            1, 'rgba(255,255,224,1)'      // Light Yellow (brightest glow)
          ],
          // Adjust radius by zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 25,
            10, 40,
            15, 60
          ],
          // Transition from heatmap to circle layer by zoom level
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            13, 0.7,
            15, 0.3
          ]
        }
      });
    }
  }, [mapLoaded, destinations, showHeatmap, provinceFilter, minOrders, maxOrders]);

  // Add/update cluster layer
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const filtered = getFilteredDestinations();

    // Remove existing cluster layers
    if (map.current.getLayer('clusters')) {
      map.current.removeLayer('clusters');
    }
    if (map.current.getLayer('cluster-count')) {
      map.current.removeLayer('cluster-count');
    }
    if (map.current.getLayer('cluster-orders')) {
      map.current.removeLayer('cluster-orders');
    }
    if (map.current.getLayer('unclustered-point')) {
      map.current.removeLayer('unclustered-point');
    }
    if (map.current.getSource('destinations-cluster')) {
      map.current.removeSource('destinations-cluster');
    }

    if (showClusters && filtered.length > 0) {
      const clusterData = {
        type: 'FeatureCollection',
        features: filtered.map(d => {
          const parts = d.address.split(', ');
          const district = parts.length >= 3 ? parts[parts.length - 3] : '';
          const province = parts.length >= 2 ? parts[parts.length - 2] : '';

          return {
            type: 'Feature',
            properties: {
              orders: d.orders_per_month,
              address: d.address,
              district: district,
              province: province
            },
            geometry: {
              type: 'Point',
              coordinates: [d.lng, d.lat]
            }
          };
        })
      };

      map.current.addSource('destinations-cluster', {
        type: 'geojson',
        data: clusterData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
        clusterProperties: {
          // Sum of orders in cluster
          totalOrders: ['+', ['get', 'orders']]
        }
      });

      // Cluster circles (blue theme - same as Thailand)
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'destinations-cluster',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#4169E1', 100,  // Royal Blue
            '#1E90FF', 500,  // Dodger Blue
            '#00BFFF'        // Deep Sky Blue
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, 100,
            30, 500,
            40
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Cluster count - show destinations count
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'destinations-cluster',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-offset': [0, 0]
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Cluster orders - show total orders below count
      map.current.addLayer({
        id: 'cluster-orders',
        type: 'symbol',
        source: 'destinations-cluster',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': [
            'concat',
            ['to-string', ['get', 'totalOrders']],
            ' orders'
          ],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 10,
          'text-offset': [0, 1.5]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.5)',
          'text-halo-width': 1
        }
      });

      // Unclustered points (blue theme)
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'destinations-cluster',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#4169E1', // Royal Blue (same as Thailand)
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      });

      // Click on cluster to zoom
      map.current.on('click', 'clusters', (e) => {
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        const clusterId = features[0].properties.cluster_id;
        map.current.getSource('destinations-cluster').getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            map.current.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          }
        );
      });

      // Show popup on unclustered point click
      map.current.on('click', 'unclustered-point', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { address, orders } = e.features[0].properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="padding: 8px;">
              <strong>${address}</strong><br/>
              <span style="color: #4264fb; font-weight: bold;">${orders} orders/month</span>
            </div>
          `)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'clusters', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'clusters', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }
  }, [mapLoaded, destinations, showClusters, provinceFilter, minOrders, maxOrders]);

  // Add/update individual markers layer
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    const filtered = getFilteredDestinations();

    // Remove existing markers layers
    if (map.current.getLayer('individual-markers')) {
      map.current.removeLayer('individual-markers');
    }
    if (map.current.getLayer('individual-markers-labels')) {
      map.current.removeLayer('individual-markers-labels');
    }
    if (map.current.getSource('individual-markers')) {
      map.current.removeSource('individual-markers');
    }

    if (showMarkers && filtered.length > 0) {
      const markersData = {
        type: 'FeatureCollection',
        features: filtered.map(d => {
          const parts = d.address.split(', ');
          const district = parts.length >= 3 ? parts[parts.length - 3] : '';

          return {
            type: 'Feature',
            properties: {
              orders: d.orders_per_month,
              address: d.address,
              district: district
            },
            geometry: {
              type: 'Point',
              coordinates: [d.lng, d.lat]
            }
          };
        })
      };

      map.current.addSource('individual-markers', {
        type: 'geojson',
        data: markersData
      });

      // Markers circles
      map.current.addLayer({
        id: 'individual-markers',
        type: 'circle',
        source: 'individual-markers',
        paint: {
          'circle-color': [
            'interpolate',
            ['linear'],
            ['get', 'orders'],
            0, '#4169E1',      // Low orders - Royal Blue
            300, '#1E90FF',    // Medium orders - Dodger Blue
            600, '#00BFFF'     // High orders - Deep Sky Blue
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2,
            10, 4,
            15, 8
          ],
          'circle-opacity': 0.7,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
        }
      });

      // Show popup on marker click
      map.current.on('click', 'individual-markers', (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { address, orders, district } = e.features[0].properties;

        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div style="padding: 10px; min-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 5px; color: #333;">${district}</div>
              <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${address}</div>
              <div style="color: #4169E1; font-weight: bold; font-size: 14px;">${orders} orders/month</div>
            </div>
          `)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'individual-markers', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'individual-markers', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }
  }, [mapLoaded, destinations, showMarkers, provinceFilter, minOrders, maxOrders]);

  // Add/update district boundaries
  useEffect(() => {
    if (!mapLoaded || !map.current || !districts) return;

    // Remove existing boundary layers
    if (map.current.getLayer('district-fills')) {
      map.current.removeLayer('district-fills');
    }
    if (map.current.getLayer('district-borders')) {
      map.current.removeLayer('district-borders');
    }
    if (map.current.getSource('districts')) {
      map.current.removeSource('districts');
    }

    if (showBoundaries && districts.features && districts.features.length > 0) {
      map.current.addSource('districts', {
        type: 'geojson',
        data: districts
      });

      // Fill layer
      map.current.addLayer({
        id: 'district-fills',
        type: 'fill',
        source: 'districts',
        paint: {
          'fill-color': '#627BC1',
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.15,
            0.05
          ]
        }
      });

      // Border layer
      map.current.addLayer({
        id: 'district-borders',
        type: 'line',
        source: 'districts',
        paint: {
          'line-color': '#627BC1',
          'line-width': 1,
          'line-opacity': 0.5
        }
      });

      // Hover effect
      let hoveredDistrictId = null;

      map.current.on('mousemove', 'district-fills', (e) => {
        if (e.features.length > 0) {
          if (hoveredDistrictId !== null) {
            map.current.setFeatureState(
              { source: 'districts', id: hoveredDistrictId },
              { hover: false }
            );
          }
          hoveredDistrictId = e.features[0].id;
          map.current.setFeatureState(
            { source: 'districts', id: hoveredDistrictId },
            { hover: true }
          );
        }
      });

      map.current.on('mouseleave', 'district-fills', () => {
        if (hoveredDistrictId !== null) {
          map.current.setFeatureState(
            { source: 'districts', id: hoveredDistrictId },
            { hover: false }
          );
        }
        hoveredDistrictId = null;
      });
    }
  }, [mapLoaded, districts, showBoundaries]);

  // Auto-zoom to province when filtered
  useEffect(() => {
    if (!mapLoaded || !map.current || !provinceFilter) return;

    const filtered = getFilteredDestinations();
    if (filtered.length === 0) return;

    // Calculate bounds of filtered destinations
    const bounds = new mapboxgl.LngLatBounds();
    filtered.forEach(d => {
      bounds.extend([d.lng, d.lat]);
    });

    // Fit map to bounds with padding
    map.current.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 450, right: 100 }, // Account for sidebar
      maxZoom: 10,
      duration: 1000
    });
  }, [provinceFilter, mapLoaded]);

  // Reset zoom when province filter is cleared
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (!provinceFilter) {
      // Reset to Vietnam view
      map.current.easeTo({
        center: [106.0, 16.0],
        zoom: 5.5,
        duration: 1000
      });
    }
  }, [provinceFilter, mapLoaded]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
  );
};

export default VietnamMap;

