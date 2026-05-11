import { SunDryConditions, HourlySunDryConditions } from "./influence";

// The main meat of the app
// Lots of work to be done here, need to do more research
// can we use Evotranspiration from open meteo api?

export type DryingScore = number;

export type DryingScoreGrade = "excellent" | "good" | "fair" | "poor";

export type DryingScoreAssessment = {
  score: DryingScore;
  grade: DryingScoreGrade;
  parameters: SunDryConditions;
};

export type DryingTimeWindow = {
  start: string;
  end: string;
};

export type SunDryWeatherAssessment = DryingScoreAssessment & {
  best_window: DryingTimeWindow;
};

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

function getScoreGrade(score: number): DryingScoreGrade {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "poor";
}

export function calculateScore(
  conditions: SunDryConditions,
): DryingScoreAssessment {
  const parameters = {
    temperature: scoreTemperature(conditions.temperature),
    humidity: scoreHumidity(conditions.humidity),
    windSpeed: scoreWindSpeed(conditions.windSpeed),
    uvIndex: scoreUvIndex(conditions.uvIndex),
    rainProbability: scoreRainProbability(conditions.rainProbability),
  };

  // each factor scores 0–100 independently,
  // then they're combined using a weighted average.
  // rain probability and humidity carry the most weight (25% each)
  // because they most directly prevent drying
  // you can have a hot sunny day but if rain is imminent or the air is saturated, clothes won't dry.
  // Temperature and UV index share 20% each as they drive the actual evaporation.
  // Wind gets 10%
  // will adjust overtime with feedback
  const score = Math.round(
    parameters.temperature * 0.2 +
      parameters.humidity * 0.25 +
      parameters.uvIndex * 0.2 +
      parameters.windSpeed * 0.1 +
      parameters.rainProbability * 0.25,
  );

  return {
    score,
    grade: getScoreGrade(score),
    parameters,
  };
}

// break down function
export function findBestWindow(
  hourly: HourlySunDryConditions[],
): DryingTimeWindow | null {
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
    start: hourly[bestStart].time.toString(),
    end: hourly[bestStart + bestLength - 1].time.toString(),
  };
}
