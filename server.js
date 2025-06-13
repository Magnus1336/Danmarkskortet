const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies for API requests
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get demographic data
app.get('/api/demographics', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'danish_parish_demographics.csv'), 'utf8');
        res.setHeader('Content-Type', 'text/csv');
        res.send(data);
    } catch (error) {
        console.error('Error reading demographic data:', error);
        res.status(500).json({ error: 'Failed to load demographic data' });
    }
});

// API endpoint to get municipality GeoJSON data
app.get('/api/municipalities', async (req, res) => {
    try {
        const response = await fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/denmark-municipalities.geojson');
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching municipality data:', error);
        res.status(500).json({ error: 'Failed to load municipality data' });
    }
});

// Serve the main HTML file for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`API available at http://localhost:${port}/api`);
});
