// Путь к файлу-источнику с расписанием кинотеатра[cite: 5].
const SOURCE_URL = "source/kino-hviezda.html";

// Ключ для хранения расписания в постоянной памяти браузера (localStorage)[cite: 5].
const STORAGE_KEY = "cinema-program";

// Список названий дней недели по-словацки (начиная с понедельника, индекс 0)[cite: 5].
const DAY_NAMES = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];

// Находим элемент абзаца статуса по ID для вывода сообщений[cite: 5].
const statusText = document.getElementById("status");

// Находим кнопку принудительного обновления по ID[cite: 5].
const refreshButton = document.getElementById("refresh");

// Находим кнопку очистки памяти по ID[cite: 5].
const clearButton = document.getElementById("clear");

// Находим блок навигации для вкладок дней недели[cite: 5].
const tabs = document.getElementById("day-tabs");

// Находим блок, куда будет выводиться расписание фильмов[cite: 5].
const schedule = document.getElementById("schedule");

// Глобальная переменная для хранения массива дней с фильмами[cite: 5].
let program = [];

// Индекс текущего выбранного пользователем дня (от 0 до 6)[cite: 5].
let selectedDay = 0;

// Асинхронная функция скачивания HTML страницы кинотеатра[cite: 5].
async function loadCinemaHtml() {
  // Выполняем сетевой запрос к файлу и ждем ответа сервера[cite: 5].
  const response = await fetch(SOURCE_URL);

  // Проверяем: если HTTP-статус не успешен (не в диапазоне 200-299, например 404)[cite: 5]:
  if (!response.ok) {
    // Выбрасываем понятную ошибку с кодом статуса[cite: 5].
    throw new Error(`Stránku kina sa nepodarilo načítať (HTTP ${response.status}).`);
  }

  // Читаем тело ответа как обычный текст и возвращаем его[cite: 5].
  return response.text();
}

// Альтернативная функция загрузки через библиотеку jQuery (из Шага 5)[cite: 5].
function loadCinemaHtmlJquery() {
  // Выполняем AJAX-запрос за текстом и возвращаем jQuery-деферред (с поддержкой await)[cite: 5].
  return $.ajax({ url: SOURCE_URL, dataType: "text" });
}

// Функция безопасного создания виртуального DOM-документа из строки HTML[cite: 5].
function parseHtml(html) {
  // Создаем DOMParser и парсим текст: скрипты не выполнятся, стили не применятся[cite: 5].
  return new DOMParser().parseFromString(html, "text/html");
}

// Вспомогательная функция очистки текста от лишних пробелов, переносов строк и табов[cite: 5].
function cleanText(text) {
  // Заменяем любые повторяющиеся пробельные символы на один пробел и отрезаем края[cite: 5].
  return text.replace(/\s+/g, " ").trim();
}

// Функция безопасного получения очищенного текста из элемента по CSS-селектору[cite: 5].
function textOf(element, selector) {
  // Ищем селектор, берем textContent (или пустую строку, если элемент не найден) и чистим[cite: 5].
  return cleanText(element.querySelector(selector)?.textContent ?? "");
}

// Функция преобразования текстовой цены (например "7,50 €") в нормальное число[cite: 5].
function parsePrice(text) {
  // Если текста нет вообще (null, undefined или пустая строка) — возвращаем null[cite: 5].
  if (!text) {
    return null;
  }

  // Заменяем запятую на точку и читаем число с плавающей точкой до знака валюты[cite: 5].
  const price = parseFloat(text.replace(",", "."));

  // Если число не распознано (NaN) — отдаем null, иначе само число[cite: 5].
  return Number.isNaN(price) ? null : price;
}

