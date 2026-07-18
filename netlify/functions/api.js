const serverless = require('serverless-http');
const express = require('express');
const apiRoutes = require('../../server/routes');

// Netlify passes the full original request path (e.g. "/api/config") through to
// the function, not a stripped-down one, so the router is mounted at "/api" here
// too — matching how server/app.js mounts it for local dev.
const app = express();
app.use('/api', apiRoutes);

module.exports.handler = serverless(app);
