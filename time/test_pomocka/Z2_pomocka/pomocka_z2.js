// Ждём, пока HTML-страница полностью загрузится (это синтаксис библиотеки jQuery, аналог DOMContentLoaded).
$(document).ready(function(){

    // Выводим в консоль браузера (F12) сообщение для разработчика, что скрипт успешно запустился.
    console.log("Aplikácia inicializovaná.");

    // Создаём главный объект приложения, где в оперативной памяти будут храниться все рабочие данные:
    let appData = {
        // Здесь будут лежать распарсенные меню всех трёх ресторанов.
        restaurants: {},
        // Здесь сохраним время последней загрузки данных для каждого ресторана (чтобы знать, когда обновляли).
        timestamps: {},
        // Индекс выбранного дня недели (0 — понедельник, 1 — вторник и т.д., по умолчанию 0).
        selectedDay: 0
    };

    // Название ключа (ячейки), под которым мы будем сохранять меню в долговременную память браузера (localStorage).
    const STORAGE_KEY = 'canteen_menu_data';

    // Справочник настроек для каждого ресторана (их ID, красивые названия, ссылки в интернете и пути к локальным копиям):
    const RESTAURANTS = {
        // Настройки для столовой FreeFood:
        freefood: {
            id: 'freefood',                          // Уникальный идентификатор
            name: 'FreeFood',                        // Видимое название для пользователя
            url: 'http://www.freefood.sk/menu/',     // Реальный сайт заведения в интернете
            localFile: 'source/FreeFood.html'        // Скачанный локальный HTML-файл на случай работы без интернета[cite: 2]
        },
        // Настройки для столовой White Dragon:
        dragon: {
            id: 'dragon',
            name: 'White Dragon',
            url: 'https://whitedragon.sk/menu/denne-menu/',
            localFile: 'source/White_Dragon.html'    // Локальный файл меню White Dragon[cite: 2]
        },
        // Настройки для столовой Eat & Meet:
        eat: {
            id: 'eat',
            name: 'Eat & Meet',
            url: 'http://eatandmeet.sk/tyzdenne-menu',
            localFile: 'source/eat&meet.html'        // Локальный файл меню Eat & Meet[cite: 2]
        }
    };

    // Асинхронная функция для скачивания содержимого HTML-страницы ресторана по его ключу ('freefood', 'dragon', 'eat').
    async function fetchHtml(restaurantKey) {

        // Узнаём текущий режим из переключателя на странице: откуда брать данные ('local' — из файлов или 'live' — из интернета).
        const sourceMode = $('#source-toggle').val();

        // Достаём настройки нужного ресторана из нашего справочника RESTAURANTS выше.
        const config = RESTAURANTS[restaurantKey];
        
        // По умолчанию считаем, что загружать будем из локального файла (например, 'source/FreeFood.html')[cite: 2].
        let targetUrl = config.localFile;

        // Но если в выпадающем списке выбран режим 'live' (живой сайт):
        if (sourceMode === 'live') {
            // Подменяем адрес на реальный URL ресторана в интернете.
            targetUrl = config.url;
        }

        // Делаем сетевой запрос по выбранному адресу и ждём (await), пока придёт ответ от сервера/файла.
        const response = await fetch(targetUrl);

        // Проверяем: если ответ вернулся с ошибкой (например, файл не найден 404 или сайт недоступен):
        if (!response.ok) {
            // Выбрасываем ошибку с кодом статуса и именем столовой, прерывая дальнейшее выполнение.
            throw new Error(`Chyba pri načítaní (${response.status}) pre ${config.name}`);
        }

        // Если всё успешно, читаем полученный ответ как сырой текст (HTML-код страницы) и возвращаем его.
        return await response.text();
    }

    // Функция-парсер: принимает сырой HTML столовой FreeFood и превращает его в аккуратный массив с данными.
    function parseFreeFood(htmlString) {

        // Создаём встроенный в браузер инструмент для разбора текстовых строк в полноценный виртуальный DOM-документ.
        const parser = new DOMParser();

        // Превращаем текст сырого HTML в виртуальную страницу (doc), по которой теперь можно искать элементы как обычно.
        const doc = parser.parseFromString(htmlString, 'text/html');
        
        // Создаём пустой массив, куда сложим меню по дням недели.
        const daysMenu = [];

        // Ищем на виртуальной странице все пункты дней недели (теги <li> внутри списка #free-food ul.daily-offer).
        const dayElements = doc.querySelectorAll('#free-food ul.daily-offer > li');

        // Перебираем каждый найденный день (dayLi) по очереди, запоминая его порядковый номер (index).
        dayElements.forEach((dayLi, index) => {

            // Ищем внутри текущего дня заголовок с названием дня и датой (класс .day-title).
            const titleEl = dayLi.querySelector('.day-title');

            // Забираем текст заголовка и отрезаем лишние пробелы по краям (если элемента нет, берём пустую строку).
            const fullTitle = titleEl ? titleEl.textContent.trim() : '';

            // Разделяем строку по запятой (на сайте FreeFood заголовок пишется в формате "Pondelok, 16.10.").
            const parts = fullTitle.split(',');

            // Первая часть до запятой — это название дня (например, "Pondelok"). Если её нет, пишем "Deň 1", "Deň 2" и т.д.
            const dayName = parts[0] ? parts[0].trim() : `Deň ${index + 1}`;

            // Вторая часть после запятой — это дата (например, "16.10."). Если даты нет, ставим null.
            const date = parts[1] ? parts[1].trim() : null;

            // Создаём пустой массив под блюда этого конкретного дня.
            const items = [];

            // Находим все строчки блюд внутри текущего дня (список ul.day-offer > li).
            const dishElements = dayLi.querySelectorAll('ul.day-offer > li');

            // Перебираем каждое блюдо (dishLi) по очереди:
            dishElements.forEach(dishLi => {

                // Ищем элемент с ценой блюда (с классами .brand и .price).
                const priceEl = dishLi.querySelector('.brand.price');

                // Достаём текст цены (например, "5.90 €"), очищая от лишних пробелов.
                const price = priceEl ? priceEl.textContent.trim() : '';

                // Ищем элемент с пометкой/номером блюда (класс .brand, но БЕЗ класса .price — например, "P1", "1", "2").
                const prefixEl = dishLi.querySelector('span.brand:not(.price)');

                // Считываем этот префикс (например, "P" или "P1" означает polievka — суп).
                const prefix = prefixEl ? prefixEl.textContent.trim() : '';

                // Проверяем: содержит ли префикс букву 'p' (в нижнем регистре). Если да, то это суп (true).
                const isSoup = prefix.toLowerCase().includes('p');

                // Определяем тип блюда для нашей системы: если суп — ставим 'soup', иначе основное блюдо — 'main'.
                const type = isSoup ? 'soup' : 'main';

                // Создаём точную независимую копию (клон) тега блюда, чтобы можно было безопасно вырезать из него лишнее.
                const clone = dishLi.cloneNode(true);

                // Удаляем из клона все теги <span> с классом brand (цену и номер), чтобы осталось только чистое название еды.
                clone.querySelectorAll('span.brand').forEach(el => el.remove());

                // Забираем оставшийся чистый текст названия блюда.
                const dishTitle = clone.textContent.trim();

                // Если название блюда не пустое:
                if (dishTitle) {
                    // Формируем красивый объект блюда и добавляем его в массив items:
                    items.push({
                        type: type,         // тип: суп или второе
                        title: dishTitle,   // название еды
                        price: price        // стоимость
                    });
                }
            });

            // Добавляем готовый день со всеми его распарсенными блюдами в общий массив недели:
            daysMenu.push({
                dayIndex: index,    // порядковый номер дня (0, 1, 2...)
                dayName: dayName,   // название (Pondelok, Utorok...)
                date: date,         // дата
                items: items        // список блюд на этот день
            });
        });

        // Возвращаем сформированное меню столовой FreeFood на всю неделю.
        return daysMenu;
    }

    // Объявляем функцию-парсер, которая принимает сырой HTML сайта White Dragon и вытаскивает из него меню.
    function parseWhiteDragon(htmlString) {

        // Создаём инструмент DOMParser, чтобы превратить строку с текстом HTML в виртуальный документ.
        const parser = new DOMParser();

        // Превращаем сырой HTML в виртуальную страницу (doc), по которой можно выполнять поиск элементов.
        const doc = parser.parseFromString(htmlString, 'text/html');

        // Создаём пустой массив, в который сложим меню на каждый день недели.
        const daysMenu = [];

        // Словарь-сопоставление: связывает словацкое название дня недели с его порядковым номером (0 — понедельник и т.д.).
        const dayIndexMap = {
            'pondelok': 0, 
            'utorok': 1, 
            'streda': 2, 
            'štvrtok': 3, 
            'piatok': 4
        };

        // Находим все абзацы текста (<p>), которые лежат внутри основного блока сайта (.l-main .l-section-h p).
        const paragraphs = doc.querySelectorAll('.l-main .l-section-h p');

        // Перебираем каждый найденный абзац (p) по очереди:
        paragraphs.forEach(p => {

            // Заменяем HTML-теги переноса строки (<br>, <br/>, <br >) на обычный символ переноса строки '\n'.
            const rawHtml = p.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');

            // Создаём временный невидимый блок <div> в памяти для очистки HTML-тегов.
            const tempDiv = document.createElement('div');

            // Засовываем туда текст с нашими переносами строк.
            tempDiv.innerHTML = rawHtml;

            // Забираем только чистый текст без тегов и отрезаем пробелы по краям.
            const fullText = tempDiv.textContent.trim();

            // Разбиваем текст абзаца по символу переноса '\n' на отдельные строки,
            // очищаем каждую строчку от пробелов (.map) и выкидываем пустые строки (.filter).
            const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            // Если в абзаце вообще не оказалось строк текста — пропускаем его и идём к следующему.
            if (lines.length === 0) return;

            // Берём самую первую строчку абзаца и переводим в нижний регистр (маленькие буквы), чтобы легко искать день.
            const firstLineLower = lines[0].toLowerCase();

            // Переменная для сохранения номера найденного дня недели (пока -1, то есть "день не найден").
            let matchedDayIndex = -1;

            // Переменная для красивого названия дня с большой буквы.
            let matchedDayName = '';

            // Перебираем пары [название, индекс] из нашего словаря dayIndexMap:
            for (const [name, idx] of Object.entries(dayIndexMap)) {

                // Проверяем: начинается ли первая строчка с названия этого дня (например, "pondelok...")?
                if (firstLineLower.startsWith(name)) {
                    // Запоминаем порядковый номер дня (например, 0 для понедельника).
                    matchedDayIndex = idx;
                    // Делаем первую букву заглавной, а остальное оставляем строчным (получаем "Pondelok").
                    matchedDayName = name.charAt(0).toUpperCase() + name.slice(1);
                    // Прерываем цикл поиска, так как день успешно определён.
                    break;
                }
            }

            // Если первая строчка — это не день недели (а просто какой-то текст или новость на сайте), пропускаем этот абзац.
            if (matchedDayIndex === -1) return;

            // Проверяем: написано ли в тексте слово "zatvorené" (закрыто)?
            if (fullText.toLowerCase().includes('zatvorené')) {
                // Если ресторан закрыт, добавляем этот день с пустым списком блюд (items: []):
                daysMenu.push({
                    dayIndex: matchedDayIndex, // номер дня
                    dayName: matchedDayName,   // название дня
                    date: null,                // даты нет
                    items: []                  // пустой список еды
                });
                // Завершаем обработку этого абзаца.
                return;
            }

            // Создаём пустой массив под блюда этого дня.
            const items = [];

            // Проходимся циклом по всем строкам абзаца, начиная со 2-й (индекс 1), так как 1-я строка (индекс 0) — это сам день недели.
            for (let i = 1; i < lines.length; i++) {
                // Достаём текущую строчку.
                const line = lines[i];

                // Проверяем на рекламный/служебный мусор: если строчка содержит "цена меню", "приятного аппетита" или "команда White dragon":
                if (line.toLowerCase().includes('cena menu') || 
                    line.toLowerCase().includes('dobrú chuť') || 
                    line.toLowerCase().includes('tím white dragon')) {
                    // Пропускаем эту бесполезную строчку и идём к следующей (continue).
                    continue;
                }

                // Проверяем, суп ли это: начинается со слова "polievka" или содержит слова "бульон", "кремовый", "борщ", "том ям".
                const isSoup = line.toLowerCase().startsWith('polievka') || 
                              line.toLowerCase().includes('vývar') || 
                              line.toLowerCase().includes('krémová') || 
                              line.toLowerCase().includes('boršč') || 
                              line.toLowerCase().includes('tom yum');

                // Очищаем название блюда: регулярным выражением удаляем номера аллергенов в самом конце строки (например, " 1, 3, 7").
                let cleanTitle = line
                    .replace(/\s+\d+(\s*,\s*\d+)*\s*$/g, '')
                    // Отрезаем пробелы по краям.
                    .trim();

                // Определяем цену: в White Dragon суп входит в стоимость, а фиксированная цена комплексного обеда — 9,90 €.
                let price = isSoup ? '' : '9,90 €';

                // Если после всех очисток в названии осталось больше 2 символов (защита от случайных точек/тире):
                if (cleanTitle.length > 2) {
                    // Добавляем готовое блюдо в список дня:
                    items.push({
                        type: isSoup ? 'soup' : 'main', // если суп — 'soup', иначе второе — 'main'
                        title: cleanTitle,              // чистое название еды
                        price: price                    // цена
                    });
                }
            }

            // Добавляем собранный день недели со всеми его блюдами в общий массив:
            daysMenu.push({
                dayIndex: matchedDayIndex, // индекс (0, 1, 2...)
                dayName: matchedDayName,   // имя дня (Pondelok, Utorok...)
                date: null,                // конкретная дата у них в тексте не пишется
                items: items               // массив блюд
            });
        });

        // Сортируем дни по порядку от 0 до 4 (с понедельника по пятницу), чтобы они не перепутались местами.
        daysMenu.sort((a, b) => a.dayIndex - b.dayIndex);

        // Возвращаем готовое отсортированное меню White Dragon.
        return daysMenu;
    }

    // Объявляем функцию-парсер для третьего заведения — Eat & Meet, принимающую сырой HTML-код их страницы[cite: 2].
    function parseEatAndMeet(htmlString) {

        // Создаём инструмент DOMParser, чтобы преобразовать текст страницы в виртуальное дерево элементов.
        const parser = new DOMParser();

        // Превращаем строку с разметкой в виртуальный HTML-документ (doc) для удобного поиска тегов.
        const doc = parser.parseFromString(htmlString, 'text/html');

        // Создаём пустой массив, куда сложим распарсенное меню столовой по дням недели.
        const daysMenu = [];

        // Список словацких названий рабочих дней недели по порядку (от понедельника до пятницы).
        const dayNames = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok'];

        // Запускаем цикл от 1 до 5 (на сайте Eat & Meet блоки дней названы id="day-1", id="day-2" и т.д.)[cite: 2].
        for (let i = 1; i <= 5; i++) {

            // Ищем на виртуальной странице блок конкретного дня по его id (например, "#day-1")[cite: 2].
            const dayPane = doc.querySelector(`#day-${i}`);

            // Если блока с таким днем на странице нет — пропускаем шаг и переходим к следующему дню.
            if (!dayPane) continue;

            // Вычисляем индекс для массива: отнимаем 1 (для i=1 индекс будет 0, для i=2 индекс 1 и т.д.).
            const dayIndex = i - 1;

            // Берём красивое название дня из нашего массива по полученному индексу (0 -> 'Pondelok').
            const dayName = dayNames[dayIndex];

            // Создаём пустой массив под блюда этого конкретного дня.
            const items = [];

            // Находим все карточки блюд внутри вкладки этого дня (элементы с классом .menu-details)[cite: 2].
            const mealElements = dayPane.querySelectorAll('.menu-details');

            // Перебираем каждое найденное блюдо (mealEl) по очереди:
            mealElements.forEach(mealEl => {

                // Ищем заголовок <h4>, где в Eat & Meet пишется категория (например, "Polievka" или "Hlavné jedlo")[cite: 2].
                const categoryEl = mealEl.querySelector('h4');

                // Забираем чистый текст категории без лишних пробелов (если тега нет — пустая строка).
                const categoryText = categoryEl ? categoryEl.textContent.trim() : '';

                // Ищем блок описания с классом .desc, где содержится название самого блюда[cite: 2].
                const descEl = mealEl.querySelector('.desc');

                // Заводим переменную под чистое название блюда.
                let dishTitle = '';

                // Если блок описания существует:
                if (descEl) {
                    // Делаем точную независимую копию (клон) этого блока, чтобы случайно не сломать оригинал.
                    const clone = descEl.cloneNode(true);

                    // Находим внутри клона все теги <span> (там лежат цифры аллергенов) и безжалостно их удаляем[cite: 2].
                    clone.querySelectorAll('span').forEach(s => s.remove());

                    // Сохраняем оставшийся очищенный текст как название блюда.
                    dishTitle = clone.textContent.trim();
                }

                // Ищем блок с ценой блюда (с классом .price)[cite: 2].
                const priceEl = mealEl.querySelector('.price');

                // Переменная под обработанную цену.
                let price = '';

                // Если блок цены найден:
                if (priceEl) {
                    // Забираем сырой текст цены (например, "4.50 € / 5.20 €", где через слэш указаны студенческая и обычная цены)[cite: 2].
                    const rawPrice = priceEl.textContent.trim();

                    // Разрезаем строку по символу дроби '/'.
                    const parts = rawPrice.split('/');

                    // Берём первую цену до дроби (студенческую) и обрезаем пробелы, либо оставляем исходную, если слэша не было.
                    price = parts[0] ? parts[0].trim() : rawPrice;
                }

                // Проверяем, суп ли это: если в названии категории есть "polievka" ИЛИ в названии блюда есть "vývar" (бульон).
                const isSoup = categoryText.toLowerCase().includes('polievka') || 
                              dishTitle.toLowerCase().includes('vývar');

                // Определяем тип: 'soup' для супов и 'main' для вторых блюд.
                const type = isSoup ? 'soup' : 'main';

                // Если название блюда не пустое:
                if (dishTitle) {
                    // Складываем готовый объект блюда в массив блюд текущего дня:
                    items.push({
                        type: type,         // суп или основное
                        title: dishTitle,   // название еды
                        price: price        // цена
                    });
                }
            });

            // Добавляем обработанный день недели со всем списком еды в общий массив заведения:
            daysMenu.push({
                dayIndex: dayIndex, // номер дня от 0 до 4
                dayName: dayName,   // название (Pondelok и т.д.)
                date: null,         // даты у них в этих блоках нет
                items: items        // список блюд
            });
        }

        // Возвращаем полностью готовое недельное меню столовой Eat & Meet.
        return daysMenu;
    }

    // Главная функция отрисовки (рендера) меню на веб-странице в браузере.
    function renderMenu() {

        // Находим на странице главный контейнер (через jQuery), куда будут вставляться колонки с меню.
        const $container = $('#menu-container');

        // Полностью очищаем контейнер от старого содержимого (удаляем старые карточки).
        $container.empty();

        // Проверяем: если в объекте appData.restaurants вообще нет сохранённых заведений (данные ещё не скачаны):
        if (Object.keys(appData.restaurants).length === 0) {
            // Выводим серую заглушку по центру: "Данные не загружены. Нажмите 'Обновить меню'".
            $container.html('<div class="col-12 text-center text-muted py-5">Dáta nie sú načítané. Kliknite na "Aktualizovať menu".</div>');
            // Выходим из функции, так как отрисовывать пока нечего.
            return;
        }

        // Перебираем идентификаторы всех сохранённых ресторанов ('freefood', 'dragon', 'eat'):
        Object.keys(appData.restaurants).forEach(restId => {

            // Достаём настройки текущего ресторана (название, ссылки) из справочника RESTAURANTS.
            const config = RESTAURANTS[restId];

            // Достаём массив дней с блюдами для этого ресторана.
            const days = appData.restaurants[restId];

            // Заводим массив для дней, которые мы действительно должны показать пользователю прямо сейчас.
            let daysToShow = [];

            // Проверяем: если в фильтре выбрана кнопка "Все дни" ('all'):
            if (appData.selectedDay === 'all') {
                // Показываем абсолютно все дни недели.
                daysToShow = days;
            // Иначе (если выбран конкретный день, например, только вторник с индексом 1):
            } else {
                // Оставляем через фильтр только тот день, чей индекс совпадает с выбранным пользователем.
                daysToShow = days.filter(d => d.dayIndex === appData.selectedDay);
            }

            // Переменная-строка, в которую будем по кусочкам собирать весь HTML-код списка блюд.
            let dishesHtml = '';

            // Проходимся по всем дням, отобранным для показа:
            daysToShow.forEach(day => {

                // Если пользователь смотрит сразу всю неделю ('all'), перед каждым днем добавляем красивый подзаголовок дня недели с датой:
                if (appData.selectedDay === 'all') {
                    dishesHtml += `<h6 class="text-uppercase text-secondary fw-bold mt-3 mb-2 border-bottom pb-1">${day.dayName} ${day.date ? `(${day.date})` : ''}</h6>`;
                }

                // Если в этот день список блюд пустой (например, ресторан закрыт):
                if (day.items.length === 0) {
                    // Добавляем плашку с предупреждением: "На этот день меню недоступно".
                    dishesHtml += `<div class="menu-empty-message">Pre tento deň nie je ponuka k dispozícii.</div>`;
                // Если блюда есть:
                } else {
                    // Перебираем каждое блюдо этого дня:
                    day.items.forEach(item => {

                        // Задаём CSS-класс полоски слева: для супов — 'menu-item-soup' (например, оранжевая), для основных блюд — 'menu-item-main' (зеленая).
                        const borderClass = item.type === 'soup' ? 'menu-item-soup' : 'menu-item-main';

                        // Формируем строчку блюда: название слева, цена справа (стили Bootstrap d-flex justify-content-between):
                        dishesHtml += `
                            <div class="menu-item ${borderClass} d-flex justify-content-between align-items-center">
                                <span class="pe-2">${item.title}</span>
                                ${item.price ? `<span class="menu-price">${item.price}</span>` : ''}
                            </div>
                        `;
                    });
                }
            });
            
            // Проверяем: есть ли в памяти дата и время обновления для текущего заведения?
            // Если есть — берем её, если нет — пишем текст "Nie je k dispozícii" (Недоступно).
            const lastUpdated = (appData.timestamps && appData.timestamps[config.id]) 
                ? appData.timestamps[config.id] 
                : 'Nie je k dispozícii';

            // Формируем HTML-код красивой карточки столовой с помощью шаблонной строки (обратные кавычки ` `):
            const cardHtml = `
                <!-- Колонка сетки Bootstrap: на смартфонах на всю ширину (col-12), на компьютерах в 3 колонки (col-lg-4) -->
                <div class="col-12 col-lg-4 mb-4 restaurant-card" data-restaurant="${config.id}">
                    <!-- Сама белая карточка со скруглениями, тенью shadow-sm и высотой 100% -->
                    <div class="card h-100 shadow-sm border-0 d-flex flex-column">
                        <!-- Шапка карточки: название заведения слева и кнопка перехода на сайт справа -->
                        <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <!-- Имя ресторана (FreeFood, White Dragon или Eat & Meet) -->
                            <h3 class="h5 m-0 fw-bold text-dark">${config.name}</h3>
                            <!-- Кнопка со ссылкой на официальный сайт (открывается в новой вкладке target="_blank") -->
                            <a href="${config.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary">
                                Web →
                            </a>
                        </div>
                        <!-- Тело карточки: сюда вставляется весь собранный ранее список блюд (dishesHtml) -->
                        <div class="card-body flex-grow-1">
                            ${dishesHtml}
                        </div>
                        <!-- Подвал карточки: серенькая полоска снизу с датой и временем обновления данных -->
                        <div class="card-footer bg-light border-top text-muted small py-2">
                            <span>Posledná aktualizácia: ${lastUpdated}</span>
                        </div>
                    </div>
                </div>
            `;

            // Вставляем готовую карточку заведения внутрь контейнера на странице.
            $container.append(cardHtml);
        });

        // После отрисовки карточек сразу вызываем фильтрацию по галочкам чекбоксов (чтобы скрыть лишние, если галочка снята).
        applyRestaurantFilter();
    }

    // Функция скрытия/показа карточек столовых в зависимости от состояния чекбоксов.
    function applyRestaurantFilter() {

        // Проходимся по каждому чекбоксу выбора столовой (с классом .filter-restaurant):
        $('.filter-restaurant').each(function () {

            // Считываем техническое значение чекбокса (например, 'freefood', 'dragon' или 'eat').
            const restId = $(this).val();

            // Проверяем: стоит ли сейчас галочка в этом чекбоксе? (true — стоит, false — снята).
            const isChecked = $(this).is(':checked');

            // Находим на странице карточку именно этой столовой по её data-атрибуту.
            const $card = $(`.restaurant-card[data-restaurant="${restId}"]`);

            // Если галочка стоит:
            if (isChecked) {
                // Показываем карточку на экране.
                $card.show();
            // Если галочку сняли:
            } else {
                // Прячем карточку с экрана.
                $card.hide();
            }
        });
    }

    // Вешаем слушатель: как только пользователь ставит или снимает галочку с любого чекбокса столовой:
    $('.filter-restaurant').on('change', function () {
        // Заново запускаем функцию фильтрации карточек.
        applyRestaurantFilter();
    });

    // Вешаем слушатель клика на кнопки переключения дней недели (внутри блока #days):
    $('#days button').on('click', function () {

        // Снимаем синюю подсветку (класс .active) со всех кнопок дней недели.
        $('#days button').removeClass('active');

        // Добавляем класс .active именно той кнопке, на которую только что нажал пользователь.
        $(this).addClass('active');

        // Считываем значение атрибута data-day у нажатой кнопки (например, '0', '1' или 'all').
        const clickedDay = $(this).data('day');

        // Записываем выбранный день в память приложения: если это 'all', оставляем строку 'all', иначе превращаем в число (0, 1...).
        appData.selectedDay = (clickedDay === 'all') ? 'all' : parseInt(clickedDay, 10);

        // Перерисовываем меню, чтобы показались блюда только за выбранный день.
        renderMenu();
    });

    // Главная асинхронная функция загрузки данных обо всех столовых сразу.
    async function loadAllMenus() {

        // Блок try/catch: пытаемся выполнить загрузку, а если возникнет любая сетевая ошибка — перехватим её в блоке catch.
        try {

            // Показываем крутящийся индикатор загрузки (спиннер), убирая класс d-none (скрывающий элемент).
            $('#loading-spinner').removeClass('d-none');

            // Выводим пользователю текстовый статус: "Загружаю и обрабатываю меню со всех источников...".
            $('#status-message').text('Načítavam a spracovávam menu zo všetkých zdrojov...');

            // Скачиваем HTML-код сразу всех 3-х столовых одновременно и параллельно с помощью Promise.all:
            const [freeHtml, dragonHtml, eatHtml] = await Promise.all([
                fetchHtml('freefood'), // запрос к FreeFood[cite: 2]
                fetchHtml('dragon'),   // запрос к White Dragon[cite: 2]
                fetchHtml('eat')       // запрос к Eat & Meet[cite: 2]
            ]);

            // Получаем текущую дату и время в словацком формате (например, "9. 11. 2026, 1:33:00").
            const now = new Date().toLocaleString('sk-SK');

            // Парсим HTML FreeFood и сохраняем массив блюд в appData.
            appData.restaurants.freefood = parseFreeFood(freeHtml);
            // Запоминаем время обновления для FreeFood.
            appData.timestamps.freefood = now;

            // Парсим HTML White Dragon и сохраняем массив блюд в appData.
            appData.restaurants.dragon = parseWhiteDragon(dragonHtml);
            // Запоминаем время обновления для White Dragon.
            appData.timestamps.dragon = now;

            // Парсим HTML Eat & Meet и сохраняем массив блюд в appData.
            appData.restaurants.eat = parseEatAndMeet(eatHtml);
            // Запоминаем время обновления для Eat & Meet.
            appData.timestamps.eat = now;

            // Сохраняем все скачанные данные и временные метки в долговременную память браузера (localStorage) в виде строки JSON.
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                restaurants: appData.restaurants,
                timestamps: appData.timestamps
            }));

            // Обновляем текст статуса на радостное: "Все столовые успешно загружены!".
            $('#status-message').text('Všetky jedálne úspešne načítané!');

            // Отрисовываем свежие карточки меню на странице.
            renderMenu();

        // Если в процессе скачивания или парсинга что-то пошло не так (пропал интернет, сайт упал):
        } catch (error) {

            // Выводим техническую ошибку в консоль браузера (F12) для программиста.
            console.error(error);

            // Показываем пользователю на экране текст ошибки (например, "Chyba: Failed to fetch").
            $('#status-message').text('Chyba: ' + error.message);

        // Блок finally выполнится в любом случае — и при успехе, и при ошибке:
        } finally {

            // Прячем спиннер обратно (добавляем класс d-none), так как процесс завершён.
            $('#loading-spinner').addClass('d-none');
        }
    }

    // Слушатель клика на кнопку "Обновить меню" (кнопка #refresh_info):
    $('#refresh_info').on('click', function () {
        // Принудительно запускаем сетевую загрузку всех меню заново.
        loadAllMenus();
    });

    // Слушатель клика на кнопки очистки памяти (кнопки с id #delete_info или #clear_data):
    $('#delete_info, #clear_data').on('click', function () {

        // Удаляем сохранённую запись меню из памяти браузера (localStorage).
        localStorage.removeItem(STORAGE_KEY);

        // Очищаем объект ресторанов в оперативной памяти программы.
        appData.restaurants = {};

        // Очищаем объект отметок времени.
        appData.timestamps = {};

        // Выводим статус: "Сохранённые данные были удалены из памяти."
        $('#status-message').text('Uložené dáta boli vymazané z pamäte.');

        // Перерисовываем интерфейс (он покажет пустую заглушку).
        renderMenu();
    });

    // ТОЧКА ВХОДА: проверяем, сохранены ли уже какие-то данные меню в памяти браузера (кэше) от прошлых посещений:
    const cachedData = localStorage.getItem(STORAGE_KEY);

    // Если сохранённые данные в памяти нашлись:
    if (cachedData) {
        try {
            // Превращаем сохранённую JSON-строку обратно в рабочий JavaScript-объект.
            const parsed = JSON.parse(cachedData);

            // Проверяем формат данных: если внутри есть поле restaurants:
            if (parsed.restaurants) {
                // Восстанавливаем меню столовых из кэша.
                appData.restaurants = parsed.restaurants;
                // Восстанавливаем сохранённые метки времени (или создаём пустой объект, если их не было).
                appData.timestamps = parsed.timestamps || {};
            // Если сохранён старый формат (где сразу лежал список заведений):
            } else {
                appData.restaurants = parsed;
                appData.timestamps = {};
            }

            // Информируем пользователя: "Данные были загружены из локального хранилища (кэша)."
            $('#status-message').text('Dáta boli načítané z lokálneho úložiska (cache).');

            // Сразу мгновенно отрисовываем меню без сетевых запросов.
            renderMenu();

        // Если сохранённый кэш оказался повреждён или сломан:
        } catch (e) {
            // Не паникуем, а просто скачиваем свежие меню с нуля через сеть.
            loadAllMenus();
        }

    // Если же в памяти браузера пусто (пользователь зашёл на сайт впервые):
    } else {
        // Запускаем полную загрузку меню из источников.
        loadAllMenus();
    }
});