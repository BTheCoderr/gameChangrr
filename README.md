# GameChangrr

A comprehensive solar installation and property analysis tool.

## Features

- Interactive map with property data visualization
- Solar potential analysis using NREL data
- Real-time weather information
- Property details from Regrid
- Census demographic data
- Move-in tracking and analysis

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/gamechangrr.git
cd gamechangrr
```

2. Install dependencies:
```bash
npm install
```

3. Set up API keys:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Get API keys from:
     - [Mapbox](https://account.mapbox.com/)
     - [Census Bureau](https://api.census.gov/data/key_signup.html)
     - [NREL](https://developer.nrel.gov/signup/)
     - [OpenWeatherMap](https://openweathermap.org/api)
     - [Regrid](https://regrid.com/api)
   - Add your API keys to `.env`

4. Start the development server:
```bash
npm run dev
```

## API Integration

### Mapbox
- Used for base map rendering
- Custom layers for data visualization
- Geocoding and address search

### Census Bureau API
- Demographic data by census tract
- Population statistics
- Income and housing data

### NREL Solar API
- Solar radiation data
- PV system performance estimates
- Energy production forecasts

### OpenWeatherMap
- Current weather conditions
- 5-day weather forecast
- Cloud cover and solar impact

### Regrid
- Property boundaries
- Ownership information
- Land use and zoning data

## Development

### Adding New Features
1. Create a new service in `src/services/`
2. Add API configuration in `src/config/api.js`
3. Create components in `src/components/`
4. Update the map or UI as needed

### Mock Data
- Set `VITE_USE_MOCK_DATA=true` for development
- Mock implementations available in each service
- Cached responses to reduce API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details
