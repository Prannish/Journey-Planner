import React, { useState, useEffect } from 'react';
import { admin, cities } from '../utils/api';
import MapPicker from '../components/MapPicker';
import { useAuth } from '../utils/AuthContext';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('places');
  const [users, setUsers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState('ALL');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [formData, setFormData] = useState({
    city_id: '',
    name: '',
    type: 'HOTEL',
    description: '',
    price: '',
    rating: '',
    latitude: '',
    longitude: '',
    image: null
  });

  useEffect(() => {
    fetchPlaces();
    fetchCities();
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = places;
    
    if (selectedCityFilter !== 'ALL') {
      filtered = filtered.filter(place => place.city_id == selectedCityFilter);
    }
    
    if (selectedTypeFilter !== 'ALL') {
      filtered = filtered.filter(place => place.type === selectedTypeFilter);
    }
    
    setFilteredPlaces(filtered);
  }, [places, selectedCityFilter, selectedTypeFilter]);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const fetchPlaces = async () => {
    try {
      const response = await admin.getPlaces();
      setPlaces(response.data);
    } catch (error) {
      console.error('Failed to fetch places:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await admin.getUsers();
      console.log('Users response:', response.data);
      console.log('Users data:', response.data.data);
      setUsers(response.data.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await admin.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const fetchCities = async () => {
    try {
      const response = await cities.getAll();
      setCityList(response.data);
    } catch (error) {
      console.error('Failed to fetch cities:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check required fields
    if (!formData.city_id || !formData.name || !formData.type || !formData.price || !formData.latitude || !formData.longitude) {
      alert('Please fill all required fields and select location on map');
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('city_id', formData.city_id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      console.log('Sending FormData with image');
      
      if (editingPlace) {
        await admin.updatePlace(editingPlace.id, formDataToSend);
      } else {
        await admin.addPlace(formDataToSend);
      }
      
      fetchPlaces();
      resetForm();
    } catch (error) {
      console.error('Failed to save place:', error);
      console.error('Error response:', error.response?.data);
      alert('Failed to save place: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (place) => {
    setEditingPlace(place);
    setFormData({
      city_id: place.city_id,
      name: place.name,
      type: place.type,
      description: place.description,
      price: place.price,
      latitude: place.latitude,
      longitude: place.longitude,
      image: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this place?')) {
      try {
        await admin.deletePlace(id);
        fetchPlaces();
      } catch (error) {
        console.error('Failed to delete place:', error);
      }
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });
  };

  const resetForm = () => {
    setFormData({
      city_id: '',
      name: '',
      type: 'HOTEL',
      description: '',
      price: '',
      latitude: '',
      longitude: '',
      image: null
    });
    setEditingPlace(null);
    setShowForm(false);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'HOTEL': return '#3b82f6';
      case 'RESTAURANT': return '#ef4444';
      case 'ATTRACTION': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Admin Dashboard</h2>
        <div style={styles.headerActions}>
          <span style={styles.welcome}>Welcome, {user?.name}</span>
          <button 
            onClick={handleLogout} 
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={styles.tabContainer}>
        <button 
          onClick={() => setActiveTab('places')}
          style={activeTab === 'places' ? styles.activeTab : styles.tab}
        >
          Places Management
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          style={activeTab === 'users' ? styles.activeTab : styles.tab}
        >
          Users Management
        </button>
      </div>

      {activeTab === 'places' && (
        <>
          {showForm && (
            <div style={styles.formContainer}>
              <h3>{editingPlace ? 'Edit Place' : 'Add New Place'}</h3>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.label}>City:</label>
                    <select
                      value={formData.city_id}
                      onChange={(e) => setFormData({...formData, city_id: e.target.value})}
                      style={styles.input}
                      required
                    >
                      <option value="">Select City</option>
                      {cityList.map(city => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={styles.formField}>
                    <label style={styles.label}>Type:</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      style={styles.input}
                      required
                    >
                      <option value="HOTEL">Hotel</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="ATTRACTION">Attraction</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>Name:</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>Description:</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={styles.textarea}
                    rows="3"
                  />
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>Upload Image:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                    style={styles.fileInput}
                  />
                  {formData.image && (
                    <div style={styles.imagePreview}>
                      <img 
                        src={URL.createObjectURL(formData.image)} 
                        alt="Preview" 
                        style={styles.previewImage}
                      />
                    </div>
                  )}
                </div>

                <div style={styles.formField}>
                  <label style={styles.label}>Select Location on Map:</label>
                  <MapPicker 
                    onLocationSelect={handleLocationSelect}
                    initialLat={parseFloat(formData.latitude) || 27.7172}
                    initialLng={parseFloat(formData.longitude) || 85.3240}
                    selectedCityId={formData.city_id}
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.label}>Price (NPR):</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formField}>
                    <label style={styles.label}>Latitude (Auto-filled):</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      style={{...styles.input, backgroundColor: '#f3f4f6'}}
                      readOnly
                    />
                  </div>
                  
                  <div style={styles.formField}>
                    <label style={styles.label}>Longitude (Auto-filled):</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      style={{...styles.input, backgroundColor: '#f3f4f6'}}
                      readOnly
                    />
                  </div>
                </div>

                <div style={styles.formActions}>
                  <button type="submit" style={styles.saveButton}>
                    {editingPlace ? 'Update Place' : 'Add Place'}
                  </button>
                  <button type="button" onClick={resetForm} style={styles.cancelButton}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={styles.placesContainer}>
            <div style={styles.tableFiltersRow}>
              <h3 style={styles.placesTitle}>All Places ({filteredPlaces.length} found)</h3>
              <div style={styles.tableFilters}>
                <button 
                  onClick={() => setShowForm(!showForm)} 
                  style={styles.addButton}
                >
                  {showForm ? 'Cancel' : 'Add New Place'}
                </button>
              </div>
            </div>
            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Image</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>  <select 
                  value={selectedTypeFilter} 
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="ALL">All Types</option>
                  <option value="HOTEL">Hotels</option>
                  <option value="RESTAURANT">Restaurants</option>
                  <option value="ATTRACTION">Attractions</option>
                </select></th>
                    <th style={styles.th}><select 
                  value={selectedCityFilter} 
                  onChange={(e) => setSelectedCityFilter(e.target.value)}
                  style={styles.filterSelect}
                >
                  <option value="ALL">All Cities</option>
                  {cityList.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select></th>
                    <th style={styles.th}>Description</th>
                    <th style={styles.th}>Price (NPR)</th>
                    <th style={styles.th}>Rating</th>
                    <th style={styles.th}>Location</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlaces.map(place => (
                    <tr key={place.id} style={styles.tableRow}>
                      <td style={styles.td}>
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
                      </td>
                      <td style={styles.td}>
                        <strong>{place.name}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={{...styles.typeTag, backgroundColor: getTypeColor(place.type)}}>
                          {place.type}
                        </span>
                      </td>
                      <td style={styles.td}>{place.city_name}</td>
                      <td style={styles.td}>
                        <div style={styles.descriptionCell}>
                          {place.description}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <strong style={styles.price}>NPR {place.price}</strong>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.rating}>★ {place.rating}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.coordinates}>
                          {parseFloat(place.latitude).toFixed(4)}, {parseFloat(place.longitude).toFixed(4)}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button 
                            onClick={() => handleEdit(place)} 
                            style={styles.editButton}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(place.id)} 
                            style={styles.deleteButton}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div style={styles.usersContainer}>
          <div style={styles.tableFiltersRow}>
            <h3 style={styles.placesTitle}>All Users ({users.length} total)</h3>
          </div>
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Joined Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={styles.tableRow}>
                    <td style={styles.td}>{user.id}</td>
                    <td style={styles.td}>
                      <strong>{user.name}</strong>
                    </td>
                    <td style={styles.td}>{user.email}</td>
                    <td style={styles.td}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => handleDeleteUser(user.id)} 
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '1rem',
    backgroundColor: '#f1f5f9',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #e2e8f0'
  },
  title: {
    color: '#1e293b',
    fontSize: '2.5rem',
    fontWeight: '800',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '-0.025em',
    margin: 0
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  welcome: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#64748b',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
  },
  filterSelect: {
    padding: '0.75rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '140px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  addButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  formContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  form: {
    marginTop: '1.5rem'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem'
  },
  formField: {
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.75rem',
    fontWeight: '600',
    color: '#1e293b',
    fontSize: '0.95rem',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  input: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '1rem',
    transition: 'border-color 0.2s ease',
    backgroundColor: 'white',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1e293b'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    resize: 'vertical',
    fontSize: '1rem',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1e293b'
  },
  formActions: {
    display: 'flex',
    gap: '1rem',
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid #e5e7eb'
  },
  saveButton: {
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    padding: '0.875rem 2rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.2s ease'
  },
  cancelButton: {
    backgroundColor: '#64748b',
    color: 'white',
    border: 'none',
    padding: '0.875rem 2rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    transition: 'all 0.2s ease'
  },
  placesContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  tableFiltersRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0'
  },
  tableFilters: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center'
  },
  placesTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: 'white'
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
    verticalAlign: 'top',
    borderBottom: '1px solid #f3f4f6'
  },
  imagePlaceholder: {
    width: '60px',
    height: '60px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    color: '#9ca3af'
  },
  typeTag: {
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  descriptionCell: {
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#6b7280',
    fontSize: '0.9rem'
  },
  price: {
    color: '#059669',
    fontWeight: '700'
  },
  rating: {
    color: '#f59e0b',
    fontWeight: '600'
  },
  coordinates: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    fontFamily: 'monospace'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem'
  },
  editButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  deleteButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '600',
    transition: 'all 0.2s'
  },
  fileInput: {
    width: '100%',
    padding: '0.75rem',
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    cursor: 'pointer'
  },
  imagePreview: {
    marginTop: '1rem',
    textAlign: 'center'
  },
  previewImage: {
    maxWidth: '200px',
    maxHeight: '150px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb'
  },
  placeImage: {
    width: '60px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  tabContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '0.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    gap: '0.5rem'
  },
  tab: {
    backgroundColor: 'transparent',
    color: '#64748b',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
  },
  usersContainer: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  roleTag: {
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  activeStatus: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: '0.9rem'
  },
  itineraryCount: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '600'
  }
};

export default AdminDashboard;