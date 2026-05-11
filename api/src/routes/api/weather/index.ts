import { FastifyPluginAsync } from "fastify";
import { Type } from "typebox";
import { getWeather } from "../../../services/weatherService";
import { calculateScore, findBestWindow } from "../../../services/scoring";

const QuerySchema = Type.Object({
  lat: Type.Number({ minimum: -90, maximum: 90 }),
  lon: Type.Number({ minimum: -180, maximum: 180 }),
});

const weather: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["weather"],
        querystring: QuerySchema,
        response: {
          200: Type.Object({
            current: Type.Object({
              score: Type.Number(),
              grade: Type.String(),
              temperature: Type.Number(),
              humidity: Type.Number(),
              // uxIndex: Type.Number(),
              windSpeed: Type.Number(),
              rainProbability: Type.Number(),
            }),
            bestWindow: Type.Union([
              Type.Object({
                start: Type.String(),
                end: Type.String(),
              }),
              Type.Null(),
            ]),
            hourly: Type.Array(
              Type.Object({
                time: Type.String(),
                score: Type.Number(),
                temperature: Type.Number(),
                humidity: Type.Number(),
                rainProbability: Type.Number(),
              }),
            ),
          }),
        },
      },
    },
    async (request) => {
      const { lat, lon } = request.query as { lat: number; lon: number };

      const weather = await getWeather(lat, lon);
      const { score, grade } = calculateScore(weather);
      const bestWindow = findBestWindow(weather.hourly);

      const hourly = weather.hourly.map((h) => {
        const { score: hourScore } = calculateScore(h);
        return {
          time: h.time,
          score: hourScore,
          temperature: h.temperature,
          humidity: h.humidity,
          rainProbability: h.rainProbability,
        };
      });

      return {
        current: {
          score,
          grade,
          temperature: weather.temperature,
          humidity: weather.humidity,
          // uvIndex: weather.uvIndex,
          windSpeed: weather.windSpeed,
          rainProbability: weather.rainProbability,
        },
        bestWindow,
        hourly,
      };
    },
  );
};

export default weather;
