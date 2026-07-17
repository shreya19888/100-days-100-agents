# 🌤️ Climate Pulse AI


**Day 002 of the 100 Days • 100 AI Agents Challenge**

Climate Pulse AI is an AI-powered outdoor safety assistant that helps workers make safer decisions based on real-time weather conditions.

Instead of simply displaying weather information, the application combines live weather data, a deterministic risk assessment engine, and GPT-5.5 to generate personalized occupational safety recommendations.

---

## 🚀 Features

- 🌍 Live weather data powered by WeatherAPI
- 🔍 City autocomplete search
- 👷 Occupation-specific recommendations
- 🌡️ Weather dashboard with:
  - Temperature
  - Feels Like
  - Humidity
  - Wind Speed
  - UV Index
  - Air Quality
- 🧠 Deterministic Climate Risk Engine
- 🤖 AI-generated safety assessment using GPT-5.5
- 💧 Personalized hydration recommendations
- 🦺 PPE recommendations
- ⚠️ Warning signs to monitor
- 🕒 Recommended work windows
- 📱 Responsive UI built with Tailwind CSS

---

## 🏗️ Architecture

```
                WeatherAPI
                     │
                     ▼
           Next.js API Route
                     │
                     ▼
        Deterministic Risk Engine
                     │
                     ▼
              GPT-5.5 Assessment
                     │
                     ▼
          Climate Pulse Dashboard
```

The application intentionally separates deterministic business logic from AI reasoning.

- The **Risk Engine** calculates objective climate risk.
- GPT-5.5 focuses on generating human-friendly recommendations.

This architecture produces more consistent and explainable AI outputs.

---

## 🛠 Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons

### Backend

- Next.js Route Handlers
- WeatherAPI
- OpenAI GPT-5.5

---

## 📂 Project Structure

```
app/
 ├── api/
 │    ├── weather/
 │    ├── assessment/
 │    └── search-city/
 │
 ├── page.tsx
 │
components/
 ├── Header.tsx
 ├── PersonaSelector.tsx
 ├── SearchBar.tsx
 ├── WeatherCards.tsx
 └── AIRecommendation.tsx
 │
lib/
 └── riskEngine.ts
 │
types/
 └── climate.ts
```

---

## ⚙️ Environment Variables

Create a `.env.local` file.

```env
WEATHERAPI_API_KEY=your_weatherapi_key
OPENAI_API_KEY=your_openai_api_key
```

---

## ▶️ Getting Started

Install dependencies

```bash
npm install
```

Start the development server

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

## 🧠 How It Works

1. Select your occupation.
2. Search for a city.
3. Retrieve live weather conditions.
4. Calculate climate risk using the built-in Risk Engine.
5. Send weather + risk assessment to GPT-5.5.
6. Receive a structured occupational safety assessment.

The AI generates:

- Executive Summary
- Recommended Work Window
- Avoid Work Window
- Safety Recommendations
- Hydration Plan
- PPE Recommendations
- Warning Signs

---

## 🎯 Why This Project

Most weather applications simply display weather.

Climate Pulse AI demonstrates how AI can support real-world decision making by combining:

- Live APIs
- Rule-based reasoning
- Large Language Models
- Human-centered UX

The project showcases an architecture where deterministic logic and AI complement each other rather than overlap.

---

## 📅 Roadmap

### ✅ Completed

- Live Weather API Integration
- City Autocomplete
- Weather Dashboard
- Occupation Selection
- Risk Assessment Engine
- GPT-5.5 Integration
- AI Safety Assessment
- Responsive UI

### 🚧 Planned

- Risk Score Visualization
- GPS Location Support
- Multi-day Forecast Assessment
- PDF Export
- AI Chat Follow-up Questions
- Historical Weather Analysis
- OSHA-based Safety Rules
- Multi-language Support

---

## 📸 Preview

Climate Pulse AI provides a professional dashboard with:

- Real-time weather
- Climate risk analysis
- AI-generated safety guidance
- Personalized occupational recommendations

---

## 👩‍💻 Author

**Shreya Chakrabarti**

Building **100 AI Agents in 100 Days** to explore practical applications of Generative AI, Agentic AI, and LLM-powered software.

GitHub: https://github.com/shreya19888