// Парсер расписания на чистом нативном JavaScript (Шаг 4 и Шаг 8)[cite: 5].
function parseCinema(doc) {
  // Создаем пустой массив под дни недели[cite: 5].
  const days = [];

  // Перебираем все секции с классом .den (каждая секция — это один день)[cite: 5]:
  for (const section of doc.querySelectorAll(".den")) {
    // Находим заголовок дня h2[cite: 5].
    const heading = section.querySelector("h2");

    // Создаем пустой массив под сеансы фильмов этого дня[cite: 5].
    const screenings = [];

    // Перебираем все элементы фильмов внутри секции дня[cite: 5]:
    for (const film of section.querySelectorAll(".film")) {
      // Извлекаем обязательное время сеанса[cite: 5].
      const time = textOf(film, ".cas");

      // Извлекаем обязательное название фильма[cite: 5].
      const title = textOf(film, ".nazov");

      // Если нет времени или названия — пропускаем неполную запись (защита из Шага 8)[cite: 5]:
      if (!time || !title) {
        // Предупреждаем в консоли и переходим к следующему фильму[cite: 5].
        console.warn("Skipping incomplete screening:", film);
        continue;
      }

      // Добавляем готовый объект фильма в список сеансов[cite: 5]:
      screenings.push({
        time: time,                                 // время сеанса[cite: 5]
        title: title,                               // название фильма[cite: 5]
        hall: textOf(film, ".sala"),                // кинозал[cite: 5]
        price: parsePrice(textOf(film, ".cena"))    // числовая цена или null[cite: 5]
      });
    }

    // Добавляем обработанный день недели в общий список дней[cite: 5]:
    days.push({
      // Имя дня берем из первого текстового узла заголовка h2 (чтобы не склеивать с <small>)[cite: 5].
      day: cleanText(heading.firstChild.textContent),
      // Дату берем из тега <small> внутри заголовка[cite: 5].
      date: cleanText(heading.querySelector("small")?.textContent ?? ""),
      // Список сеансов[cite: 5].
      screenings: screenings
    });
  }

  // Возвращаем собранный массив дней[cite: 5].
  return days;
}

// Альтернативный парсер расписания с использованием jQuery (Шаг 5)[cite: 5].
function parseCinemaJquery(doc) {
  // Создаем массив под дни[cite: 5].
  const days = [];

  // Ищем все секции .den через jQuery и обходим их с явными аргументами (index, section)[cite: 5]:
  $(doc).find(".den").each((index, section) => {
    // Оборачиваем текущую секцию в jQuery-объект[cite: 5].
    const $section = $(section);

    // Массив под фильмы дня[cite: 5].
    const screenings = [];

    // Ищем фильмы .film внутри секции с аргументами (fIndex, film)[cite: 5]:
    $section.find(".film").each((fIndex, film) => {
      // Оборачиваем фильм в jQuery[cite: 5].
      const $film = $(film);

      // Считываем время сеанса[cite: 5].
      const time = cleanText($film.find(".cas").text());

      // Считываем название фильма[cite: 5].
      const title = cleanText($film.find(".nazov").text());

      // Пропускаем неполные данные[cite: 5]:
      if (!time || !title) {
        return;
      }

      // Добавляем сеанс в массив[cite: 5]:
      screenings.push({
        time: time,
        title: title,
        hall: cleanText($film.find(".sala").text()),
        price: parsePrice($film.find(".cena").text())
      });
    });

    // Добавляем день в массив (contents().first() заменяет firstChild)[cite: 5]:
    days.push({
      day: cleanText($section.find("h2").contents().first().text()),
      date: cleanText($section.find("h2 small").text()),
      screenings: screenings
    });
  });

  // Возвращаем полученный массив[cite: 5].
  return days;
}

