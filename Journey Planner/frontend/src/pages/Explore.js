import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { places, recommendations, ratings } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const Explore = () => {
  const { cityId } = useParams();
  const { user } = useAuth();
  const [placesList, setPlacesList] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [selectedType, setSelectedType] = useState('ALL');
  const [budget, setBudget] = useState('');
  const [budgetRecommendations, setBudgetRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRatings, setUserRatings] = useState({});

  useEffect(() => {
    fetchPlaces();
  }, [cityId]);

  useEffect(() => {
    if (selectedType === 'ALL') {
      setFilteredPlaces(placesList);
    } else {
      setFilteredPlaces(placesList.filter(place => place.type === selectedType));
    }
  }, [placesList, selectedType]);

  const fetchPlaces = async () => {
    try {
      const response = await places.getByCity(cityId);
      setPlacesList(response.data);
      setFilteredPlaces(response.data);
      
      // Fetch user ratings for all places
      if (user) {
        const ratingsPromises = response.data.map(place => 
          ratings.getUserRating(place.id)
            .then(res => {
              console.log(`Rating for place ${place.id}:`, res.data);
              return { placeId: place.id, rating: res.data.userRating };
            })
            .catch(() => ({ placeId: place.id, rating: null }))
        );
        const ratingsResults = await Promise.all(ratingsPromises);
        
        const ratingsMap = {};
        ratingsResults.forEach(result => {
          // Convert string rating to number for consistency
          ratingsMap[result.placeId] = result.rating ? parseFloat(result.rating) : null;
        });
        console.log('Fetched user ratings in Explore:', ratingsMap);
        setUserRatings(ratingsMap);
      }
    } catch (error) {
      console.error('Failed to fetch places:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetRecommendation = async () => {
    if (!budget) return;
    
    try {
      const response = await recommendations.getBudgetRecommendations({
        city_id: cityId,
        budget: parseFloat(budget)
      });
      setBudgetRecommendations(response.data);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
    }
  };

  const handleRating = async (placeId, rating) => {
    try {
      console.log('Submitting rating:', { placeId, rating, userId: user?.id });
      await ratings.submitRating({ place_id: placeId, rating });
      setUserRatings({ ...userRatings, [placeId]: rating });
      console.log('Rating submitted successfully. Updated ratings:', { ...userRatings, [placeId]: rating });
      
      // Refresh places to get updated average rating
      const response = await places.getByCity(cityId);
      setPlacesList(response.data);
      setFilteredPlaces(response.data.filter(place => 
        selectedType === 'ALL' || place.type === selectedType
      ));
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating: ' + (error.response?.data?.message || error.message));
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'HOTEL': return '#3b82f6';
      case 'RESTAURANT': return '#ef4444';
      case 'ATTRACTION': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) return <div style={styles.loading}>Loading places...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Explore Places</h2>
        
        <div style={styles.filters}>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">All Places</option>
            <option value="HOTEL">Hotels</option>
            <option value="RESTAURANT">Restaurants</option>
            <option value="ATTRACTION">Attractions</option>
          </select>
        </div>
      </div>

      <div style={styles.budgetSection}>
        <h3>Budget Recommendations</h3>
        <div style={styles.budgetInput}>
          <input
            type="number"
            placeholder="Enter your budget"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            style={styles.input}
          />
          <button onClick={handleBudgetRecommendation} style={styles.button}>
            Get Recommendations
          </button>
        </div>
        
        {budgetRecommendations && (
          <div style={styles.recommendations}>
            <h4>Recommended Places (Knapsack Algorithm)</h4>
            <p>Total Cost: NPR {budgetRecommendations.totalCost}</p>
            <p>Remaining Budget: NPR {budgetRecommendations.remainingBudget}</p>
            <div style={styles.recommendedPlaces}>
              {budgetRecommendations.recommendations.map(place => (
                <div key={place.id} style={styles.recommendedPlace}>
                  <span style={{...styles.typeTag, backgroundColor: getTypeColor(place.type)}}>
                    {place.type}
                  </span>
                  <strong>{place.name}</strong> - NPR {place.price} (Rating: {place.rating})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={styles.placesGrid}>
        {filteredPlaces.map(place => (
          <div key={place.id} style={styles.placeCard}>
            {place.image_url && (
              <img 
                src={`http://localhost:5000${place.image_url}`} 
                alt={place.name}
                style={styles.placeImage}
              />
            )}
            
            <div style={styles.placeHeader}>
              <h3 style={styles.placeName}>{place.name}</h3>
              <span style={{...styles.typeTag, backgroundColor: getTypeColor(place.type)}}>
                {place.type}
              </span>
            </div>
            
            <p style={styles.description}>{place.description}</p>
            
            <div style={styles.placeDetails}>
              <div style={styles.price}>NPR {place.price}</div>
              <div style={styles.rating}>★ {place.rating}</div>
            </div>
            
            {user && (
              <div style={styles.userRating}>
                <span>Your rating: </span>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => handleRating(place.id, star)}
                    style={{
                      ...styles.star,
                      color: star <= (userRatings[place.id] || 0) ? '#f59e0b' : '#d1d5db'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
            
            <div style={styles.coordinates}>
              Lat: {place.latitude}, Lng: {place.longitude}
            </div>
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
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  title: {
    color: '#1f2937',
    fontSize: '2rem'
  },
  filters: {
    display: 'flex',
    gap: '1rem'
  },
  select: {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px'
  },
  budgetSection: {
    backgroundColor: '#f9fafb',
    padding: '1.5rem',
    borderRadius: '8px',
    marginBottom: '2rem'
  },
  budgetInput: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem'
  },
  input: {
    padding: '0.5rem',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    flex: 1
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  recommendations: {
    backgroundColor: 'white',
    padding: '1rem',
    borderRadius: '4px',
    border: '1px solid #e5e7eb'
  },
  recommendedPlaces: {
    marginTop: '1rem'
  },
  recommendedPlace: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    marginBottom: '0.5rem'
  },
  loading: {
    textAlign: 'center',
    padding: '2rem',
    fontSize: '1.2rem'
  },
  placesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.5rem'
  },
  placeCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden'
  },
  placeImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover'
  },
  placeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    padding: '1.5rem 1.5rem 0'
  },
  placeName: {
    color: '#1f2937',
    fontSize: '1.2rem',
    margin: 0
  },
  typeTag: {
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  description: {
    color: '#6b7280',
    marginBottom: '1rem',
    lineHeight: '1.5',
    padding: '0 1.5rem'
  },
  placeDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    padding: '0 1.5rem'
  },
  price: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#059669'
  },
  rating: {
    color: '#f59e0b',
    fontWeight: 'bold'
  },
  coordinates: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    padding: '0 1.5rem 1.5rem'
  },
  userRating: {
    padding: '0 1.5rem 1rem',
    fontSize: '0.9rem',
    color: '#4b5563'
  },
  star: {
    cursor: 'pointer',
    fontSize: '1.5rem',
    marginLeft: '0.3rem',
    transition: 'color 0.2s',
    userSelect: 'none',
    display: 'inline-block',
    padding: '0.2rem'
  }
};

export default Explore;