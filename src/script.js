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
const CACHE_EXPIRY_MS = 360 * 60 * 1000; // 6 ore

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

async function searchCityCoordinates(name) {
  displayState();
  forcstState();
  statusDataLoading();
  hourlyLoadingState(true);

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
    displayState();
    forcstState();
    statusDataLoading();
    hourlyLoadingState(true);
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
    currentWeatherDate(
      weatherDataCache.feels,
      weatherDataCache.humidity,
      weatherDataCache.wind,
      weatherDataCache.precipitation,
    );
    if (isFiltered || isWeekDayFiltered) {
      displayState();
      forcstState();
      hourlyLoadingState(false);
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
  displayState();
  forcstState();
  statusDataLoading();
  hourlyLoadingState(true);
  hideSuggestions();

  homeStateBottom.classList.remove("hide");
  noFound.classList.remove("show");
  cityContryName(name, country);

  try {
    return await weatherInfo(lat, lon);
  } catch (e) {
    console.log("Error:" + e);
  } finally {
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
      retryBtn.disabled = false;
      retryText.textContent = "Retry";
    }
  };

  const error = (err) => {
    console.error("Errore Geolocalizzazione:", err.message);
    gestisciInterfacciaErrore();
    retryBtn.disabled = false;
    retryText.textContent = "Retry";
  };

  function gestisciInterfacciaErrore() {
    errorFetch.classList.remove("hide");
    correctFetch.classList.add("hide");
  }

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
  suggestionList.innerHTML = "";
  suggestionList.style.display = "block";

  const li = document.createElement("li");
  li.classList.add("loadSugg");

  const img = document.createElement("img");
  img.src = "../assets/images/icon-loading.svg";
  img.alt = "loading icon";

  const span = document.createElement("span");
  span.textContent = "Searching in progress...";

  li.appendChild(img);
  li.appendChild(span);
  suggestionList.appendChild(li);
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
  let clearSky = isDay
    ? "../assets/images/icon-sunny.webp"
    : "../assets/images/icon-moon.webp";

  let mainlyClear = isDay
    ? "../assets/images/icon-partly-cloudy.webp"
    : "../assets/images/icon-partly-cloud-night.webp";

  switch (weatherCode) {
    case 0:
      return clearSky;
    case 1:
    case 2:
      return mainlyClear;
    case 3:
      return "../assets/images/icon-overcast.webp";
    case 45:
    case 48:
      return "../assets/images/icon-fog.webp";
    case 51:
    case 53:
    case 55:
    case 56:
    case 57:
      return "../assets/images/icon-drizzle.webp";
    case 61:
    case 63:
    case 65:
    case 66:
    case 67:
    case 80:
    case 81:
    case 82:
      return "../assets/images/icon-rain.webp";
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return "../assets/images/icon-snow.webp";
    case 95:
    case 96:
    case 99:
      return "../assets/images/icon-storm.webp";
    default:
      return "../assets/images/icon-overcast.webp";
  }
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
  const newHoursArr = hoursArr.map((h) => {
    const hour = new Date(h);
    return hour.getHours();
  });

  const currentHour = new Date().getHours();
  const currentIndex = newHoursArr.findIndex((h) => h === currentHour);

  const existingCards = hourlyCardsCont.querySelectorAll(".wheater-hours");

  if (existingCards.length > 0) {
    for (let i = currentIndex, c = 0; c < 12; i++, c++) {
      const card = existingCards[c];

      card.querySelector(".front-part img").src = weatherCodeConv(
        weatherCodeArr[i],
        isDay[i],
      );
      card.querySelector(".front-part p").textContent = newHoursArr[i] + ":00";
      card.lastElementChild.textContent = weatherDegArr[i] + "°";
    }
  } else {
    for (let i = currentIndex; i < currentIndex + 12; i++) {
      const card = document.createElement("div");
      card.classList.add("wheater-hours");
      const hourWeather = document.createElement("div");
      hourWeather.classList.add("front-part");
      const img = document.createElement("img");
      img.src = weatherCodeConv(weatherCodeArr[i], isDay[i]);
      img.alt = "weather icon";
      img.classList.add("img-hour");
      hourWeather.appendChild(img);
      const hour = document.createElement("p");
      hour.textContent = newHoursArr[i] + ":00";
      hourWeather.appendChild(hour);
      card.appendChild(hourWeather);

      const p = document.createElement("p");
      p.textContent = weatherDegArr[i] + "°";
      card.appendChild(p);

      hourlyCardsCont.appendChild(card);
    }
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
  const currentDay = new Date().toISOString().split("T")[0];
  const finalWeeks = timeArr.map((t) => {
    const date = new Date(t);
    const weekFormat = date.toLocaleDateString("en-US", {
      weekday: "long",
    });
    const isoDate = date.toISOString().split("T")[0];
    return [weekFormat, isoDate];
  });

  const dataArr = [...new Set(finalWeeks.map(JSON.stringify))]
    .map(JSON.parse)
    .filter((_, i) => i % 2 !== 0);

  const isExisting = weekList.querySelectorAll("li");

  if (isExisting.length === 0) {
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
  } else {
    isExisting.forEach((n, i) => {
      n.textContent = dataArr[i][0];
      n.dataset.isoDate = dataArr[i][1];
      const newElem = n.cloneNode(true);
      n.parentNode.replaceChild(newElem, n);

      newElem.addEventListener("click", (e) => {
        weekday.textContent = e.currentTarget.textContent;
        weekdayFilter = e.currentTarget.dataset.isoDate;
        weatherInfo(latitudine, longitudine, false, true);
      });
    });
    weekday.textContent = dataArr[0][0];
  }
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

celFiltr.addEventListener("click", () => {
  if (tempSwitch !== false) {
    tempSwitch = !tempSwitch;
    celFiltr.querySelector("img").classList.remove("hide");
    fahFilter.querySelector("img").classList.add("hide");
    weatherInfo(latitudine, longitudine, true);
  }
});

fahFilter.addEventListener("click", () => {
  if (tempSwitch === false) {
    tempSwitch = !tempSwitch;
    fahFilter.querySelector("img").classList.remove("hide");
    celFiltr.querySelector("img").classList.add("hide");
    weatherInfo(latitudine, longitudine, true);
  }
});

wspeedkm.addEventListener("click", () => {
  if (windSwitch !== false) {
    windSwitch = !windSwitch;
    wspeedkm.querySelector("img").classList.remove("hide");
    wspeedmp.querySelector("img").classList.add("hide");
    weatherInfo(latitudine, longitudine, true);
  }
});

wspeedmp.addEventListener("click", () => {
  if (windSwitch === false) {
    windSwitch = !windSwitch;
    wspeedmp.querySelector("img").classList.remove("hide");
    wspeedkm.querySelector("img").classList.add("hide");
    weatherInfo(latitudine, longitudine, true);
  }
});

precimm.addEventListener("click", () => {
  if (preciSwitch !== false) {
    preciSwitch = !preciSwitch;
    precimm.querySelector("img").classList.remove("hide");
    preciin.querySelector("img").classList.add("hide");
    weatherInfo(latitudine, longitudine, true);
  }
});

preciin.addEventListener("click", () => {
  if (preciSwitch === false) {
    preciSwitch = !preciSwitch;
    preciin.querySelector("img").classList.remove("hide");
    precimm.querySelector("img").classList.add("hide");
    weatherInfo(latitudine, longitudine, true);
  }
});

weekFilterBtn.addEventListener("click", () => {
  weekList.classList.toggle("hide");
});

getLocationAndFetch();
