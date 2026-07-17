import { Weather } from "../types/climate";

export type RiskAssessment = {
  overallRisk: "Low" | "Moderate" | "High" | "Extreme";
  heatStress: string;
  uvRisk: string;
  airQualityRisk: string;
};

function getHeatStress(feelsLike: number) {
  if (feelsLike >= 45) return "Extreme";
  if (feelsLike >= 38) return "High";
  if (feelsLike >= 32) return "Moderate";
  return "Low";
}

function getUVRisk(uv: number) {
  if (uv >= 11) return "Extreme";
  if (uv >= 8) return "Very High";
  if (uv >= 6) return "High";
  if (uv >= 3) return "Moderate";
  return "Low";
}

function getAirQualityRisk(aqi: number) {
  switch (aqi) {
    case 1:
      return "Good";
    case 2:
      return "Moderate";
    case 3:
      return "Unhealthy for Sensitive Groups";
    case 4:
      return "Unhealthy";
    case 5:
      return "Very Unhealthy";
    case 6:
      return "Hazardous";
    default:
      return "Unknown";
  }
}

export function assessRisk(
  weather: Weather
): RiskAssessment {
  const heatStress = getHeatStress(
    weather.feelsLike
  );

  const uvRisk = getUVRisk(weather.uv);

  const airQualityRisk = getAirQualityRisk(
    weather.airQuality
  );

  let overallRisk: RiskAssessment["overallRisk"] =
    "Low";

  if (
    heatStress === "Extreme" ||
    uvRisk === "Extreme"
  ) {
    overallRisk = "Extreme";
  } else if (
    heatStress === "High" ||
    uvRisk === "Very High"
  ) {
    overallRisk = "High";
  } else if (
    heatStress === "Moderate" ||
    uvRisk === "Moderate"
  ) {
    overallRisk = "Moderate";
  }

  return {
    overallRisk,
    heatStress,
    uvRisk,
    airQualityRisk,
  };
}