import { getWeather, HourlyForecast } from "./weatherForecast";
export type SunDryConditions = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  rainProbability: number;
};

export type CurrentSunDryConditions = SunDryConditions;
export type HourlySunDryConditions = SunDryConditions & { time: Date };
export type SunDryConditionsSnapshot = {
  current: CurrentSunDryConditions;
  hourly: HourlySunDryConditions[];
};

export async function getCurrentConditions() {}

export function getHourlyConditions(forecast: HourlyForecast[]) {
  return forecast.map((h) => {
    return {
      time: h.time,
      temperature: h.temperature,
      humidity: h.humidity,
      windSpeed: h.windSpeed,
      uvIndex: h.uvIndex,
      rainProbability: h.rainProbability,
    };
  });
}

export async function getSunDryConditionsSnapshot(
  latitude: number,
  longitude: number,
): Promise<SunDryConditionsSnapshot> {
  const forecast = await getWeather(latitude, longitude);
  // will probably run some checks here
  if (!forecast) {
    return {
      current: {
        temperature: 0,
        humidity: 0,
        windSpeed: 0,
        uvIndex: 0,
        rainProbability: 0,
      },
      hourly: [],
    };
  }

  return {
    current: {
      temperature: forecast.temperature,
      humidity: forecast.humidity,
      windSpeed: forecast.windSpeed,
      uvIndex: forecast.uvIndex,
      rainProbability: forecast.rainProbability,
    },
    hourly: getHourlyConditions(forecast.hourly),
  };
}
