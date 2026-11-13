// Адрес вымышленного proxy-сервера, через который в реальной жизни делают запросы к чужим сайтам, чтобы обойти блокировку CORS[cite: 8].
const PROXY_URL = "https://proxy.example/?url=";

// Главный массив-реестр кинотеатров (источников данных); чтобы подключить новое кино, достаточно просто добавить сюда новый объект[cite: 8].
const SOURCES = [
  {
    // Уникальный текстовый идентификатор кинотеатра (ключ)[cite: 8].
    id: "hviezda",
    // Красивое человекочитаемое название заведения для отображения на странице[cite: 8].
    name: "Kino Hviezda",
    // Реальный URL-адрес страницы кинотеатра в интернете со всеми get-параметрами[cite: 8].
    website: "https://www.kino-hviezda.example/program?tyzden=45&jazyk=sk",
    // Относительный путь к сохранённому локальному HTML-файлу в папке проекта[cite: 8].
    localUrl: "source/kino-hviezda.html",
    // Ссылка на функцию-парсер из файла parsers.js (передаём именно как ссылку, без скобок (), чтобы вызвать позже)[cite: 8].
    parse: parseHviezda,
  },
  {
    // Идентификатор второго кинотеатра[cite: 8].
    id: "mier",
    // Название второго кинотеатра[cite: 8].
    name: "Kino Mier",
    // Ссылка на страницу второго кинотеатра[cite: 8].
    website: "https://kinomier.example/rozpis?mesto=ba&tyzden=45",
    // Путь к его локальной копии[cite: 8].
    localUrl: "source/kino-mier.html",
    // Ссылка на соответствующую функцию-парсер для структуры таблицы[cite: 8].
    parse: parseMier,
  },
  {
    // Идентификатор третьего кинотеатра[cite: 8].
    id: "lumiere",
    // Название третьего кинотеатра[cite: 8].
    name: "Kino Lumière",
    // Ссылка на сайт третьего кинотеатра[cite: 8].
    website: "https://lumiere.example/program/?od=2026-11-02&do=2026-11-08",
    // Путь к локальному файлу третьего кинотеатра[cite: 8].
    localUrl: "source/kino-lumiere.html",
    // Парсер для разметки со статьями и тегами <time>[cite: 8].
    parse: parseLumiere,
  },
  {
    // Идентификатор четвёртого кинотеатра[cite: 8].
    id: "odeon",
    // Название четвёртого кинотеатра[cite: 8].
    name: "Kino Odeon",
    // Вымышленный сайт для четвёртого кинотеатра[cite: 8].
    website: "https://odeon.example/program",
    // Файл, которого изначально физически нет на диске (чтобы проверить, как скрипт обработает ошибку 404)[cite: 8].
    localUrl: "source/kino-odeon.html",
    // Временный парсер для него[cite: 8].
    parse: parseHviezda,
  },
];

// Объект с искусственными задержками в миллисекундах (имитирует то, что разные серверы отвечают с разной скоростью)[cite: 8].
const DELAYS = { hviezda: 1500, mier: 500, lumiere: 1000, odeon: 300 };

