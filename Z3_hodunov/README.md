# WEBTE1 – Zadanie č. 3: Môj TODO List

Webová aplikácia na správu úloh (TODO List) vytvorená v rámci predmetu **Webové technológie 1 (FEI STU)** pomocou moderných front-end technológií a napojená na vzdialené REST API.

## Autor
- **Meno:** Dmytro Hodunov
- **Login / Identifikátor:** `xhodunov` (ID: `135234`)

## Použité technológie a knižnice
- **Vue 3** (Composition API, `<script setup>`) – reaktívny používateľský interfejs a správa stavu aplikácie
- **Vite** – vývojový server a zostavovací nástroj (bundler)
- **Bootstrap 5 & Bootstrap Icons** – responzívny dizajn, komponenty a ikonografia
- **Axios** – komunikácia so vzdialeným REST API (`https://wt1zadanie.iolab.sk`)
- **FullCalendar** (`@fullcalendar/vue3`, `daygrid`, `timegrid`, `interaction`, `bootstrap5`) – interaktívne kalendárové zobrazenie úloh

## Funkcionalita aplikácie
1. **Správa používateľskej relácie:** Prihlásenie pomocou identifikátora študenta s uchovaním v `sessionStorage`, možnosť obnovenia predvolených testovacích dát (`POST /api/{name}/reset`).
2. **CRUD operácie nad úlohami:**
   - Zobrazenie zoznamu úloh (`GET /api/{name}`)
   - Vytvorenie novej úlohy (`POST /api/{name}`)
   - Úprava existujúcej úlohy (`PUT /api/{name}/{todo_id}`)
   - Označenie úlohy ako splnenej / nesplnenej (`PATCH /api/{name}/{todo_id}/done` a `/undone`)
   - Vymazanie úlohy s potvrdením (`DELETE /api/{name}/{todo_id}`)
3. **Validácia a bezpečnosť:** Kontrola povinných polí, dĺžky reťazcov, logickej postupnosti dátumov (`startDate <= endDate`), ochrana proti duplicitnému odoslaniu formulára a ochrana proti XSS útokom prostredníctvom automatického escapovania vo Vue šablónach.
4. **Filtrovanie, vyhľadávanie a zoradenie:** Fulltextové vyhľadávanie v názve a popise, filtrovanie podľa stavu (*Všetky*, *Aktívne*, *Splnené*, *Po termíne*) a zoradenie podľa dátumu začiatku alebo termínu dokončenia.
5. **Kalendárové zobrazenie:** Mesačný, týždenný a denný prehľad úloh s farebným rozlíšením stavu, vytváranie úloh kliknutím na dátum a ich úprava kliknutím na udalosť.
6. **Prehľad štatistík:** Dynamický výpočet celkového počtu, aktívnych, splnených a omeškaných úloh vrátane vizuálneho indikátora progresu.

## Štruktúra projektu
```text
Z3_hodunov/
├── public/                 
│   ├── training-course.ico     # Statické súbory (ikona stránky)
├── src/
│   ├── components/
│   │   ├── AboutProjects.vue   # Informácie o projekte a použitých technológiách
│   │   ├── TodoCalendar.vue    # Integrácia knižnice FullCalendar
│   │   ├── TodoFormModal.vue   # Modálne okno pre vytvorenie a úpravu úlohy s validáciou
│   │   ├── TodoList.vue        # Zoznam úloh, vyhľadávanie, filtre a zoradenie
│   │   └── TodoStats.vue       # Karty so štatistikami a progress barom
│   ├── css/
│   │   └── styles.css          # Vlastné doplnkové štýly
│   ├── services/
│   │   └── todoApi.js          # Centralizovaná Axios vrstva pre REST API volania
│   ├── utils/
│   │   └── dateHelpers.js      # Pomocné funkcie pre prácu s dátumami a kontrolu termínov
│   ├── App.vue                 # Hlavný koreňový komponent aplikácie
│   └── main.js                 # Vstupný bod aplikácie
├── index.html
├── package-lock.json
├── package.json
├── vite.config.js
└── README.md
```
##  Použitie AI nástrojov
AI nástroje (Gemini) boli použité na vysvetlenie práce s frameworkom Vue 3 a knižnicami Bootstrap 5 a FullCalendar, ako aj na pomoc pri implementácii Axios požiadaviek na REST API, spracovaní dátumov a validácií, a pomoc pri implementácii vybraných častí kódu a pri riešení problémov v prípadoch, keď som si s danou problematikou nevedel poradiť.