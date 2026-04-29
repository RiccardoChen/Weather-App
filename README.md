# 🌤️ Weather App

A clean, responsive weather application built with vanilla HTML, CSS and JavaScript. Search any city in the world and get real-time weather data, a 7-day daily forecast, and a 12-hour hourly breakdown — all powered by free, open APIs.

---

## 📸 Preview

![Preview image](./design/desktop-design-metric.jpg)

---

## ✨ Features

- 🔍 **City search** with live autocomplete suggestions (debounced)
- 📍 **Automatic geolocation** on load, with a 6-hour localStorage cache
- 🌡️ **Current conditions** — temperature, feels like, humidity, wind speed, precipitation
- 📅 **7-day daily forecast** with weather icons, max and min temperatures
- ⏱️ **12-hour hourly forecast** with a day-picker dropdown
- ⚙️ **Unit switcher** — toggle individually or all at once between:
  - Celsius / Fahrenheit
  - km/h / mph
  - mm / inches
- ⌨️ **Keyboard navigation** on suggestions (↑ ↓ Enter Escape)
- ❌ **Error state** with retry button for failed API or geolocation requests
- 📱 **Fully responsive** from 375px mobile up to 1440px desktop

---

## 🛠️ Tech Stack

| Layer   | Technology                                  |
| ------- | ------------------------------------------- |
| Markup  | HTML5                                       |
| Styling | CSS3 (custom properties, CSS Grid, Flexbox) |
| Logic   | Vanilla JavaScript (ES2020+, async/await)   |
| Fonts   | Google Fonts — DM Sans, Bricolage Grotesque |

---

## 🌐 APIs Used

| API                                                                  | Purpose                                  | Docs                                                            |
| -------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| [Open-Meteo Forecast](https://open-meteo.com/)                       | Current weather, daily & hourly forecast | [docs](https://open-meteo.com/en/docs)                          |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | City search & autocomplete               | [docs](https://open-meteo.com/en/docs/geocoding-api)            |
| [Nominatim (OpenStreetMap)](https://nominatim.org/)                  | Reverse geocoding (coords → city name)   | [docs](https://nominatim.org/release-docs/develop/api/Reverse/) |

All APIs are **free** and require **no API key**.

---

## 🚀 Getting Started

No build step, no dependencies, no package manager needed.

```bash
# 1. Clone the repository
git clone https://github.com/your-username/your-repo-name.git

# 2. Open the project
cd your-repo-name

# 3. Open index.html in your browser
#    (or use a local dev server like VS Code Live Server)
open weather-app/index.html
```

> ⚠️ Geolocation requires the page to be served over `http://` or `https://`. Opening the file directly via `file://` will block the geolocation API in most browsers. Use a local server like [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) for development.

## 🔧 Configuration

No environment variables or config files required. The only constant worth noting:

```js
// script.js
const CACHE_EXPIRY_MS = 360 * 60 * 1000; // Geolocation cache duration (6 hours)
```

You can adjust this value if you want the app to re-request the user's position more or less frequently.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- Challenge design inspired by [Frontend Mentor](https://www.frontendmentor.io/)
- Weather data by [Open-Meteo](https://open-meteo.com/) — free and open-source
- Reverse geocoding by [Nominatim / OpenStreetMap](https://nominatim.org/)