// Функция сохранения расписания в localStorage вместе со временем сохранения[cite: 5].
function saveProgram(days) {
  // Формируем объект с ISO-меткой времени и массивом данных[cite: 5].
  const data = { savedAt: new Date().toISOString(), days: days };

  // Превращаем объект в строку JSON и записываем в хранилище[cite: 5].
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Функция загрузки сохраненного расписания из localStorage[cite: 5].
function loadSavedProgram() {
  // Достаем JSON-строку по ключу и превращаем обратно в объект[cite: 5].
  const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

  // Если в хранилище ничего не было — возвращаем null[cite: 5].
  if (!data) {
    return null;
  }

  // Превращаем сохраненную строку даты обратно в полноценный объект Date[cite: 5].
  const savedAt = new Date(data.savedAt);

  // Сравниваем календарный день в локальном времени (toDateString) с сегодняшним днем[cite: 5]:
  if (savedAt.toDateString() !== new Date().toDateString()) {
    // Если данные сохранены не сегодня (устарели) — возвращаем null[cite: 5].
    return null;
  }

  // Если данные свежие за сегодняшний день — отдаем объект с датой и днями[cite: 5].
  return { savedAt: savedAt, days: data.days };
}

// Функция вычисления индекса сегодняшнего дня в массиве программы[cite: 5].
function getTodayIndex() {
  // getDay(): 0-вс, 1-пн... Формула (getDay() + 6) % 7 сдвигает: 0-пн, 1-вт... 6-вс[cite: 5].
  const todayName = DAY_NAMES[(new Date().getDay() + 6) % 7];

  // Ищем в массиве программы день, чье имя совпадает с сегодняшним[cite: 5].
  const index = program.findIndex((day) => day.day === todayName);

  // Если совпадение не найдено — возвращаем 0 (первый день), иначе найденный индекс[cite: 5].
  return index === -1 ? 0 : index;
}

// Функция отрисовки кнопок-вкладок дней недели[cite: 5].
function renderTabs() {
  // Очищаем контейнер вкладок перед новой отрисовкой[cite: 5].
  tabs.replaceChildren();

  // Обходим каждый день из массива программы[cite: 5]:
  program.forEach((day, index) => {
    // Создаем элемент кнопки <button>[cite: 5].
    const button = document.createElement("button");

    // Задаем тип кнопки "button"[cite: 5].
    button.type = "button";

    // Устанавливаем название дня в качестве текста кнопки[cite: 5].
    button.textContent = day.day;

    // Задаем атрибут aria-pressed="true" для активной кнопки и "false" для остальных[cite: 5].
    button.setAttribute("aria-pressed", index === selectedDay);

    // Вешаем слушатель клика: переключаем выбранный день и перерисовываем интерфейс[cite: 5].
    button.addEventListener("click", () => {
      // Обновляем индекс активного дня[cite: 5].
      selectedDay = index;
      // Вызываем общую перерисовку[cite: 5].
      render();
    });

    // Добавляем созданную кнопку во вкладки[cite: 5].
    tabs.append(button);
  });
}

// Функция отрисовки расписания для одного конкретного выбранного дня[cite: 5].
function renderDay() {
  // Очищаем блок расписания[cite: 5].
  schedule.replaceChildren();

  // Берем данные выбранного дня по его индексу[cite: 5].
  const day = program[selectedDay];

  // Если день по какой-то причине не найден — прекращаем выполнение[cite: 5].
  if (!day) {
    return;
  }

  // Создаем заголовок <h2> с названием дня и датой[cite: 5].
  const heading = document.createElement("h2");

  // Записываем внутрь текст названия дня и даты[cite: 5].
  heading.textContent = `${day.day} ${day.date}`;

  // Вставляем заголовок на страницу[cite: 5].
  schedule.append(heading);

  // Проверяем: если в этот день нет ни одного сеанса (пустой массив)[cite: 5]:
  if (day.screenings.length === 0) {
    // Создаем абзац для уведомления[cite: 5].
    const empty = document.createElement("p");

    // Выводим сообщение о пустом дне[cite: 5].
    empty.textContent = "Na tento deň nie je v programe žiadne predstavenie.";

    // Вставляем абзац и выходим из функции[cite: 5].
    schedule.append(empty);
    return;
  }

  // Создаем маркированный список <ul> для сеансов[cite: 5].
  const list = document.createElement("ul");

  // Перебираем каждый сеанс выбранного дня[cite: 5]:
  for (const screening of day.screenings) {
    // Создаем пункт списка <li>[cite: 5].
    const item = document.createElement("li");

    // Форматируем цену: если null — пишем "cena neuvedená", иначе число с €[cite: 5].
    const price = screening.price === null ? "cena neuvedená" : `${screening.price.toFixed(2)} €`;

    // Безопасно заполняем текст через textContent через точку-разделитель[cite: 5].
    item.textContent = `${screening.time} · ${screening.title} · ${screening.hall} · ${price}`;

    // Добавляем пункт в список[cite: 5].
    list.append(item);
  }

  // Добавляем готовый список фильмов в блок расписания[cite: 5].
  schedule.append(list);
}

// Общая функция отрисовки всего интерфейса (вкладки + расписание выбранного дня)[cite: 5].
function render() {
  // Рисуем кнопки вкладок[cite: 5].
  renderTabs();
  // Рисуем содержимое дня[cite: 5].
  renderDay();
}

// Главная асинхронная функция загрузки и отображения программы кинотеатра[cite: 5].
async function showProgram(forceRefresh = false) {
  // Проверяем сохраненные данные: если forceRefresh === true, принудительно игнорируем кеш[cite: 5].
  const saved = forceRefresh ? null : loadSavedProgram();

  // Если в памяти есть свежие данные за сегодня[cite: 5]:
  if (saved) {
    // Восстанавливаем расписание из кеша[cite: 5].
    program = saved.days;

    // Выводим статус с точным временем сохранения из памяти[cite: 5].
    statusText.textContent = `Uložený program z ${saved.savedAt.toLocaleString("sk-SK")}.`;
  // Иначе (если кеша нет или нажата кнопка "Aktualizovať")[cite: 5]:
  } else {
    // Блок try-catch-finally для безопасного сетевого запроса[cite: 5].
    try {
      // Сообщаем пользователю, что началось скачивание[cite: 5].
      statusText.textContent = "Načítavam program…";

      // Блокируем кнопку обновления, чтобы предотвратить спам-клики[cite: 5].
      refreshButton.disabled = true;

      // Скачиваем HTML-строку файла кинотеатра[cite: 5].
      const html = await loadCinemaHtml();

      // Парсим полученный HTML через DOMParser и извлекаем массив дней[cite: 5].
      program = parseCinema(parseHtml(html));

      // Защита из Шага 8: если массив пуст (например, изменились CSS-классы на сайте)[cite: 5]:
      if (program.length === 0) {
        // Выбрасываем исключение о смене структуры страницы[cite: 5].
        throw new Error("Na stránke kina sa nenašiel program. Možno sa zmenila jej štruktúra.");
      }

      // Сохраняем успешно скачанную программу в localStorage[cite: 5].
      saveProgram(program);

      // Обновляем статус с текущим временем успешного обновления[cite: 5].
      statusText.textContent = `Program aktualizovaný ${new Date().toLocaleString("sk-SK")}.`;
    // Перехватываем любые ошибки (404, сломанная сеть, изменившаяся разметка)[cite: 5]:
    } catch (error) {
      // Выводим понятный текст ошибки пользователю[cite: 5].
      statusText.textContent = error.message;
      // Прерываем дальнейшее отображение[cite: 5].
      return;
    // Блок finally выполняется всегда — возвращаем кнопку в активное состояние[cite: 5]:
    } finally {
      // Разблокируем кнопку[cite: 5].
      refreshButton.disabled = false;
    }
  }

  // Определяем индекс сегодняшнего дня недели[cite: 5].
  selectedDay = getTodayIndex();

  // Отрисовываем интерфейс на экране[cite: 5].
  render();
}

// Вешаем слушатель клика на кнопку "Aktualizovať": передаем true для обхода кеша[cite: 5].
refreshButton.addEventListener("click", () => showProgram(true));

// Вешаем слушатель клика на кнопку "Vymazať": удаляем запись из localStorage[cite: 5].
clearButton.addEventListener("click", () => {
  // Удаляем ключ из постоянной памяти[cite: 5].
  localStorage.removeItem(STORAGE_KEY);

  // Информируем пользователя[cite: 5].
  statusText.textContent = "Uložené dáta sú vymazané.";
});

// Запускаем первичное отображение при загрузке страницы[cite: 5].
showProgram();