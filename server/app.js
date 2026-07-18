require('dotenv').config();
const path = require('path');
const express = require('express');
const apiRoutes = require('./routes');

const app = express();

app.use('/api', apiRoutes);

// Serves the static frontend when run as a standalone Node process (local dev).
// On Netlify, the frontend is served directly from the `public` publish directory instead.
app.use(express.static(path.join(__dirname, '..', 'public')));

module.exports = app;
