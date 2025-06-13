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

// API endpoint to get parish demographic data
app.get('/api/parish-demographics', (req, res) => {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'danish_parish_demographics.csv'), 'utf8');
        res.setHeader('Content-Type', 'text/csv');
        res.send(data);
    } catch (error) {
        console.error('Error reading parish demographic data:', error);
        res.status(500).json({ error: 'Failed to load parish demographic data' });
    }
});

// API endpoint to get municipality demographic data
app.get('/api/municipality-demographics', (req, res) => {
    try {
        const csvData = fs.readFileSync(path.join(__dirname, 'data', 'dk_region_municipality_demo_mock.csv'), 'utf8');
        
        // Parse CSV to JSON
        const lines = csvData.split('\n');
        const headers = lines[0].split(';').map(h => h.trim());
        
        const result = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = lines[i].split(';');
            const entry = {};
            
            headers.forEach((header, index) => {
                let value = values[index] ? values[index].trim() : '';
                
                // Convert numeric values to numbers
                if (!isNaN(value) && value !== '') {
                    value = parseFloat(value);
                }
                
                entry[header] = value;
            });
            
            result.push(entry);
        }
        
        res.json(result);
    } catch (error) {
        console.error('Error reading municipality demographic data:', error);
        res.status(500).json({ error: 'Failed to load municipality demographic data' });
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
