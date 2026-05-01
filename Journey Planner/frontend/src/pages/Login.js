import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { auth } from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await auth.login(formData);
      login(response.data.token, response.data.user);
      
      if (response.data.user.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/cities';
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>Login</h2>
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={styles.input}
              required
            />
          </div>
          
          <div style={styles.field}>
            <label style={styles.label}>Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={styles.input}
              required
            />
          </div>
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p style={styles.link}>
          Don't have an account? <a href="/register">Register here</a>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 80px)',
    padding: '2rem',
    backgroundImage: 'url(/travel.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    margin: '0 2rem',
    overflow: 'hidden'
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '3rem',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    width: '100%',
    maxWidth: '450px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  title: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    color: '#1f2937'
  },
  field: {
    marginBottom: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    fontSize: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#1f2937',
    backdropFilter: 'blur(5px)'
  },
  button: {
    width: '100%',
    backgroundColor: '#2563eb',
    color: 'white',
    padding: '0.75rem',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    marginTop: '1rem'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem'
  }
};

export default Login;