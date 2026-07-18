const app = require('./app');

const PORT = process.env.PORT || 8888;

app.listen(PORT, () => {
  console.log(`Suswani Capital server running at http://localhost:${PORT}`);
});