// Вспомогательная функция, которая возвращает Promise и ждёт указанное количество миллисекунд (ms) через обычный таймер setTimeout[cite: 8].
function wait(ms) {
  // Возвращаем промис, который успешно завершится (resolve), когда сработает таймер[cite: 8].
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Находим в HTML-документе текстовый абзац с id="status" для показа сообщений о статусе загрузки[cite: 8].
const statusText = document.getElementById("status");

// Находим кнопку "Aktualizovať všetko" по её id="refresh"[cite: 8].
const refreshButton = document.getElementById("refresh");

// Находим чекбокс с id="use-local", который переключает режим (локальные файлы или интернет через proxy)[cite: 8].
const useLocalCheckbox = document.getElementById("use-local");

// Находим блок-контейнер с id="filters", куда скрипт будет автоматически вставлять чекбоксы для каждого кинотеатра[cite: 8].
const filters = document.getElementById("filters");

// Находим блок с id="cards" (сетку Bootstrap), куда будут динамически добавляться карточки с расписанием[cite: 8].
const cards = document.getElementById("cards");

// Центральный объект оперативной памяти, куда будем сохранять текущее состояние каждого кинотеатра (идёт загрузка, ошибка или готовые данные)[cite: 8].
const results = {};

// Специальная коллекция Set (множество уникальных значений), в которой храним id кинотеатров, выключенных галочками фильтра[cite: 8].
const hiddenSources = new Set();

// Проверяем память браузера (localStorage): если там сохранена строка "false", флажок снимается, в остальных случаях он включён по умолчанию[cite: 8].
useLocalCheckbox.checked = localStorage.getItem("use-local") !== "false";

// Функция, которая решает, по какому именно адресу делать сетевой запрос для конкретного кинотеатра[cite: 8].
function buildUrl(source) {
  // Если галочка "Načítať lokálne kópie" стоит — возвращаем путь к файлу на диске[cite: 8].
  if (useLocalCheckbox.checked) {
    return source.localUrl;
  }
  // Если галочка снята — склеиваем адрес proxy и обязательно кодируем ссылку кинотеатра через encodeURIComponent, чтобы не сломались спецсимволы вроде ? и &[cite: 8].
  return PROXY_URL + encodeURIComponent(source.website);
}

// Навешиваем слушатель события на переключение чекбокса локального режима[cite: 8]:
useLocalCheckbox.addEventListener("change", () => {
  // Записываем новое состояние (true или false) в память браузера под ключом "use-local"[cite: 8].
  localStorage.setItem("use-local", useLocalCheckbox.checked);
  // Заново запускаем загрузку данных для всех заведений с учётом выбранного источника[cite: 8].
  loadAll();
});

// Асинхронная функция, которая скачивает и парсит данные одного переданного кинотеатра[cite: 8].
async function loadSource(source) {
  // Искусственно ждём заданное время из объекта DELAYS (если задержка не задана, ждём 0 мс)[cite: 8].
  await wait(DELAYS[source.id] ?? 0);
  // Делаем реальный сетевой запрос по вычисленному адресу и ждём ответа[cite: 8].
  const response = await fetch(buildUrl(source));
  // Если сервер ответил ошибкой (например, файл не найден 404 или сервер упал 500)[cite: 8]:
  if (!response.ok) {
    // Выбрасываем техническую ошибку с указанием статуса ответа[cite: 8].
    throw new Error(`HTTP ${response.status}`);
  }
  // Читаем тело ответа как обычный текст страницы[cite: 8].
  const html = await response.text();
  // Превращаем текст в виртуальный DOM через parseHtml и передаём его в функцию-парсер этого кинотеатра[cite: 8].
  return source.parse(parseHtml(html));
}

// Вспомогательная функция, которая строит HTML-список фильмов строго на сегодняшний день недели[cite: 8].
function createTodayList(days) {
  // Получаем название сегодняшнего дня недели на словацком (формула сдвигает американское воскресенье в конец, чтобы понедельник был 0)[cite: 8].
  const today = DAY_NAMES[(new Date().getDay() + 6) % 7];
  // Ищем в массиве расписания объект, чей день совпадает с сегодняшним[cite: 8].
  const day = days.find((item) => item.day === today);
  // Если данных на сегодня нет или массив сеансов пуст (например, кино закрыто на техперерыв)[cite: 8]:
  if (!day || day.screenings.length === 0) {
    // Создаём параграф для вывода сообщения[cite: 8].
    const empty = document.createElement("p");
    // Навешиваем служебные классы Bootstrap (без нижнего отступа, приглушённый серый цвет)[cite: 8].
    empty.className = "mb-0 text-body-secondary";
    // Пишем информационный текст: "Сегодня не показывают"[cite: 8].
    empty.textContent = `${today}: dnes sa nehrá.`;
    // Возвращаем готовый элемент[cite: 8].
    return empty;
  }
  // Создаём тег списка <ul> для перечисления фильмов[cite: 8].
  const list = document.createElement("ul");
  // Убираем стандартные маркеры точек и отступы списка с помощью классов Bootstrap[cite: 8].
  list.className = "list-unstyled mb-0";
  // Перебираем каждый отдельный сеанс сегодняшнего дня[cite: 8]:
  for (const screening of day.screenings) {
    // Создаём тег строчки списка <li>[cite: 8].
    const item = document.createElement("li");
    // Форматируем цену: если цены нет (null) — пишем "cena neuvedená", иначе выводим цифры с двумя знаками и знаком евро[cite: 8].
    const price = screening.price === null ? "cena neuvedená" : `${screening.price.toFixed(2)} €`;
    // Формируем строчку с временем, названием и ценой через безопасный textContent[cite: 8].
    item.textContent = `${screening.time} ${screening.title} (${price})`;
    // Вставляем строчку в список фильмов[cite: 8].
    list.append(item);
  }
  // Возвращаем собранный список[cite: 8].
  return list;
}

// Функция, которая создаёт полную визуальную карточку для одного кинотеатра (с шапкой, телом, спиннером и подвалом)[cite: 8].
function createCard(source) {
  // Достаём текущее состояние кинотеатра из памяти (если данных ещё нет — по умолчанию ставим статус "loading")[cite: 8].
  const result = results[source.id] ?? { state: "loading" };

  // Создаём внешний блок-колонку сетки Bootstrap[cite: 8].
  const column = document.createElement("div");
  // Назначаем адаптивные классы Bootstrap: на смартфонах ширина 100% (col-12), от 768px — по 2 в ряд (col-md-6), от 992px — по 3 в ряд (col-lg-4)[cite: 8].
  column.className = "col-12 col-md-6 col-lg-4";
  // Записываем data-атрибут data-source="hviezda", чтобы элемент можно было легко найти в DOM при необходимости[cite: 8].
  column.dataset.source = source.id;

  // Создаём семантический тег <article> под саму карточку[cite: 8].
  const card = document.createElement("article");
  // Класс card задаёт рамку и фон Bootstrap, а h-100 растягивает карточки на одинаковую высоту в пределах одного ряда[cite: 8].
  card.className = "card h-100";

  // Создаём блок шапки карточки[cite: 8].
  const header = document.createElement("div");
  // Делаем шапку белой со встроенным flexbox для разнесения элементов по краям (название слева, спиннер справа)[cite: 8].
  header.className = "card-header d-flex justify-content-between align-items-center";

  // Создаём заголовок <h2> для названия[cite: 8].
  const title = document.createElement("h2");
  // Стилизуем заголовок классом h5 и убираем лишний внешний отступ снизу mb-0[cite: 8].
  title.className = "h5 mb-0";
  // Создаём ссылку на оригинальный сайт заведения[cite: 8].
  const link = document.createElement("a");
  // Прописываем адрес из настроек кинотеатра[cite: 8].
  link.href = source.website;
  // Указываем, чтобы ссылка открывалась в новой вкладке браузера[cite: 8].
  link.target = "_blank";
  // Защитный атрибут безопасности при открытии сторонних ссылок[cite: 8].
  link.rel = "noopener noreferrer";
  // Пишем название кинотеатра внутри ссылки[cite: 8].
  link.textContent = source.name;
  // Вкладываем ссылку в заголовок[cite: 8].
  title.append(link);
  // Вкладываем заголовок в шапку[cite: 8].
  header.append(title);

  // Создаём основной блок содержимого карточки[cite: 8].
  const body = document.createElement("div");
  // Применяем стандартный класс отступов тела карточки Bootstrap[cite: 8].
  body.className = "card-body";

  // Ветка 1: кинотеатр прямо сейчас находится в процессе загрузки[cite: 8]:
  if (result.state === "loading") {
    // Создаём блок спиннера загрузки[cite: 8].
    const spinner = document.createElement("div");
    // Классы Bootstrap для маленького крутящегося кружка[cite: 8].
    spinner.className = "spinner-border spinner-border-sm";
    // Атрибут доступности для скринридеров[cite: 8].
    spinner.setAttribute("role", "status");
    // Невидимая текстовая подсказка для людей с ограниченными возможностями[cite: 8].
    const label = document.createElement("span");
    // Скрывает текст визуально с экрана, оставляя доступным для скринридера[cite: 8].
    label.className = "visually-hidden";
    // Текст подсказки[cite: 8].
    label.textContent = "Načítava sa…";
    // Вкладываем подсказку внутрь спиннера[cite: 8].
    spinner.append(label);
    // Добавляем крутящийся спиннер в правую часть шапки карточки[cite: 8].
    header.append(spinner);
    // В теле карточки пишем текст ожидания[cite: 8].
    body.textContent = "Načítavam program…";
  // Ветка 2: при загрузке кинотеатра произошла ошибка[cite: 8]:
  } else if (result.state === "error") {
    // Окрашиваем текст ошибки в красный цвет с помощью класса text-danger[cite: 8].
    body.classList.add("text-danger");
    // Выводим понятное сообщение с текстом ошибки[cite: 8].
    body.textContent = `Program sa nepodarilo načítať (${result.error.message}). `;

    // Создаём кнопку для персонального повтора загрузки именно этого упавшего заведения[cite: 8].
    const retry = document.createElement("button");
    // Указываем тип кнопки[cite: 8].
    retry.type = "button";
    // Стилизуем как компактную красную контурную кнопку Bootstrap[cite: 8].
    retry.className = "btn btn-sm btn-outline-danger mt-2 d-block";
    // Надпись на кнопке: "Попробовать снова"[cite: 8].
    retry.textContent = "Skúsiť znova";
    // Вешаем слушатель клика: вызываем loadOne для этого кинотеатра и обязательно глушим ошибку через catch, чтобы консоль оставалась чистой[cite: 8].
    retry.addEventListener("click", () => loadOne(source).catch(() => {}));
    // Вставляем кнопку повтора в тело карточки[cite: 8].
    body.append(retry);
  // Ветка 3: данные успешно загружены[cite: 8]:
  } else {
    // Генерируем и вставляем список фильмов на сегодня[cite: 8].
    body.append(createTodayList(result.days));
  }

  // Создаём блок подвала карточки[cite: 8].
  const footer = document.createElement("div");
  // Стилизуем мелким серым текстом Bootstrap[cite: 8].
  footer.className = "card-footer small text-body-secondary";
  // Если время обновления зафиксировано — выводим локализованную дату и время, иначе пишем "Ещё не загружено"[cite: 8].
  footer.textContent = result.updatedAt
    ? `Aktualizované ${result.updatedAt.toLocaleString("sk-SK")}`
    : "Zatiaľ nenačítané";

  // Собираем карточку: прикрепляем шапку, тело и подвал[cite: 8].
  card.append(header, body, footer);
  // Вкладываем готовую карточку в колонку сетки[cite: 8].
  column.append(card);
  // Возвращаем готовую колонку[cite: 8].
  return column;
}

// Функция обновления и отрисовки видимых карточек в контейнере[cite: 8].
function renderCards() {
  // Фильтруем массив всех источников, оставляя только те, которых нет в списке скрытых (hiddenSources)[cite: 8].
  const visible = SOURCES.filter((source) => !hiddenSources.has(source.id));
  // Очищаем контейнер и вставляем все сформированные карточки за одну быструю операцию replaceChildren[cite: 8].
  cards.replaceChildren(...visible.map(createCard));
}

// Асинхронная функция загрузки одного конкретного кинотеатра (позволяет отображать результат сразу по готовности)[cite: 8].
async function loadOne(source) {
  // Запоминаем старые данные кинотеатра (чтобы не потерять время прошлой удачной загрузки)[cite: 8].
  const previous = results[source.id];
  // Переводим заведение в состояние "loading", сохранив предыдущую дату обновления[cite: 8].
  results[source.id] = { state: "loading", updatedAt: previous?.updatedAt };
  // Сразу перерисовываем карточки на экране (пользователь увидит спиннер на этой карточке)[cite: 8].
  renderCards();
  // Блок try-catch-finally для безопасного выполнения[cite: 8]:
  try {
    // Ждём загрузки и парсинга только этого выбранного кинотеатра[cite: 8].
    const days = await loadSource(source);
    // При успехе сохраняем статус "ok", полученные дни и текущую отметку времени[cite: 8].
    results[source.id] = { state: "ok", days, updatedAt: new Date() };
  } catch (error) {
    // При сбое сохраняем статус "error", объект ошибки и старое время[cite: 8].
    results[source.id] = { state: "error", error, updatedAt: previous?.updatedAt };
    // Пробрасываем ошибку дальше, чтобы общий Promise.allSettled в функции loadAll знал, что этот запрос упал[cite: 8].
    throw error;
  } finally {
    // В любом случае (успех или ошибка) перерисовываем карточку с новым содержимым[cite: 8].
    renderCards();
  }
}

// Главная асинхронная функция одновременной параллельной загрузки всех кинотеатров[cite: 8].
async function loadAll() {
  // Выключаем главную кнопку обновления (disabled), чтобы пользователь не кликал много раз подряд[cite: 8].
  refreshButton.disabled = true;
  // Пишем в общий статус текст ожидания[cite: 8].
  statusText.textContent = "Načítavam programy…";
  // Запускаем loadOne для каждого кинотеатра параллельно через Promise.allSettled (ждём завершения всех, даже если часть упадёт)[cite: 8].
  const outcomes = await Promise.allSettled(SOURCES.map(loadOne));
  // Считаем количество неудавшихся запросов (со статусом "rejected")[cite: 8].
  const failed = outcomes.filter((outcome) => outcome.status === "rejected").length;
  // Выводим финальный отчёт: сколько кинотеатров из общего количества успешно загрузилось[cite: 8].
  statusText.textContent = `Načítané ${SOURCES.length - failed} z ${SOURCES.length} kín.`;
  // Включаем кнопку обновления обратно[cite: 8].
  refreshButton.disabled = false;
}

// Динамически создаём чекбоксы в блоке фильтров на основе массива SOURCES[cite: 8]:
for (const source of SOURCES) {
  // Создаём тег обёртки <label>[cite: 8].
  const label = document.createElement("label");
  // Назначаем класс Bootstrap для красивого выравнивания инлайн-чекбоксов[cite: 8].
  label.className = "form-check form-check-inline";

  // Создаём сам элемент ввода <input>[cite: 8].
  const checkbox = document.createElement("input");
  // Задаём тип "checkbox"[cite: 8].
  checkbox.type = "checkbox";
  // Класс оформления чекбокса Bootstrap[cite: 8].
  checkbox.className = "form-check-input";
  // По умолчанию галочка включена[cite: 8].
  checkbox.checked = true;

  // Вешаем слушатель переключения галочки[cite: 8]:
  checkbox.addEventListener("change", () => {
    // Если галочку поставили — убираем id кинотеатра из списка скрытых[cite: 8]:
    if (checkbox.checked) {
      hiddenSources.delete(source.id);
    // Если галочку сняли — добавляем id кинотеатра в список скрытых[cite: 8]:
    } else {
      hiddenSources.add(source.id);
    }
    // Перерисовываем карточки (скрытая карточка исчезнет из сетки)[cite: 8].
    renderCards();
  });

  // Вставляем инпут и название кинотеатра с пробелом внутрь тега <label>[cite: 8].
  label.append(checkbox, ` ${source.name}`);
  // Добавляем собранный чекбокс в контейнер фильтров на странице[cite: 8].
  filters.append(label);
}

// Вешаем слушатель клика на главную кнопку "Aktualizovať všetko" для ручного перезапуска[cite: 8].
refreshButton.addEventListener("click", loadAll);

// Стартовая точка: запускаем первичную загрузку данных сразу при открытии страницы браузером[cite: 8].
loadAll();