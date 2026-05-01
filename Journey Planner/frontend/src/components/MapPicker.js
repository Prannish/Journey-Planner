import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapUpdater = React.memo(({ center }) => {
  const map = useMap();
  const lastCenter = useRef(center);
  
  useEffect(() => {
    if (center && (center[0] !== lastCenter.current[0] || center[1] !== lastCenter.current[1])) {
      map.setView(center, map.getZoom()); // Keep current zoom level
      lastCenter.current = center;
    }
  }, [center, map]);
  
  return null;
});

const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      onLocationSelect(lat, lng);
    },
  });

  return position === null ? null : (
    <Marker 
      position={position} 
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          setPosition([lat, lng]);
          onLocationSelect(lat, lng);
        },
      }}
    />
  );
};

const MapPicker = ({ onLocationSelect, initialLat = 27.7172, initialLng = 85.3240, selectedCityId }) => {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [mapCenter, setMapCenter] = useState([initialLat, initialLng]);
  const mapRef = useRef(null);

  // City coordinates mapping
  const cityCoordinates = {
    1: [27.7172, 85.3240], // Kathmandu
    2: [28.2096, 83.9856], // Pokhara
    3: [26.4525, 87.2718]  // Biratnagar
  };

  const handleLocationSelect = useCallback((lat, lng) => {
    onLocationSelect(lat, lng);
  }, [onLocationSelect]);

  useEffect(() => {
    if (selectedCityId && cityCoordinates[selectedCityId]) {
      const cityCoords = cityCoordinates[selectedCityId];
      setMapCenter(cityCoords);
      
    }
  }, [selectedCityId]);

  const handleQuickSelect = useCallback((lat, lng) => {
    const newPos = [lat, lng];
    setPosition(newPos);
    setMapCenter(newPos);
    handleLocationSelect(lat, lng);
  }, [handleLocationSelect]);

  return (
    <div style={styles.container}>
      <div style={styles.mapContainer}>
        <MapContainer
          ref={mapRef}
          center={mapCenter}
          zoom={13}
          style={styles.map}
          scrollWheelZoom={true}
          touchZoom={true}
          doubleClickZoom={true}
          boxZoom={true}
          keyboard={true}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />
          <LocationMarker 
            position={position} 
            setPosition={setPosition} 
            onLocationSelect={handleLocationSelect}
          />
        </MapContainer>
      </div>
      
      <div style={styles.info}>
        <p style={styles.instructions}>
          📍 Click on the map or drag the marker to select location
        </p>
        <div style={styles.coordinates}>
          <span>Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '1rem'
  },
  mapContainer: {
    border: '2px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '1rem'
  },
  map: {
    width: '100%',
    height: '400px'
  },
  info: {
    backgroundColor: '#f3f4f6',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1rem'
  },
  instructions: {
    margin: '0 0 0.5rem 0',
    color: '#374151',
    fontSize: '0.9rem'
  },
  coordinates: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontFamily: 'monospace'
  }
};

export default MapPicker;