import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RouteDetail.css';

// Decode polyline
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

function RouteDetail({ route, hubs, onBack }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [106.0, 16.0],
      zoom: 6
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map with route details
  useEffect(() => {
    if (!mapLoaded || !map.current || !route) return;

    // Clear existing layers
    ['route-line', 'stop-markers', 'stop-labels'].forEach(layer => {
      if (map.current.getLayer(layer)) map.current.removeLayer(layer);
    });
    ['route', 'stops'].forEach(source => {
      if (map.current.getSource(source)) map.current.removeSource(source);
    });

    // Prepare route lines - each segment as separate feature
    const routeFeatures = [];
    route.stops.forEach((stop, index) => {
      if (stop.segment_polyline) {
        const coords = decodePolyline(stop.segment_polyline);
        if (coords && coords.length > 0) {
          routeFeatures.push({
            type: 'Feature',
            properties: {
              segment: index + 1,
              distance: stop.segment_distance_km || 0,
              duration: stop.segment_duration_minutes || 0
            },
            geometry: {
              type: 'LineString',
              coordinates: coords
            }
          });
        }
      }
    });

    if (routeFeatures.length > 0) {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: routeFeatures
        }
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': route.delivery_type === 'D' ? '#10b981' : 
                        route.delivery_type === 'D+1' ? '#f59e0b' : '#ef4444',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }

    // Prepare stop markers
    const stopFeatures = [];
    const departerHub = hubs[route.hub_departer];
    
    if (departerHub && departerHub.latitude && departerHub.longitude) {
      stopFeatures.push({
        type: 'Feature',
        properties: {
          name: route.hub_departer,
          stt: 0,
          type: 'departer'
        },
        geometry: {
          type: 'Point',
          coordinates: [departerHub.longitude, departerHub.latitude]
        }
      });
    }

    route.stops.forEach((stop, index) => {
      const hub = hubs[stop.hub_destination];
      if (hub && hub.latitude && hub.longitude) {
        stopFeatures.push({
          type: 'Feature',
          properties: {
            name: stop.hub_destination,
            stt: stop.STT || (index + 1),
            type: 'destination',
            distance: stop.segment_distance_km || 0,
            duration: stop.segment_duration_minutes || 0
          },
          geometry: {
            type: 'Point',
            coordinates: [hub.longitude, hub.latitude]
          }
        });
      }
    });

    if (stopFeatures.length > 0) {
      map.current.addSource('stops', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: stopFeatures
        }
      });

      map.current.addLayer({
        id: 'stop-markers',
        type: 'circle',
        source: 'stops',
        paint: {
          'circle-radius': [
            'match',
            ['get', 'type'],
            'departer', 14,
            10
          ],
          'circle-color': [
            'match',
            ['get', 'type'],
            'departer', '#3b82f6',
            '#ef4444'
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.current.addLayer({
        id: 'stop-labels',
        type: 'symbol',
        source: 'stops',
        layout: {
          'text-field': ['to-string', ['get', 'stt']],
          'text-size': 12,
          'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold']
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // Add click handler for markers
      map.current.on('click', 'stop-markers', (e) => {
        const feature = e.features[0];
        const props = feature.properties;
        const coords = feature.geometry.coordinates.slice();

        // Find the stop data
        let stopData = null;
        if (props.type === 'departer') {
          stopData = {
            name: props.name,
            type: 'Hub Departure',
            stt: 0
          };
        } else {
          const stop = route.stops.find(s => s.hub_destination === props.name);
          if (stop) {
            stopData = {
              name: props.name,
              type: 'Destination',
              stt: props.stt,
              distance: stop.segment_distance_km,
              duration: stop.segment_duration_minutes,
              cumulative_distance: stop['tổng quãng đường'],
              cumulative_duration: stop['tổng thời gian'],
              hub_departer: route.hub_departer
            };
          }
        }

        if (stopData) {
          let popupHTML = `
            <div style="padding: 10px; min-width: 200px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #1f2937;">
                ${stopData.name}
              </h3>
              <div style="font-size: 12px; color: #6b7280;">
                <p style="margin: 5px 0;"><strong>Type:</strong> ${stopData.type}</p>
                <p style="margin: 5px 0;"><strong>Stop #:</strong> ${stopData.stt}</p>
          `;

          if (stopData.type === 'Destination') {
            popupHTML += `
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="margin: 5px 0;"><strong>From:</strong> ${stopData.hub_departer}</p>
                <p style="margin: 5px 0;"><strong>Segment Distance:</strong> ${stopData.distance.toFixed(2)} km</p>
                <p style="margin: 5px 0;"><strong>Segment Duration:</strong> ${Math.round(stopData.duration)} min</p>
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="margin: 5px 0;"><strong>Total Distance:</strong> ${stopData.cumulative_distance.toFixed(2)} km</p>
                <p style="margin: 5px 0;"><strong>Total Duration:</strong> ${Math.floor(stopData.cumulative_duration / 60)}h ${Math.round(stopData.cumulative_duration % 60)}m</p>
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
        }
      });

      // Change cursor on hover
      map.current.on('mouseenter', 'stop-markers', () => {
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'stop-markers', () => {
        map.current.getCanvas().style.cursor = '';
      });

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      stopFeatures.forEach(f => bounds.extend(f.geometry.coordinates));
      map.current.fitBounds(bounds, { padding: 80 });
    }

  }, [mapLoaded, route, hubs]);

  if (!route) return null;

  return (
    <div className="route-detail">
      <div className="route-detail-header">
        <button onClick={onBack} className="back-button">
          ← Back to Routes
        </button>
        <h1>{route.route_name}</h1>
      </div>

      <div className="route-detail-content">
        <div className="route-detail-map">
          <div ref={mapContainer} className="detail-map" />
        </div>

        <div className="route-detail-info">
          <div className="route-summary">
            <h2>📊 Route Summary</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">📦 Hub Departure</span>
                <span className="summary-value">{route.hub_departer}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🎯 Total Stops</span>
                <span className="summary-value">{route.stops.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">📏 Total Distance</span>
                <span className="summary-value">{route.total_distance.toFixed(2)} km</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">⏱️ Total Duration</span>
                <span className="summary-value">
                  {Math.floor(route.total_duration / 60)}h {Math.round(route.total_duration % 60)}m
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🚚 Delivery Type</span>
                <span className="summary-value">{route.delivery_type}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">⚡ Avg Speed</span>
                <span className="summary-value">
                  {route.total_duration > 0
                    ? ((route.total_distance / (route.total_duration / 60)).toFixed(1))
                    : '0'} km/h
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🕐 Departure Time</span>
                <span className="summary-value">
                  {route.stops[0]?.['Giờ xuất phát'] || 'N/A'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">🕐 Final Arrival</span>
                <span className="summary-value">
                  {route.stops[route.stops.length - 1]?.['Giờ đến hub destination'] || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="stop-sequence">
            <h2>Stop Sequence</h2>
            <div className="stops-list">
              {route.stops.map((stop, index) => (
                <div key={index} className="stop-item">
                  <div className="stop-number">{stop.STT || (index + 1)}</div>
                  <div className="stop-details">
                    <h3>{stop.hub_destination}</h3>
                    {stop['Giờ đến hub destination'] && (
                      <p className="stop-time">⏰ Arrival: {stop['Giờ đến hub destination']}</p>
                    )}
                    {stop.segment_distance_km > 0 && (
                      <p className="stop-distance">
                        📏 {stop.segment_distance_km} km • ⏱️ {Math.round(stop.segment_duration_minutes)} min
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteDetail;

