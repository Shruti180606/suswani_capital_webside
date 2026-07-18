const serverless = require('serverless-http');
const express = require('express');
const apiRoutes = require('../../server/routes');

// Netlify strips the /api prefix before invoking this function (see netlify.toml),
// so routes are mounted at the root here.
const app = express();
app.use('/', apiRoutes);

module.exports.handler = serverless(app);
