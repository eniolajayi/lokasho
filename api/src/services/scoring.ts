import { WeatherData, HourlyForecast } from "./weatherService";

export interface ScoreBreakdown {
  temperature: number;
  humidity: number;
  // uvIndex: number;
  windSpeed: number;
  rainProbability: number;
}

export interface DryingScore {
  score: number;
  grade: "excellent" | "good" | "fair" | "poor";
  breakdown: ScoreBreakdown;
  bestWindow: { start: string; end: string } | null;
}

// What's the best score for drying stuff. need to add rationale for this values
function scoreTemperature(temp: number): number {
  if (temp >= 25) return 100;
  if (temp >= 18) return 80;
  if (temp >= 12) return 50;
  if (temp >= 5) return 20;
  return 0;
}

// humidity
function scoreHumidity(humidity: number): number {
  if (humidity <= 40) return 100;
  if (humidity <= 55) return 80;
  if (humidity <= 65) return 60;
  if (humidity <= 75) return 30;
  return 0;
}

// weather uvIndex
function scoreUvIndex(uv: number): number {
  if (uv >= 6) return 100;
  if (uv >= 3) return 80;
  if (uv >= 1) return 50;
  return 20;
}

function scoreWindSpeed(wind: number): number {
  // km/h light breeze is ideal, too still or too strong is worse
  if (wind >= 10 && wind <= 30) return 100;
  if (wind >= 5 && wind < 10) return 70;
  if (wind > 30 && wind <= 50) return 50;
  if (wind < 5) return 30;
  return 10; // Very high wind
}

function scoreRainProbability(rainProb: number): number {
  if (rainProb <= 10) return 100;
  if (rainProb <= 25) return 70;
  if (rainProb <= 50) return 30;
  return 0;
}

function gradeFromScore(score: number): DryingScore["grade"] {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

// need to use UV index
export function calculateScore(
  data: Pick<
    WeatherData,
    "temperature" | "humidity" | "windSpeed" | "rainProbability"
  >,
): DryingScore {
  const breakdown = {
    temperature: scoreTemperature(data.temperature),
    humidity: scoreHumidity(data.humidity),
    windSpeed: scoreWindSpeed(data.windSpeed),
    rainProbability: scoreRainProbability(data.rainProbability),
  };

  // weighted average, rain and humidity matter most
  const score = Math.round(
    breakdown.temperature * 0.2 +
      breakdown.humidity * 0.25 +
      breakdown.windSpeed * 0.1 +
      breakdown.rainProbability * 0.25,
  );

  return {
    score,
    grade: gradeFromScore(score),
    breakdown,
    bestWindow: null, // to fix
  };
}

// break down function
export function findBestWindow(
  hourly: HourlyForecast[],
): { start: string; end: string } | null {
  // find the longest consecutive run of hours with score >= 60

  // algorithm needs more comment
  let bestStart = -1;
  let bestLength = 0;
  let currentStart = -1;
  let currentLength = 0;

  hourly.forEach((hour, i) => {
    const { score } = calculateScore(hour);

    // if we get a decent score
    if (score >= 60) {
      if (currentStart === -1) currentStart = i;
      currentLength++;
      if (currentLength > bestLength) {
        bestLength = currentLength;
        bestStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLength = 0;
    }
  });

  if (bestStart === -1 || bestLength < 2) return null;

  return {
    start: hourly[bestStart].time.toDateString(),
    end: hourly[bestStart + bestLength - 1].time.toDateString(),
  };
}
