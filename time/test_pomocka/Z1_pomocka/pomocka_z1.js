// Ждём, пока браузер полностью прочитает и построит весь HTML-каркас страницы,
// чтобы скрипт не упал с ошибкой, пытаясь найти элементы, которые ещё не появились на экране.
document.addEventListener("DOMContentLoaded", function() {

    // Ищем на странице элемент (таблицу) с CSS-классом "schedule-grid-table" и сохраняем ссылку на неё.
    const scheduleTable = document.querySelector(".schedule-grid-table");

    // Проверяем: нашлась ли таблица на этой странице?
    // Если мы открыли другую вкладку (например, контакты или резюме), таблицы там нет,
    // и весь дальнейший код просто не будет выполняться вхолостую.
    if (scheduleTable) {

        // Создаём дату начала учебного семестра: 14 сентября 2026 года.
        const SEMESTER_START = new Date("2026-09-14");

        // Создаём дату окончания семестра: 18 декабря 2026 года.
        const SEMESTER_END = new Date("2026-12-18");

        // Узнаём точную текущую дату и время на компьютере пользователя прямо сейчас.
        const now = new Date();

        // Считаем общую длительность всего семестра в миллисекундах (отнимаем от даты конца дату старта).
        const totalDuration = SEMESTER_END - SEMESTER_START;

        // Считаем, сколько миллисекунд уже прошло от начала семестра до сегодняшней секунды.
        const elapsed = now - SEMESTER_START;
        
        // Вычисляем процент пройденного времени семестра (делим прошедшее на общее и умножаем на 100).
        let percent = (elapsed / totalDuration) * 100;

        // Защита от выхода за рамки: если семестр ещё не начался (процент ушёл в минус), делаем его 0%.
        if (percent < 0) percent = 0;

        // Если семестр уже закончился (процент больше 100), ограничиваем его максимальными 100%.
        if (percent > 100) percent = 100;

        // Находим на странице текстовый элемент (по id), куда нужно записать проценты цифрами.
        const percentEl = document.getElementById("semester-percent");

        // Находим на странице полосу загрузки (progress bar), которую будем закрашивать.
        const fillEl = document.getElementById("semester-progress-fill");

        // Проверяем: оба ли элемента (текст и полоса) вообще существуют в вёрстке?
        if (percentEl && fillEl) {

            // Округляем процент до одного знака после запятой (например, "45.2"), приклеиваем знак "%" и пишем в текст.
            percentEl.textContent = percent.toFixed(1) + "%";

            // Меняем ширину полосы прогресса в CSS (например, "width: 45.2%"), чтобы она визуально заполнилась.
            fillEl.style.width = percent.toFixed(1) + "%";
        }

        // Находим ВСЕ кнопки фильтрации расписания с классом "filter-btn" и складываем их в список.
        const filterButtons = document.querySelectorAll(".filter-btn");

        // Находим ВСЕ карточки/ячейки занятий (с классом "slot") внутри нашей таблицы.
        const slots = document.querySelectorAll(".schedule-grid-table .slot");

        // Находим блок с сообщением "Ничего не найдено", который показывается, если фильтр пустой.
        const emptyMsg = document.getElementById("filter-empty-message");

        // Берём список кнопок фильтра и перебираем каждую кнопку по очереди с помощью цикла forEach.
        filterButtons.forEach(btn => {

            // Навешиваем на текущую кнопку "слушатель": ждём, когда пользователь по ней кликнет мышкой.
            btn.addEventListener("click", function() {

                // Сначала снимаем класс подсветки "active" абсолютно со всех кнопок фильтра.
                filterButtons.forEach(b => b.classList.remove("active"));

                // А именно той кнопке, на которую сейчас нажали ("this"), добавляем класс "active", чтобы она подсветилась.
                this.classList.add("active");

                // Считываем у нажатой кнопки значение HTML-атрибута "data-filter" (например, "lecture", "practice" или "all").
                const filterType = this.getAttribute("data-filter");

                // Заводим счётчик пар, которые останутся видимыми (на старте их 0).
                let visibleCount = 0;

                // Перебираем абсолютно все карточки пар (слоты) на странице, чтобы решить, какие скрыть, а какие показать.
                slots.forEach(slot => {

                    // Смотрим, какой тип пары указан в атрибуте текущей карточки (например, лекция или практика).
                    const type = slot.getAttribute("data-type");
                    
                    // Условие: если нажата кнопка "Показать всё" ("all") ИЛИ тип пары совпал с выбранным фильтром:
                    if (filterType === "all" || type === filterType) {

                        // Делаем карточку полностью яркой и непрозрачной (100% видимости).
                        slot.style.opacity = "1";

                        // Разрешаем пользователю кликать по ней и наводить курсор (включаем мышь).
                        slot.style.pointerEvents = "auto";

                        // Возвращаем карточке нормальный оригинальный размер (масштаб 1:1).
                        slot.style.transform = "scale(1)";

                        // Увеличиваем наш счётчик видимых пар на единицу (+1).
                        visibleCount++;

                    // Иначе (если карточка не подходит под выбранный фильтр):
                    } else {

                        // Делаем карточку полупрозрачной и блёклой (всего 15% видимости).
                        slot.style.opacity = "0.15"; 

                        // Отключаем реакцию карточки на мышь, чтобы по ней нельзя было кликнуть.
                        slot.style.pointerEvents = "none";

                        // Слегка уменьшаем её визуально (на 2%), создавая красивый эффект отдаления.
                        slot.style.transform = "scale(0.98)";
                    }
                });

                // Проверяем, есть ли на странице блок сообщения о пустом результате поиска.
                if (emptyMsg) {

                    // Если счётчик видимых пар равен 0, включаем блок ("block"), иначе прячем его с глаз ("none").
                    emptyMsg.style.display = (visibleCount === 0) ? "block" : "none";
                }
            });
        });

        // Находим блок статуса (по id), куда пишется информирующее сообщение о занятиях на сегодня.
        const statusBox = document.getElementById("current-class-status");

        // Проверяем: существует ли такой блок статуса на странице?
        if (statusBox) {

            // Узнаём текущий день недели в виде цифры (0 — это воскресенье, 1 — понедельник, ..., 6 — суббота).
            const currentDay = now.getDay();

            // Проверяем: если сегодня день от 1 до 5 (то есть с понедельника по пятницу — будни):
            if (currentDay >= 1 && currentDay <= 5) {

                // Пишем в блок текст на словацком: "Сегодня занятия идут по расписанию текущего дня."
                statusBox.textContent = `Dnes prebieha výučba podľa aktuálneho dňa.`;

            // Иначе (если сегодня суббота или воскресенье — выходные):
            } else {

                // Пишем в блок текст: "Сегодня выходной, занятий нет. Ближайшая пара в понедельник в 08:00."
                statusBox.textContent = `Dnes je víkend, žiadna výučba neprebieha. Najbližšia hodina bude v pondelok o 08:00.`;
            }
        }
    }

    // Ищем на странице HTML-блок с id="map", куда будет встраиваться интерактивная карта.
const mapElement = document.getElementById("map");

// Проверяем: если блок карты найден (значит, пользователь открыл страницу с картой):
if(mapElement){

    // Инициализируем карту через библиотеку Leaflet (L.map) в блоке "map",
    // задаём координаты центра Братиславы ([широта, долгота]) и масштаб приближения (13).
    const map = L.map("map").setView([48.151965, 17.072995], 13);

    // Подключаем слой плиток (картинок карты) от бесплатного сервиса OpenStreetMap.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        // Задаём максимальный зум приближения (до уровня отдельных домов).
        maxZoom: 19,
        // Обязательная подпись с указанием авторских прав OpenStreetMap внизу карты.
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // Добавляем этот настроенный слой на нашу созданную карту.
    }).addTo(map);

    // Создаём объект с координатами и названием университета FEI STU в Братиславе.
    const schoolCoords = { lat: 48.151965, lng: 17.072995, name: "FEI STU Bratislava" };

    // Создаём объект с координатами и названием точки "Дом".
    const homeCoords = { lat: 48.140000, lng: 17.120000, name: "Môj domov" };

    // Ставим стандартную синюю метку-маркер на карте по координатам университета.
    L.marker([schoolCoords.lat, schoolCoords.lng])
        // Отрисовываем маркер на карте.
        .addTo(map)
        // Привязываем всплывающее окошко (попап), которое откроется при клике на маркер.
        .bindPopup(`<b>${schoolCoords.name}</b><br>Škola`);

    // Ставим точно такую же синюю метку на карте по координатам дома.
    L.marker([homeCoords.lat, homeCoords.lng])
        // Отрисовываем маркер дома на карте.
        .addTo(map)
        // Привязываем всплывающее окошко при клике.
        .bindPopup(`<b>${homeCoords.name}</b><br>Bydlisko`);

    // Считываем сохранённые пользователем точки из памяти браузера (localStorage).
    // Если там ничего нет (первый запуск), берём пустой массив [].
    let customPoints = JSON.parse(localStorage.getItem("customPoints")) || [];

    // Создаём пустой массив, куда будем складывать маркеры пользовательских точек на карте.
    let customMarkers = [];

    // Переменная для хранения нарисованной линии между точками (пока линии нет, здесь null).
    let routePolyline = null;

    // Находим выпадающий список для выбора начальной точки пути.
    const pointSelect = document.getElementById("point-select");

    // Находим выпадающий список для выбора конечной точки пути.
    const destinationSelect = document.getElementById("destination-select");

    // Находим кнопку "Рассчитать расстояние" (по id).
    const calculateBtn = document.getElementById("calculate-btn");

    // Находим блок, куда выводится результат вычислений (километры).
    const resultBox = document.getElementById("result-box");

    // Находим блок с подсказкой "У вас пока нет добавленных точек".
    const emptyState = document.getElementById("empty-state");

    // Объявляем функцию удаления точки по её порядковому номеру (index) в массиве.
    function deletePoint(index) {
        // Вырезаем ровно 1 элемент по указанному индексу из массива пользовательских точек.
        customPoints.splice(index, 1);

        // Перезаписываем обновлённый массив точек обратно в память браузера (в виде строки JSON).
        localStorage.setItem("customPoints", JSON.stringify(customPoints));
        
        // Если на карте в этот момент была нарисована линия маршрута:
        if (routePolyline) {
            // Стираем эту линию с карты.
            map.removeLayer(routePolyline);
            // Обнуляем переменную линии.
            routePolyline = null;
        }
        
        // Прячем блок с результатом старого расчёта расстояния.
        resultBox.style.display = "none";

        // Перерисовываем интерфейс (списки и маркеры), чтобы удалённая точка исчезла.
        updateUI();
    }

    // Главная функция обновления внешнего вида интерфейса (UI).
    function updateUI() {
        // Базовая HTML-разметка выпадающего списка со стандартными точками (Дом и Университет).
        const defaultOptions = '<option value="" disabled selected>-- Vyberte miesto --</option><option value="home">Môj domov (Bydlisko)</option><option value="school">FEI STU Bratislava</option>';
        
        // Сбрасываем содержимое списка "Старт" до базового состояния.
        if (pointSelect) pointSelect.innerHTML = defaultOptions;

        // Сбрасываем содержимое списка "Финиш" до базового состояния.
        if (destinationSelect) destinationSelect.innerHTML = defaultOptions;

        // Проходимся по всем старым маркерам пользовательских точек и убираем их с карты.
        customMarkers.forEach(marker => map.removeLayer(marker));

        // Очищаем массив ссылок на маркеры, чтобы заполнить его заново.
        customMarkers = [];

        // Проверяем, существует ли блок "Точек пока нет":
        if (emptyState) {
            // Если массив пользовательских точек пуст:
            if (customPoints.length === 0) {
                // Показываем надпись "Точек пока нет".
                emptyState.style.display = "block";
            // Если пользовательские точки есть:
            } else {
                // Прячем эту надпись.
                emptyState.style.display = "none";
            }
        }

        // Перебираем каждую сохранённую пользовательскую точку (pt) вместе с её номером (index).
        customPoints.forEach((pt, index) => {
            // Если выпадающий список старта существует:
            if (pointSelect) {
                // Создаём новый HTML-тег <option>.
                const opt1 = document.createElement("option");
                // Задаём ему техническое значение, например: "custom_0", "custom_1".
                opt1.value = "custom_" + index;
                // Пишем видимое название точки, которое дал пользователь.
                opt1.textContent = pt.name;
                // Вставляем этот пункт в выпадающий список старта.
                pointSelect.appendChild(opt1);
            }

            // Если выпадающий список финиша существует:
            if (destinationSelect) {
                // Создаём новый HTML-тег <option>.
                const opt2 = document.createElement("option");
                // Задаём такое же техническое значение ("custom_0" и т.д.).
                opt2.value = "custom_" + index;
                // Пишем название точки.
                opt2.textContent = pt.name;
                // Вставляем этот пункт в выпадающий список финиша.
                destinationSelect.appendChild(opt2);
            }

            // Ставим маркер на карте по координатам этой пользовательской точки.
            const marker = L.marker([pt.lat, pt.lng]).addTo(map);

            // Привязываем попап с именем точки и красной кнопкой «Удалить это место».
            marker.bindPopup(`<b>${pt.name}</b><br><span class="delete-btn" style="color: red; cursor: pointer;">Vymazať toto miesto</span>`);
        
            // Вешаем слушатель: в момент, когда пользователь кликает на маркер и попап открывается:
            marker.on('popupopen', function() {
                // Находим внутри открытого попапа ту самую красную кнопку удаления.
                const deleteBtn = marker.getPopup().getElement().querySelector('.delete-btn');

                // Если кнопка найдена:
                if (deleteBtn) {
                    // Вешаем на неё клик:
                    deleteBtn.onclick = function() {
                        // Удаляем текущую точку из массива по её индексу.
                        customPoints.splice(index, 1);

                        // Записываем обновлённый массив в память браузера.
                        localStorage.setItem("customPoints", JSON.stringify(customPoints));

                        // Если на карте висела линия маршрута:
                        if (routePolyline) { 
                            // Стираем линию с карты.
                            map.removeLayer(routePolyline); 
                            // Обнуляем переменную.
                            routePolyline = null; 
                        }

                        // Прячем блок с расстоянием.
                        if (resultBox) resultBox.style.display = "none";

                        // Обновляем весь интерфейс (точка удалится и из списков, и с карты).
                        updateUI();
                    };
                }
            });

            // Запоминаем созданный маркер в массиве customMarkers.
            customMarkers.push(marker);
        });
    }

    // Вешаем слушатель клика на саму карту (чтобы ставить новые точки кликом мыши):
    map.on("click", function(e) {
        // Достаём точную широту (lat) того места, куда кликнул пользователь.
        const lat = e.latlng.lat;

        // Достаём точную долготу (lng) того места, куда кликнул пользователь.
        const lng = e.latlng.lng;

        // Показываем системное всплывающее окно с вопросом: "Введите название этого места:".
        let placeName = prompt("Zadajte názov tohto miesta:");

        // Если пользователь нажал «Отмена» или ввёл одни пробелы — ничего не делаем и выходим.
        if (!placeName || placeName.trim() === "") return;

        // Формируем объект новой точки с чистым именем и полученными координатами.
        const newPoint = { name: placeName.trim(), lat: lat, lng: lng };

        // Добавляем новую точку в конец массива точек.
        customPoints.push(newPoint);

        // Сохраняем обновлённый список в память браузера.
        localStorage.setItem("customPoints", JSON.stringify(customPoints));

        // Обновляем интерфейс (новая точка сразу появится на карте и в списках).
        updateUI();
    });

    // Математическая формула Хаверсина для вычисления расстояния между двумя координатами по сфере Земли.
    function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        // Средний радиус планеты Земля в километрах.
        const earthRadiusKm = 6371;

        // Переводим разницу широт из градусов в радианы.
        const dLat = (lat2 - lat1) * (Math.PI / 180);

        // Переводим разницу долгот из градусов в радианы.
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        
        // Основная тригонометрическая часть формулы Хаверсина (квадрат половины длины хорды).
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
        // Угловое расстояние в радианах через арктангенс.
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // Умножаем радиус Земли на радианы и получаем точное расстояние в километрах.
        return earthRadiusKm * c;
    }

    // Вспомогательная функция: по строке из селекта находит нужный объект с координатами.
    function getCoordByValue(val) {
        // Если выбран "home" — отдаём объект координат дома.
        if (val === "home") return homeCoords;

        // Если выбрана "school" — отдаём объект координат университета.
        if (val === "school") return schoolCoords;

        // Если значение начинается со слова "custom_" (пользовательская точка):
        if (val && val.startsWith("custom_")) {
            // Отрезаем приставку "custom_" и превращаем оставшийся текст в число-индекс.
            const idx = parseInt(val.replace("custom_", ""));
            // Возвращаем точку из массива по этому номеру.
            return customPoints[idx];
        }

        // Если ничего не подошло — возвращаем пустоту (null).
        return null;
    }

    // Проверяем: есть ли на странице кнопка расчёта расстояния?
    if (calculateBtn) {
        // Вешаем на кнопку слушатель клика мыши:
        calculateBtn.addEventListener("click", function() {
            // Считываем выбранное значение из списка старта (или пустую строку, если списка нет).
            const startVal = pointSelect ? pointSelect.value : "";

            // Считываем выбранное значение из списка финиша.
            const endVal = destinationSelect ? destinationSelect.value : "";

            // Если не выбран старт ИЛИ не выбран финиш:
            if (!startVal || !endVal) {
                // Ругаемся через всплывающее предупреждение и прерываем работу.
                alert("Prosím, vyberte štart aj cieľ.");
                return;
            }

            // Если пользователь выбрал одну и ту же точку и стартом, и финишем:
            if (startVal === endVal) {
                // Предупреждаем, что так нельзя, и выходим.
                alert("Štart a cieľ nemôžu byť rovnaké.");
                return;
            }

            // Находим координаты для точки старта через нашу функцию.
            const startCoord = getCoordByValue(startVal);

            // Находим координаты для точки финиша.
            const endCoord = getCoordByValue(endVal);

            // Если вдруг какую-то из точек найти не удалось — останавливаем скрипт.
            if (!startCoord || !endCoord) return;

            // Считаем расстояние между точками в километрах по формуле Хаверсина.
            const distance = calculateHaversineDistance(startCoord.lat, startCoord.lng, endCoord.lat, endCoord.lng);

            // Если блок для результата есть на странице:
            if (resultBox) {
                // Делаем блок видимым на экране.
                resultBox.style.display = "block";
                // Пишем внутрь текст со значением километров, округлённым до двух знаков после запятой (например, "3.45 km").
                resultBox.innerHTML = `Vzdialenosť medzi vybranými bodmi je <b>${distance.toFixed(2)} km</b>.`;
            }

            // Если на карте уже нарисована старая синяя линия от прошлого замера:
            if (routePolyline) {
                // Удаляем её с карты.
                map.removeLayer(routePolyline);
            }

            // Рисуем новую соединительную линию (L.polyline) между двумя точками на карте:
            routePolyline = L.polyline([
                [startCoord.lat, startCoord.lng], // координаты начала
                [endCoord.lat, endCoord.lng]      // координаты конца
            ], { color: '#2563eb', weight: 4, opacity: 0.8 }).addTo(map); // задаём синий цвет, толщину 4px и полупрозрачность

            // Автоматически двигаем и масштабируем камеру карты так, чтобы в экран целиком влезла вся нарисованная линия (с отступом 50px по краям).
            map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
        });
    }

    // Вызываем функцию один раз при загрузке страницы, чтобы сразу отобразить уже сохранённые точки.
    updateUI();
}
});
