const tg = window.Telegram.WebApp;

// State
let prices = {
    USDT: 1.00,
    BTC: 0,
    ETH: 0,
    currentRate: 76.0,     // Base Rate (Buy Rate usually)
    currentBuy: 78.21,     // Explicit Buy Rate
    currentSell: 76.66,    // Explicit Sell Rate
    currentCurrency: 'RUB', // Current active currency code for Fiat
    currentSymbol: '₽',     // Current active currency symbol for Fiat

    // New State for "Give" Side (Crypto)
    currentGiveCoin: 'USDT (TRC20)',
    currentGiveCode: 'USDTTRC',

    // Swap State
    isFiatToCrypto: false // false = Crypto -> Fiat (Default), true = Fiat -> Crypto
};

// Exchange Rates Mock (USD to X)
const RATES = {
    RUB: { buy: 78.2100, sell: 76.6600, symbol: '₽' },
    USD: { buy: 1.005, sell: 0.995, symbol: '$' },
    AED: { buy: 3.67, sell: 3.61, symbol: 'Ar' },
    GEL: { buy: 2.70, sell: 2.65, symbol: '₾' },
    TRY: { buy: 34.20, sell: 33.50, symbol: '₺' },
    AMD: { buy: 405.0, sell: 395.0, symbol: '֏' },
    BRL: { buy: 5.75, sell: 5.60, symbol: 'R$' },
    ARS: { buy: 980.0, sell: 960.0, symbol: '$' }
};

// Translations
const translations = {
    ru: {
        rates: "Курсы",
        subtitle: "Валюта и курс зависят от выбранного города",
        buy: "Купить",
        sell: "Продать",
        tether_trc: "Tether",
        bitcoin: "Bitcoin",
        ethereum: "Ethereum",
        exchange_btn: "Выбрать обмен",
        support_btn: "Поддержка",
        settings_title: "Настройки",
        default_location: "Локация по умолчанию",
        orders: "Заявки",
        language: "Язык",
        support: "Поддержка",
        faq: "Вопросы и ответы",
        modal_exchange_title: "Обмен",
        modal_give: "Отдаете",
        modal_get: "Получаете",
        modal_fio: "ФИО Получателя",
        modal_contact: "Ваш контакт",
        modal_confirm: "Подтвердить",
        modal_location_title: "Локация",
        modal_location_desc: "Выберите офис, который будет выбран по умолчанию при выборе офиса, в котором вы хотите обменять ваши активы",
        loading: "Загрузка...",
        fill_fields: "Заполните все поля!",
        settings_soon: "Настройки скоро будут доступны!"
    },
    en: {
        rates: "Rates",
        subtitle: "Currency and rate depend on the selected city",
        buy: "Buy",
        sell: "Sell",
        tether_trc: "Tether",
        bitcoin: "Bitcoin",
        ethereum: "Ethereum",
        exchange_btn: "Select Exchange",
        support_btn: "Support",
        settings_title: "Settings",
        default_location: "Default Location",
        orders: "Orders",
        language: "Language",
        support: "Support",
        faq: "FAQ",
        modal_exchange_title: "Exchange",
        modal_give: "You Give",
        modal_get: "You Get",
        modal_fio: "Recipient Name",
        modal_contact: "Your Contact",
        modal_confirm: "Confirm",
        modal_location_title: "Location",
        modal_location_desc: "Choose the office that will be selected by default when choosing the office where you want to exchange your assets",
        loading: "Loading...",
        fill_fields: "Fill all fields!",
        settings_soon: "Settings coming soon!"
    }
};

let currentLang = 'ru';

document.addEventListener('DOMContentLoaded', () => {
    tg.expand();
    initUserProfile();
    fetchPrices();
    setLanguage('ru'); // Default to RU

    // Set default initial location to trigger currency setup
    const defaultCity = cityData.find(c => c.id === currentCityId);
    if (defaultCity) selectCity(defaultCity, true);

    // Refresh prices every 30 seconds
    setInterval(fetchPrices, 30000);
});

function openSettings() {
    toggleSettingsModal(true);
}

function toggleSettingsModal(show) {
    const modal = document.getElementById('settings-modal');
    if (show) {
        modal.classList.add('active');
        tg.BackButton.show();
        tg.BackButton.onClick(() => toggleSettingsModal(false));
    } else {
        modal.classList.remove('active');
        const locModal = document.getElementById('location-modal');
        const exModal = document.getElementById('exchange-modal');
        if ((!locModal || !locModal.classList.contains('active')) &&
            (!exModal || !exModal.classList.contains('active'))) {
            tg.BackButton.hide();
            tg.BackButton.offClick();
        }
    }
}

