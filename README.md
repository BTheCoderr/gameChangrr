# Game Changer Map Application

A full-stack application that displays various data layers on a Google Maps interface, including utility boundaries, solar permits, EV charging stations, and demographic data.

## Current Deployment

* Frontend: Deployed on Netlify
* Backend: Deployed on Heroku

## Live URLs

* Frontend: Netlify App
* Backend: Heroku API

## Environment Setup

### Frontend (.env)

```
VITE_API_URL=https://game-changer-map-api-4530bd9b4dbb.herokuapp.com
VITE_GOOGLE_MAPS_API_KEY=your_key
```

### Backend (.env on Heroku)

```
GOOGLE_MAPS_API_KEY=your_key
NREL_API_KEY=your_key
CENSUS_API_KEY=your_key
ATTOM_API_KEY=your_key
MASS_DATA_API_KEY=your_key
FRONTEND_URL=https://game-changer-map.netlify.app
```

## Deployment Instructions

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Configure build settings:  
   * Build command: `npm run build`  
     * Publish directory: `dist`
3. Add environment variables in Netlify's dashboard
4. Deploy!

### Backend (Heroku)

1. Create a new Heroku app
2. Connect your GitHub repository
3. Add environment variables in Heroku's settings
4. Deploy from GitHub main branch

## Available Data Layers

* Leads
* Neighborhood Insights
* Utility Boundaries
* Solar Permits
* Move Ins
* City Boundaries
* Spanish Speakers
* Manufactured Homes
* EV Owners

## API Endpoints

### Health Check

```
GET /health
```

### NREL API (EV Charging Stations)

```
GET /api/nrel/stations
```

### Utility Boundaries

```
GET /api/utility/boundaries
```

### Census Data

```
GET /api/census/fips
GET /api/census/demographics
```

## Local Development

### Frontend

```bash
cd game-changer
npm install
npm run dev
```

### Backend

```bash
cd game-changer/server
npm install
npm run dev
```

## Troubleshooting

### Port Issues

If port 3000 is in use:

```bash
lsof -ti :3000 | xargs kill -9
```

### API Issues

* Verify all API keys are correctly set in both frontend and backend .env files
* Check CORS settings in backend if API calls fail

## Future Plans

We plan to explore using Leaflet or Mapbox for map rendering while keeping the current Google Maps integration intact. This will allow us to compare performance and features.

## About

No description, website, or topics provided.

### Resources

Readme

### License

MIT license

Activity

### Stars

**0** stars

### Watchers

**1** watching

### Forks

**0** forks

Report repository

## Releases

No releases published

## Packages0

No packages published

## Languages

* JavaScript 98.3%
* CSS 1.2%
* Other 0.5%

## Footer

© 2025 GitHub, Inc.

### Footer navigation

* Terms
* Privacy
* Security
* Status
* Docs
* Contact
* Manage cookies
* Do not share my personal information

You can’t perform that action at this time.
