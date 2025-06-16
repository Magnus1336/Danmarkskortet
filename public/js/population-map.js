// Configuration
const CONFIG = {
    width: 800,
    height: 800,
    margin: { top: 20, right: 20, bottom: 20, left: 20 },
    colorScheme: d3.interpolateBlues,
    colorSteps: 7
};

// Global variables
let mapData;
let demographicData = {};
let currentDate = '2025-01-01';

// Main function to initialize the map
async function initMap() {
    try {
        // Load the map data and demographic data in parallel
        const [municipalities, demographics] = await Promise.all([
            d3.json('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/denmark-municipalities.geojson'),
            fetchDemographicData()
        ]);
        
        mapData = municipalities;
        processDemographicData(demographics);
        
        // Create the map
        createMap();
        
        // Update the map with the data
        updateMap();
        
    } catch (error) {
        console.error('Error initializing map:', error);
        d3.select('#population-map')
            .append('div')
            .attr('class', 'error-message')
            .text('Error loading map data. Please try again later.');
    }
}

// Fetch demographic data from the server
async function fetchDemographicData() {
    try {
        const response = await fetch('/api/municipality-demographics');
        if (!response.ok) throw new Error('Failed to load demographic data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching demographic data:', error);
        throw error;
    }
}

// Process demographic data into a more usable format
function processDemographicData(rows) {
    demographicData = {};
    
    // Filter for the target date and process the data
    const targetDate = new Date(currentDate);
    
    rows.forEach(row => {
        const rowDate = new Date(row.date);
        
        // Only process data for the target date
        if (rowDate.getTime() === targetDate.getTime()) {
            const key = row.municipality;
            
            if (!demographicData[key]) {
                demographicData[key] = {
                    municipality: row.municipality,
                    region: row.region,
                    population: 0,
                    population_male: 0,
                    population_female: 0,
                    date: row.date
                };
            }
            
            // Sum up the population data
            demographicData[key].population += row.population_total || 0;
            demographicData[key].population_male += row.population_male || 0;
            demographicData[key].population_female += row.population_female || 0;
        }
    });
    
    console.log('Processed demographic data:', demographicData);
}

// Create the map visualization
function createMap() {
    // Calculate the width and height for the map
    const width = CONFIG.width - CONFIG.margin.left - CONFIG.margin.right;
    const height = CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom;
    
    // Create SVG container
    const svg = d3.select('#population-map')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add a group for the map features
    const g = svg.append('g')
        .attr('transform', `translate(${CONFIG.margin.left},${CONFIG.margin.top})`);
    
    // Create a projection that fits Denmark
    const projection = d3.geoMercator()
        .center([10, 56])
        .scale(3000)
        .translate([width / 2, height / 2]);
    
    // Create a path generator
    const path = d3.geoPath().projection(projection);
    
    // Add the map features
    g.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('class', 'municipality')
        .attr('d', path)
        .attr('data-name', d => d.properties.name || '')
    
    // Store the path generator and projection for later use
    g.path = path;
    g.projection = projection;
    

    
    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.7, 8])  // Allow zooming out to 0.7x (70%)
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
            g.selectAll('path')
                .style('stroke-width', 1 / event.transform.k);
        });
    
    // Set initial zoom and center
    const initialScale = 2;
    const mapWidth = CONFIG.width;
    const mapHeight = CONFIG.height;
    const center = [mapWidth / 2, mapHeight / 2];
    
    // Center the map
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(center[0] - (center[0] * initialScale), center[1] - (center[1] * initialScale))
        .scale(initialScale)
    );
    
    // Apply the zoom behavior
    svg.call(zoom);
    
    // Add a tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'white')
        .style('padding', '8px')
        .style('border', '1px solid #ccc')
        .style('border-radius', '4px')
        .style('pointer-events', 'none')
        .style('font-size', '14px');
    
    // Store references for later use
    window.mapElements = {
        svg,
        g,
        path,
        projection,
        tooltip
    };
}

// Update the map with the current data
function updateMap() {
    const { g, path, tooltip } = window.mapElements;
    
    // Get all population values for the color scale
    const populationValues = Object.values(demographicData)
        .map(d => d.population)
        .filter(d => d > 0);
    
    if (populationValues.length === 0) {
        console.error('No population data available for the selected date');
        return;
    }
    
    // Create a color scale
    const colorScale = d3.scaleSequential()
        .domain([0, d3.max(populationValues)])
        .interpolator(d3.interpolateBlues);
    
    // Update the legend
    updateLegend(colorScale, d3.max(populationValues));
    
    // Update the map features with the data
    g.selectAll('.municipality')
        .each(function(d) {
            const name = d.properties.name || '';
            const data = demographicData[name];
            const population = data ? data.population : 0;
            
            d3.select(this)
                .attr('fill', population > 0 ? colorScale(population) : '#f0f0f0')
                .attr('data-population', population);
        });
    
    // Add tooltip events
    g.selectAll('.municipality')
        .on('mousemove', function(event, d) {
            const name = d.properties.name || 'Unknown';
            const data = demographicData[name] || {};
            const population = data.population || 0;
            const formattedPopulation = population.toLocaleString();
            
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .style('opacity', 1)
                .html(`
                    <div><strong>${name}</strong></div>
                    <div>Region: ${data.region || 'N/A'}</div>
                    <div>Population: ${formattedPopulation}</div>
                `);
        })
        .on('mouseout', function() {
            tooltip.style('opacity', 0);
        });
}

// Update the legend
function updateLegend(colorScale, maxValue) {
    const legendWidth = 300;
    const legendHeight = 20;
    const legendSvg = d3.select('#legend-scale')
        .html('') // Clear existing content
        .style('width', legendWidth + 'px')
        .style('height', legendHeight + 'px');
    
    // Create gradient definition
    const defs = legendSvg.append('defs');
    const gradient = defs.append('linearGradient')
        .attr('id', 'legend-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
    
    // Add color stops
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
        const value = (i / numStops) * maxValue;
        gradient.append('stop')
            .attr('offset', `${(i / numStops) * 100}%`)
            .attr('stop-color', colorScale(value))
            .attr('stop-opacity', 1);
    }
    
    // Create the gradient rectangle
    legendSvg.append('rect')
        .attr('width', '100%')
        .attr('height', '100%')
        .style('fill', 'url(#legend-gradient)');
    
    // Update the legend labels
    d3.select('#legend-min').text('0');
    d3.select('#legend-max').text(maxValue.toLocaleString());
}




// Initialize the map when the page loads
document.addEventListener('DOMContentLoaded', initMap);
