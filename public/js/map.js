// Configuration
const CONFIG = {
    width: 900,
    height: 1000,
    colors: {
        defaultFill: '#dddddd',
        highlight: '#FFA500',
        border: '#ffffff',
        hover: '#FFD700'
    },
    colorScales: {
        population: d3.scaleSequential()
            .domain([0, 10000]) // Will be updated with actual data
            .interpolator(d3.interpolateBlues),
        density: d3.scaleSequential()
            .domain([0, 500]) // Will be updated with actual data
            .interpolator(d3.interpolateGreens),
        households: d3.scaleSequential()
            .domain([0, 5000]) // Will be updated with actual data
            .interpolator(d3.interpolateOranges)
    }
};

// Global variables
let mapData = null;
let demographicData = {};
let currentView = 'municipalities';
let currentDataType = 'population';
let currentDate = '2024-01-01';

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Load the map data
    await loadMapData();
    
    // Load demographic data
    await loadDemographicData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial render
    updateMap();
});

// Load map data from GeoJSON
async function loadMapData() {
    try {
        // For now, we'll use a simplified version of Denmark's municipalities
        // In a real application, you would load this from a proper GeoJSON file
        const response = await fetch('https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/denmark-municipalities.geojson');
        if (!response.ok) throw new Error('Failed to load map data');
        
        const data = await response.json();
        mapData = data;
        
        // Initialize the map
        initMap();
    } catch (error) {
        console.error('Error loading map data:', error);
        alert('Failed to load map data. Please try again later.');
    }
}

// Load demographic data from our generated CSV
async function loadDemographicData() {
    try {
        // For now, we'll use the data from the Python script
        // In a real application, you would load this from your database or API
        const response = await fetch('data/danish_region_municipality_demo_mock.csv');
        if (!response.ok) throw new Error('Failed to load demographic data');
        console.log(response);
        const csvText = await response.text();
        const rows = d3.csvParse(csvText, d3.autoType);
        
        // Process the data into a more usable format
        processDemographicData(rows);
    } catch (error) {
        console.error('Error loading demographic data:', error);
        // Continue without demographic data
    }
}

// Process demographic data into a more usable format
function processDemographicData(rows) {
    demographicData = {};
    rows.forEach(row => {
        const key = `${row.municipality}_${row.date}`;
        if (!demographicData[key]) {
            demographicData[key] = {
                municipality: row.municipality,
                date: row.date,
                pop_total: 0,
                pop_male: 0,
                pop_female: 0,
                births: 0,
                deaths: 0,
                immigration: 0,
                emigration: 0,
                households: 0
            };
        }
        // Aggregate data by municipality and date
        const data = demographicData[key];
        data.pop_total += row.pop_total || 0;
        data.pop_male += row.pop_male || 0;
        data.pop_female += row.pop_female || 0;
        data.births += row.births || 0;
        data.deaths += row.deaths || 0;
        data.immigration += row.immigration || 0;
        data.emigration += row.emigration || 0;
        data.households += row.households || 0;
    });
    
    // Update the color scale domains based on the data
    updateColorScales();
}

// Update color scales based on the data
function updateColorScales() {
    const values = Object.values(demographicData)
        .filter(d => d.date === currentDate)
        .map(d => d.pop_total);
    
    if (values.length > 0) {
        CONFIG.colorScales.population.domain([d3.min(values), d3.max(values)]);
    }
    
    // Similar updates for other scales would go here
}

// Initialize the map
function initMap() {
    // Create SVG container
    const svg = d3.select('#map-container')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${CONFIG.width} ${CONFIG.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add a group for the map features
    const g = svg.append('g');
    
    // Create a projection
    const projection = d3.geoMercator()
        .fitSize([CONFIG.width, CONFIG.height], mapData);
    
    // Get the center of the map in pixel coordinates
    const center = projection([11.5, 56]); // Approximate center of Denmark
    
    // Create a path generator
    const path = d3.geoPath().projection(projection);
    
    // Draw the map
    g.selectAll('path')
        .data(mapData.features)
        .enter()
        .append('path')
        .attr('class', 'municipality')
        .attr('d', path)
        .attr('data-name', d => d.properties.name)
        .style('fill', CONFIG.colors.defaultFill)
        .style('stroke', CONFIG.colors.border)
        .style('stroke-width', 0.5)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut)
        .on('click', handleClick);
    
    // Add zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([0.7, 8])  // Allow zooming out to 0.5x (50%)
        .on('zoom', (event) => {
            g.attr('transform', event.transform);
        });
    
    // Set initial zoom and center
    const initialScale = 0.8;
    const [width, height] = [CONFIG.width, CONFIG.height];
    
    // Center the map
    svg.call(zoom.transform, d3.zoomIdentity
        .translate(width / 2 - center[0] * initialScale, height / 2 - center[1] * initialScale)
        .scale(initialScale)
    );
    
    // Apply the zoom behavior
    svg.call(zoom);
    
    // Add a reset zoom button
    addResetZoomButton(svg, g, zoom);
}

