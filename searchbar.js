const DESTINATIONS = [
  "South Korea",
  "Shanghai, China",
  "Taiwan",
  "Hongkong",
  "Singapore",
  "Thailand",
  "Japan",
  "Batanes, Philippines",
  "El Nido, Philippines",
  "Siargao, Philippines",
  "Iloilo, Philippines",
  "Boracay, Philippines"
];

const DESTINATION_LINKS = DESTINATIONS.reduce((links, destination) => {
  links[destination.toLowerCase()] = `destinations.html#package-list?destination=${encodeURIComponent(destination)}`;
  return links;
}, {});

const destinationBox = document.getElementById("destination-box");
const destinationInput = document.getElementById("destination-input");
const suggestionsList = document.getElementById("suggestions");

const dateBox = document.getElementById("date-box");
const dateDisplay = document.getElementById("date-display");
const dateInput = document.getElementById("date-input");
const dateTrigger = document.getElementById("date-trigger");
const calendarDropdown = document.getElementById("calendar-dropdown");

const peopleBox = document.getElementById("people-box");
const peopleDisplay = document.getElementById("people-display");
const peopleLabel = document.getElementById("people-label");
const peopleDropdown = document.getElementById("people-dropdown");

const adultDec = document.getElementById("adult-dec");
const adultInc = document.getElementById("adult-inc");
const adultCount = document.getElementById("adult-count");
const childDec = document.getElementById("child-dec");
const childInc = document.getElementById("child-inc");
const childCount = document.getElementById("child-count");

const searchBtn = document.getElementById("search-button");
const searchBar = document.querySelector(".search-bar");

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

let selectedDate = null;
let calendarYear = 0;
let calendarMonth = 0;
let adults = 1;
let children = 0;
let errorTimeoutId = null;
let yearPickerOpen = false;
let monthPickerOpen = false;

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getCurrentYear() {
  return getToday().getFullYear();
}

function getMinDate() {
  const d = getToday();
  d.setDate(d.getDate() + 7);
  return d;
}

function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function parseDate(value) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function isDateAllowed(date) {
  return date >= getMinDate();
}

function getSuggestedCalendarDate() {
  const typedDate = parseDate(dateInput.value);

  if (selectedDate && isDateAllowed(selectedDate)) {
    return selectedDate;
  }

  if (typedDate && isDateAllowed(typedDate)) {
    return typedDate;
  }

  return getMinDate();
}

function getAvailableDatesForDestination(destination) {
  const normalized = destination.trim().toLowerCase();

  if (!normalized || !DESTINATIONS.some((item) => item.toLowerCase() === normalized)) {
    return [];
  }

  const minDate = getMinDate();
  const baseDates = [10, 17, 24].map((offset) => {
    const nextDate = new Date(minDate);
    nextDate.setDate(minDate.getDate() + offset);
    return nextDate;
  });

  if (normalized === "hongkong" || normalized === "iloilo, philippines") {
    return [];
  }

  if (normalized === "taiwan") {
    return baseDates.slice(0, 2);
  }

  return baseDates;
}

