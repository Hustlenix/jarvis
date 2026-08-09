import assert from 'node:assert';
import { describe, it } from 'node:test';

import { describeWeatherCode, getCityWeather } from '../../../agent/tools/weather.js';

describe('describeWeatherCode', () => {
  it('maps known codes', () => {
    assert.strictEqual(describeWeatherCode(0), 'clear sky');
    assert.strictEqual(describeWeatherCode(2), 'partly cloudy');
    assert.strictEqual(describeWeatherCode(63), 'rain');
    assert.strictEqual(describeWeatherCode(95), 'thunderstorm');
  });

  it('falls back for unknown codes', () => {
    assert.strictEqual(describeWeatherCode(999), 'unknown conditions');
  });
});

describe('getCityWeather', () => {
  const fakeClient = (place, current) => ({
    get: async (url) => {
      if (url.includes('geocoding-api')) return { data: { results: [place] } };
      return { data: { current } };
    },
  });

  it('formats weather for a found city', async () => {
    const client = fakeClient(
      { latitude: 12.97, longitude: 77.59, name: 'Bengaluru', country: 'India' },
      { temperature_2m: 27.4, relative_humidity_2m: 60.2, wind_speed_10m: 11.9, weather_code: 2 },
    );
    const result = await getCityWeather('bengaluru', client);
    assert.ok(result.includes('Bengaluru, India'));
    assert.ok(result.includes('27°C'));
    assert.ok(result.includes('partly cloudy'));
    assert.ok(result.includes('60%'));
  });

  it('reports unknown cities', async () => {
    const client = { get: async () => ({ data: { results: [] } }) };
    const result = await getCityWeather('atlantis', client);
    assert.ok(result.includes('Could not find'));
  });

  it('handles API errors gracefully', async () => {
    const client = {
      get: async () => {
        throw new Error('offline');
      },
    };
    const result = await getCityWeather('paris', client);
    assert.ok(result.includes('unreachable'));
  });
});
