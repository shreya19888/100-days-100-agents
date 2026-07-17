export type Weather = {
  city: string;
  region: string;
  country: string;

  temperature: number;
  feelsLike: number;
  humidity: number;

  wind: number;
  uv: number;

  condition: string;
  icon: string;

  airQuality: number;
};

export type Assessment = {
  summary: string;

  recommendations: string[];

  hydration: string[];

  ppe: string[];

  warningSigns: string[];

  bestWorkWindow: string;
  avoidWorkWindow: string;
};

export type City = {
  id: number;
  name: string;
  region: string;
  country: string;

  lat: number;
  lon: number;
};