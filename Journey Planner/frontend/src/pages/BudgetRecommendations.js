import React, { useState, useEffect } from 'react';
import { cities, recommendations, places, trips, ratings } from '../utils/api';
import { useAuth } from '../utils/AuthContext';

const BudgetRecommendations = () => {
  const { user } = useAuth();
  const [cityList, setCityList] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [budget, setBudget] = useState('');
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generatedItinerary, setGeneratedItinerary] = useState([]);
  const [alternativePlaces, setAlternativePlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [showAddPlaces, setShowAddPlaces] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userRatings, setUserRatings] = useState({});
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapPlace, setMapPlace] = useState(null);
  const [hotelPreference, setHotelPreference] = useState('any');
  const [restaurantPreference, setRestaurantPreference] = useState('any');

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (cityList.length > 0) {
      loadEditingItinerary();
    }
  }, [cityList]);

  useEffect(() => {
    if (selectedCity) {
      fetchAlternativePlaces();
    }
  }, [selectedCity]);


  useEffect(() => {
    if (generatedItinerary.length > 0 && user) {
      fetchUserRatings();
    }
  }, [generatedItinerary, user]);

  const fetchAlternativePlaces = async () => {
    try {
      const response = await places.getByCity(selectedCity);
      setAlternativePlaces(response.data || []);
    } catch (error) {
      console.error('Failed to fetch alternative places:', error);
    }
  };

  const fetchUserRatings = async () => {
    if (!user) return;
    try {
      const allPlaces = generatedItinerary.flatMap(day => day.places);
      if (allPlaces.length === 0) return;
      const ratingsPromises = allPlaces.map(place =>
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

  const loadEditingItinerary = () => {
    const editing = JSON.parse(localStorage.getItem('editingItinerary') || 'null');
    if (editing) {
      setEditingId(editing.id);
      setTripName(editing.trip_name || editing.tripName);
      const cityId = editing.city_id || editing.cityId || cityList.find(c => c.name === editing.city)?.id || '';
      setSelectedCity(String(cityId));
      setBudget(editing.budget);
      // Normalize dates to YYYY-MM-DD format
      const start = (editing.start_date || editing.startDate || '').split('T')[0];
      const end = (editing.end_date || editing.endDate || '').split('T')[0];
      setStartDate(start);
      setEndDate(end);
      const days = calculateDaysFromDates(start, end);
      const organizedPlaces = organizeExistingPlaces(editing.places, days);
      setGeneratedItinerary(organizedPlaces);
      localStorage.removeItem('editingItinerary');
    }
  };

  const calculateDaysFromDates = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const organizeExistingPlaces = (places, numDays) => {
    const days = Array(numDays).fill().map((_, i) => ({ day: i + 1, places: [] }));
    places.forEach((place, index) => {
      const dayIndex = index % numDays;
      days[dayIndex].places.push(place);
    });
    return days;
  };

  const fetchCities = async () => {
    try {
      const response = await cities.getAll();
      setCityList(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.min(diffDays, 7); // Max 7 days
  };

  const handleGenerateItinerary = async (e) => {
    e.preventDefault();
    if (!selectedCity || !budget || !tripName || !startDate || !endDate) return;

    const days = calculateDays();
    if (days > 7) {
      alert('Maximum trip duration is 7 days. Please select dates within 7 days.');
      return;
    }

    setLoading(true);
    try {
      const days = calculateDays();
      const [recommendationsResponse, allPlacesResponse] = await Promise.all([
        recommendations.getBudgetRecommendations({
          city_id: selectedCity,
          budget: parseFloat(budget),
          days: days,
          hotelPreference,
          restaurantPreference
        }),
        places.getByCity(selectedCity)
      ]);
      
      const recommended = recommendationsResponse.data.itinerary || [];
      
      setGeneratedItinerary(recommended);
      setAlternativePlaces(allPlacesResponse.data || []);
      
      // Auto-save to localStorage
      const flatPlaces = recommended.flatMap(day => day.places);
      localStorage.setItem('itinerary', JSON.stringify(flatPlaces));
      
    } catch (error) {
      console.error('Failed to generate itinerary:', error);
      if (error.response?.data?.minimumBudget) {
        const data = error.response.data;
        alert(`Budget Too Low!\n\nYour budget: NPR ${budget}\nMinimum required: NPR ${data.minimumBudget}`);
      } else {
        alert('Failed to generate itinerary');
      }
    } finally {
      setLoading(false);
    }
  };

  const organizeByDays = (places, numDays) => {
    const days = Array(numDays).fill().map((_, i) => ({ day: i + 1, places: [] }));
    
    // Distribute places across days using round-robin
    places.forEach((place, index) => {
      const dayIndex = index % numDays;
      days[dayIndex].places.push(place);
    });
    
    return days;
  };

  const replacePlace = (dayIndex, oldPlace, newPlace) => {
    // Check if trying to replace with a hotel when day already has a different hotel
    if (newPlace.type === 'HOTEL' && oldPlace.type !== 'HOTEL') {
      const dayHasHotel = generatedItinerary[dayIndex].places.find(p => p.type === 'HOTEL' && p.id !== oldPlace.id);
      if (dayHasHotel) {
        alert('This day already has a hotel. You can only have one hotel per day.');
        return;
      }
    }
    
    const costAfterReplace = getTotalCost() - parseFloat(oldPlace.price) + parseFloat(newPlace.price);
    if (costAfterReplace > parseFloat(budget)) {
      alert(`Replacing with ${newPlace.name} (NPR ${newPlace.price}) would exceed your budget of NPR ${parseFloat(budget).toFixed(2)}.`);
      return;
    }

    const updated = generatedItinerary.map((day, index) => {
      if (index === dayIndex) {
        return {
          ...day,
          places: day.places.map(place =>
            place.id === oldPlace.id ? newPlace : place
          )
        };
      }
      return day;
    });
    setGeneratedItinerary(updated);

    const flatPlaces = updated.flatMap(day => day.places);
    localStorage.setItem('itinerary', JSON.stringify(flatPlaces));
  };

  const removePlace = (dayIndex, placeId) => {
    const updated = generatedItinerary.map((day, index) => {
      if (index === dayIndex) {
        return {
          ...day,
          places: day.places.filter(place => place.id !== placeId)
        };
      }
      return day;
    });
    setGeneratedItinerary(updated);
    
    // Update localStorage with flat array
    const flatPlaces = updated.flatMap(day => day.places);
    localStorage.setItem('itinerary', JSON.stringify(flatPlaces));
  };

  const getTotalCost = () => {
    const seenHotelIds = new Set();
    return generatedItinerary.flatMap(day => day.places).reduce((total, place) => {
      if (place.type === 'HOTEL') {
        if (seenHotelIds.has(place.id)) return total; // count hotel only once
        seenHotelIds.add(place.id);
        return total + (parseFloat(place.price) * generatedItinerary.length); // price × days
      }
      return total + parseFloat(place.price);
    }, 0);
  };

  const addPlaceToDay = (dayIndex, place) => {
    // Check if trying to add a hotel when day already has one
    if (place.type === 'HOTEL') {
      const dayHasHotel = generatedItinerary[dayIndex].places.find(p => p.type === 'HOTEL');
      if (dayHasHotel) {
        alert('This day already has a hotel. You can only have one hotel per day.');
        return;
      }
    }
    
    const newTotal = getTotalCost() + parseFloat(place.price);
    if (newTotal > parseFloat(budget)) {
      alert(`Adding ${place.name} (NPR ${place.price}) would exceed your budget of NPR ${parseFloat(budget).toFixed(2)}. Current total: NPR ${getTotalCost().toFixed(2)}.`);
      return;
    }

    const updated = generatedItinerary.map((day, index) => {
      if (index === dayIndex) {
        return {
          ...day,
          places: [...day.places, place]
        };
      }
      return day;
    });
    setGeneratedItinerary(updated);

    const flatPlaces = updated.flatMap(day => day.places);
    localStorage.setItem('itinerary', JSON.stringify(flatPlaces));
  };

  const getAvailablePlaces = () => {
    const allPlaces = generatedItinerary.flatMap(day => day.places);
    return alternativePlaces.filter(place => 
      !allPlaces.find(p => p.id === place.id)
    );
  };

  const getAlternativesByType = (type, currentDayIndex) => {
    const currentDay = generatedItinerary[currentDayIndex];
    
    return alternativePlaces.filter(place => {
      if (place.type !== type) return false;
      
      // Don't show if already in current day
      if (currentDay.places.find(p => p.id === place.id)) return false;
      
      return true;
    });
  };

  const handleRatePlace = async (placeId, rating) => {
    if (!user) {
      alert('Please login to rate places');
      return;
    }
    try {
      await ratings.submitRating({ place_id: placeId, rating });
      setUserRatings(prev => ({ ...prev, [placeId]: rating }));
      alert(`Thank you for rating with ${rating} stars!`);
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('Failed to submit rating: ' + (error.response?.data?.message || error.message));
    }
  };

  const isOverBudget = () => getTotalCost() > parseFloat(budget);

  const saveItinerary = async () => {
    if (isOverBudget()) {
      alert(`Total cost (NPR ${getTotalCost().toFixed(2)}) exceeds your budget (NPR ${parseFloat(budget).toFixed(2)}). Please remove some places before saving.`);
      return;
    }
    const flatPlaces = generatedItinerary.flatMap(day => day.places);
    const cityId = parseInt(selectedCity);
    const daysCount = calculateDays() || calculateDaysFromDates(startDate, endDate);
    const itineraryData = {
      tripName,
      cityId: isNaN(cityId) ? null : cityId,
      budget: parseFloat(budget),
      startDate: String(startDate).split('T')[0],
      endDate: String(endDate).split('T')[0],
      days: daysCount,
      places: flatPlaces,
      totalCost: getTotalCost()
    };

    if (!itineraryData.tripName || !itineraryData.cityId || !itineraryData.days ||
        !itineraryData.budget || !itineraryData.startDate || !itineraryData.endDate) {
      alert('Missing required fields. Please fill in all trip details.');
      return;
    }

    try {
      if (editingId) {
        await trips.delete(editingId);
      }
      await trips.save(itineraryData);
      alert(editingId ? 'Itinerary updated successfully!' : 'Itinerary saved successfully!');
      window.location.href = '/trips';
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Unknown error';
      console.error('Failed to save itinerary:', msg);
      alert('Failed to save itinerary: ' + msg);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Auto Itinerary Generator</h1>
        <p style={styles.subtitle}>Get an optimized itinerary generated automatically within your budget</p>
      </div>

      <div style={styles.formContainer}>
        <form onSubmit={handleGenerateItinerary} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.label}>Trip Name:</label>
              <input
                type="text"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                style={styles.input}
                placeholder="Enter trip name"
                required
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Select City:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={styles.select}
                required
              >
                <option value="">Choose a city</option>
                {cityList.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Budget (NPR):</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={styles.input}
                placeholder="Enter your budget"
                required
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.label}>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={styles.input}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={styles.input}
                min={startDate || new Date().toISOString().split('T')[0]}
                max={startDate ? new Date(new Date(startDate).setDate(new Date(startDate).getDate() + 6)).toISOString().split('T')[0] : undefined}
                required
              />
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Duration:</label>
              <input
                type="text"
                value={startDate && endDate ? `${calculateDays()} days` : ''}
                style={{...styles.input, backgroundColor: '#f3f4f6'}}
                readOnly
                placeholder="Auto-calculated"
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formField}>
              <label style={styles.label}>Hotel Preference:</label>
              <select
                value={hotelPreference}
                onChange={(e) => setHotelPreference(e.target.value)}
                style={styles.select}
              >
                <option value="any">Any (Best Rated)</option>
                <option value="budget">Budget (Cheapest)</option>
                <option value="mid">Mid Range</option>
                <option value="luxury">Luxury (Most Expensive)</option>
              </select>
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Restaurant Preference:</label>
              <select
                value={restaurantPreference}
                onChange={(e) => setRestaurantPreference(e.target.value)}
                style={styles.select}
              >
                <option value="any">Any (Best Rated)</option>
                <option value="budget">Budget (Cheapest)</option>
                <option value="mid">Mid Range</option>
                <option value="luxury">Luxury (Most Expensive)</option>
              </select>
            </div>
            <div style={styles.formField} />
          </div>
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Generating Itinerary...' : (editingId && generatedItinerary.length > 0 ? 'Regenerate Itinerary' : 'Generate Itinerary')}
          </button>
        </form>
      </div>

      {generatedItinerary.length > 0 && (
        <div style={styles.resultsContainer}>
          <div style={styles.resultsHeader}>
            <h2 style={styles.resultsTitle}>{editingId ? `Editing: ${tripName}` : `Your ${calculateDays()}-Day Itinerary: ${tripName}`}</h2>
            <div style={styles.headerActions}>
              <div style={styles.budgetInfo}>
                <span>Total: NPR {getTotalCost()}</span>
                <span style={{color: budget - getTotalCost() >= 0 ? '#059669' : '#ef4444'}}>
                  Remaining: NPR {Math.max(0, budget - getTotalCost()).toFixed(2)}
                </span>
              </div>
              <button
                onClick={saveItinerary}
                style={{...styles.saveButton, backgroundColor: isOverBudget() ? '#ef4444' : '#10b981'}}
                title={isOverBudget() ? `Over budget by NPR ${(getTotalCost() - parseFloat(budget)).toFixed(2)}` : ''}
              >
                {editingId ? 'Update Itinerary' : 'Save Itinerary'}
              </button>
            </div>
          </div>
          
          {generatedItinerary.map((day, dayIndex) => (
            <div key={day.day} style={styles.dayContainer}>
              <h3 style={styles.dayTitle}>Day {day.day}</h3>
              <div style={styles.placesGrid}>
                {day.places.map(place => (
                  <div key={place.id} style={styles.placeCard}>
                    {place.image_url && (
                      <img 
                        src={`http://localhost:5000${place.image_url}`} 
                        alt={place.name}
                        style={styles.placeImage}
                      />
                    )}
                    <div style={styles.cardContent}>
                      <h3 style={styles.placeName}>{place.name}</h3>
                      <p style={styles.placeType}>{place.type}</p>
                      <p style={styles.price}>NPR {place.price}</p>
                      <p style={styles.rating}>★ {place.rating}</p>
                      
                      {user && (
                        <div style={styles.userRatingSection}>
                          <span style={styles.yourRatingLabel}>Your rating: </span>
                          {[1, 2, 3, 4, 5].map(star => (
                            <span
                              key={star}
                              onClick={() => handleRatePlace(place.id, star)}
                              style={{
                                ...styles.starInline,
                                color: star <= (userRatings[place.id] || 0) ? '#f59e0b' : '#d1d5db'
                              }}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div style={styles.cardActions}>
                        <button 
                          onClick={() => {
                            setMapPlace(place);
                            setShowMapModal(true);
                          }}
                          style={styles.mapButton}
                        >
                          View on Map
                        </button>
                      </div>
                      <div style={styles.cardActions}>
                        <button 
                          onClick={() => setShowAlternatives(showAlternatives === `${dayIndex}-${place.id}` ? false : `${dayIndex}-${place.id}`)}
                          style={styles.changeButton}
                        >
                          Change
                        </button>
                        <button 
                          onClick={() => removePlace(dayIndex, place.id)}
                          style={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                      
                      {showAlternatives === `${dayIndex}-${place.id}` && (
                        <div style={styles.alternatives}>
                          <h4>Alternatives:</h4>
                          {getAlternativesByType(place.type, dayIndex).slice(0, 3).map(alt => (
                            <div key={alt.id} style={styles.altPlace}>
                              <span>{alt.name} - NPR {alt.price}</span>
                              <button 
                                onClick={() => {
                                  replacePlace(dayIndex, place, alt);
                                  setShowAlternatives(false);
                                }}
                                style={styles.selectButton}
                              >
                                Select
                              </button>
                            </div>
                          ))}
                          {getAlternativesByType(place.type, dayIndex).length === 0 && (
                            <p style={{margin: '0.5rem 0', color: '#6b7280', fontSize: '0.9rem'}}>No alternatives available</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => setShowAddPlaces(showAddPlaces === dayIndex ? false : dayIndex)}
                style={styles.addPlacesButton}
              >
                + Add More Places
              </button>
              
              {showAddPlaces === dayIndex && (
                <div style={styles.addPlacesSection}>
                  <h4>Available Places to Add:</h4>
                  <div style={styles.availablePlacesGrid}>
                    {getAvailablePlaces().map(place => (
                      <div key={place.id} style={styles.availablePlaceCard}>
                        <div style={styles.placeInfo}>
                          <span style={styles.placeName}>{place.name}</span>
                          <span style={styles.placeType}>({place.type})</span>
                          <span style={styles.price}>NPR {place.price}</span>
                        </div>
                        <button 
                          onClick={() => {
                            addPlaceToDay(dayIndex, place);
                            setShowAddPlaces(false);
                          }}
                          style={styles.selectButton}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                  {getAvailablePlaces().length === 0 && (
                    <p style={styles.noPlacesText}>No more places available to add.</p>
                  )}
                </div>
              )}
            </div>
          ))}
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
    textAlign: 'center'
  },
  title: {
    color: '#1f2937',
    fontSize: '2.5rem',
    fontWeight: '700',
    margin: '0 0 1rem 0'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '1.1rem',
    margin: 0
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1.5rem'
  },
  formField: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#374151'
  },
  select: {
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem'
  },
  input: {
    padding: '0.75rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '1rem'
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '1rem 2rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    alignSelf: 'center'
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  resultsTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  resultsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem'
  },
  budgetInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '0.5rem',
    fontSize: '1.1rem',
    fontWeight: '600'
  },
  saveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    whiteSpace: 'nowrap'
  },
  placesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem'
  },
  placeCard: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  placeImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover'
  },
  cardContent: {
    padding: '1rem'
  },
  placeName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.5rem 0'
  },
  placeType: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: '0 0 0.5rem 0'
  },
  price: {
    color: '#059669',
    fontWeight: '600',
    margin: '0 0 0.5rem 0'
  },
  rating: {
    color: '#f59e0b',
    fontWeight: '600',
    margin: '0 0 1rem 0'
  },
  addButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    width: '100%'
  },
  cardActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  changeButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    flex: 1
  },
  removeButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    flex: 1
  },
  mapButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    flex: 1
  },
  reviewButton: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    flex: 1
  },
  alternatives: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px'
  },
  altPlace: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #e5e7eb'
  },
  selectButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600'
  },
  dayContainer: {
    marginBottom: '2rem',
    backgroundColor: '#f9fafb',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  dayTitle: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '2px solid #3b82f6'
  },
  addPlacesButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    marginTop: '1rem',
    width: '100%'
  },
  addPlacesSection: {
    marginTop: '1.5rem',
    padding: '1rem',
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe'
  },
  availablePlacesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '1rem'
  },
  availablePlaceCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb'
  },
  placeInfo: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  noPlacesText: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    margin: '1rem 0'
  },
  userRatingSection: {
    padding: '0.5rem 0',
    fontSize: '0.9rem',
    color: '#4b5563',
    borderTop: '1px solid #e5e7eb',
    marginTop: '0.5rem',
    paddingTop: '0.75rem'
  },
  yourRatingLabel: {
    marginRight: '0.5rem'
  },
  starInline: {
    cursor: 'pointer',
    fontSize: '1.3rem',
    marginLeft: '0.2rem',
    transition: 'color 0.2s',
    userSelect: 'none',
    display: 'inline-block'
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
  }
};

export default BudgetRecommendations;