function toggleLanguage() {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    setLanguage(newLang);
}

function setLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Main Page
    document.querySelector('.rates-title').textContent = t.rates;
    document.querySelector('.rates-subtitle').textContent = t.subtitle;

    const headers = document.querySelectorAll('.rates-header span');
    if (headers.length >= 3) {
        headers[0].textContent = lang === 'ru' ? 'Валюта' : 'Currency';
        headers[1].textContent = t.buy;
        headers[2].textContent = t.sell;
    }

    // Button Translations
    const btnExchange = document.getElementById('btn-exchange');
    const btnAml = document.getElementById('btn-aml');
    const btnSupport = document.getElementById('btn-support');

    if (btnExchange) btnExchange.innerHTML = `<i class="fa-solid fa-arrow-right-arrow-left"></i> ${lang === 'ru' ? 'Выбрать обмен' : 'Select Exchange'}`;
    if (btnAml) btnAml.innerHTML = `<i class="fa-solid fa-user-shield"></i> ${lang === 'ru' ? 'Проверить AML' : 'Check AML'}`;
    if (btnSupport) btnSupport.innerHTML = `<i class="fa-regular fa-comment-dots"></i> ${t.support_btn}`;

    document.getElementById('t-settings-title').textContent = t.settings_title;
    document.getElementById('t-default-location').textContent = t.default_location;
    document.getElementById('t-orders').textContent = t.orders;
    document.getElementById('t-language').textContent = t.language;
    document.getElementById('t-support').textContent = t.support;
    document.getElementById('t-faq').textContent = t.faq;
    document.getElementById('current-lang-code').textContent = lang.toUpperCase();

    document.querySelector('#exchange-modal .modal-title').textContent = t.modal_exchange_title;
    document.querySelectorAll('#exchange-modal .modal-label')[0].textContent = t.modal_give;

    // Dynamic Label for Receive
    updateModalRate(); // Rely on this to update dynamic labels

    document.querySelectorAll('#exchange-modal .modal-label')[2].textContent = t.modal_fio;
    document.querySelectorAll('#exchange-modal .modal-label')[3].textContent = t.modal_contact;
    document.querySelector('#exchange-modal .btn-primary').textContent = t.modal_confirm;

    document.querySelector('#location-modal .modal-title').textContent = t.modal_location_title;
    document.querySelector('#location-modal .modal-desc').textContent = t.modal_location_desc;

    const userName = document.getElementById('user-name');
    if (userName.textContent === 'Загрузка...' || userName.textContent === 'Loading...') {
        userName.textContent = t.loading;
    }
}


