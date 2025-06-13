# Danmarkskortet

Interactive map visualization of Denmark showing demographic data across municipalities and regions.

## Features

- Interactive map of Denmark with zoom and pan functionality
- Color-coded visualization of different demographic metrics
- Tooltips showing detailed information on hover
- Responsive design that works on desktop and tablet devices
- Time-series data visualization with date selector

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/danmarkskortet.git
   cd danmarkskortet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:5000`

## Data Sources

- Municipality boundaries: [Dataforsyningen](https://dataforsyningen.dk/)
- Demographic data: Sample data (can be replaced with real data from Statistics Denmark)

## Project Structure

```
danmarkskortet/
├── public/                 # Static files
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript files
│   └── index.html         # Main HTML file
├── data/                  # Data files
├── server.js              # Express server
└── package.json           # Project configuration
```

## Available Scripts

- `npm start` - Start the development server
- `npm run dev` - Start the development server with nodemon

## Built With

- [D3.js](https://d3js.org/) - Data visualization library
- [Express](https://expressjs.com/) - Web application framework
- [TopoJSON](https://github.com/topojson/topojson) - Extension of GeoJSON for topology

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to Dataforsyningen for providing open geographic data
- Inspired by similar data visualization projects
