import { db } from "../db";
import { weatherCache } from "../db/schema";
import { eq } from "drizzle-orm";
import { fetchWeatherApi } from "openmeteo";

const CACHE_TTL_MINUTES = 30;
const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  // uvIndex: number;
  rainProbability: number;
  hourly: HourlyForecast[];
}

export interface HourlyForecast {
  time: Date;
  temperature: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  rainProbability: number;
}

function buildCacheKey(lat: number, lon: number): string {
  // round to 2dp so nearby locations share cache entries
  return `${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

// async function fetchFromOpenMeteo(
//   lat: number,
//   lon: number,
// ): Promise<WeatherData> {
//   const params = new URLSearchParams({
//     latitude: lat.toString(),
//     longitude: lon.toString(),

//     current: [
//       "temperature_2m",
//       "relative_humidity_2m",
//       "wind_speed_10m",
//       "uv_index",
//       "precipitation_probability",
//     ].join(","),
//     hourly: [
//       "temperature_2m",
//       "relative_humidity_2m",
//       "wind_speed_10m",
//       "uv_index",
//       "precipitation_probability",
//     ].join(","),
//     forecast_days: "1",
//     timezone: "auto",
//   });

//   const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);

//   if (!res.ok) {
//     throw new Error(`Open-Meteo error: ${res.status} ${res.statusText}`);
//   }

//   // figure out the shape of open meteo response data
//   const raw = await res.json();
//   const c = raw.current;
//   const hourly: HourlyForecast[] = raw.hourly;

//   return {
//     temperature: c.temperature_2m,
//     humidity: c.relative_humidity_2m,
//     windSpeed: c.wind_speed_10m,
//     uvIndex: c.uv_index,
//     rainProbability: c.precipitation_probability,
//     hourly,
//   };
// }

async function fetchFromOpenMeteo(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),

    // The info needed from open meteo
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "uv_index",
      "precipitation_probability",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "uv_index",
      "precipitation_probability",
    ].join(","),
    forecast_days: "1",
    timezone: "auto",
  });

  const responses = await fetchWeatherApi(OPEN_METEO_URL, params);

  return responses[0];
}

export async function getWeatherData(
  lat: number,
  lon: number,
): Promise<WeatherData> {
  const raw = await fetchFromOpenMeteo(lat, lon);
  const current = raw.current();
  const hourly = raw.hourly();

  if (current === null || hourly === null) {
    throw new Error(
      `No 'current' weather data and hourly weather data received from open-meteo response.`,
    );
  }

  const utcOffsetSeconds = raw.utcOffsetSeconds();

  const hourlyTimes = Array.from(
    {
      length:
        (Number(hourly.timeEnd()) - Number(hourly.time())) / hourly.interval(),
    },
    (_, i) =>
      new Date(
        (Number(hourly.time()) + i * hourly.interval() + utcOffsetSeconds) *
          1000,
      ),
  );

  // There as to be better way to handle this
  return {
    temperature: current.variables(0)!.value(), // temperature_2m
    humidity: current.variables(1)!.value(), // relative_humidity_2m
    windSpeed: current.variables(2)!.value(), // wind_speed_10m
    rainProbability: current.variables(3)!.value(), // precipitation
    hourly: hourlyTimes.map((time, i) => ({
      time,
      temperature: hourly.variables(0)!.valuesArray()![i], // temperature_2m
      humidity: hourly.variables(1)!.valuesArray()![i], // relative_humidity_2m
      windSpeed: hourly.variables(2)!.valuesArray()![i], // wind_speed_10m
      uvIndex: hourly.variables(3)!.valuesArray()![i], // uv_index
      rainProbability: hourly.variables(4)!.valuesArray()![i], // precipitation_probability
    })),
  };
}

export async function getWeather(
  lat: number,
  lon: number,
): Promise<WeatherData> {
  const cacheKey = buildCacheKey(lat, lon);

  // check cache first - check if there is any duplicate key
  const cached = await db
    .select()
    .from(weatherCache)
    .where(eq(weatherCache.id, cacheKey))
    .limit(1);

  if (cached.length > 0) {
    const entry = cached[0];
    // if its not expired, then return the cached data
    if (new Date() < new Date(entry.expiresAt)) {
      return entry.data as WeatherData;
    }
  }

  // if no cached data or cached data is expired, fetch fresh data
  const data = await getWeatherData(lat, lon);
  const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000);

  await db
    .insert(weatherCache)
    .values({
      id: cacheKey,
      lat,
      lon,
      data,
      expiresAt,
    })
    // upsert
    .onConflictDoUpdate({
      target: weatherCache.id,
      set: { data, fetchedAt: new Date(), expiresAt },
    });

  return data;
}
