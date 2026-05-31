require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const recipesRoutes = require('./routes/recipes');
const categoriesRoutes = require('./routes/categories');
const ingredientsRoutes = require('./routes/ingredients');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.SERVER_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// System health check
app.get('/', (req, res) => {
  res.send('Server is running. API is ready.');
});

app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});