function sameDate(dateA, dateB) {
  return (
    dateA &&
    dateB &&
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function setBoxPersistentState(box, hasValue) {
  box.classList.toggle("filled", hasValue);
}

function updatePersistentStates() {
  setBoxPersistentState(destinationBox, destinationInput.value.trim().length > 0);
  setBoxPersistentState(dateBox, Boolean(selectedDate || dateInput.value.trim()));
  setBoxPersistentState(peopleBox, adults > 1 || children > 0);
}

function activateBox(box) {
  box.classList.add("active");
}

function deactivateBoxes() {
  [destinationBox, dateBox, peopleBox].forEach((box) => box.classList.remove("active"));
  suggestionsList.classList.remove("show");
  closeDatePanel();
  peopleDropdown.classList.remove("show");
  peopleBox.classList.remove("dropdown-open");
  dateTrigger.setAttribute("aria-expanded", "false");
}
// Open the destination suggestions panel and build suggestions based on current input
function openDestinationPanel() {
  activateBox(destinationBox);

  const value = destinationInput.value.trim();

  if (value.length > 0) {
    buildSuggestions(value);
  } else {
    suggestionsList.innerHTML = "";
    suggestionsList.classList.remove("show");
  }
}
// Debounce the input event to avoid excessive suggestion building while typing
let typingTimer;

destinationInput.addEventListener("input", (event) => {
  clearTimeout(typingTimer);

  typingTimer = setTimeout(() => {
    buildSuggestions(event.target.value);
  }, 150);
});
function openDatePanel() {
  activateBox(dateBox);

  const baseDate = getSuggestedCalendarDate();
  calendarYear = baseDate.getFullYear();
  calendarMonth = baseDate.getMonth();
  yearPickerOpen = false;
  monthPickerOpen = false;

  buildCalendar();
  calendarDropdown.classList.add("show");
  dateTrigger.setAttribute("aria-expanded", "true");
}

function closeDatePanel() {
  calendarDropdown.classList.remove("show");
  dateTrigger.setAttribute("aria-expanded", "false");
  yearPickerOpen = false;
  monthPickerOpen = false;
}

function openPeoplePanel() {
  activateBox(peopleBox);
  peopleDropdown.classList.add("show");
  peopleBox.classList.add("dropdown-open");
}

function normalizeDestinationValue(value) {
  return value.replace(/[0-9]/g, "").replace(/\s{2,}/g, " ");
}
// Build the suggestions list based on the current input value
function buildSuggestions(query) {
  const normalizedQuery = query.trim().toLowerCase();

  // ❗ STOP if no input
  if (normalizedQuery.length < 1) {
    suggestionsList.innerHTML = "";
    suggestionsList.classList.remove("show");
    return;
  }

  suggestionsList.innerHTML = "";

  const matches = DESTINATIONS.filter((destination) =>
    destination.toLowerCase().includes(normalizedQuery)
  );

  if (matches.length === 0) {
    suggestionsList.classList.remove("show");
    return;
  }

  matches.forEach((destination) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "suggestion-item";
    option.textContent = destination;

    option.addEventListener("click", (event) => {
      event.stopPropagation();
      destinationInput.value = destination;
      activateBox(destinationBox);
      updatePersistentStates();
      clearError();
      suggestionsList.classList.remove("show");
      destinationInput.focus();
    });

    suggestionsList.appendChild(option);
  });

  suggestionsList.classList.add("show");
}

function syncDateInput(date) {
  const formatted = formatDate(date);
  dateInput.value = formatted;
  dateInput.dataset.filled = "true";
  selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  calendarYear = selectedDate.getFullYear();
  calendarMonth = selectedDate.getMonth();
  updatePersistentStates();
}

function clearDateSelection() {
  selectedDate = null;
  delete dateInput.dataset.filled;
  updatePersistentStates();
}

function applyTypedDate() {
  const trimmedValue = dateInput.value.trim();

  if (!trimmedValue) {
    clearDateSelection();
    buildCalendar();
    return true;
  }

  const parsedDate = parseDate(trimmedValue);

  if (!parsedDate) {
    showError("Please enter a valid date in mm/dd/yyyy format.");
    return false;
  }

  if (!isDateAllowed(parsedDate)) {
    showError(`Please choose a date on or after ${formatDate(getMinDate())}.`);
    return false;
  }

  syncDateInput(parsedDate);
  buildCalendar();
  clearError();
  return true;
}

function buildCalendar() {
  calendarDropdown.innerHTML = "";

  const minDate = getMinDate();
  const header = document.createElement("div");
  header.className = "cal-header";
  const currentYear = getCurrentYear();

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "cal-nav-btn";
  prevBtn.innerHTML = "‹";
  prevBtn.setAttribute("aria-label", "Previous month");
  prevBtn.disabled =
    calendarYear === minDate.getFullYear() &&
    calendarMonth === minDate.getMonth();

  prevBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    const min = getMinDate();
    let newMonth = calendarMonth - 1;
    let newYear = calendarYear;

    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    }

    const testDate = new Date(newYear, newMonth, 1);

    if (testDate < new Date(min.getFullYear(), min.getMonth(), 1)) {
      return;
    }

    calendarMonth = newMonth;
    calendarYear = newYear;
    yearPickerOpen = false;
    monthPickerOpen = false;
    buildCalendar();
  });

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "cal-nav-btn";
  nextBtn.innerHTML = "›";
  nextBtn.setAttribute("aria-label", "Next month");
  nextBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    let newMonth = calendarMonth + 1;
    let newYear = calendarYear;

    if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }

    calendarMonth = newMonth;
    calendarYear = newYear;
    yearPickerOpen = false;
    monthPickerOpen = false;
    buildCalendar();
  });

  const center = document.createElement("div");
  center.className = "cal-header-center";

  const yearLabel = document.createElement("button");
  yearLabel.type = "button";
  yearLabel.className = "cal-year";
  yearLabel.textContent = calendarYear;
  yearLabel.setAttribute("aria-label", "Choose year");
  yearLabel.setAttribute("aria-expanded", yearPickerOpen ? "true" : "false");
  yearLabel.addEventListener("click", (event) => {
    event.stopPropagation();
    yearPickerOpen = !yearPickerOpen;
    monthPickerOpen = false;
    buildCalendar();
  });

  const monthLabel = document.createElement("button");
  monthLabel.type = "button";
  monthLabel.className = "cal-month";
  monthLabel.textContent = MONTH_NAMES[calendarMonth].toUpperCase();
  monthLabel.setAttribute("aria-label", "Choose month");
  monthLabel.setAttribute("aria-expanded", monthPickerOpen ? "true" : "false");
  monthLabel.addEventListener("click", (event) => {
    event.stopPropagation();
    monthPickerOpen = !monthPickerOpen;
    yearPickerOpen = false;
    buildCalendar();
  });

  center.append(yearLabel, monthLabel);
  header.append(prevBtn, center, nextBtn);
  calendarDropdown.appendChild(header);

  if (yearPickerOpen) {
    const yearPicker = document.createElement("div");
    yearPicker.className = "cal-year-picker";

    const maxYear = currentYear + 10;

    for (let year = currentYear; year <= maxYear; year += 1) {
      const yearOption = document.createElement("button");
      yearOption.type = "button";
      yearOption.className = "cal-year-option";
      yearOption.textContent = String(year);

      if (year === calendarYear) {
        yearOption.classList.add("cal-year-option--selected");
      }

      yearOption.addEventListener("click", (event) => {
        event.stopPropagation();
        calendarYear = year;

        const min = getMinDate();
        const test = new Date(calendarYear, calendarMonth, 1);

        if (test < new Date(min.getFullYear(), min.getMonth(), 1)) {
          calendarYear = min.getFullYear();
          calendarMonth = min.getMonth();
        }

        yearPickerOpen = false;
        buildCalendar();
      });

      yearPicker.appendChild(yearOption);
    }

    calendarDropdown.appendChild(yearPicker);
  }

  if (monthPickerOpen) {
    const monthPicker = document.createElement("div");
    monthPicker.className = "cal-month-picker";

    for (let monthIndex = 0; monthIndex < MONTH_NAMES.length; monthIndex += 1) {
      const monthStart = new Date(calendarYear, monthIndex, 1);
      const monthEnd = new Date(calendarYear, monthIndex + 1, 0);
      const isMonthAvailable = monthEnd >= minDate;

      if (!isMonthAvailable) {
        continue;
      }

      const monthOption = document.createElement("button");
      monthOption.type = "button";
      monthOption.className = "cal-month-option";
      monthOption.textContent = MONTH_NAMES[monthIndex].slice(0, 3).toUpperCase();

      if (monthIndex === calendarMonth) {
        monthOption.classList.add("cal-month-option--selected");
      }

      monthOption.addEventListener("click", (event) => {
        event.stopPropagation();
        calendarMonth = monthIndex;
        monthPickerOpen = false;
        buildCalendar();
      });

      monthPicker.appendChild(monthOption);
    }

    calendarDropdown.appendChild(monthPicker);
  }

  const daysRow = document.createElement("div");
  daysRow.className = "cal-days-row";

  DAY_LABELS.forEach((label) => {
    const dayLabel = document.createElement("span");
    dayLabel.className = "cal-day-name";
    dayLabel.textContent = label;
    daysRow.appendChild(dayLabel);
  });

  calendarDropdown.appendChild(daysRow);

  const grid = document.createElement("div");
  grid.className = "cal-grid";

  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

  for (let index = 0; index < firstDayOfWeek; index += 1) {
    const emptyCell = document.createElement("span");
    emptyCell.className = "cal-cell cal-cell--empty";
    grid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(calendarYear, calendarMonth, day);
    cellDate.setHours(0, 0, 0, 0);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "cal-cell";
    button.textContent = day;

    if (!isDateAllowed(cellDate)) {
      button.classList.add("cal-cell--disabled");
      button.disabled = true;
    }

    if (selectedDate && sameDate(selectedDate, cellDate)) {
      button.classList.add("cal-cell--selected");
    }

    if (!button.disabled) {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        syncDateInput(cellDate);
        clearError();
        yearPickerOpen = false;
        monthPickerOpen = false;
        buildCalendar();
        dateInput.focus();
      });
    }

    grid.appendChild(button);
  }

  calendarDropdown.appendChild(grid);
}

