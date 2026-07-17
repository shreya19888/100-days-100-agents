type Weather = {
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

type WeatherCardsProps = {
  weather: Weather | null;
};

function getUVBadge(uv: number) {
  if (uv <= 2)
    return {
      label: "Low",
      color: "bg-green-100 text-green-700",
    };

  if (uv <= 5)
    return {
      label: "Moderate",
      color: "bg-yellow-100 text-yellow-700",
    };

  if (uv <= 7)
    return {
      label: "High",
      color: "bg-orange-100 text-orange-700",
    };

  return {
    label: "Very High",
    color: "bg-red-100 text-red-700",
  };
}

function getAQILabel(index: number) {
  switch (index) {
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

export default function WeatherCards({
  weather,
}: WeatherCardsProps) {
  if (!weather) return null;

  const uv = getUVBadge(weather.uv);

  return (
    <section className="mt-8 rounded-3xl bg-white p-8 shadow-sm">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-bold">
            Today's Conditions
          </h2>

          <p className="mt-2 text-slate-500">
            {weather.city}, {weather.region},{" "}
            {weather.country}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={weather.icon}
            alt={weather.condition}
            className="h-20 w-20"
          />

          <div>
            <p className="text-lg font-semibold">
              {weather.condition}
            </p>

            <p className="text-5xl font-bold">
              {weather.temperature}°C
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Feels Like"
          value={`${weather.feelsLike}°C`}
        />

        <MetricCard
          title="Humidity"
          value={`${weather.humidity}%`}
        />

        <MetricCard
          title="Wind"
          value={`${weather.wind} km/h`}
        />

        <MetricCard
          title="UV Index"
          value={weather.uv.toString()}
        >
          <span
            className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-medium ${uv.color}`}
          >
            {uv.label}
          </span>
        </MetricCard>

        <MetricCard
          title="Air Quality"
          value={getAQILabel(weather.airQuality)}
        />

        <MetricCard
          title="Country"
          value={weather.country}
        />

        <MetricCard
          title="Region"
          value={weather.region}
        />

        <MetricCard
          title="Condition"
          value={weather.condition}
        />
      </div>
    </section>
  );
}

type MetricCardProps = {
  title: string;
  value: string;
  children?: React.ReactNode;
};

function MetricCard({
  title,
  value,
  children,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>

      {children}
    </div>
  );
}