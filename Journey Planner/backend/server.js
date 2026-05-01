const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const recommendationRoutes = require('./routes/recommendations');
const ratingsRoutes = require('./routes/ratings');
const tripsRoutes = require('./routes/trips');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/trips', tripsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Journey Planner API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});