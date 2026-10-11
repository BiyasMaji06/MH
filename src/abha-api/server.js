const express = require('express');
const cors = require('cors');
const abhaRoutes = require('./routes/abha');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'MumWise ABHA Test API',
  });
});

app.use('/api/abha', abhaRoutes);

const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ABHA API running on port ${PORT}`);
});