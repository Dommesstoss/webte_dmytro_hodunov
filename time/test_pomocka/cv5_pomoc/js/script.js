// Исходная база данных товаров (наш "каталог на сервере").
const PRODUCTS = [
    // Первый товар: ID, название, базовая цена и теги категорий.
    { id: 1, name: "Zvonček na bicykel", price: 8.5, tags: ["bike"] },
    // Второй товар.
    { id: 2, name: "Fľaša na vodu", price: 12, tags: ["sport"] },
    // Третий товар.
    { id: 3, name: "Svetlá na bicykel", price: 24.9, tags: ["bike", "safety"] },
  ];
  
  // Находим в DOM элемент списка <ul> по id="products", куда будем добавлять товары.
  const list = document.getElementById("products");
  
  // Находим текстовый абзац с id="status" для информирования пользователя о ходе загрузки.
  const statusText = document.getElementById("status");
  
  // Находим кнопку с id="reload" для ручной перезагрузки товаров.
  const reloadButton = document.getElementById("reload");
  
  // Находим кнопку с id="discount" для управления скидкой.
  const discountButton = document.getElementById("discount");
  
  // Создаём пустой массив корзины, куда будем складывать выбранные товары (const защищает ссылку, но массив можно мутировать).
  const cart = [];
  
  // Флаг состояния: активна ли сейчас скидка (false — выключена, true — включена).
  let discountActive = false;
  
  // Функция создания одного элемента списка <li> для конкретного товара (product).
  function createProductItem(product) {
    // Создаем сам тег <li> через createElement (безопасно, не парсит HTML).
    const item = document.createElement("li");
  
    // Создаем тег <span> для названия товара.
    const name = document.createElement("span");
    // Используем textContent — он вставляет строку как чистый текст, защищая от XSS-атак (знаки < и > не превратятся в теги).
    name.textContent = product.name;
  
    // Создаем тег <span> для отображения цены.
    const price = document.createElement("span");
    // Форматируем цену до двух знаков после запятой (например, 8.50) и приписываем знак евро.
    price.textContent = `${product.price.toFixed(2)} €`;
  
    // Создаем кнопку "Do košíka" внутри карточки товара.
    const button = document.createElement("button");
    // Явно указываем тип кнопки "button", чтобы она случайно не отправляла формы.
    button.type = "button";
    // Задаем видимый текст на кнопке.
    button.textContent = "Do košíka";
  
    // Вешаем слушатель клика на кнопку: стрелочная функция создает замыкание (closure) именно на переданный сюда объект product.
    button.addEventListener("click", () => addToCart(product));
  
    // Добавляем все созданные узлы (название, цену и кнопку) внутрь элемента <li> за один вызов метода append.
    item.append(name, price, button);
  
    // Возвращаем полностью собранный узел <li>.
    return item;
  }
  
  // Функция отображения списка товаров на странице.
  function renderProducts(products) {
    // Очищаем список перед отрисовкой (удаляем все старые <li>, чтобы они не дублировались).
    list.replaceChildren();
  
    // Создаем легковесный временный контейнер в памяти (DocumentFragment), чтобы не вызывать перерисовку экрана на каждом товаре.
    const fragment = document.createDocumentFragment();
  
    // Проходим по каждому товару из переданного массива products циклом for..of.
    for (const product of products) {
      // Создаем карточку товара и крепим ее внутрь нашего фрагмента в памяти.
      fragment.appendChild(createProductItem(product));
    }
  
    // Вставляем фрагмент в реальный видимый DOM: все товары появляются на экране за одно единственное действие браузера.
    list.appendChild(fragment);
  }
  
  // Функция добавления товара в корзину покупок.
  function addToCart(product) {
    // Кладём товар в массив корзины.
    cart.push(product);
    // Пересчитываем сумму и обновляем интерфейс корзины на экране.
    renderCart();
  }
  
  // Чистая функция: рассчитывает скидку 10%, создавая новые объекты (map + spread), не портя исходный каталог.
  function applyDiscount(items) {
    // Для каждого товара создаем копию объекта (...item), но с уменьшенной на 10% ценой (price * 0.9).
    return items.map((item) => ({ ...item, price: item.price * 0.9 }));
  }
  
  // Функция обновления блока корзины на странице.
  function renderCart() {
    // Тернарный оператор: если скидка включена — берем пересчитанный массив, если нет — исходный массив cart.
    const items = discountActive ? applyDiscount(cart) : cart;
  
    // Считаем общую сумму цен всех товаров в корзине с помощью метода reduce, начиная с нуля (0).
    const total = items.reduce((sum, item) => sum + item.price, 0);
  
    // Обновляем количество товаров в счетчике на странице.
    document.getElementById("cart-count").textContent = cart.length;
  
    // Выводим итоговую сумму с округлением до двух знаков после запятой.
    document.getElementById("cart-total").textContent = total.toFixed(2);
  }
  
  // Вешаем слушатель клика на кнопку скидки:
  discountButton.addEventListener("click", () => {
    // Инвертируем флаг скидки: true становится false, а false становится true.
    discountActive = !discountActive;
  
    // Меняем надпись на кнопке в зависимости от состояния:
    discountButton.textContent = discountActive ? "Zrušiť zľavu" : "Zľava 10 %";
  
    // Перерисовываем корзину с учетом нового состояния скидки.
    renderCart();
  });
  
  // Асинхронная функция имитации запроса к серверу, возвращающая Promise.
  function loadProducts() {
    // Создаем объект Promise, который перейдет в состояние fulfilled (resolve) или rejected (reject).
    return new Promise((resolve, reject) => {
      // Имитируем сетевую задержку в 1500 миллисекунд (1.5 секунды) через Web API setTimeout.
      setTimeout(() => {
        // Имитируем нестабильную сеть: с вероятностью 30% (Math.random() < 0.3) сервер вернет ошибку.
        if (Math.random() < 0.3) {
          // Завершаем Promise с ошибкой "Сервер не отвечает".
          reject(new Error("Server neodpovedá"));
        // В остальных 70% случаев отдаем успешный результат:
        } else {
          // structuredClone создает глубокую независимую копию каталога, имитируя получение новых данных по сети.
          resolve(structuredClone(PRODUCTS));
        }
      }, 1500);
    });
  }
  
  // Главная асинхронная функция загрузки и отображения товаров с обработкой ошибок.
  async function showProducts() {
    // Показываем текст ожидания пользователю.
    statusText.textContent = "Načítavam…";
  
    // Блокируем кнопку загрузки (disabled = true), чтобы пользователь не спамил кликами во время запроса.
    reloadButton.disabled = true;
  
    // Блок try-catch-finally для безопасной работы с асинхронным кодом.
    try {
      // await приостанавливает выполнение функции и ждет завершения Promise, не блокируя браузер и интерфейс.
      const products = await loadProducts();
  
      // Если Promise завершился успешно — отрисовываем полученные товары.
      renderProducts(products);
  
      // Выводим сообщение об успешной загрузке с количеством полученных товаров.
      statusText.textContent = `Načítaných produktov: ${products.length}`;
    // Блок catch сработает, если сервер упал с ошибкой (reject):
    } catch (error) {
      // Показываем текст ошибки пользователю, не давая скрипту сломаться.
      statusText.textContent = `Chyba: ${error.message}. Skúste to znova.`;
    // Блок finally выполняется ВСЕГДА (и при успехе, и при ошибке):
    } finally {
      // Разблокируем кнопку обратно, чтобы можно было повторить попытку.
      reloadButton.disabled = false;
    }
  }
  
  // Вешаем слушатель клика на кнопку "Načítať produkty": при клике вызывается функция showProducts.
  reloadButton.addEventListener("click", showProducts);
  
  // Первоначальный вызов при открытии страницы: загружаем товары в первый раз.
  showProducts();