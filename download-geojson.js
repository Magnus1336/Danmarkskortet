const fs = require('fs');
const https = require('https');
const path = require('path');

const url = 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/denmark-municipalities.geojson';
const outputPath = path.join(__dirname, 'data', 'denmark-municipalities.geojson');

console.log('Downloading GeoJSON file...');

https.get(url, (response) => {
    let data = '';
    
    response.on('data', (chunk) => {
        data += chunk;
    });
    
    response.on('end', () => {
        fs.writeFileSync(outputPath, data);
        console.log(`GeoJSON file saved to ${outputPath}`);
    });    
}).on('error', (error) => {
    console.error('Error downloading GeoJSON file:', error);
});
