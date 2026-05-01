import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { cities, places } from '../utils/api';

const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [allPlaces, setAllPlaces] = useState([]);
  const [cityList, setCityList] = useState([]);

  useEffect(() => {
    fetchPlacesData();
  }, []);

  const fetchPlacesData = async () => {
    try {
      const citiesResponse = await cities.getAll();
      setCityList(citiesResponse.data);
      
      const allCityPlaces = [];
      for (const city of citiesResponse.data) {
        try {
          const placesResponse = await places.getByCity(city.id);
          const placesWithCity = placesResponse.data.map(place => ({
            ...place,
            city_name: city.name
          }));
          allCityPlaces.push(...placesWithCity);
        } catch (error) {
          console.error(`Failed to fetch places for ${city.name}:`, error);
        }
      }
      setAllPlaces(allCityPlaces.slice(0, 6)); // Show only first 6 places
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <p style={styles.heroSubtitle}>
              Plan your perfect trip to Nepal's beautiful cities with budget optimization
            </p>
            
            {!isAuthenticated ? (
              <div style={styles.heroActions}>
                <a href="/register" style={styles.primaryButton}>Get Started</a>
                <a href="/login" style={styles.secondaryButton}>Login</a>
              </div>
            ) : (
              <div style={styles.heroActions}>
                {isAdmin ? (
                  <a href="/admin" style={styles.primaryButton}>Admin Dashboard</a>
                ) : (
                  <a href="/places" style={styles.primaryButton}>Explore Places</a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.featuresSection}>
        <div style={styles.featuresContainer}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>⚙️</div>
            <h3 style={styles.featureTitle}>Smart Budget Planning</h3>
            <p style={styles.featureText}>Algorithm-powered recommendations that optimize your travel budget using advanced calculations</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🏔️</div>
            <h3 style={styles.featureTitle}>Interactive Maps</h3>
            <p style={styles.featureText}>Explore destinations with detailed maps and precise location information</p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📋</div>
            <h3 style={styles.featureTitle}>Easy Trip Management</h3>
            <p style={styles.featureText}>Create, edit, and manage multiple itineraries with our intuitive interface</p>
          </div>
        </div>
      </div>

      <div style={styles.exploreSection}>
        <h2 style={styles.exploreTitle}>Explore Popular Places</h2>
        <div style={styles.placesGrid}>
          {allPlaces.map(place => (
            <div key={place.id} style={styles.placeCard}>
              {place.image_url && (
                <img 
                  src={`http://localhost:5000${place.image_url}`} 
                  alt={place.name}
                  style={styles.placeImage}
                />
              )}
              <div style={styles.placeContent}>
                <h3 style={styles.placeName}>{place.name}</h3>
                <p style={styles.placeCity}>{place.city_name}</p>
                <p style={styles.placePrice}>NPR {place.price}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={styles.exploreMore}>
          <a href="/places" style={styles.exploreButton}>View All Places</a>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh'
  },
  hero: {
    padding: '4rem 2rem',
    backgroundImage: 'url(/travel.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '75vh',
    display: 'flex',
    alignItems: 'center',
    margin: '0 2rem'
  },
  heroContent: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '3rem'
  },
  heroText: {
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: '1.5rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
    letterSpacing: '-0.02em'
  },
  heroSubtitle: {
    fontSize: '1.4rem',
    color: '#ffffff',
    marginBottom: '2.5rem',
    lineHeight: '1.7',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    fontWeight: '700'
  },
  heroActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '1rem 2.5rem',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '1.1rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  secondaryButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '1rem 2.5rem',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '700',
    fontSize: '1.1rem',
    border: '2px solid #10b981',
    transition: 'all 0.3s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  exploreSection: {
    padding: '4rem 2rem',
    backgroundColor: '#f8fafc'
  },
  exploreTitle: {
    textAlign: 'center',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '3rem'
  },
  placesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  placeCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s ease'
  },
  placeImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  placeContent: {
    padding: '1.5rem'
  },
  placeName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.5rem 0'
  },
  placeCity: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: '0 0 0.5rem 0'
  },
  placePrice: {
    color: '#059669',
    fontWeight: '600',
    fontSize: '1.1rem',
    margin: 0
  },
  exploreMore: {
    textAlign: 'center',
    marginTop: '3rem'
  },
  exploreButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.875rem 2rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
  },
  featuresSection: {
    padding: '4rem 2rem',
    backgroundColor: 'white'
  },
  featuresContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  featureCard: {
    textAlign: 'center',
    padding: '2rem'
  },
  featureIcon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1rem'
  },
  featureText: {
    color: '#6b7280',
    lineHeight: '1.6'
  }
};

export default Home;