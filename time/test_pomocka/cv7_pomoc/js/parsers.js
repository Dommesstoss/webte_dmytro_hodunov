// Ready-made parsers for the three cinema pages.
// Every parser takes a Document from DOMParser and returns the same structure:
// [{ day: "Pondelok", date: "2. 11.", screenings: [{ time, title, hall, price }] }]

const DAY_NAMES = ["Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota", "Nedeľa"];

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function textOf(element, selector) {
  return cleanText(element.querySelector(selector)?.textContent ?? "");
}

function parsePrice(text) {
  if (!text) {
    return null;
  }
  // Skip everything before the first digit ("Vstupné: 8,50 €" -> "8,50 €")
  const price = parseFloat(text.replace(/^\D*/, "").replace(",", "."));
  return Number.isNaN(price) ? null : price;
}

function parseHtml(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

// Kino Hviezda: <section class="den"> with <h2>Day <small>date</small></h2> and li.film (cviko 6)
function parseHviezda(doc) {
  const days = [];
  for (const section of doc.querySelectorAll(".den")) {
    const heading = section.querySelector("h2");
    const screenings = [];
    for (const film of section.querySelectorAll(".film")) {
      const time = textOf(film, ".cas");
      const title = textOf(film, ".nazov");
      if (!time || !title) {
        continue;
      }
      screenings.push({ time, title, hall: textOf(film, ".sala"), price: parsePrice(textOf(film, ".cena")) });
    }
    days.push({
      day: cleanText(heading.firstChild.textContent),
      date: textOf(section, "h2 small"),
      screenings,
    });
  }
  return days;
}

// Kino Mier: one table, a row tr.den starts a new day ("Pondelok 2. 11. 2026"),
// the following rows with three cells are screenings
function parseMier(doc) {
  const days = [];
  let current = null;
  for (const row of doc.querySelectorAll("table.rozpis tr")) {
    if (row.classList.contains("den")) {
      const [day, ...date] = cleanText(row.textContent).split(" ");
      current = { day, date: date.slice(0, 2).join(" "), screenings: [] };
      days.push(current);
      continue;
    }
    const cells = row.querySelectorAll("td");
    if (!current || cells.length !== 3) {
      continue;
    }
    current.screenings.push({
      time: cleanText(cells[0].textContent),
      title: cleanText(cells[1].textContent),
      hall: "",
      price: parsePrice(cleanText(cells[2].textContent)),
    });
  }
  return days;
}

// Kino Lumière: flat list of article.predstavenie, the day is in <time datetime="2026-11-02T19:00">
function parseLumiere(doc) {
  const byDay = new Map();
  for (const article of doc.querySelectorAll("article.predstavenie")) {
    const datetime = article.querySelector("time")?.getAttribute("datetime");
    const title = textOf(article, "h3");
    if (!datetime || !title) {
      continue;
    }
    const date = new Date(datetime);
    const day = DAY_NAMES[(date.getDay() + 6) % 7];
    if (!byDay.has(day)) {
      byDay.set(day, { day, date: `${date.getDate()}. ${date.getMonth() + 1}.`, screenings: [] });
    }
    byDay.get(day).screenings.push({
      time: datetime.slice(11, 16),
      title,
      hall: textOf(article, ".miesto"),
      price: parsePrice(textOf(article, ".vstupne")),
    });
  }
  return DAY_NAMES.filter((day) => byDay.has(day)).map((day) => byDay.get(day));
}