function initUserProfile() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').textContent = `${user.first_name}`;
        document.getElementById('user-username').textContent = user.username ? '@' + user.username : '';

        if (user.photo_url) {
            const avatarEl = document.getElementById('avatar');
            avatarEl.style.background = 'none';
            avatarEl.style.border = 'none';
            avatarEl.innerHTML = `<img src="${user.photo_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            const colors = ['#FF5500', '#007AFF', '#34C759', '#AF52DE'];
            const color = colors[user.id % colors.length];
            const avatarEl = document.getElementById('avatar');
            avatarEl.style.background = color;
            avatarEl.style.border = 'none';
            avatarEl.innerHTML = `<span style="font-size:20px; color:white;">${user.first_name[0]}</span>`;
        }
    } else {
        // Fallback for testing / when not in Telegram
        document.getElementById('user-name').textContent = 'rexes';
        document.getElementById('user-username').textContent = '@rexes_support';
        const avatarEl = document.getElementById('avatar');
        avatarEl.style.background = '#333'; // Default dark grey
        avatarEl.innerHTML = `<i class="fa-solid fa-user"></i>`;
    }
}

async function fetchPrices() {
    try {
        const buyRate = prices.currentBuy;
        const sellRate = prices.currentSell;
        const symbol = prices.currentSymbol;

        const [btcRes, ethRes] = await Promise.all([
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
        ]);

        const btcData = await btcRes.json();
        const ethData = await ethRes.json();

        if (btcData.price) prices.BTC = parseFloat(btcData.price);
        if (ethData.price) prices.ETH = parseFloat(ethData.price);

        const fmt = (val) => val.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ' + symbol;

        document.getElementById('usdt-trc-buy').textContent = fmt(buyRate);
        document.getElementById('usdt-trc-sell').textContent = fmt(sellRate);

        const btcBuy = prices.BTC * buyRate;
        const btcSell = prices.BTC * sellRate;
        document.getElementById('btc-buy').textContent = fmt(btcBuy);
        document.getElementById('btc-sell').textContent = fmt(btcSell);

        const ethBuy = prices.ETH * buyRate;
        const ethSell = prices.ETH * sellRate;
        document.getElementById('eth-buy').textContent = fmt(ethBuy);
        document.getElementById('eth-sell').textContent = fmt(ethSell);

        document.getElementById('usdt-erc-buy').textContent = fmt(buyRate);
        document.getElementById('usdt-erc-sell').textContent = fmt(sellRate);

        // Also update modal calculation if open
        // calculateExchange(); // Removed
        // updateModalRate();   // Removed

    } catch (e) {
        console.error("Failed to fetch prices:", e);
    }
}

function updateRates() {
    const city = cityData.find(c => c.id === currentCityId);

    if (city && city.currency && RATES[city.currency]) {
        const rateData = RATES[city.currency];

        if (rateData.buy !== undefined && rateData.sell !== undefined) {
            prices.currentBuy = rateData.buy;
            prices.currentSell = rateData.sell;
            prices.currentRate = rateData.buy;
        } else {
            prices.currentBuy = rateData.rate;
            prices.currentSell = rateData.rate * 0.985;
            prices.currentRate = rateData.rate;
        }

        prices.currentCurrency = city.currency;
        prices.currentSymbol = rateData.symbol;
    } else {
        // Fallback to RUB
        prices.currentBuy = RATES.RUB.buy;
        prices.currentSell = RATES.RUB.sell;
        prices.currentCurrency = 'RUB';
        prices.currentSymbol = RATES.RUB.symbol;
        prices.currentRate = RATES.RUB.buy;
    }

    fetchPrices();
}

// Modal Logic - Exchange Modal Removed

function updateModalLocation() {
    const city = cityData.find(c => c.id === currentCityId);
    if (city) {
        document.getElementById('modal-location-text').textContent = city.name;
    }
}

function updateModalLimits() {
    const limitInEl = document.getElementById('limit-in');
    const limitOutEl = document.getElementById('limit-out');

    let minIn, maxIn, minOut, maxOut;
    let symbolIn, symbolOut;

    if (!prices.isFiatToCrypto) {
        // Crypto -> Fiat
        // Give: Crypto
        minIn = 3500; // USDT
        maxIn = 500000;
        symbolIn = prices.currentGiveCode;

        // Get: Fiat
        // Approx conversion for display limits
        const rate = prices.currentSell; // Selling Crypto
        minOut = minIn * rate; // Rough estimate
        maxOut = maxIn * rate;
        symbolOut = prices.currentSymbol;

        // Override Fiat Limits if specifically defined
        if (prices.currentCurrency === 'USD') {
            // Example fixed limits for USD
        }

    } else {
        // Fiat -> Crypto
        // Give: Fiat
        // This is tricky, usually limits are defined in Crypto.
        // Let's assume we allow buying 50 USDT minimum.
        const rate = prices.currentBuy; // Buying Crypto cost
        minIn = 50 * rate;
        maxIn = 50000 * rate;
        symbolIn = prices.currentSymbol;

        // Get: Crypto
        minOut = 50;
        maxOut = 50000;
        symbolOut = prices.currentGiveCode;
    }

    limitInEl.textContent = `Лимит: ${minIn.toFixed(2)} - ${maxIn.toFixed(2)} ${symbolIn}`;
    limitOutEl.textContent = ``; // Hide output limit or calculate it
}


// Exchange logic removed

function openSupport() {
    tg.openTelegramLink('https://t.me/rexes_support');
}

function openAml() {
    tg.openLink('https://rexes.world/chain/index');
}

function submitOrder() {
    const amountIn = document.getElementById('amount-in').value;
    const amountOut = document.getElementById('amount-out').value;

    if (!amountIn) {
        tg.showAlert("Введите сумму!");
        return;
    }

    const data = {
        type: 'ORDER',
        coin: prices.currentGiveCode,
        amount_in: amountIn,
        currency_in: prices.isFiatToCrypto ? prices.currentCurrency : prices.currentGiveCode,
        amount_out: amountOut,
        currency_out: prices.isFiatToCrypto ? prices.currentGiveCode : prices.currentCurrency,
        city: currentCityId,
        direction: prices.isFiatToCrypto ? 'BUY' : 'SELL'
    };

    tg.sendData(JSON.stringify(data));
    setTimeout(() => tg.close(), 50);
}

// -- Location Modal Logic --

const cityData = [
    {
        name: "ОАЭ, г. Дубай",
        id: "Dubai",
        currency: "USD",
        flag: "us",
        currencies: [
            { code: 'AED', flag: 'ae' },
            { code: 'USD', flag: 'us' }
        ]
    },
    { name: "Россия, г. Санкт-Петербург", id: "Saint-Petersburg", currency: "RUB", flag: "ru" },
    { name: "Грузия, г. Тбилиси", id: "Tbilisi", currency: "USD", flag: "us" },
    { name: "Турция, г. Стамбул", id: "Istanbul", currency: "USD", flag: "us" },
    { name: "Армения, г. Ереван", id: "Yerevan", currency: "USD", flag: "us" },
    { name: "Россия, г. Москва", id: "Moscow", default: true, currency: "RUB", flag: "ru" },
    { name: "Россия, г. Краснодар", id: "Krasnodar", currency: "RUB", flag: "ru" },
    { name: "Бразилия, г. Сан-Паулу", id: "Sao-Paulo", currency: "USD", flag: "us" },
    { name: "Аргентина, г. Буэнос-Айрес", id: "Buenos-Aires", currency: "USD", flag: "us" },
    { name: "Россия, г. Новосибирск", id: "Novosibirsk", currency: "RUB", flag: "ru" }
];

let currentCityId = "Moscow";

function toggleLocationModal(show) {
    const modal = document.getElementById('location-modal');
    if (show) {
        renderLocationList();
        modal.classList.add('active');
        tg.BackButton.show();
        tg.BackButton.onClick(() => toggleLocationModal(false));
    } else {
        modal.classList.remove('active');
        tg.BackButton.hide();
        tg.BackButton.offClick();
    }
}

function renderLocationList() {
    const container = document.getElementById('location-list');
    container.innerHTML = '';

    cityData.forEach(city => {
        const item = document.createElement('div');
        item.className = `location-item ${city.id === currentCityId ? 'selected' : ''}`;
        item.onclick = () => selectCity(city);

        let checkMark = '';
        if (city.id === currentCityId) {
            checkMark = `<div class="check-icon"><i class="fa-solid fa-check"></i></div>`;
        }

        item.innerHTML = `
            <span>${city.name}</span>
            ${checkMark}
        `;

        container.appendChild(item);
    });
}

function selectCity(city, initialLoad = false) {
    currentCityId = city.id;

    let cityName = city.name;
    if (cityName.includes("Россия, г.")) cityName = cityName.replace("Россия, г. ", "");
    else if (cityName.includes("ОАЭ, г.")) cityName = cityName.replace("ОАЭ, г. ", "");
    else if (cityName.includes("Турция, г.")) cityName = cityName.replace("Турция, г. ", "");
    else if (cityName.includes("Грузия, г.")) cityName = cityName.replace("Грузия, г. ", "");
    else if (cityName.includes("Армения, г.")) cityName = cityName.replace("Армения, г. ", "");
    else if (cityName.includes("Бразилия, г.")) cityName = cityName.replace("Бразилия, г. ", "");
    else if (cityName.includes("Аргентина, г.")) cityName = cityName.replace("Аргентина, г. ", "");

    document.getElementById('current-city-label').innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 6px;"></i> ${cityName}`;

    const currencyContainer = document.getElementById('currency-selector');

    if (city.currencies && city.currencies.length > 0) {
        let toggleHtml = `<div class="currency-toggle">`;
        city.currencies.forEach(curr => {
            const isActive = (curr.code === city.currency);
            toggleHtml += `
                <div class="toggle-option ${isActive ? 'active' : ''}" onclick="event.stopPropagation(); setCityCurrency('${city.id}', '${curr.code}')">
                    <img src="https://flagcdn.com/w80/${curr.flag}.png" class="toggle-flag" alt="${curr.code}">
                    ${curr.code}
                </div>
            `;
        });
        toggleHtml += `</div>`;

        currencyContainer.innerHTML = toggleHtml;
        currencyContainer.classList.remove('big-selector');
        currencyContainer.style.padding = '0';
        currencyContainer.style.border = 'none';
        currencyContainer.style.background = 'transparent';

    } else {
        currencyContainer.classList.add('big-selector');
        currencyContainer.style.padding = '';
        currencyContainer.style.background = '';
        currencyContainer.innerHTML = `
            <img src="https://flagcdn.com/w80/${city.flag}.png" id="currency-flag" class="currency-flag" alt="Flag">
            <span id="currency-code">${city.currency}</span>
        `;
    }

    if (!initialLoad) toggleLocationModal(false);

    // Update Logic
    updateRates();
    updateModalLocation(); // Sync modal location text even if closed
}

function setCityCurrency(cityId, currencyCode) {
    const city = cityData.find(c => c.id === cityId);
    if (city) {
        city.currency = currencyCode;
        const currObj = city.currencies.find(c => c.code === currencyCode);
        if (currObj) city.flag = currObj.flag;
        selectCity(city);
    }
}
