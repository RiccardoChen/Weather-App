const cityName = document.getElementById("citySearch");
const searchBtn = document.getElementById("search-btn");
const currentDate = document.getElementById("dateinfo");
const cityN = document.getElementById("city");
const countryN = document.getElementById("country");
const currentDegree = document.getElementById("deg-num");
const currentWeatherImgContainer =
  document.getElementById("weather-img-degree");
const feels = document.getElementById("feels");
const humidity = document.getElementById("humidity");
const winds = document.getElementById("wind");
const precipi = document.getElementById("precipitation");
const dailyCards = document.querySelectorAll(".forcast-card");
const hourlyCardsCont = document.getElementById("vertical-cards");
const currentWeatherDisplay = document.getElementById("city-weather-container");
const loadingDisplay = document.getElementById("loading-display");
const currentWeatherContainer = document.getElementById("city-wheater-display");
const statusData = document.querySelectorAll(".status-data");
const homeStateBottom = document.querySelector(".home-state__bot");
const noFound = document.querySelector(".noFound");
const suggestionList = document.getElementById("suggestionsList");
const errorFetch = document.getElementById("error-state");
const correctFetch = document.getElementById("home-state");
const retryBtn = document.getElementById("retry-btn");
const retryText = document.getElementById("retryText");
const dropDownBtn = document.getElementById("dropDownBtn");
const dropDownList = document.getElementById("filter");
const imperialBtn = document.getElementById("imperialBtn");
const metricBtn = document.getElementById("metricBtn");
const celFiltr = document.getElementById("celFiltr");
const fahFilter = document.getElementById("fahFilter");
const wspeedkm = document.getElementById("wspeedkm");
const wspeedmp = document.getElementById("wspeedmp");
const precimm = document.getElementById("precimm");
const preciin = document.getElementById("preciin");
const weekFilterBtn = document.getElementById("weekFilter__container");
const weekList = document.getElementById("weekList");
const weekday = document.getElementById("weekday");

const LOCATION_CACHE_KEY = "userLocationCache";
const CACHE_EXPIRY_MS = 360 * 60 * 1000;

let impMetricSwitch = false;
let tempSwitch = false;
let windSwitch = false;
let preciSwitch = false;

let longitudine = null;
let latitudine = null;

let weekdayFilter = null;

let selectedSuggIndex = -1;

let weatherDataCache = {
  feels: null,
  humidity: null,
  wind: null,
  precipitation: null,
};

function startLoading() {
  displayState();
  forcstState();
  statusDataLoading();
  hourlyLoadingState(true);
}

function stopLoading() {
  currentWeatherDate(
    weatherDataCache.feels,
    weatherDataCache.humidity,
    weatherDataCache.wind,
    weatherDataCache.precipitation,
  );
  displayState();
  forcstState();
  hourlyLoadingState(false);
}

