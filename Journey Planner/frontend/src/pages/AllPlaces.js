import React, { useState, useEffect } from 'react';
import { cities, places, trips, ratings } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const AllPlaces = () => {
  const { user } = useAuth();
  const [cityList, setCityList] = useState([]);
  const [allPlaces, setAllPlaces] = useState([]);
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [tripName, setTripName] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState('new');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingPlace, setRatingPlace] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapPlace, setMapPlace] = useState(null);
  const [userRatings, setUserRatings] = useState({});

  useEffect(() => {
    fetchCities();
    fetchAllPlaces();
    loadSavedItineraries();
  }, []);

  useEffect(() => {
    filterPlaces();
  }, [allPlaces, selectedCity, selectedType]);

  useEffect(() => {
    if (filteredPlaces.length > 0 && user) {
      fetchUserRatings();
    }
  }, [filteredPlaces, user]);

  const fetchCities = async () => {
    try {
      const response = await cities.getAll();
      setCityList(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const fetchAllPlaces = async () => {
    try {
      const response = await cities.getAll();
      const allCityPlaces = [];
      
      for (const city of response.data) {
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
      
      setAllPlaces(allCityPlaces);
    } catch (error) {
      console.error('Failed to fetch places:', error);
    }
  };

  const filterPlaces = () => {
    let filtered = allPlaces;
    
    if (selectedCity !== 'ALL') {
      filtered = filtered.filter(place => place.city_id == selectedCity);
    }
    
    if (selectedType !== 'ALL') {
      filtered = filtered.filter(place => place.type === selectedType);
    }
    
    setFilteredPlaces(filtered);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'HOTEL': return '#3b82f6';
      case 'RESTAURANT': return '#ef4444';
      case 'ATTRACTION': return '#10b981';
      default: return '#6b7280';
    }
  };

  const loadSavedItineraries = async () => {
    try {
      const response = await trips.getAll();
      setSavedItineraries(response.data.data || []);
    } catch (error) {
      console.error('Failed to load trips:', error);
    }
  };

  const handleAddToTrip = (place) => {
    setSelectedPlace(place);
    setShowModal(true);
    setTripName('');
    setBudget('');
    setStartDate('');
    setEndDate('');
    setSelectedItinerary('new');
  };

  const fetchUserRatings = async () => {
    if (!user) return;
    
    try {
      const ratingsPromises = filteredPlaces.map(place => 
        ratings.getUserRating(place.id)
          .then(res => ({ placeId: place.id, rating: res.data.userRating }))
          .catch(() => ({ placeId: place.id, rating: null }))
      );
      const ratingsResults = await Promise.all(ratingsPromises);
      
      const ratingsMap = {};
      ratingsResults.forEach(result => {
        ratingsMap[result.placeId] = result.rating ? parseFloat(result.rating) : null;
      });
      
      setUserRatings(ratingsMap);
    } catch (error) {
      console.error('Failed to fetch user ratings:', error);
    }
  };

  const handleRatePlace = (place) => {
    setRatingPlace(place);
    setUserRating(userRatings[place.id] || 0);
    setShowRatingModal(true);
  };

  const handleViewOnMap = (place) => {
    setMapPlace(place);
    setShowMapModal(true);
  };

  const submitRating = async () => {
    if (userRating === 0) {
      alert('Please select a rating');
      return;
    }
    
    if (!user) {
      alert('Please login to rate places');
      return;
    }
    
    try {
      await ratings.submitRating({ place_id: ratingPlace.id, rating: userRating });
      
      // Update local state
      setUserRatings(prev => ({ ...prev, [ratingPlace.id]: userRating }));
      
      alert(`Thank you for rating ${ratingPlace.name} with ${userRating} stars!`);
      setShowRatingModal(false);
      setRatingPlace(null);
      setUserRating(0);
      
      // Refresh places to get updated average rating
      fetchAllPlaces();
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating: ' + (error.response?.data?.message || error.message));
    }
  };

  const getUserRating = (placeId) => {
    return userRatings[placeId] || 0;
  };

  const handleSaveToTrip = async () => {
    if (selectedItinerary === 'new') {
      if (!tripName.trim()) { alert('Please enter a trip name'); return; }
      if (!budget || parseFloat(budget) <= 0) { alert('Please enter a valid budget'); return; }
      if (!startDate) { alert('Please select a start date'); return; }
      if (!endDate) { alert('Please select an end date'); return; }
      if (new Date(endDate) <= new Date(startDate)) { alert('End date must be after start date'); return; }

      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      try {
        await trips.save({
          tripName: tripName.trim(),
          cityId: selectedPlace.city_id,
          budget: parseFloat(budget),
          startDate,
          endDate,
          days,
          places: [selectedPlace],
          totalCost: parseFloat(selectedPlace.price)
        });
        alert(`New trip "${tripName}" created with ${selectedPlace.name}!`);
        loadSavedItineraries();
      } catch (error) {
        alert('Failed to create trip: ' + (error.response?.data?.message || error.message));
        return;
      }
    } else {
      const trip = savedItineraries.find(t => t.id == selectedItinerary);
      if (!trip) return;
      const exists = trip.places?.find(p => p.id === selectedPlace.id);
      if (exists) {
        alert(`${selectedPlace.name} is already in "${trip.trip_name}"!`);
        return;
      }
      try {
        // Delete old trip and re-save with new place added
        await trips.delete(trip.id);
        await trips.save({
          tripName: trip.trip_name,
          cityId: trip.city_id,
          budget: parseFloat(trip.budget),
          startDate: String(trip.start_date).split('T')[0],
          endDate: String(trip.end_date).split('T')[0],
          days: trip.days,
          places: [...(trip.places || []), selectedPlace],
          totalCost: parseFloat(trip.total_cost) + parseFloat(selectedPlace.price)
        });
        alert(`${selectedPlace.name} added to "${trip.trip_name}"!`);
        loadSavedItineraries();
      } catch (error) {
        alert('Failed to add to trip: ' + (error.response?.data?.message || error.message));
        return;
      }
    }
    setShowModal(false);
    setSelectedPlace(null);
    setTripName('');
    setBudget('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Explore Places</h1>
        <div style={styles.filters}>
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="ALL">All Cities</option>
            {cityList.map(city => (
              <option key={city.id} value={city.id}>{city.name}</option>
            ))}
          </select>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="ALL">All Types</option>
            <option value="HOTEL">Hotels</option>
            <option value="RESTAURANT">Restaurants</option>
            <option value="ATTRACTION">Attractions</option>
          </select>
        </div>
      </div>

      <div style={styles.placesGrid}>
        {filteredPlaces.map(place => (
          <div key={place.id} style={styles.placeCard}>
            <div style={styles.imageContainer}>
              {place.image_url ? (
                <img 
                  src={`http://localhost:5000${place.image_url}`} 
                  alt={place.name}
                  style={styles.placeImage}
                />
              ) : (
                <div style={styles.imagePlaceholder}>
                  📷
                </div>
              )}
            </div>
            <div style={styles.cardContent}>
              <div style={styles.cardHeader}>
                <h3 style={styles.placeName}>{place.name}</h3>
                <span style={{...styles.typeTag, backgroundColor: getTypeColor(place.type)}}>
                  {place.type}
                </span>
              </div>
              <p style={styles.cityName}>{place.city_name}</p>
              {place.description && (
                <p style={styles.description}>{place.description}</p>
              )}
              <div style={styles.cardFooter}>
                <div style={styles.price}>NPR {place.price}</div>
                <div style={styles.rating}>★ {place.rating}</div>
                {user && getUserRating(place.id) > 0 && (
                  <div style={styles.userRating}>Your: {getUserRating(place.id)}★</div>
                )}
              </div>
              <div style={styles.buttonGroup}>
                <button 
                  onClick={() => handleAddToTrip(place)}
                  style={styles.addButton}
                >
                  Add to Trip
                </button>
                <button 
                  onClick={() => handleRatePlace(place)}
                  style={styles.rateButton}
                >
                  Rate Place
                </button>
                <button 
                  onClick={() => handleViewOnMap(place)}
                  style={styles.mapButton}
                >
                  View on Map
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPlaces.length === 0 && (
        <div style={styles.noResults}>
          <h3>No places found</h3>
          <p>Try adjusting your filters to see more results.</p>
        </div>
      )}

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Add {selectedPlace?.name} to Trip</h3>
            
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '600'}}>Choose Option:</label>
              <select 
                value={selectedItinerary} 
                onChange={(e) => setSelectedItinerary(e.target.value)}
                style={styles.input}
              >
                <option value="new">Create New Trip</option>
                {savedItineraries.map(trip => (
                  <option key={trip.id} value={trip.id}>{trip.trip_name}</option>
                ))}
              </select>
            </div>
            
            {selectedItinerary === 'new' && (
              <>
                <div style={{marginBottom: '1rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '600'}}>Trip Name:</label>
                  <input
                    type="text"
                    value={tripName}
                    onChange={(e) => setTripName(e.target.value)}
                    placeholder="Enter trip name..."
                    style={styles.input}
                  />
                </div>
                
                <div style={{marginBottom: '1rem'}}>
                  <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '600'}}>Budget (NPR):</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="Enter budget..."
                    style={styles.input}
                    min="0"
                  />
                </div>
                
                <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '600'}}>Start Date:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={{flex: 1}}>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '600'}}>End Date:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>
              </>
            )}
            
            <div style={styles.modalActions}>
              <button onClick={handleSaveToTrip} style={styles.saveButton}>
                {selectedItinerary === 'new' ? 'Create Trip' : 'Add to Trip'}
              </button>
              <button onClick={() => setShowModal(false)} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatingModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Rate {ratingPlace?.name}</h3>
            
            <div style={{marginBottom: '1rem', textAlign: 'center'}}>
              <p>How would you rate this place?</p>
              <div style={styles.starRating}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setUserRating(star)}
                    style={{
                      ...styles.star,
                      color: star <= userRating ? '#f59e0b' : '#d1d5db'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            
            <div style={styles.modalActions}>
              <button onClick={submitRating} style={styles.saveButton}>
                Submit Rating
              </button>
              <button onClick={() => setShowRatingModal(false)} style={styles.cancelButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showMapModal && (
        <div style={styles.modal}>
          <div style={{...styles.modalContent, width: '600px', height: '500px', maxWidth: '90vw'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3 style={{margin: 0}}>{mapPlace?.name} - Location</h3>
              <button 
                onClick={() => setShowMapModal(false)} 
                style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}
              >
                ×
              </button>
            </div>
            <div style={{height: '400px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden'}}>
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(mapPlace?.longitude) - 0.01},${parseFloat(mapPlace?.latitude) - 0.01},${parseFloat(mapPlace?.longitude) + 0.01},${parseFloat(mapPlace?.latitude) + 0.01}&layer=mapnik&marker=${mapPlace?.latitude},${mapPlace?.longitude}`}
                width="100%"
                height="100%"
                style={{border: 'none'}}
                title={`Map showing ${mapPlace?.name}`}
              />
            </div>
            <div style={{marginTop: '1rem', textAlign: 'center', color: '#6b7280'}}>
              <p style={{margin: 0, fontSize: '0.9rem'}}>
                📍 {mapPlace?.city_name} • Coordinates: {parseFloat(mapPlace?.latitude).toFixed(4)}, {parseFloat(mapPlace?.longitude).toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem'
  },
  title: {
    color: '#1f2937',
    fontSize: '2.5rem',
    fontWeight: '700',
    margin: 0
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '140px'
  },
  placesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '2rem',
    marginBottom: '2rem'
  },
  placeCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  imageContainer: {
    width: '100%',
    height: '200px',
    overflow: 'hidden'
  },
  placeImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    color: '#9ca3af'
  },
  cardContent: {
    padding: '1.5rem'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem'
  },
  placeName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
    flex: 1
  },
  typeTag: {
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginLeft: '0.5rem'
  },
  cityName: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: '0 0 1rem 0',
    fontWeight: '500'
  },
  description: {
    color: '#4b5563',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    margin: '0 0 1rem 0'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #f3f4f6'
  },
  price: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#059669'
  },
  rating: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#f59e0b'
  },
  noResults: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  addButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    flex: 1
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    width: '400px',
    maxWidth: '90vw'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '1rem'
  },
  modalActions: {
    display: 'flex',
    gap: '1rem'
  },
  saveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    flex: 1
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    flex: 1
  },
  buttonGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  rateButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    flex: 1
  },
  mapButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    flex: 1
  },
  userRating: {
    fontSize: '0.9rem',
    fontWeight: '600',
    color: '#10b981'
  },
  starRating: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.5rem',
    margin: '1rem 0'
  },
  star: {
    fontSize: '2rem',
    cursor: 'pointer',
    transition: 'color 0.2s'
  }
};

export default AllPlaces;