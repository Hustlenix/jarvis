import { tool } from '@openai/agents';
import { z } from 'zod';

/** WMO weather code to plain-English description. @type {Record<number, string>} */
const WEATHER_CODES = {
  0: 'clear sky',
  1: 'mainly clear',
  2: 'partly cloudy',
  3: 'overcast',
  45: 'foggy',
  48: 'icy fog',
  51: 'light drizzle',
  53: 'drizzle',
  55: 'heavy drizzle',
  56: 'freezing drizzle',
  57: 'heavy freezing drizzle',
  61: 'light rain',
  63: 'rain',
  65: 'heavy rain',
  66: 'freezing rain',
  67: 'heavy freezing rain',
  71: 'light snow',
  73: 'snow',
  75: 'heavy snow',
  77: 'snow grains',
  80: 'light rain showers',
  81: 'rain showers',
  82: 'violent rain showers',
  85: 'snow showers',
  86: 'heavy snow showers',
  95: 'thunderstorm',
  96: 'thunderstorm with light hail',
  99: 'thunderstorm with heavy hail',
};

/** @param {number} code */
export function describeWeatherCode(code) {
  return WEATHER_CODES[code] || 'unknown conditions';
}

/**
 * Get the current weather for a city using Open-Meteo (free, no API key).
 * @param {string} city
 * @param {Pick<typeof import('axios').default, 'get'>} client axios-like client, injectable for tests
 * @returns {Promise<string>}
 */
export async function getCityWeather(city, client) {
  try {
    const geo = await client.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
    );
    const place = geo.data?.results?.[0];
    if (!place) {
      return `Could not find a place called "${city}".`;
    }

    const { latitude, longitude, name, country } = place;
    const forecast = await client.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
    );
    const current = forecast.data?.current;
    if (!current) {
      return `Weather data is unavailable for ${name} right now.`;
    }

    const temp = Math.round(current.temperature_2m);
    const humidity = Math.round(current.relative_humidity_2m);
    const wind = Math.round(current.wind_speed_10m);
    return (
      `Weather in ${name}${country ? `, ${country}` : ''}: ${temp}°C, ${describeWeatherCode(current.weather_code)}. ` +
      `Humidity ${humidity}%, wind ${wind} km/h.`
    );
  } catch (_err) {
    return 'Weather service is unreachable right now — try again in a bit.';
  }
}

/** Weather tool for Jarvis. */
export const weather = tool({
  name: 'get_weather',
  description:
    'Get the current weather for a city: temperature, conditions, humidity, and wind. ' +
    'Use this when the user asks about the weather anywhere in the world.',
  parameters: z.object({
    city: z.string().describe("The city name, e.g. 'San Francisco' or 'Bengaluru'."),
  }),
  execute: async ({ city }) => getCityWeather(city, (await import('axios')).default),
});