async function searchCityCoordinates(name) {
  startLoading();

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`,
    );
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      homeStateBottom.classList.add("hide");
      noFound.classList.add("show");
      return;
    }

    homeStateBottom.classList.remove("hide");
    noFound.classList.remove("show");
    const cityData = data.results[0];

    cityContryName(cityData.name, cityData.country);

    return await weatherInfo(cityData.latitude, cityData.longitude);
  } catch (e) {
    console.log("Error:" + e);
  } finally {
    stopLoading();
  }
}

async function weatherInfo(
  latitude,
  longitude,
  isFiltered = false,
  isWeekDayFiltered = false,
) {
  latitudine = latitude;
  longitudine = longitude;

  let tomorrow = null;

  const currentDay = new Date().toISOString().split("T")[0];

  if (isWeekDayFiltered) {
    const nextDay = new Date(weekdayFilter);
    nextDay.setDate(nextDay.getDate() + 1);
    tomorrow = nextDay.toISOString().split("T")[0];
  }

  if (isFiltered || isWeekDayFiltered) {
    startLoading();
  }

  let tempUnitsSwitch = tempSwitch ? `&temperature_unit=fahrenheit` : ``;

  let windSpeedUnitsSwitch = windSwitch ? `&wind_speed_unit=mph` : ``;

  let precipiSwitch = preciSwitch ? `&precipitation_unit=inch` : ``;

  let selectedDay = isWeekDayFiltered
    ? `&start_date=${encodeURIComponent(weekdayFilter)}&end_date=${encodeURIComponent(tomorrow)}`
    : ``;

  let url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,temperature_2m_mean,apparent_temperature_mean,relative_humidity_2m_mean,wind_speed_10m_mean,precipitation_sum&hourly=temperature_2m,weather_code,is_day&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,precipitation,weather_code,is_day&timezone=auto${tempUnitsSwitch}${windSpeedUnitsSwitch}${precipiSwitch}${selectedDay}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (currentDay === weekdayFilter || !isWeekDayFiltered) {
      convertDate(data.current.time);
      const currentTemp = data.current.temperature_2m + "°";
      const isDay = data.current.is_day;
      weatherImgTemp(data.current.weather_code, currentTemp, isDay);

      weatherDataCache.feels =
        data.current.apparent_temperature +
        data.current_units.apparent_temperature;
      weatherDataCache.humidity =
        data.current.relative_humidity_2m +
        data.current_units.relative_humidity_2m;
      weatherDataCache.wind =
        data.current.wind_speed_10m + " " + data.current_units.wind_speed_10m;
      weatherDataCache.precipitation =
        data.current.precipitation + " " + data.current_units.precipitation;

      dailyData(
        data.daily.time,
        data.daily.weather_code,
        data.daily.temperature_2m_max,
        data.daily.temperature_2m_min,
      );

      takeWeeks(data.hourly.time);
    } else {
      convertDate(weekdayFilter);
      const currentTemp = data.daily.temperature_2m_mean[0] + "°";
      const isDay = data.current.is_day;
      weatherImgTemp(data.daily.weather_code[0], currentTemp, isDay);

      weatherDataCache.feels =
        data.daily.apparent_temperature_mean[0] +
        data.daily_units.apparent_temperature_mean;
      weatherDataCache.humidity =
        data.daily.relative_humidity_2m_mean[0] +
        data.daily_units.relative_humidity_2m_mean;
      weatherDataCache.wind =
        data.daily.wind_speed_10m_mean[0] +
        " " +
        data.daily_units.wind_speed_10m_mean;
      weatherDataCache.precipitation =
        data.daily.precipitation_sum[0] +
        " " +
        data.daily_units.precipitation_sum;
    }
    hourlyData(
      data.hourly.time,
      data.hourly.weather_code,
      data.hourly.temperature_2m,
      data.hourly.is_day,
    );
  } catch (e) {
    console.log("Error:" + e);
  } finally {
    if (isFiltered || isWeekDayFiltered) {
      stopLoading();
    }
  }
}

async function suggetionCitiesSearch(inputCityName) {
  if (!inputCityName.trim()) {
    hideSuggestions();
    return;
  }

  suggestionLoadingState();
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputCityName)}`,
    );
    const data = await response.json();

    suggestionList.innerHTML = "";

    if (!data.results || data.results.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No cities found";
      li.classList.add("sugg-empty");
      suggestionList.appendChild(li);
      suggestionList.style.display = "block";
      return;
    }

    suggestionCities(data.results);
  } catch (e) {
    console.log("Error: " + e);
    hideSuggestions();
  }
}

async function searchCityByCoords(lat, lon, name, country) {
  startLoading();
  hideSuggestions();

  homeStateBottom.classList.remove("hide");
  noFound.classList.remove("show");
  cityContryName(name, country);

  try {
    return await weatherInfo(lat, lon);
  } catch (e) {
    console.log("Error:" + e);
  } finally {
    stopLoading();
  }
}

