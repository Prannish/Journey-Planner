import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('savedItineraries');
      localStorage.removeItem('itinerary');
      localStorage.removeItem('editingItinerary');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

export const cities = {
  getAll: () => api.get('/cities'),
};

export const places = {
  getByCity: (cityId, type) => api.get(`/places/city/${cityId}${type ? `?type=${type}` : ''}`),
};

export const admin = {
  getPlaces: () => api.get('/admin/places'),
  addPlace: (placeData) => api.post('/admin/places', placeData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  updatePlace: (id, placeData) => api.put(`/admin/places/${id}`, placeData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  deletePlace: (id) => api.delete(`/admin/places/${id}`),
  getUsers: () => api.get('/admin/users'),
  deleteUser: (id) => api.delete(`/admin/users/${id}`)
};

export const trips = {
  save: (tripData) => api.post('/trips', tripData),
  getAll: () => api.get('/trips'),
  delete: (id) => api.delete(`/trips/${id}`)
};

export const recommendations = {
  getBudgetRecommendations: (data) => api.post('/recommendations/budget', data),
};

export const ratings = {
  submitRating: (data) => api.post('/ratings', data),
  getUserRating: (placeId) => api.get(`/ratings/user/${placeId}`),
};

export default api;