function refreshPeopleLabel() {
  const parts = [`${adults} adult${adults !== 1 ? "s" : ""}`];

  if (children > 0) {
    parts.push(`${children} ${children === 1 ? "child" : "children"}`);
  }

  peopleLabel.textContent = parts.join(", ");
  adultCount.textContent = adults;
  childCount.textContent = children;
  adultDec.disabled = adults <= 1;
  childDec.disabled = children <= 0;
  updatePersistentStates();
}

function showError(message, linkText, linkHref) {
  clearError();

  const errorBox = document.createElement("div");
  errorBox.className = "search-error";
  errorBox.id = "searchError";

  const messageNode = document.createElement("span");
  messageNode.textContent = `${message} `;
  errorBox.appendChild(messageNode);

  if (linkText) {
    const link = document.createElement("a");
    link.className = "search-error__link";
    link.href = linkHref || "#packages";
    link.textContent = linkText;
    errorBox.appendChild(link);
  }

  searchBar.insertAdjacentElement("afterend", errorBox);

  errorTimeoutId = window.setTimeout(() => {
    clearError();
  }, 4000);
}

function clearError() {
  if (errorTimeoutId) {
    clearTimeout(errorTimeoutId);
    errorTimeoutId = null;
  }

  const existingError = document.getElementById("searchError");
  if (existingError) {
    existingError.remove();
  }
}