async function getLocationAndFetch() {
  weekdayFilter = null;
  if (!navigator.geolocation) {
    console.log("Geolocalizzazione non supportata");
    return;
  }

  const cached = localStorage.getItem(LOCATION_CACHE_KEY);
  if (cached) {
    const { lat, lon, city, country, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_EXPIRY_MS;

    if (!isExpired) {
      searchCityByCoords(lat, lon, city, country);
      setTimeout(() => {
        retryBtn.disabled = false;
        retryText.textContent = "Retry";
      }, 2000);
      return;
    }
  }

  function resetRetryBtn() {
    retryBtn.disabled = false;
    retryText.textContent = "Retry";
  }

  function gestisciInterfacciaErrore() {
    errorFetch.classList.remove("hide");
    correctFetch.classList.add("hide");
  }

  const success = async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`,
      );

      if (!response.ok)
        throw new Error(`Errore HTTP! Stato: ${response.status}`);

      const data = await response.json();

      errorFetch.classList.add("hide");
      correctFetch.classList.remove("hide");

      const city =
        data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.county;
      const country = data.address.country;

      localStorage.setItem(
        LOCATION_CACHE_KEY,
        JSON.stringify({ lat, lon, city, country, timestamp: Date.now() }),
      );

      searchCityByCoords(lat, lon, city, country);
    } catch (error) {
      console.error("Errore durante la fetch:", error.message);
      gestisciInterfacciaErrore();
    } finally {
      resetRetryBtn();
    }
  };

  const error = (err) => {
    console.error("Errore Geolocalizzazione:", err.message);
    gestisciInterfacciaErrore();
    resetRetryBtn();
  };

  navigator.geolocation.getCurrentPosition(success, error);
}

function suggestionCities(cities) {
  selectedSuggIndex = -1;
  suggestionList.innerHTML = "";
  cities.forEach((c) => {
    const li = document.createElement("li");
    const region = c.admin1 ? `${c.admin1}, ` : "";
    li.textContent = `${c.name}, ${region}${c.country}`;
    li.dataset.lat = c.latitude;
    li.dataset.lon = c.longitude;
    li.dataset.cityName = c.name;
    li.dataset.country = c.country;

    li.addEventListener("click", () => {
      cityName.value = `${c.name}, ${region}${c.country}`;
      hideSuggestions();
      searchCityByCoords(c.latitude, c.longitude, c.name, c.country);
    });

    suggestionList.appendChild(li);
  });

  suggestionList.style.display = "block";
}

function suggestionLoadingState() {
  suggestionList.style.display = "block";
  suggestionList.innerHTML = `
    <li class="loadSugg">
      <img src="../assets/images/icon-loading.svg" alt="loading icon">
      <span>Searching in progress...</span>
    </li>`;
}

function convertDate(date) {
  const dateConv = new Date(date);

  const formatted = dateConv.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  currentDate.textContent = formatted;
}

function cityContryName(city, country) {
  cityN.textContent = city + ", ";
  countryN.textContent = country;
}

function weatherImgTemp(weatherCode, degree, isDay) {
  currentDegree.textContent = degree;

  const existingImg = currentWeatherImgContainer.querySelector("img");

  if (existingImg) {
    existingImg.src = weatherCodeConv(weatherCode, isDay);
  } else {
    const img = document.createElement("img");
    img.src = weatherCodeConv(weatherCode, isDay);
    img.alt = "weather icon";
    img.classList.add("weather-img");
    currentWeatherImgContainer.prepend(img);
  }
}

function weatherCodeConv(weatherCode, isDay = true) {
  const CODE_TO_ICON = {
    0: "clear",
    1: "partly",
    2: "partly",
    3: "overcast",
    45: "fog",
    48: "fog",
    51: "drizzle",
    53: "drizzle",
    55: "drizzle",
    56: "drizzle",
    57: "drizzle",
    61: "rain",
    63: "rain",
    65: "rain",
    66: "rain",
    67: "rain",
    71: "snow",
    73: "snow",
    75: "snow",
    77: "snow",
    80: "rain",
    81: "rain",
    82: "rain",
    85: "snow",
    86: "snow",
    95: "storm",
    96: "storm",
    99: "storm",
  };

  const ICON_PATH = {
    clear: isDay
      ? "../assets/images/icon-sunny.webp"
      : "../assets/images/icon-moon.webp",
    partly: isDay
      ? "../assets/images/icon-partly-cloudy.webp"
      : "../assets/images/icon-partly-cloud-night.webp",
    overcast: "../assets/images/icon-overcast.webp",
    fog: "../assets/images/icon-fog.webp",
    drizzle: "../assets/images/icon-drizzle.webp",
    rain: "../assets/images/icon-rain.webp",
    snow: "../assets/images/icon-snow.webp",
    storm: "../assets/images/icon-storm.webp",
  };

  return (
    ICON_PATH[CODE_TO_ICON[weatherCode]] ??
    "../assets/images/icon-overcast.webp"
  );
}

function currentWeatherDate(feel, hum, wind, pre) {
  feels.textContent = feel;
  humidity.textContent = hum;
  winds.textContent = wind;
  precipi.textContent = pre;
}

function statusDataLoading() {
  statusData.forEach((s) => {
    s.innerHTML = "&mdash;";
  });
}

function dailyData(weeks, weatherCode, tempMax, tempMin) {
  dailyCards.forEach((c, i) => {
    if (
      weeks[i] !== undefined &&
      weatherCode[i] !== undefined &&
      tempMax[i] !== undefined &&
      tempMin[i] !== undefined
    ) {
      const dateConv = new Date(weeks[i]);
      const formatted = dateConv.toLocaleDateString("en-US", {
        weekday: "short",
      });
      const h4 = c.querySelector("h4");
      h4.textContent = formatted;

      const existingImg = c.querySelector("img");
      if (existingImg) {
        existingImg.src = weatherCodeConv(weatherCode[i]);
      } else {
        const img = document.createElement("img");
        img.src = weatherCodeConv(weatherCode[i]);
        img.alt = "weather icon";
        img.classList.add("forecast-img");
        img.style.display = "none";
        h4.after(img);
      }
      c.querySelector(".max-deg").textContent = tempMax[i] + "°";
      c.querySelector(".min-deg").textContent = tempMin[i] + "°";
    }
  });
}

function hourlyData(hoursArr, weatherCodeArr, weatherDegArr, isDay) {
  const newHoursArr = hoursArr.map((h) => new Date(h).getHours());

  const currentHour = new Date().getHours();
  const currentIndex = newHoursArr.findIndex((h) => h === currentHour);

  const existingCards = hourlyCardsCont.querySelectorAll(".wheater-hours");

  for (let slot = 0; slot < 12; slot++) {
    const i = currentIndex + slot;

    let card = existingCards[slot];
    if (!card) {
      card = document.createElement("div");
      card.classList.add("wheater-hours");
      card.innerHTML = `
        <div class="front-part">
          <img src="" alt="weather icon" class="img-hour">
          <p></p>
        </div>
        <p></p>`;
      hourlyCardsCont.appendChild(card);
    }

    card.querySelector(".front-part img").src = weatherCodeConv(
      weatherCodeArr[i],
      isDay[i],
    );
    card.querySelector(".front-part p").textContent = newHoursArr[i] + ":00";
    card.lastElementChild.textContent = weatherDegArr[i] + "°";
  }
}

function displayState() {
  currentWeatherContainer.classList.toggle("hideState");
  currentWeatherDisplay.classList.toggle("hide");
  loadingDisplay.classList.toggle("hide");
}

function forcstState() {
  dailyCards.forEach((f) => {
    const childs = f.children;

    for (let i = 0; i < childs.length; i++) {
      if (
        childs[i].style.display === "none" &&
        childs[i].classList.contains("degrees")
      ) {
        childs[i].style.display = "flex";
      } else if (childs[i].style.display === "none") {
        childs[i].style.display = "block";
      } else {
        childs[i].style.display = "none";
      }
    }
  });
}

function hourlyLoadingState(isLoading) {
  const existingCards = hourlyCardsCont.querySelectorAll(".wheater-hours");
  existingCards.forEach((card) => {
    const children = card.children;
    for (let i = 0; i < children.length; i++) {
      children[i].style.visibility = isLoading ? "hidden" : "visible";
    }
  });
}

function hideSuggestions() {
  selectedSuggIndex = -1;
  suggestionList.style.display = "none";
  suggestionList.innerHTML = "";
}

function updateSuggestionHighlight(items) {
  items.forEach((item, i) => {
    item.classList.toggle("sugg-highlighted", i === selectedSuggIndex);
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function takeWeeks(timeArr) {
  const finalWeeks = timeArr.map((t) => {
    const date = new Date(t);
    const weekFormat = date.toLocaleDateString("en-US", { weekday: "long" });
    const isoDate = date.toISOString().split("T")[0];
    return [weekFormat, isoDate];
  });

  const dataArr = [...new Set(finalWeeks.map(JSON.stringify))]
    .map(JSON.parse)
    .filter((_, i) => i % 2 !== 0);

  weekList.innerHTML = "";

  dataArr.forEach(([w, d]) => {
    const li = document.createElement("li");
    li.textContent = w;
    li.dataset.isoDate = d;
    li.addEventListener("click", (e) => {
      weekday.textContent = e.currentTarget.textContent;
      weekdayFilter = e.currentTarget.dataset.isoDate;
      weatherInfo(latitudine, longitudine, false, true);
    });
    weekList.appendChild(li);
  });

  weekday.textContent = dataArr[0][0];
}

document.addEventListener("click", (e) => {
  if (!suggestionList.contains(e.target) && e.target !== cityName) {
    hideSuggestions();
  }
});

document.addEventListener("keydown", (e) => {
  const items = [
    ...suggestionList.querySelectorAll("li:not(.loadSugg):not(.sugg-empty)"),
  ];
  const isOpen = suggestionList.style.display === "block" && items.length > 0;

  if (e.key === "ArrowDown") {
    if (!isOpen) return;
    e.preventDefault();
    selectedSuggIndex = (selectedSuggIndex + 1) % items.length;
    updateSuggestionHighlight(items);
    items[selectedSuggIndex].scrollIntoView({ block: "nearest" });
    return;
  }

  if (e.key === "ArrowUp") {
    if (!isOpen) return;
    e.preventDefault();
    selectedSuggIndex = (selectedSuggIndex - 1 + items.length) % items.length;
    updateSuggestionHighlight(items);
    items[selectedSuggIndex].scrollIntoView({ block: "nearest" });
    return;
  }

  if (e.key === "Enter") {
    if (isOpen && selectedSuggIndex >= 0) {
      items[selectedSuggIndex].click();
      selectedSuggIndex = -1;
      return;
    }
    const name = cityName.value.trim();
    if (!name) return;
    hideSuggestions();
    searchCityCoordinates(name);
  }

  if (e.key === "Escape") {
    hideSuggestions();
    selectedSuggIndex = -1;
  }
});

searchBtn.addEventListener("click", () => {
  const name = cityName.value.trim();
  if (!name) {
    getLocationAndFetch();
    return;
  }
  hideSuggestions();
  searchCityCoordinates(name.split(",")[0]);
});

const debouncedSuggestion = debounce((value) => {
  if (value.trim().length >= 2) {
    suggetionCitiesSearch(value);
  } else {
    hideSuggestions();
  }
}, 250);

cityName.addEventListener("input", () => {
  debouncedSuggestion(cityName.value);
});

retryBtn.addEventListener("click", () => {
  retryBtn.disabled = true;
  retryText.textContent = "Loading...";
  getLocationAndFetch();
});

dropDownBtn.addEventListener("click", () => {
  dropDownList.classList.toggle("hide");
});

function setUnit(isAlreadyActive, setter, activeEl, inactiveEl) {
  if (isAlreadyActive()) return;
  setter();
  activeEl.querySelector("img").classList.remove("hide");
  inactiveEl.querySelector("img").classList.add("hide");
  weatherInfo(latitudine, longitudine, true);
}

celFiltr.addEventListener("click", () =>
  setUnit(
    () => !tempSwitch,
    () => (tempSwitch = false),
    celFiltr,
    fahFilter,
  ),
);
fahFilter.addEventListener("click", () =>
  setUnit(
    () => tempSwitch,
    () => (tempSwitch = true),
    fahFilter,
    celFiltr,
  ),
);
wspeedkm.addEventListener("click", () =>
  setUnit(
    () => !windSwitch,
    () => (windSwitch = false),
    wspeedkm,
    wspeedmp,
  ),
);
wspeedmp.addEventListener("click", () =>
  setUnit(
    () => windSwitch,
    () => (windSwitch = true),
    wspeedmp,
    wspeedkm,
  ),
);
precimm.addEventListener("click", () =>
  setUnit(
    () => !preciSwitch,
    () => (preciSwitch = false),
    precimm,
    preciin,
  ),
);
preciin.addEventListener("click", () =>
  setUnit(
    () => preciSwitch,
    () => (preciSwitch = true),
    preciin,
    precimm,
  ),
);

imperialBtn.addEventListener("click", () => {
  impMetricSwitch = true;
  tempSwitch = true;
  windSwitch = true;
  preciSwitch = true;
  imperialBtn.classList.add("hide");
  metricBtn.classList.remove("hide");

  fahFilter.querySelector("img").classList.remove("hide");
  celFiltr.querySelector("img").classList.add("hide");
  wspeedmp.querySelector("img").classList.remove("hide");
  wspeedkm.querySelector("img").classList.add("hide");
  preciin.querySelector("img").classList.remove("hide");
  precimm.querySelector("img").classList.add("hide");
  weatherInfo(latitudine, longitudine, true);
});

metricBtn.addEventListener("click", () => {
  impMetricSwitch = false;
  tempSwitch = false;
  windSwitch = false;
  preciSwitch = false;
  metricBtn.classList.add("hide");
  imperialBtn.classList.remove("hide");
  celFiltr.querySelector("img").classList.remove("hide");
  fahFilter.querySelector("img").classList.add("hide");
  wspeedkm.querySelector("img").classList.remove("hide");
  wspeedmp.querySelector("img").classList.add("hide");
  precimm.querySelector("img").classList.remove("hide");
  preciin.querySelector("img").classList.add("hide");
  weatherInfo(latitudine, longitudine, true);
});

weekFilterBtn.addEventListener("click", () => {
  weekList.classList.toggle("hide");
});

getLocationAndFetch();
