import React, { useState, useEffect } from 'react';
import { cities } from '../utils/api';

const Cities = () => {
  const [cityList, setCityList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await cities.getAll();
      setCityList(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCitySelect = (cityId) => {
    window.location.href = `/explore/${cityId}`;
  };

  if (loading) return <div style={styles.loading}>Loading cities...</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Select Your Destination</h2>
      <div style={styles.grid}>
        {cityList.map(city => (
          <div key={city.id} style={styles.card} onClick={() => handleCitySelect(city.id)}>
            <h3 style={styles.cityName}>{city.name}</h3>
            <p style={styles.coordinates}>
              Lat: {city.latitude}, Lng: {city.longitude}
            </p>
            <button style={styles.button}>Explore {city.name}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem'
  },
  title: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#1f2937',
    fontSize: '2rem'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #e5e7eb'
  },
  cityName: {
    fontSize: '1.5rem',
    marginBottom: '1rem',
    color: '#2563eb'
  },
  coordinates: {
    color: '#6b7280',
    marginBottom: '1.5rem',
    fontSize: '0.9rem'
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default Cities;