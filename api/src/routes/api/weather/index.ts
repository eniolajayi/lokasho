import { FastifyPluginAsync } from "fastify";
import { Type } from "typebox";
import { getWeather } from "../../../services/weatherForecast";
import { getAssessment } from "../../../services/scoring";
import { getSunDryConditionsSnapshot } from "../../../services/influence";

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
              grade: Type.String(),
              temperature: Type.Number(),
              humidity: Type.Number(),
              uxIndex: Type.Number(),
              windSpeed: Type.Number(),
              rainProbability: Type.Number(),
            }),
            hourly: Type.Array(
              Type.Object({
                time: Type.String(),
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

      return {
        current: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          uvIndex: weather.uvIndex,
          windSpeed: weather.windSpeed,
          rainProbability: weather.rainProbability,
        },
        hourly: weather.hourly,
      };
    },
  );
  fastify.get(
    "/check",
    {
      schema: {
        tags: ["weather"],
        querystring: QuerySchema,
        response: {
          200: Type.Object({
            score: Type.Number(),
            grade: Type.Number(),
            parameters: Type.Object({
              grade: Type.String(),
              temperature: Type.Number(),
              humidity: Type.Number(),
              uxIndex: Type.Number(),
              windSpeed: Type.Number(),
              rainProbability: Type.Number(),
            }),
            best_window: Type.Object({
              start: Type.String(),
              end: Type.String(),
              closed: Type.Boolean(),
            }),
          }),
        },
      },
    },
    async (request) => {
      const { lat, lon } = request.query as { lat: number; lon: number };
      const snapshot = await getSunDryConditionsSnapshot(lat, lon);
      const assessment = getAssessment(snapshot);
      return assessment;
    },
  );
};

export default weather;
