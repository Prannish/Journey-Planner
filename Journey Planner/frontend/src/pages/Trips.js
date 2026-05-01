import React, { useState, useEffect } from 'react';
import { trips } from '../utils/api';

const Trips = () => {
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    try {
      const response = await trips.getAll();
      setSavedItineraries(response.data.data || []);
    } catch (error) {
      console.error('Failed to load trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItinerary = async (id) => {
    if (window.confirm('Are you sure you want to delete this itinerary?')) {
      try {
        await trips.delete(id);
        setSavedItineraries(prev => prev.filter(trip => trip.id !== id));
      } catch (error) {
        console.error('Failed to delete trip:', error);
        alert('Failed to delete trip.');
      }
    }
  };

  const editItinerary = (itinerary) => {
    localStorage.setItem('editingItinerary', JSON.stringify(itinerary));
    window.location.href = '/budget';
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>My Trips</h1>
        <a href="/budget" style={styles.createButton}>Create New Trip</a>
      </div>

      {loading ? (
        <div style={styles.noTrips}><p>Loading trips...</p></div>
      ) : savedItineraries.length > 0 ? (
        <div style={styles.savedSection}>
          <h2 style={styles.sectionTitle}>Your Itineraries</h2>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Trip Name</th>
                  <th style={styles.th}>City</th>
                  <th style={styles.th}>Duration</th>
                  <th style={styles.th}>Budget</th>
                  <th style={styles.th}>Places</th>
                  <th style={styles.th}>Created Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedItineraries.map(trip => (
                  <tr key={trip.id} style={styles.tableRow}>
                    <td style={styles.td}><strong>{trip.trip_name}</strong></td>
                    <td style={styles.td}>{trip.city_name}</td>
                    <td style={styles.td}>{trip.days} days</td>
                    <td style={styles.td}><span style={styles.budget}>NPR {trip.budget}</span></td>
                    <td style={styles.td}><span style={styles.placesCount}>{trip.places_count} places</span></td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{new Date(trip.created_at).toLocaleDateString()}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionButtons}>
                        <button onClick={() => editItinerary(trip)} style={styles.editButton}>Edit</button>
                        <button onClick={() => deleteItinerary(trip.id)} style={styles.deleteButton}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={styles.noTrips}>
          <h3>No trips created yet</h3>
          <p>Create your first trip to get started!</p>
          <a href="/budget" style={styles.exploreButton}>Create New Trip</a>
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
    alignItems: 'center'
  },
  totalCost: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#059669'
  },
  title: {
    color: '#1f2937',
    fontSize: '2.5rem',
    fontWeight: '700',
    margin: 0
  },
  noTrips: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  exploreButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    display: 'inline-block',
    marginTop: '1rem'
  },
  tripsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '2rem'
  },
  tripCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  tripName: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 1rem 0'
  },
  tripBudget: {
    color: '#059669',
    fontWeight: '600',
    margin: '0 0 0.5rem 0'
  },
  tripDate: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: 0
  },
  placeImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '1rem'
  },
  cityName: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: '0 0 0.5rem 0'
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
    width: '100%',
    marginTop: '1rem'
  },
  savedSection: {
    marginBottom: '3rem'
  },
  savedInfo: {
    display: 'flex',
    gap: '2rem',
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#059669'
  },
  dateInfo: {
    backgroundColor: '#f0f9ff',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '2rem',
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: '500',
    color: '#0369a1'
  },
  createButton: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '2rem'
  },
  itineraryContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    overflow: 'hidden'
  },
  itineraryHeader: {
    padding: '2rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itineraryTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  itineraryInfo: {
    display: 'flex',
    gap: '2rem',
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#059669'
  },
  itineraryActions: {
    display: 'flex',
    gap: '1rem'
  },
  editButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  deleteButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600'
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
  placePrice: {
    color: '#059669',
    fontWeight: '600',
    margin: 0
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f8fafc'
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '700',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s'
  },
  td: {
    padding: '1rem',
    verticalAlign: 'middle',
    borderBottom: '1px solid #f3f4f6'
  },
  dateText: {
    fontSize: '0.9rem',
    color: '#6b7280'
  },
  budget: {
    color: '#3b82f6',
    fontWeight: '600'
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    textAlign: 'center'
  },
  summaryTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '1.5rem'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem'
  },
  statNumber: {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#10b981'
  },
  statLabel: {
    fontSize: '1.1rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  placesCount: {
    color: '#3b82f6',
    fontWeight: '600'
  },
  totalCost: {
    color: '#059669',
    fontWeight: '700'
  },
  actionButtons: {
    display: 'flex',
    gap: '0.5rem'
  }
};

export default Trips;