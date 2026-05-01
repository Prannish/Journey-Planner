import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './utils/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AllPlaces from './pages/AllPlaces';
import Trips from './pages/Trips';
import BudgetRecommendations from './pages/BudgetRecommendations';
import Explore from './pages/Explore';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/places" />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const isAdminRoute = window.location.pathname === '/admin';
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div style={styles.app}>
        {!isAdminRoute && <Header />}
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/places" 
              element={
                <ProtectedRoute>
                  <AllPlaces />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trips" 
              element={
                <ProtectedRoute>
                  <Trips />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/budget" 
              element={
                <ProtectedRoute>
                  <BudgetRecommendations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/explore/:cityId" 
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6'
  },
  main: {
    minHeight: 'calc(100vh - 80px)'
  }
};

export default App;