function getDestinationMatch(value) {
  const normalized = value.trim().toLowerCase();
  return DESTINATIONS.find((destination) => destination.toLowerCase() === normalized) || null;
}

function getDestinationPackagesLink(destination) {
  return DESTINATION_LINKS[destination.toLowerCase()] || "#packages";
}

function destinationHasAvailableDate(destination, date) {
  return getAvailableDatesForDestination(destination).some((availableDate) => sameDate(availableDate, date));
}

destinationBox.addEventListener("click", () => {
  openDestinationPanel();
});

destinationInput.addEventListener("click", (event) => {
  event.stopPropagation();
  openDestinationPanel();
});

destinationInput.addEventListener("focus", () => {
  openDestinationPanel();
});

destinationInput.addEventListener("input", (event) => {
  const sanitizedValue = normalizeDestinationValue(event.target.value);

  if (sanitizedValue !== event.target.value) {
    event.target.value = sanitizedValue;
  }

  activateBox(destinationBox);
  updatePersistentStates();
  buildSuggestions(event.target.value);
  clearError();
});

destinationInput.addEventListener("keydown", (event) => {
  if (/^\d$/.test(event.key)) {
    event.preventDefault();
  }
});

dateBox.addEventListener("click", (event) => {
  if (event.target.closest(".calendar-dropdown")) {
    return;
  }

  if (!event.target.closest("#date-trigger")) {
    activateBox(dateBox);
  }
});

