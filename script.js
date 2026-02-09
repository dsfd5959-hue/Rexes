const tg = window.Telegram.WebApp;

// State
let prices = {
    USDT: 1.00,
    BTC: 0,
    ETH: 0,
    currentRate: 1.0,     // Base Rate (USDT in Fiat)
    currentBuy: 1.0,     // Buy Rate (Fiat -> USDT)
    currentSell: 1.0,    // Sell Rate (USDT -> Fiat)
    currentCurrency: 'RUB', // Current active currency code for Fiat
    currentSymbol: '₽',     // Current active currency symbol for Fiat

    // New State for "Give" Side (Crypto)
    currentGiveCoin: 'USDT (TRC20)',
    currentGiveCode: 'USDTTRC',

    // Swap State
    isFiatToCrypto: false // false = Crypto -> Fiat (Default), true = Fiat -> Crypto
};

// Currency Metadata (Symbols & Config)
const CURRENCY_META = {
    RUB: { symbol: '₽', binance: 'USDTRUB' },
    USD: { symbol: '$', type: 'fiat' }, // special case
    AED: { symbol: 'Dh', type: 'pegged', rate: 3.6725 },
    GEL: { symbol: '₾', type: 'forex' },
    TRY: { symbol: '₺', binance: 'USDTTRY' },
    AMD: { symbol: '֏', type: 'forex' },
    BRL: { symbol: 'R$', binance: 'USDTBRL' },
    ARS: { symbol: '$', binance: 'USDTARS' } // Binance supports ARS too usually
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
    
    // Set default currency state from initial city
    const defaultCity = cityData.find(c => c.id === currentCityId);
    if (defaultCity) selectCity(defaultCity, true); // This will trigger updateRates

    // Refresh prices every 10 seconds for more "live" feel
    setInterval(fetchPrices, 10000);
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
        if ((!locModal || !locModal.classList.contains('active'))) {
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

    // Modal translations if they exist in DOM (removed previously but keeping logic safe)
    const exTitle = document.querySelector('#exchange-modal .modal-title');
    if (exTitle) exTitle.textContent = t.modal_exchange_title;

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

// --- Dynamic Price Fetching ---

async function fetchPrices() {
    try {
        const currency = prices.currentCurrency;
        const meta = CURRENCY_META[currency] || { symbol: currency };
        let usdtRate = 0;

        // 1. Fetch USDT Rate relative to Fiat
        if (currency === 'USD') {
            usdtRate = 1.0;
        } else if (meta.type === 'pegged') {
             usdtRate = meta.rate;
        } else if (meta.binance) {
            // Try Binance
            try {
                const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${meta.binance}`);
                const data = await res.json();
                if (data.price) usdtRate = parseFloat(data.price);
            } catch (e) {
                console.warn(`Binance fetch failed for ${meta.binance}, trying fallback...`);
            }
        }

        // Fallback: If binance failed or not supported, try Forex API
        if (!usdtRate && currency !== 'USD') {
             try {
                // Using a free open API for fallback
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
                const data = await res.json();
                if (data.rates && data.rates[currency]) {
                    usdtRate = data.rates[currency];
                }
            } catch (e) {
                console.error("Forex fetch failed", e);
            }
        }
        
        // If still 0, use old fallback or stop
        if (!usdtRate) return;

        // 2. Fetch BTC & ETH prices (in USDT)
        // We always fetch these from Binance
        let btcPrice = prices.BTC;
        let ethPrice = prices.ETH;
        
        try {
             const [btcRes, ethRes] = await Promise.all([
                fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
                fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
            ]);
            const btcData = await btcRes.json();
            const ethData = await ethRes.json();
            
            if (btcData.price) prices.BTC = parseFloat(btcData.price);
            if (ethData.price) prices.ETH = parseFloat(ethData.price);
        } catch (e) {
            console.error("Crypto prices fetch failed", e);
        }

        // 3. Calculate Buy/Sell with Spread
        // Spread logic: Buyers pay slightly more, Sellers get slightly less
        // e.g. Spread 1-2%
        const spreadConfig = { 
            RUB: 0.02, // 2% spread for unstable
            TRY: 0.02, 
            default: 0.01 
        };
        const spread = spreadConfig[currency] || spreadConfig.default;
        
        // Buy Price = Market Rate * (1 + spread/2)
        // Sell Price = Market Rate * (1 - spread/2)
        
        prices.currentRate = usdtRate;
        prices.currentBuy = usdtRate * (1 + spread/2);
        prices.currentSell = usdtRate * (1 - spread/2);
        
        // 4. Update UI
        updatePriceDOM();

    } catch (e) {
        console.error("Global fetchPrices error:", e);
    }
}

function updatePriceDOM() {
    const symbol = prices.currentSymbol;
    const buyRate = prices.currentBuy;
    const sellRate = prices.currentSell;

    const fmt = (val) => val.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ' + symbol;

    // USDT
    document.getElementById('usdt-trc-buy').textContent = fmt(buyRate);
    document.getElementById('usdt-trc-sell').textContent = fmt(sellRate);
    
    document.getElementById('usdt-erc-buy').textContent = fmt(buyRate);
    document.getElementById('usdt-erc-sell').textContent = fmt(sellRate);

    // BTC
    const btcBuy = prices.BTC * buyRate;
    const btcSell = prices.BTC * sellRate;
    document.getElementById('btc-buy').textContent = fmt(btcBuy);
    document.getElementById('btc-sell').textContent = fmt(btcSell);

    // ETH
    const ethBuy = prices.ETH * buyRate;
    const ethSell = prices.ETH * sellRate;
    document.getElementById('eth-buy').textContent = fmt(ethBuy);
    document.getElementById('eth-sell').textContent = fmt(ethSell);
}

function updateRates() {
    const city = cityData.find(c => c.id === currentCityId);
    
    if (city && city.currency) {
        prices.currentCurrency = city.currency;
        const meta = CURRENCY_META[city.currency];
        prices.currentSymbol = meta ? meta.symbol : city.currency;
    } else {
        prices.currentCurrency = 'RUB';
        prices.currentSymbol = '₽';
    }

    // Trigger immediate fetch
    document.getElementById('usdt-trc-buy').textContent = translations[currentLang].loading;
    fetchPrices();
}

// Modal Logic - Exchange Modal Removed

function updateModalLocation() {
    const city = cityData.find(c => c.id === currentCityId);
    if (city) {
        // Just logic if modal exists
    }
}

// ... helper functions ...

function openSupport() {
    tg.openTelegramLink('https://t.me/rexes_support');
}

function openAml() {
    const baseUrl = 'https://rexes.world/chain/index';
    const initData = tg.initData;
    const url = `${baseUrl}?tgWebAppData=${encodeURIComponent(initData)}`;
    window.location.href = url;
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
    { name: "Грузия, г. Тбилиси", id: "Tbilisi", currency: "GEL", flag: "ge" }, // Fixed currency assumption
    { name: "Турция, г. Стамбул", id: "Istanbul", currency: "TRY", flag: "tr" },
    { name: "Армения, г. Ереван", id: "Yerevan", currency: "AMD", flag: "am" },
    { name: "Россия, г. Москва", id: "Moscow", default: true, currency: "RUB", flag: "ru" },
    { name: "Россия, г. Краснодар", id: "Krasnodar", currency: "RUB", flag: "ru" },
    { name: "Бразилия, г. Сан-Паулу", id: "Sao-Paulo", currency: "BRL", flag: "br" }, 
    { name: "Аргентина, г. Буэнос-Айрес", id: "Buenos-Aires", currency: "ARS", flag: "ar" },
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