// Handle mouseover event on municipalities
function handleMouseOver(event, d) {
    const name = d.properties.name;
    const data = getDemographicDataForMunicipality(name);
    
    // Highlight the hovered municipality
    d3.select(this)
        .style('stroke', CONFIG.colors.highlight)
        .style('stroke-width', 2);
    
    // Show tooltip
    const tooltip = d3.select('#tooltip');
    tooltip
        .style('opacity', 1)
        .html(`
            <strong>${name}</strong><br>
            Population: ${data ? data.pop_total.toLocaleString() : 'N/A'}<br>
            Households: ${data ? data.households.toLocaleString() : 'N/A'}
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
}

// Handle mouseout event on municipalities
function handleMouseOut() {
    // Reset the hover effect
    d3.select(this)
        .style('stroke', CONFIG.colors.border)
        .style('stroke-width', 0.5);
    
    // Hide tooltip
    d3.select('#tooltip').style('opacity', 0);
}

// Handle click event on municipalities
function handleClick(event, d) {
    const name = d.properties.name;
    const data = getDemographicDataForMunicipality(name);
    
    // Update the details panel
    updateDetailsPanel(name, data);
}

// Get demographic data for a specific municipality and date
function getDemographicDataForMunicipality(municipality) {
    const key = `${municipality}_${currentDate}`;
    return demographicData[key] || null;
}

// Update the details panel with information about the selected municipality
function updateDetailsPanel(municipality, data) {
    const panel = d3.select('#region-info');
    
    if (!data) {
        panel.html(`<p>No data available for ${municipality}</p>`);
        return;
    }
    
    panel.html(`
        <h3>${municipality}</h3>
        <p><strong>Population:</strong> ${data.pop_total.toLocaleString()}</p>
        <p><strong>Male:</strong> ${data.pop_male.toLocaleString()} 
           (${(data.pop_male / data.pop_total * 100).toFixed(1)}%)</p>
        <p><strong>Female:</strong> ${data.pop_female.toLocaleString()} 
           (${(data.pop_female / data.pop_total * 100).toFixed(1)}%)</p>
        <p><strong>Households:</strong> ${data.households.toLocaleString()}</p>
        <p><strong>Births (annual):</strong> ${(data.births * 12).toLocaleString()}</p>
        <p><strong>Deaths (annual):</strong> ${(data.deaths * 12).toLocaleString()}</p>
        <p><strong>Net Migration (annual):</strong> 
           ${((data.immigration - data.emigration) * 12).toLocaleString()}</p>
    `);
}

// Add a reset zoom button to the map
function addResetZoomButton(svg, g, zoom) {
    const button = svg.append('g')
        .attr('class', 'reset-zoom')
        .style('opacity', 0)
        .style('cursor', 'pointer')
        .on('click', () => {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        });
    
    button.append('rect')
        .attr('x', 10)
        .attr('y', 10)
        .attr('width', 100)
        .attr('height', 30)
        .attr('rx', 5)
        .style('fill', 'white')
        .style('stroke', '#999')
        .style('stroke-width', 1);
    
    button.append('text')
        .attr('x', 60)
        .attr('y', 30)
        .text('Reset Zoom')
        .style('text-anchor', 'middle')
        .style('font-size', '12px');
    
    // Show/hide button based on zoom
    svg.call(zoom).on('zoom', (event) => {
        if (event.transform.k > 1) {
            button.transition().style('opacity', 1);
        } else {
            button.transition().style('opacity', 0);
        }
    });
}

// Setup event listeners for the UI controls
function setupEventListeners() {
    // Data type selector
    d3.select('#data-selector')
        .on('change', function() {
            currentDataType = this.value;
            updateMap();
        });
    
    // Year selector
    d3.select('#year-selector')
        .on('change', function() {
            currentDate = this.value;
            updateMap();
        });
}

// Update the map based on the current selections
function updateMap() {
    // Update the color scale domain based on the current data
    updateColorScales();
    
    // Update the fill color of each municipality
    d3.selectAll('.municipality')
        .style('fill', d => {
            const name = d.properties.name;
            const data = getDemographicDataForMunicipality(name);
            
            if (!data) return CONFIG.colors.defaultFill;
            
            // Use the appropriate color scale based on the current data type
            switch (currentDataType) {
                case 'population':
                    return CONFIG.colorScales.population(data.pop_total);
                case 'density':
                    // In a real app, you would calculate density here
                    return CONFIG.colorScales.density(data.pop_total / 100);
                case 'households':
                    return CONFIG.colorScales.households(data.households);
                default:
                    return CONFIG.colors.defaultFill;
            }
        });
    
    // Update the legend
    updateLegend();
}

// Update the legend based on the current data type and values
function updateLegend() {
    const legend = d3.select('#legend');
    legend.html(''); // Clear existing legend
    
    const title = legend.append('div')
        .style('font-weight', 'bold')
        .style('margin-bottom', '5px');
    
    let values = [];
    
    // Set title and get values based on data type
    switch (currentDataType) {
        case 'population':
            title.text('Population');
            values = [0, 2500, 5000, 7500, 10000];
            break;
        case 'density':
            title.text('Density (per km²)');
            values = [0, 100, 200, 300, 400, 500];
            break;
        case 'households':
            title.text('Households');
            values = [0, 1000, 2000, 3000, 4000, 5000];
            break;
    }
    
    // Add color scale to legend
    values.forEach((d, i) => {
        if (i < values.length - 1) {
            const item = legend.append('div')
                .attr('class', 'legend-item');
                
            item.append('div')
                .attr('class', 'legend-color')
                .style('background', () => {
                    switch (currentDataType) {
                        case 'population':
                            return CONFIG.colorScales.population(d);
                        case 'density':
                            return CONFIG.colorScales.density(d);
                        case 'households':
                            return CONFIG.colorScales.households(d);
                        default:
                            return CONFIG.colors.defaultFill;
                    }
                });
                
            item.append('div')
                .text(d.toLocaleString() + (i < values.length - 1 ? ' - ' + values[i + 1].toLocaleString() : '+'));
        }
    });
}

// Helper function to get color based on value and data type
function getColorForValue(value, dataType) {
    switch (dataType) {
        case 'population':
            return CONFIG.colorScales.population(value);
        case 'density':
            return CONFIG.colorScales.density(value);
        case 'households':
            return CONFIG.colorScales.households(value);
        default:
            return CONFIG.colors.defaultFill;
    }
}
