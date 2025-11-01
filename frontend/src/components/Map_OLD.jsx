import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createCircleBoundary, getColorForCommune, parseAddress, calculateArea } from '../utils/boundaries';

// Use environment variable for Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoia2FpZHJvZ2VyIiwiYSI6ImNtaDM4bnB2cjBuN28ybnM5NmV0ZTluZHEifQ.YHW9Erg1h5egssNhthQiZw';

const Map = ({ markers, onMarkerClick, showBoundaries = true, showRoutes = true, focusMode = false, focusedDestinations = [] }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(102.8);
  const [lat, setLat] = useState(13.6);
  const [zoom, setZoom] = useState(9);
  const markersRef = useRef([]);
  const routeLayers = useRef([]);
  const boundaryLayers = useRef([]);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, []);

  const fetchRoute = async (start, end) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return {
          geometry: data.routes[0].geometry,
          distance: data.routes[0].distance / 1000,
          duration: data.routes[0].duration / 60
        };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
    return null;
  };

  useEffect(() => {
    if (!map.current || !markers || markers.length === 0) return;

    const addMarkersAndRoutes = async () => {
      // Remove markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Remove route layers and sources
      routeLayers.current.forEach(layerId => {
        try {
          if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
          if (map.current.getSource(layerId)) map.current.removeSource(layerId);
        } catch (e) {
          console.error('Error removing route layer:', e);
        }
      });
      routeLayers.current = [];

      // Remove boundary layers BEFORE removing sources
      boundaryLayers.current.forEach(layerId => {
        try {
          const fillId = `boundary-fill-${layerId.split('-')[1]}`;
          const outlineId = `boundary-outline-${layerId.split('-')[1]}`;
          if (map.current.getLayer(fillId)) map.current.removeLayer(fillId);
          if (map.current.getLayer(outlineId)) map.current.removeLayer(outlineId);
          if (map.current.getSource(layerId)) map.current.removeSource(layerId);
        } catch (e) {
          console.error('Error removing boundary layer:', e);
        }
      });
      boundaryLayers.current = [];

      // Determine which markers to display
      const displayMarkers = focusMode && focusedDestinations.length > 0
        ? focusedDestinations
        : markers;

      const hubDeparter = markers[0];
      const departerCoords = [hubDeparter.departer_long, hubDeparter.departer_lat];

      // Calculate total orders from displayed markers
      const totalOrdersFromHub = displayMarkers.reduce((sum, m) => sum + m.order, 0);

      const departerEl = document.createElement('div');
      departerEl.style.cssText = 'background-color:#FF0000;width:30px;height:30px;border-radius:50%;border:3px solid white;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3)';

      const hubPopupHTML = `
        <div style="padding:12px;min-width:250px">
          <h3 style="margin:0 0 10px 0;color:#FF0000;font-weight:bold;font-size:16px">${hubDeparter.hub_departer}</h3>
          <p style="margin:5px 0;font-size:13px"><strong>📍 Địa chỉ:</strong> Poipet, Banteay Meanchey, Cambodia</p>
          <p style="margin:5px 0;font-size:13px"><strong>📦 Tổng đơn hàng/tháng:</strong> ${totalOrdersFromHub} đơn</p>
          <p style="margin:5px 0;font-size:13px"><strong>🎯 Số điểm giao hàng:</strong> ${displayMarkers.length} điểm</p>
          <p style="margin:5px 0;font-size:13px"><strong>🗺️ Tọa độ:</strong> ${hubDeparter.departer_lat.toFixed(4)}, ${hubDeparter.departer_long.toFixed(4)}</p>
        </div>
      `;

      const departerMarker = new mapboxgl.Marker(departerEl)
        .setLngLat(departerCoords)
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(hubPopupHTML))
        .addTo(map.current);
      markersRef.current.push(departerMarker);

      // Only show boundaries if not in focus mode
      if (showBoundaries && !focusMode) {
        const processedCommunes = new Set();
        displayMarkers.forEach((marker, idx) => {
          const addressParts = parseAddress(marker.address_destination);
          const commune = addressParts.commune;
          if (processedCommunes.has(commune)) return;
          processedCommunes.add(commune);
          const boundaryId = `boundary-${idx}`;
          const fillId = `boundary-fill-${idx}`;
          const outlineId = `boundary-outline-${idx}`;
          boundaryLayers.current.push(boundaryId);
          const circleGeometry = createCircleBoundary(marker.destination_long, marker.destination_lat, 8);
          const color = getColorForCommune(commune);
          const area = calculateArea(circleGeometry);
          if (!map.current.getSource(boundaryId)) {
            map.current.addSource(boundaryId, {
              type: 'geojson',
              data: { type: 'Feature', properties: { name: commune, area: area.toFixed(2) }, geometry: circleGeometry }
            });
          }
          if (!map.current.getLayer(fillId)) {
            map.current.addLayer({ id: fillId, type: 'fill', source: boundaryId, paint: { 'fill-color': color, 'fill-opacity': 0.2 } });
          }
          if (!map.current.getLayer(outlineId)) {
            map.current.addLayer({ id: outlineId, type: 'line', source: boundaryId, paint: { 'line-color': color, 'line-width': 2, 'line-opacity': 0.8 } });
          }
          map.current.on('click', fillId, (e) => {
            const properties = e.features[0].properties;
            new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(`<div style="padding:10px"><h3 style="margin:0 0 5px 0;color:${color};font-weight:bold">Xã ${properties.name}</h3><p style="margin:5px 0"><strong>Diện tích ước tính:</strong> ${properties.area} km²</p></div>`).addTo(map.current);
          });
          map.current.on('mouseenter', fillId, () => { map.current.getCanvas().style.cursor = 'pointer'; });
          map.current.on('mouseleave', fillId, () => { map.current.getCanvas().style.cursor = ''; });
        });
      }

      // Loop through displayMarkers instead of all markers
      for (let index = 0; index < displayMarkers.length; index++) {
        const marker = displayMarkers[index];
        const destCoords = [marker.destination_long, marker.destination_lat];
        const routeData = await fetchRoute(departerCoords, destCoords);
        const addressParts = parseAddress(marker.address_destination);
        const commune = addressParts.commune;
        const communeColor = getColorForCommune(commune);
        const circleGeometry = createCircleBoundary(marker.destination_long, marker.destination_lat, 8);
        const area = calculateArea(circleGeometry);
        const el = document.createElement('div');
        el.style.cssText = `background-color:${communeColor};width:28px;height:28px;border-radius:50%;border:3px solid white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;box-shadow:0 3px 6px rgba(0,0,0,0.4)`;
        el.textContent = marker.order;
        let popupContent = `<div style="padding:12px;min-width:220px"><h3 style="margin:0 0 10px 0;color:${communeColor};font-weight:bold;font-size:16px">${marker.hub_destination}</h3><div style="border-left:3px solid ${communeColor};padding-left:10px;margin-bottom:10px"><p style="margin:5px 0;font-size:13px"><strong>📍 Địa chỉ:</strong><br/>${marker.address_destination}</p></div><p style="margin:5px 0;font-size:13px"><strong>📦 Số đơn hàng/tháng:</strong> ${marker.order}</p><p style="margin:5px 0;font-size:13px"><strong>🗺️ Diện tích khu vực:</strong> ~${area.toFixed(2)} km²</p>`;
        if (routeData) {
          popupContent += `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #eee"><p style="margin:5px 0;font-size:13px"><strong>🚗 Khoảng cách:</strong> ${routeData.distance.toFixed(2)} km</p><p style="margin:5px 0;font-size:13px"><strong>⏱️ Thời gian di chuyển:</strong> ${Math.round(routeData.duration)} phút</p></div>`;
        }
        popupContent += `</div>`;
        const destMarker = new mapboxgl.Marker(el)
          .setLngLat(destCoords)
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent))
          .addTo(map.current);
        markersRef.current.push(destMarker);
        el.addEventListener('click', () => {
          if (onMarkerClick) onMarkerClick({ ...marker, routeData });
        });
        // In focus mode, always show routes. Otherwise, respect showRoutes setting
        if (routeData && (focusMode || showRoutes)) {
          const layerId = `route-${index}`;
          routeLayers.current.push(layerId);
          if (!map.current.getSource(layerId)) {
            map.current.addSource(layerId, { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: routeData.geometry } });
          }
          if (!map.current.getLayer(layerId)) {
            map.current.addLayer({ id: layerId, type: 'line', source: layerId, layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': communeColor, 'line-width': 4, 'line-opacity': 0.7 } });
          }
        }
      }

      // Fit bounds to displayed markers
      if (displayMarkers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(departerCoords);
        displayMarkers.forEach(marker => bounds.extend([marker.destination_long, marker.destination_lat]));
        map.current.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.current.loaded()) {
      addMarkersAndRoutes();
    } else {
      map.current.on('load', addMarkersAndRoutes);
    }

    return () => {
      if (map.current) map.current.off('load', addMarkersAndRoutes);
    };
  }, [markers, onMarkerClick, showBoundaries, showRoutes, focusMode, focusedDestinations]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(255,255,255,0.9)', padding: '10px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', zIndex: 1 }}>
        Lng: {lng} | Lat: {lat} | Zoom: {zoom}
      </div>
    </div>
  );
};

export default Map;

