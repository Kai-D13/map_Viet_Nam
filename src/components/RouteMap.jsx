import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RouteMap.css';

// Decode polyline (Google's polyline encoding format)
function decodePolyline(encoded) {
  const poly = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push([lng / 1e5, lat / 1e5]);
  }
  return poly;
}

function RouteMap({ routes, hubs, selectedRoute }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [106.0, 16.0], // Center of Vietnam
      zoom: 5.5
    });

    map.current.on('load', () => {
      console.log('Map loaded');
      setMapLoaded(true);
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map with routes
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Remove existing layers and sources
    const layersToRemove = ['route-lines', 'hub-markers', 'hub-labels'];
    layersToRemove.forEach(layer => {
      if (map.current.getLayer(layer)) {
        map.current.removeLayer(layer);
      }
    });

    const sourcesToRemove = ['routes', 'hubs'];
    sourcesToRemove.forEach(source => {
      if (map.current.getSource(source)) {
        map.current.removeSource(source);
      }
    });

    // Prepare route lines with polylines
    const routeFeatures = [];
    
    routes.forEach(route => {
      route.stops.forEach(stop => {
        if (stop.segment_polyline) {
          const coordinates = decodePolyline(stop.segment_polyline);
          
          routeFeatures.push({
            type: 'Feature',
            properties: {
              route_name: route.route_name,
              delivery_type: route.delivery_type,
              distance: stop.segment_distance_km || 0,
              duration: stop.segment_duration_minutes || 0
            },
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          });
        }
      });
    });

    // Prepare hub markers
    const hubFeatures = [];
    const hubsInRoutes = new Set();
    
    routes.forEach(route => {
      hubsInRoutes.add(route.hub_departer);
      route.stops.forEach(stop => {
        hubsInRoutes.add(stop.hub_destination);
      });
    });

    hubsInRoutes.forEach(hubName => {
      const hub = hubs[hubName];
      if (hub && hub.latitude && hub.longitude) {
        hubFeatures.push({
          type: 'Feature',
          properties: {
            name: hubName,
            type: hubName.includes('VSIP') ? 'main_fc' : 
                  hubName.includes('Hub Cần Thơ') ? 'regional' : 'destination'
          },
          geometry: {
            type: 'Point',
            coordinates: [hub.longitude, hub.latitude]
          }
        });
      }
    });

    // Add route lines source and layer
    if (routeFeatures.length > 0) {
      map.current.addSource('routes', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures
        }
      });

      map.current.addLayer({
        id: 'route-lines',
        type: 'line',
        source: 'routes',
        paint: {
          'line-color': [
            'match',
            ['get', 'delivery_type'],
            'D', '#10b981',
            'D+1', '#f59e0b',
            '#ef4444'
          ],
          'line-width': 3,
          'line-opacity': 0.7
        }
      });
    }

    // Add hub markers
    if (hubFeatures.length > 0) {
      map.current.addSource('hubs', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: hubFeatures
        }
      });

      // Add hub circles
      map.current.addLayer({
        id: 'hub-markers',
        type: 'circle',
        source: 'hubs',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'type'],
            'main_fc', 12,
            'regional', 10,
            8
          ],
          'circle-color': [
            'match',
            ['get', 'type'],
            'main_fc', '#3b82f6',
            'regional', '#10b981',
            '#ef4444'
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Add hub labels
      map.current.addLayer({
        id: 'hub-labels',
        type: 'symbol',
        source: 'hubs',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#1f2937',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // Add click handler for hub markers
      map.current.on('click', 'hub-markers', (e) => {
        const feature = e.features[0];
        const hubName = feature.properties.name;
        const hubType = feature.properties.type;
        const coords = feature.geometry.coordinates.slice();

        // Find routes that use this hub
        const routesFromHub = routes.filter(r => r.hub_departer === hubName);
        const routesToHub = routes.flatMap(r =>
          r.stops.filter(s => s.hub_destination === hubName)
        );

        let popupHTML = `
          <div style="padding: 10px; min-width: 250px; max-width: 350px;">
            <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
              ${hubName}
            </h3>
            <div style="font-size: 12px; color: #6b7280;">
              <p style="margin: 5px 0;"><strong>Type:</strong> ${
                hubType === 'main_fc' ? 'Main FC Hub' :
                hubType === 'regional' ? 'Regional Hub' : 'Destination Hub'
              }</p>
        `;

        if (routesFromHub.length > 0) {
          popupHTML += `
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="margin: 5px 0;"><strong>Routes from this hub:</strong> ${routesFromHub.length}</p>
          `;
        }

        if (routesToHub.length > 0) {
          const totalDistance = routesToHub.reduce((sum, stop) => sum + (stop.segment_distance_km || 0), 0);
          const avgDistance = totalDistance / routesToHub.length;

          popupHTML += `
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="margin: 5px 0;"><strong>Incoming routes:</strong> ${routesToHub.length}</p>
              <p style="margin: 5px 0;"><strong>Avg distance to hub:</strong> ${avgDistance.toFixed(2)} km</p>
          `;
        }

        popupHTML += `
            </div>
          </div>
        `;

        new mapboxgl.Popup()
          .setLngLat(coords)
          .setHTML(popupHTML)
          .addTo(map.current);
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'hub-markers', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'hub-markers', () => {
        map.current.getCanvas().style.cursor = '';
      });
    }

    // Fit map to show all routes
    if (hubFeatures.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      hubFeatures.forEach(feature => {
        bounds.extend(feature.geometry.coordinates);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [mapLoaded, routes, hubs]);

  return (
    <div className="route-map-container">
      <div className="route-map-header">
        <h2>🗺️ Route Visualization</h2>
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#10b981' }}></span>
            <span>Same-day (D)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#f59e0b' }}></span>
            <span>Next-day (D+1)</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#ef4444' }}></span>
            <span>Multi-day</span>
          </div>
        </div>
      </div>
      <div ref={mapContainer} className="route-map" />
    </div>
  );
}

export default RouteMap;

