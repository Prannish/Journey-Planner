import React, { useState } from 'react';
import { auth } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await auth.register(formData);
      setSuccess('Registration successful! You can now login.');
      setFormData({ name: '', email: '', password: '' });
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>Register</h2>
        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              style={styles.input}
              required
            />
          </div>
          
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
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p style={styles.link}>
          Already have an account? <a href="/login">Login here</a>
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
  success: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem'
  },
  link: {
    textAlign: 'center',
    marginTop: '1rem'
  }
};

export default Register;