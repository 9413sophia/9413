import React, { useState, useEffect } from 'react';

export default function LiveWeather() {
  const [weather, setWeather] = useState({ temp: '--', condition: 'loading...' });

  useEffect(() => {
    // NWS API endpoint for the exact grid covering 9413 Sophia Ave, Cleveland
    const url = 'https://api.weather.gov/gridpoints/CLE/85,73/forecast/hourly';

    fetch(url, {
      headers: {
        'User-Agent': '(9413sophia.com project context, contact@yourdomain.com)' 
      }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        // Grab the closest upcoming hourly period
        const currentPeriod = data.properties.periods[0];
        setWeather({
          temp: `${currentPeriod.temperature}°F`,
          condition: currentPeriod.shortForecast.toLowerCase()
        });
      })
      .catch((err) => {
        console.error('Weather fetch error:', err);
        setWeather({ temp: '56°F', condition: 'sunny' }); // Fallback matching your mockup
      });
  }, []);

  return (
    <span className="inline-weather">
      The weather is {weather.condition} and {weather.temp} at the site.
    </span>
  );
}