// Initialize the map centered on Denmark
const map = L.map('map').setView([56.2639, 9.5018], 7);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Theme toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
const icon = themeToggle.querySelector('i');

// Check for saved theme preference or use system preference
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    body.classList.add('dark-theme');
    icon.classList.replace('fa-moon', 'fa-sun');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    }
});

// Sample data for demonstration
const regions = [
    { id: 1, name: 'Hovedstaden', lat: 55.8, lng: 12.5 },
    { id: 2, name: 'Sjælland', lat: 55.5, lng: 11.8 },
    { id: 3, name: 'Syddanmark', lat: 55.4, lng: 9.3 },
    { id: 4, name: 'Midtjylland', lat: 56.2, lng: 9.7 },
    { id: 5, name: 'Nordjylland', lat: 56.8, lng: 9.5 }
];

// Add regions to the map and dropdown
const regionSelect = document.getElementById('region-select');
const dataContent = document.getElementById('data-content');
const markers = [];

// Populate region dropdown
regions.forEach(region => {
    // Add to dropdown
    const option = document.createElement('option');
    option.value = region.id;
    option.textContent = region.name;
    regionSelect.appendChild(option);
    
    // Add marker to map
    const marker = L.marker([region.lat, region.lng])
        .addTo(map)
        .bindPopup(`<b>${region.name}</b><br>Klik for flere oplysninger`);
    
    marker.regionId = region.id;
    markers.push(marker);
    
    // Add click event to marker
    marker.on('click', () => {
        showRegionData(region.id);
    });
});

// Handle region selection from dropdown
regionSelect.addEventListener('change', (e) => {
    const regionId = parseInt(e.target.value);
    if (regionId) {
        const region = regions.find(r => r.id === regionId);
        if (region) {
            map.setView([region.lat, region.lng], 8);
            showRegionData(regionId);
        }
    }
});

// Function to display region data
function showRegionData(regionId) {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    
    // In a real app, you would fetch this data from your database
    const sampleData = {
        population: Math.floor(Math.random() * 1000000) + 500000,
        area: Math.floor(Math.random() * 10000) + 5000,
        municipalities: Math.floor(Math.random() * 20) + 5
    };
    
    dataContent.innerHTML = `
        <h3>${region.name}</h3>
        <p><strong>Befolkning:</strong> ${sampleData.population.toLocaleString('da-DK')}</p>
        <p><strong>Areal:</strong> ${sampleData.area.toLocaleString('da-DK')} km²</p>
        <p><strong>Kommuner:</strong> ${sampleData.municipalities}</p>
    `;
    
    // Highlight the selected region's marker
    markers.forEach(marker => {
        if (marker.regionId === regionId) {
            marker.openPopup();
        }
    });
}

// Add a click event to the map to clear selection
map.on('click', () => {
    regionSelect.value = '';
    dataContent.innerHTML = '<p>Vælg et område på kortet for at se data</p>';
});

// Add a scale control
L.control.scale({ imperial: false }).addTo(map);
