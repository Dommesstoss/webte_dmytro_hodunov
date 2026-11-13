// Поясняющий комментарий от преподавателя: все три парсера получают на вход Document из DOMParser
// и отдают наружу строго одинаковую структуру массива объектов по дням.

// Массив со словацкими названиями дней недели по порядку от понедельника до воскресенья.
const DAY_NAMES = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];

// Вспомогательная функция для чистки строк от мусора.
function cleanText(text) {
  // Находит любые разрывы строк, табуляции и подряд идущие пробелы (\s+) и заменяет на 1 пробел, а trim() убирает пробелы с краев.
  return text.replace(/\s+/g, " ").trim();
}

// Вспомогательная функция безопасного взятия текста из дочернего элемента по CSS-селектору.
function textOf(element, selector) {
  // element.querySelector(selector)? — если элемент не найден, вместо краша возвращает undefined.
  // ?? "" — если слева null или undefined, подставляет пустую строку.
  // cleanText(...) — чистит полученный текст от лишних пробелов.
  return cleanText(element.querySelector(selector)?.textContent ?? "");
}

// Вспомогательная функция извлечения числовой цены из строки.
function parsePrice(text) {
  // Если текста нет (null, undefined или пустая строка) — возвращаем null.
  if (!text) {
    return null;
  }
  // Регулярное выражение /^\D*/ отрезает любые нецифровые символы в начале строки (например, "Vstupné: ").
  // replace(",", ".") заменяет европейскую запятую на точку для дробных чисел.
  // parseFloat превращает получившуюся строку в число (например, "8.50").
  const price = parseFloat(text.replace(/^\D*/, "").replace(",", "."));
  // Если число не спарсилось и получилось NaN — отдаем null, иначе само число.
  return Number.isNaN(price) ? null : price;
}

// Вспомогательная функция для превращения сырого HTML-текста в виртуальный DOM-документ через браузерный DOMParser.
function parseHtml(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

// ==========================================
// 1. Парсер для Kino Hviezda (сайт с блоками <section class="den">)
// ==========================================
function parseHviezda(doc) {
  // Создаем пустой массив под дни недели.
  const days = [];

  // Ищем все секции дней недели с классом .den и проходим по каждой циклом.
  for (const section of doc.querySelectorAll(".den")) {
    // Находим заголовок дня h2.
    const heading = section.querySelector("h2");
    // Создаем пустой массив под сеансы фильмов этого дня.
    const screenings = [];

    // Ищем все строки фильмов с классом .film внутри этой секции.
    for (const film of section.querySelectorAll(".film")) {
      // Достаем время сеанса из тега .cas.
      const time = textOf(film, ".cas");
      // Достаем название фильма из ссылки .nazov.
      const title = textOf(film, ".nazov");

      // Если время или название отсутствуют — сеанс битый, пропускаем его (continue).
      if (!time || !title) {
        continue;
      }

      // Добавляем готовый сеанс в массив: время, название, зал из .sala и числовую цену из .cena.
      screenings.push({ time, title, hall: textOf(film, ".sala"), price: parsePrice(textOf(film, ".cena")) });
    }

    // Собираем день: имя дня из первого текстового узла заголовка h2, дату из h2 small, и список сеансов.
    days.push({
      day: cleanText(heading.firstChild.textContent),
      date: textOf(section, "h2 small"),
      screenings,
    });
  }

  // Возвращаем собранную неделю.
  return days;
}

// ==========================================
// 2. Парсер для Kino Mier (сайт со сплошной таблицей table.rozpis)
// ==========================================
function parseMier(doc) {
  // Создаем массив под дни недели.
  const days = [];
  // Переменная-указатель на объект текущего обрабатываемого дня.
  let current = null;

  // Обходим каждую строку tr таблицы table.rozpis сверху вниз.
  for (const row of doc.querySelectorAll("table.rozpis tr")) {
    // Если строка имеет класс .den — это строка-разделитель, начинающая новый день (например, "Pondelok 2. 11. 2026").
    if (row.classList.contains("den")) {
      // Разбиваем текст строки по пробелам: первое слово в day ("Pondelok"), остаток массива в date (["2.", "11.", "2026"]).
      const [day, ...date] = cleanText(row.textContent).split(" ");
      // Формируем новый объект дня, склеивая число и месяц ("2. 11."), и создаем пустой массив screenings.
      current = { day, date: date.slice(0, 2).join(" "), screenings: [] };
      // Закидываем день в итоговый массив days.
      days.push(current);
      // Идем к следующей строке таблицы.
      continue;
    }

    // Если это не разделитель дня, ищем ячейки <td> в строке фильма.
    const cells = row.querySelectorAll("td");
    // Если день еще не начался (current === null) или в строке не 3 ячейки — пропускаем строку.
    if (!current || cells.length !== 3) {
      continue;
    }

    // Добавляем фильм в массив сеансов текущего открытого дня:
    current.screenings.push({
      time: cleanText(cells[0].textContent),                       // 1-я ячейка — время
      title: cleanText(cells[1].textContent),                      // 2-я ячейка — название
      hall: "",                                                    // в Kino Mier залы не указаны, поэтому пустая строка
      price: parsePrice(cleanText(cells[2].textContent)),          // 3-я ячейка — цена (вызываем parsePrice)
    });
  }

  // Возвращаем массив дней.
  return days;
}

// ==========================================
// 3. Парсер для Kino Lumière (сплошной список тегов article.predstavenie с датой в атрибуте time)
// ==========================================
function parseLumiere(doc) {
  // Используем структуру Map для группировки сеансов по дням недели.
  const byDay = new Map();

  // Обходим каждую карточку фильма article.predstavenie.
  for (const article of doc.querySelectorAll("article.predstavenie")) {
    // Считываем ISO-дату из атрибута datetime тега <time> (например, "2026-11-02T19:00").
    const datetime = article.querySelector("time")?.getAttribute("datetime");
    // Достаем название фильма из заголовка <h3>.
    const title = textOf(article, "h3");

    // Если даты или названия нет — пропускаем элемент.
    if (!datetime || !title) {
      continue;
    }

    // Создаем объект даты JS из строки datetime.
    const date = new Date(datetime);
    // Вычисляем имя дня недели на словацком (сдвиг +6 % 7 переводит вс=0 в вс=6, пн=0).
    const day = DAY_NAMES[(date.getDay() + 6) % 7];

    // Если в Map еще нет ключа для этого дня недели:
    if (!byDay.has(day)) {
      // Создаем новую запись дня с вычисленной датой (день. месяц.) и пустым массивом сеансов.
      byDay.set(day, { day, date: `${date.getDate()}. ${date.getMonth() + 1}.`, screenings: [] });
    }

    // Берем массив сеансов этого дня из Map и добавляем в него текущий фильм:
    byDay.get(day).screenings.push({
      time: datetime.slice(11, 16),              // вырезаем подстроку часов и минут "19:00" из ISO-строки
      title,                                     // название фильма
      hall: textOf(article, ".miesto"),          // зал из тега с классом .miesto
      price: parsePrice(textOf(article, ".vstupne")), // цена из тега с классом .vstupne
    });
  }

  // Проходимся по стандартному массиву DAY_NAMES, чтобы дни в результате шли по порядку от понедельника к воскресенью,
  // отбираем только те, которые есть в Map, и возвращаем их значения.
  return DAY_NAMES.filter((day) => byDay.has(day)).map((day) => byDay.get(day));
}