dateTrigger.addEventListener("click", (event) => {
  event.stopPropagation();
  openDatePanel();
});

dateInput.addEventListener("focus", () => {
  activateBox(dateBox);
});

dateInput.addEventListener("input", (event) => {
  event.target.value = event.target.value.replace(/[^\d/]/g, "").slice(0, 10);
  activateBox(dateBox);
  updatePersistentStates();
  clearError();
});

dateInput.addEventListener("blur", () => {
  if (dateInput.value.trim()) {
    applyTypedDate();
  } else {
    clearDateSelection();
  }
});

dateInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyTypedDate();
  }
});

peopleBox.addEventListener("click", (event) => {
  if (event.target.closest(".people-dropdown")) {
    return;
  }

  openPeoplePanel();
});

peopleDisplay.addEventListener("click", (event) => {
  event.stopPropagation();
  openPeoplePanel();
});

adultInc.addEventListener("click", (event) => {
  event.stopPropagation();
  adults += 1;
  refreshPeopleLabel();
  clearError();
});

adultDec.addEventListener("click", (event) => {
  event.stopPropagation();
  if (adults > 1) {
    adults -= 1;
    refreshPeopleLabel();
    clearError();
  }
});

childInc.addEventListener("click", (event) => {
  event.stopPropagation();
  children += 1;
  refreshPeopleLabel();
  clearError();
});

childDec.addEventListener("click", (event) => {
  event.stopPropagation();
  if (children > 0) {
    children -= 1;
    refreshPeopleLabel();
    clearError();
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-bar") && !event.target.closest(".search-error")) {
    deactivateBoxes();
  }
});

searchBtn.addEventListener("click", () => {
  clearError();

  const destinationValue = destinationInput.value.trim();
  const matchedDestination = getDestinationMatch(destinationValue);
  const hasDateText = dateInput.value.trim().length > 0;
  const typedDateIsValid = !hasDateText || applyTypedDate();

  if (!typedDateIsValid) {
    activateBox(dateBox);
    openDatePanel();
    return;
  }

  const hasSelectedDate = Boolean(selectedDate);

  if (!destinationValue && !hasSelectedDate) {
    showError("Please enter a destination and select a travel date.");
    return;
  }

  if (!destinationValue) {
    showError("Please enter a destination.");
    return;
  }

  if (!matchedDestination && !hasSelectedDate) {
    showError(
      "No available destinations and dates.",
      "Click here",
      "#packages"
    );
    return;
  }

  if (!matchedDestination) {
    showError(
      "No available destinations.",
      "Click here",
      "#packages"
    );
    return;
  }

  const destinationLink = getDestinationPackagesLink(matchedDestination);
  const availableDates = getAvailableDatesForDestination(matchedDestination);

  if (!availableDates.length) {
    showError(
      "No available dates.",
      "Click here",
      destinationLink
    );
    return;
  }

  if (!hasSelectedDate) {
    showError("Please select a travel date.");
    return;
  }

  if (!destinationHasAvailableDate(matchedDestination, selectedDate)) {
    showError(
      "No available dates.",
      "Click here",
      destinationLink
    );
    return;
  }

  window.location.href = "#";
});

refreshPeopleLabel();
updatePersistentStates();

const initialDate = getMinDate();
calendarYear = initialDate.getFullYear();
calendarMonth = initialDate.getMonth();
buildCalendar();