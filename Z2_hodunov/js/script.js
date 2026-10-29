$(document).ready(function(){
    console.log("Aplikácia inicializovaná.");

    let appData = {
        restaurants: {},
        timestamps: {},
        selectedDay: 0
    };
    const STORAGE_KEY = 'canteen_menu_data';

    const RESTAURANTS = {
        freefood: {
            id: 'freefood',
            name: 'FreeFood',
            url: 'http://www.freefood.sk/menu/',
            localFile: 'source/FreeFood.html'
        },
        dragon: {
            id: 'dragon',
            name: 'White Dragon',
            url: 'https://whitedragon.sk/menu/denne-menu/',
            localFile: 'source/White_Dragon.html'
        },
        eat: {
            id: 'eat',
            name: 'Eat & Meet',
            url: 'http://eatandmeet.sk/tyzdenne-menu',
            localFile: 'source/eat&meet.html'
        }
    };

    async function fetchHtml(restaurantKey) {
        const sourceMode = $('#source-toggle').val();
        const config = RESTAURANTS[restaurantKey];
        
        let targetUrl = config.localFile;
        if (sourceMode === 'live') {
            targetUrl = config.url;
        }

        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Chyba pri načítaní (${response.status}) pre ${config.name}`);
        }
        return await response.text();
    }

    function parseFreeFood(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        
        const daysMenu = [];
        const dayElements = doc.querySelectorAll('#free-food ul.daily-offer > li');

        dayElements.forEach((dayLi, index) => {
            const titleEl = dayLi.querySelector('.day-title');
            const fullTitle = titleEl ? titleEl.textContent.trim() : '';

            const parts = fullTitle.split(',');
            const dayName = parts[0] ? parts[0].trim() : `Deň ${index + 1}`;
            const date = parts[1] ? parts[1].trim() : null;

            const items = [];
            const dishElements = dayLi.querySelectorAll('ul.day-offer > li');

            dishElements.forEach(dishLi => {
                const priceEl = dishLi.querySelector('.brand.price');
                const price = priceEl ? priceEl.textContent.trim() : '';

                const prefixEl = dishLi.querySelector('span.brand:not(.price)');
                const prefix = prefixEl ? prefixEl.textContent.trim() : '';

                const isSoup = prefix.toLowerCase().includes('p');
                const type = isSoup ? 'soup' : 'main';
                const clone = dishLi.cloneNode(true);
                clone.querySelectorAll('span.brand').forEach(el => el.remove());
                const dishTitle = clone.textContent.trim();

                if (dishTitle) {
                    items.push({
                        type: type,
                        title: dishTitle,
                        price: price
                    });
                }
            });

            daysMenu.push({
                dayIndex: index,
                dayName: dayName,
                date: date,
                items: items
            });
        });

        return daysMenu;
    }

    function parseWhiteDragon(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const daysMenu = [];

        const dayIndexMap = {
            'pondelok': 0, 
            'utorok': 1, 
            'streda': 2, 
            'štvrtok': 3, 
            'piatok': 4
        };

        const paragraphs = doc.querySelectorAll('.l-main .l-section-h p');

        paragraphs.forEach(p => {
            const rawHtml = p.innerHTML.replace(/<br\s*[\/]?>/gi, '\n');
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawHtml;
            const fullText = tempDiv.textContent.trim();

            const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length === 0) return;

            const firstLineLower = lines[0].toLowerCase();
            let matchedDayIndex = -1;
            let matchedDayName = '';

            for (const [name, idx] of Object.entries(dayIndexMap)) {
                if (firstLineLower.startsWith(name)) {
                    matchedDayIndex = idx;
                    matchedDayName = name.charAt(0).toUpperCase() + name.slice(1);
                    break;
                }
            }

            if (matchedDayIndex === -1) return;

            if (fullText.toLowerCase().includes('zatvorené')) {
                daysMenu.push({
                    dayIndex: matchedDayIndex,
                    dayName: matchedDayName,
                    date: null,
                    items: []
                });
                return;
            }

            const items = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i];

                if (line.toLowerCase().includes('cena menu') || 
                    line.toLowerCase().includes('dobrú chuť') || 
                    line.toLowerCase().includes('tím white dragon')) {
                    continue;
                }

                const isSoup = line.toLowerCase().startsWith('polievka') || 
                              line.toLowerCase().includes('vývar') || 
                              line.toLowerCase().includes('krémová') || 
                              line.toLowerCase().includes('boršč') || 
                              line.toLowerCase().includes('tom yum');

                let cleanTitle = line
                    .replace(/\s+\d+(\s*,\s*\d+)*\s*$/g, '')
                    .trim();

                let price = isSoup ? '' : '9,90 €';

                if (cleanTitle.length > 2) {
                    items.push({
                        type: isSoup ? 'soup' : 'main',
                        title: cleanTitle,
                        price: price
                    });
                }
            }

            daysMenu.push({
                dayIndex: matchedDayIndex,
                dayName: matchedDayName,
                date: null,
                items: items
            });
        });

        daysMenu.sort((a, b) => a.dayIndex - b.dayIndex);
        return daysMenu;
    }

    function parseEatAndMeet(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        const daysMenu = [];
        const dayNames = ['Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok'];

        for (let i = 1; i <= 5; i++) {
            const dayPane = doc.querySelector(`#day-${i}`);
            if (!dayPane) continue;
            const dayIndex = i - 1;
            const dayName = dayNames[dayIndex];
            const items = [];
            const mealElements = dayPane.querySelectorAll('.menu-details');

            mealElements.forEach(mealEl => {
                const categoryEl = mealEl.querySelector('h4');
                const categoryText = categoryEl ? categoryEl.textContent.trim() : '';
                const descEl = mealEl.querySelector('.desc');
                let dishTitle = '';
                if (descEl) {
                    const clone = descEl.cloneNode(true);
                    clone.querySelectorAll('span').forEach(s => s.remove());
                    dishTitle = clone.textContent.trim();
                }

                const priceEl = mealEl.querySelector('.price');
                let price = '';
                if (priceEl) {
                    const rawPrice = priceEl.textContent.trim();
                    const parts = rawPrice.split('/');
                    price = parts[0] ? parts[0].trim() : rawPrice;
                }

                const isSoup = categoryText.toLowerCase().includes('polievka') || 
                              dishTitle.toLowerCase().includes('vývar');
                const type = isSoup ? 'soup' : 'main';

                if (dishTitle) {
                    items.push({
                        type: type,
                        title: dishTitle,
                        price: price
                    });
                }
            });

            daysMenu.push({
                dayIndex: dayIndex,
                dayName: dayName,
                date: null,
                items: items
            });
        }

        return daysMenu;
    }

    function renderMenu() {
        const $container = $('#menu-container');
        $container.empty();

        if (Object.keys(appData.restaurants).length === 0) {
            $container.html('<div class="col-12 text-center text-muted py-5">Dáta nie sú načítané. Kliknite na "Aktualizovať menu".</div>');
            return;
        }

        Object.keys(appData.restaurants).forEach(restId => {
            const config = RESTAURANTS[restId];
            const days = appData.restaurants[restId];

            let daysToShow = [];
            if (appData.selectedDay === 'all') {
                daysToShow = days;
            } else {
                daysToShow = days.filter(d => d.dayIndex === appData.selectedDay);
            }

            let dishesHtml = '';
            daysToShow.forEach(day => {
                if (appData.selectedDay === 'all') {
                    dishesHtml += `<h6 class="text-uppercase text-secondary fw-bold mt-3 mb-2 border-bottom pb-1">${day.dayName} ${day.date ? `(${day.date})` : ''}</h6>`;
                }

                if (day.items.length === 0) {
                    dishesHtml += `<div class="menu-empty-message">Pre tento deň nie je ponuka k dispozícii.</div>`;
                } else {
                    day.items.forEach(item => {
                        const borderClass = item.type === 'soup' ? 'menu-item-soup' : 'menu-item-main';

                        dishesHtml += `
                            <div class="menu-item ${borderClass} d-flex justify-content-between align-items-center">
                                <span class="pe-2">${item.title}</span>
                                ${item.price ? `<span class="menu-price">${item.price}</span>` : ''}
                            </div>
                        `;
                    });
                }
            });

            const lastUpdated = (appData.timestamps && appData.timestamps[config.id]) 
                ? appData.timestamps[config.id] 
                : 'Nie je k dispozícii';

            const cardHtml = `
                <div class="col-12 col-lg-4 mb-4 restaurant-card" data-restaurant="${config.id}">
                    <div class="card h-100 shadow-sm border-0 d-flex flex-column">
                        <div class="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                            <h3 class="h5 m-0 fw-bold text-dark">${config.name}</h3>
                            <a href="${config.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-secondary">
                                Web →
                            </a>
                        </div>
                        <div class="card-body flex-grow-1">
                            ${dishesHtml}
                        </div>
                        <div class="card-footer bg-light border-top text-muted small py-2">
                            <span>Posledná aktualizácia: ${lastUpdated}</span>
                        </div>
                    </div>
                </div>
            `;

            $container.append(cardHtml);
        });

        applyRestaurantFilter();
    }

    function applyRestaurantFilter() {
        $('.filter-restaurant').each(function () {
            const restId = $(this).val();
            const isChecked = $(this).is(':checked');
            const $card = $(`.restaurant-card[data-restaurant="${restId}"]`);

            if (isChecked) {
                $card.show();
            } else {
                $card.hide();
            }
        });
    }

    $('.filter-restaurant').on('change', function () {
        applyRestaurantFilter();
    });

    $('#days button').on('click', function () {
        $('#days button').removeClass('active');
        $(this).addClass('active');

        const clickedDay = $(this).data('day');
        appData.selectedDay = (clickedDay === 'all') ? 'all' : parseInt(clickedDay, 10);

        renderMenu();
    });

    async function loadAllMenus() {
        try {
            $('#loading-spinner').removeClass('d-none');
            $('#status-message').text('Načítavam a spracovávam menu zo všetkých zdrojov...');

            const [freeHtml, dragonHtml, eatHtml] = await Promise.all([
                fetchHtml('freefood'),
                fetchHtml('dragon'),
                fetchHtml('eat')
            ]);

            const now = new Date().toLocaleString('sk-SK');

            appData.restaurants.freefood = parseFreeFood(freeHtml);
            appData.timestamps.freefood = now;

            appData.restaurants.dragon = parseWhiteDragon(dragonHtml);
            appData.timestamps.dragon = now;

            appData.restaurants.eat = parseEatAndMeet(eatHtml);
            appData.timestamps.eat = now;

            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                restaurants: appData.restaurants,
                timestamps: appData.timestamps
            }));

            $('#status-message').text('Všetky jedálne úspešne načítané!');
            renderMenu();
        } catch (error) {
            console.error(error);
            $('#status-message').text('Chyba: ' + error.message);
        } finally {
            $('#loading-spinner').addClass('d-none');
        }
    }

    $('#refresh_info').on('click', function () {
        loadAllMenus();
    });

    $('#delete_info, #clear_data').on('click', function () {
        localStorage.removeItem(STORAGE_KEY);
        appData.restaurants = {};
        appData.timestamps = {};
        $('#status-message').text('Uložené dáta boli vymazané z pamäte.');
        renderMenu();
    });

    const cachedData = localStorage.getItem(STORAGE_KEY);
    if (cachedData) {
        try {
            const parsed = JSON.parse(cachedData);
            if (parsed.restaurants) {
                appData.restaurants = parsed.restaurants;
                appData.timestamps = parsed.timestamps || {};
            } else {
                appData.restaurants = parsed;
                appData.timestamps = {};
            }
            $('#status-message').text('Dáta boli načítané z lokálneho úložiska (cache).');
            renderMenu();
        } catch (e) {
            loadAllMenus();
        }
    } else {
        loadAllMenus();
    }
});