import { db } from "../db";
import { weatherCache } from "../db/schema";
import { eq } from "drizzle-orm";
import { fetchWeatherApi } from "openmeteo";

export interface CustomWeatherForecast {
  temperature: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
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

/// get custom weather forecast from cache or re-fetch
export async function getWeather(
  lat: number,
  lon: number,
): Promise<CustomWeatherForecast> {
  const cacheKey = buildCacheKey(lat, lon);

  // retrieve from cache first.
  const cached = await db
    .select()
    .from(weatherCache)
    .where(eq(weatherCache.id, cacheKey))
    .limit(1);

  if (cached.length > 0) {
    const entry = cached[0];
    // check if its expired
    if (new Date() < new Date(entry.expiresAt)) {
      return entry.data as CustomWeatherForecast;
    }
  }

  // if no cached/expired forecast, fetch fresh data and cache it
  const data = await fetchCustomWeatherForecast(lat, lon);
  await addForecastToCache(cacheKey, lat, lon, data);
  return data;
}

async function addForecastToCache(
  key: string,
  lat: number,
  lon: number,
  data: CustomWeatherForecast,
) {
  const CACHE_TTL_MINUTES = 30; //minutes
  const expiresAt = new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000);
  await db
    .insert(weatherCache)
    .values({
      id: key,
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
}

function buildCacheKey(lat: number, lon: number): string {
  // round to 2dp so nearby locations share cache entries
  return `lksh-wth-che-${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

// we receive so much information from the weather api.
// restructure to get only what we need in a nice format.
async function fetchCustomWeatherForecast(
  lat: number,
  lon: number,
): Promise<CustomWeatherForecast> {
  const raw = await fetchExternalAPIWeather(lat, lon);
  const current = raw.current();
  const hourly = raw.hourly();
  const daily = raw.daily();

  if (current === null || hourly === null || daily === null) {
    throw new Error(
      `No 'current' weather data and hourly weather data received from open-meteo response.`,
    );
  }

  const utcOffsetSeconds = raw.utcOffsetSeconds();

  //
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
    uvIndex: daily.variables(0)!.value(), // uv_index_max
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

async function fetchExternalAPIWeather(lat: number, lon: number) {
  // Using open-meteo https://open-meteo.com/en/docs
  const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    // The info from open meteo we need.
    daily: ["uv_index_max"],
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
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
  // don't know why open meteo returns an array of responses. only need the first response
  return responses[0];
}
