export interface SunDryConditions {
  temperature: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  rainProbability: number;
}

export type CurrentSunDryConditions = SunDryConditions;
export type HourlySunDryConditions = SunDryConditions & { time: Date };
export type SunDryConditionsSnapshot = {
  current: CurrentSunDryConditions;
  hourly: HourlySunDryConditions[];
};

export async function getCurrentConditions() {}

export async function getHourlyConditions() {}
export async function getSunDryConditionsSnapshot(
  latitude: number,
  longitude: number,
): Promise<SunDryConditionsSnapshot> {
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
