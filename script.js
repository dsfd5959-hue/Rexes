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

    // Exchange Page State
    exchangeGive: 'RUB',
    exchangeGet: 'USDTTRC',
    exchangeRate: 0
};

// Currency Metadata (Symbols & Config)
const CURRENCY_META = {
    RUB: { symbol: '₽', binance: 'USDTRUB', name: "Russian Ruble", flag: 'ru', type: 'fiat' },
    USD: { symbol: '$', type: 'fiat', name: "US Dollar", flag: 'us' },
    AED: { symbol: 'Dh', type: 'pegged', rate: 3.6725, name: "Dirham", flag: 'ae' },

    // Crypto
    USDTTRC: { symbol: 'USDT', name: "Tether TRC20", flag: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=026', type: 'crypto', network: 'TRC20' },
    USDTERC: { symbol: 'USDT', name: "Tether ERC20", flag: 'https://cryptologos.cc/logos/tether-usdt-logo.svg?v=026', type: 'crypto', network: 'ERC20' },
    BTC: { symbol: 'BTC', name: "Bitcoin", flag: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=026', type: 'crypto', binance: 'BTCUSDT' },
    ETH: { symbol: 'ETH', name: "Ethereum", flag: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=026', type: 'crypto', binance: 'ETHUSDT' }
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

// -- Initialization --

document.addEventListener('DOMContentLoaded', () => {
    tg.expand();
    initUserProfile();

    // Detect Page
    if (document.getElementById('exchange-location')) {
        initExchangePage();
    } else if (document.getElementById('form-container')) {
        initOrderPage();
    } else {
        initDashboard();
    }

    // Interval Update
    if (!document.getElementById('form-container')) {
        setInterval(fetchPrices, 10000);
    }
});

function initDashboard() {
    // Default City Logic
    const defaultCity = cityData.find(c => c.id === currentCityId);
    if (defaultCity) selectCity(defaultCity, true);

    // Navigation Binding
    const btn = document.getElementById('btn-exchange');
    if (btn) {
        btn.onclick = () => window.location.href = 'exchange.html';
        btn.style.cursor = 'pointer';
    }
}

function initExchangePage() {
    // Load City
    const city = cityData.find(c => c.id === currentCityId);
    if (city) {
        document.getElementById('location-text').textContent = city.name;
        // Default Give = City Currency
        prices.exchangeGive = city.currency;
        // Default Get = USDT
        prices.exchangeGet = 'USDTTRC';
    }

    // Bind Inputs
    const giveInput = document.getElementById('give-amount');
    if (giveInput) {
        giveInput.addEventListener('input', calculateGetAmount);
    }

    // Initial Fetch
    updateExchangeUI();
    fetchPrices();
}

// -- Shared UI Logic --

function initUserProfile() {
    try {
        const user = tg.initDataUnsafe?.user;
        const nameEl = document.getElementById('user-name');
        if (!nameEl) return;

        if (user) {
            nameEl.textContent = `${user.first_name}`;
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
            // Fallback
            nameEl.textContent = 'rexes';
            document.getElementById('user-username').textContent = '@rexes_support';
            const avatarEl = document.getElementById('avatar');
            avatarEl.style.background = '#333';
            avatarEl.innerHTML = `<i class="fa-solid fa-user"></i>`;
        }
    } catch (e) { }
}

// -- Data Fetching --

async function fetchPrices() {
    try {
        // We determine "Main" currency based on page
        // Dashboard: currentCurrency (from City)
        // Exchange: exchangeGive (if Fiat) or exchangeGet (if Fiat)

        let targetFiat = prices.currentCurrency; // Default Dashboard

        if (document.getElementById('exchange-location')) {
            // Exchange Page Logic
            const giveType = CURRENCY_META[prices.exchangeGive].type;
            if (giveType !== 'crypto') targetFiat = prices.exchangeGive;
            else {
                const getType = CURRENCY_META[prices.exchangeGet].type;
                if (getType !== 'crypto') targetFiat = prices.exchangeGet;
            }
        }

        const meta = CURRENCY_META[targetFiat];
        if (!meta) return;

        let usdtRate = 0;

        // 1. Get USDT Rate
        if (targetFiat === 'USD') {
            usdtRate = 1.0;
        } else if (meta.type === 'pegged') {
            usdtRate = meta.rate;
        } else if (targetFiat === 'RUB') {
            usdtRate = 78.85;
        } else if (meta.binance) {
            try {
                const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${meta.binance}`);
                const data = await res.json();
                if (data.price) usdtRate = parseFloat(data.price);
            } catch (e) { }
        }

        // Fallback
        if (!usdtRate && targetFiat !== 'USD') {
            try {
                const res = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
                const data = await res.json();
                if (data.rates && data.rates[targetFiat]) {
                    usdtRate = data.rates[targetFiat];
                }
            } catch (e) { }
        }

        if (!usdtRate) return;

        // 2. Get Crypto Prices
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
        } catch (e) { }

        // 3. Calc Buy/Sell Spreads
        const spreadConfig = { RUB: 0.025, AED: 0.015, default: 0.01 };
        const spread = spreadConfig[targetFiat] || spreadConfig.default;

        prices.currentRate = usdtRate;
        prices.currentBuy = usdtRate * (1 + spread / 2);
        prices.currentSell = usdtRate * (1 - spread / 2);

        // 4. Update UI
        if (document.getElementById('usdt-trc-buy')) updateDashboardRates();
        if (document.getElementById('exchange-rate-display')) updateExchangeRateLogic();

    } catch (e) {
        console.error(e);
    }
}

function updateDashboardRates() {
    const symbol = CURRENCY_META[prices.currentCurrency].symbol;
    const fmt = (val) => val.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ' + symbol;

    document.getElementById('usdt-trc-buy').textContent = fmt(prices.currentBuy);
    document.getElementById('usdt-trc-sell').textContent = fmt(prices.currentSell);
    document.getElementById('usdt-erc-buy').textContent = fmt(prices.currentBuy);
    document.getElementById('usdt-erc-sell').textContent = fmt(prices.currentSell);

    const btcBuy = prices.BTC * prices.currentBuy;
    const btcSell = prices.BTC * prices.currentSell;
    document.getElementById('btc-buy').textContent = fmt(btcBuy);
    document.getElementById('btc-sell').textContent = fmt(btcSell);

    const ethBuy = prices.ETH * prices.currentBuy;
    const ethSell = prices.ETH * prices.currentSell;
    document.getElementById('eth-buy').textContent = fmt(ethBuy);
    document.getElementById('eth-sell').textContent = fmt(ethSell);
}

// ------ Exchange Page Functions ------

function updateExchangeUI() {
    const give = prices.exchangeGive;
    const get = prices.exchangeGet;

    // Update Icons/Codes
    const setPill = (idPrefix, code) => {
        const meta = CURRENCY_META[code];
        const img = meta.type === 'crypto' ? meta.flag : `https://flagcdn.com/w80/${meta.flag}.png`;
        document.getElementById(idPrefix + '-flag').src = img;
        document.getElementById(idPrefix + '-code').textContent = meta.symbol || code;
    };

    setPill('give', give);
    setPill('get', get);

    updateExchangeLimits();
}

function getLimits(code) {
    const meta = CURRENCY_META[code];
    let min = 1000, max = 100000;
    if (code === 'RUB') { min = 300000; max = 30000000; }
    else if (meta.type === 'crypto') { min = 100; max = 50000; }
    else if (code === 'AED') { min = 5000; max = 500000; }
    return { min, max };
}

function updateExchangeLimits() {
    const giveCode = prices.exchangeGive;
    const meta = CURRENCY_META[giveCode];
    const { min, max } = getLimits(giveCode);

    document.getElementById('give-limit').textContent = `Лимит: ${min.toLocaleString()} - ${max.toLocaleString()} ${meta.symbol}`;
}

// ... existing code ...

function submitOrder() {
    // Save data and redirect
    const giveAmountVal = document.getElementById('give-amount').value;
    const giveAmount = parseFloat(giveAmountVal);

    if (!giveAmountVal || isNaN(giveAmount) || giveAmount <= 0) {
        if (tg.showAlert) tg.showAlert("Пожалуйста, введите корректную сумму");
        else alert("Пожалуйста, введите корректную сумму");
        return;
    }

    const { min, max } = getLimits(prices.exchangeGive);
    if (giveAmount < min) {
        const msg = `Минимальная сумма обмена: ${min.toLocaleString()} ${CURRENCY_META[prices.exchangeGive].symbol}`;
        if (tg.showAlert) tg.showAlert(msg);
        else alert(msg);
        return;
    }

    if (giveAmount > max) {
        const msg = `Максимальная сумма обмена: ${max.toLocaleString()} ${CURRENCY_META[prices.exchangeGive].symbol}`;
        if (tg.showAlert) tg.showAlert(msg);
        else alert(msg);
        return;
    }

    const data = {
        give: prices.exchangeGive,
        giveAmount: giveAmountVal,
        get: prices.exchangeGet,
        getAmount: document.getElementById('get-amount').value
    };

    localStorage.setItem('rexes_order_data', JSON.stringify(data));
    window.location.href = 'order.html';
}

function initOrderPage() {
    const orderData = JSON.parse(localStorage.getItem('rexes_order_data') || '{}');
    if (!orderData.give) { window.location.href = 'exchange.html'; return; }

    const giveMeta = CURRENCY_META[orderData.give];
    const getMeta = CURRENCY_META[orderData.get];

    document.getElementById('summary-give').innerHTML = `
        <div style="font-size: 14px; color: #8E8E93;">${orderData.giveAmount} ${giveMeta.symbol}</div>
        <div style="font-size: 12px; color: #555;">${giveMeta.name}</div>
    `;
    document.getElementById('summary-get').innerHTML = `
        <div style="font-size: 14px; color: #8E8E93;">${orderData.getAmount} ${getMeta.symbol}</div>
        <div style="font-size: 12px; color: #555;">${getMeta.name}</div>
    `;

    const container = document.getElementById('form-container');
    container.innerHTML = '';

    // Form Selection
    const isGetCrypto = getMeta.type === 'crypto'; // Fiat -> Crypto

    if (isGetCrypto) {
        // Screenshot 3: Fiat -> Crypto
        // Sender Card, Wallet Addr, FIO (Sender?), Email, TG, Phone
        renderInput(container, 'sender_card', 'Номер карты отправителя', 'xxxx xxxx xxxx xxxx');
        renderInput(container, 'wallet_address', 'Адрес кошелька', `${getMeta.name} Address`);

        const row1 = document.createElement('div'); row1.className = 'row';
        renderInput(row1, 'holder_name', 'ФИО ОТПРАВИТЕЛЯ', 'Иванов И.И.', 'col');
        renderInput(row1, 'email', 'Email', '', 'col');
        container.appendChild(row1);

        const row2 = document.createElement('div'); row2.className = 'row';
        renderInput(row2, 'telegram', 'Telegram', '', 'col');
        renderInput(row2, 'phone', 'Телефон', '', 'col');
        container.appendChild(row2);

    } else {
        // Screenshot 2: Crypto -> Fiat
        // Card Number, FIO (Holder?), Email, TG, Phone
        const rowTop = document.createElement('div'); rowTop.className = 'row';
        renderInput(rowTop, 'card_number', 'Номер карты', 'xxxx xxxx xxxx xxxx', 'col');
        renderInput(rowTop, 'holder_name', 'ФИО ДЕРЖАТЕЛЯ КАРТЫ', 'В точности как на карте', 'col');
        container.appendChild(rowTop);

        const rowBot = document.createElement('div'); rowBot.className = 'row';
        renderInput(rowBot, 'email', 'Email', '', 'col');
        renderInput(rowBot, 'telegram', 'Telegram', '', 'col');
        renderInput(rowBot, 'phone', 'Телефон', '', 'col');
        container.appendChild(rowBot);
    }
}

function renderInput(parent, id, label, placeholder, extraClass = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'input-group ' + extraClass;
    wrapper.innerHTML = `<div class="form-section-title">${label}</div><input type="text" id="${id}" class="form-input" placeholder="${placeholder}">`;
    parent.appendChild(wrapper);
}

function submitFinalOrder() {
    const inputs = document.querySelectorAll('.form-input');
    const formData = {};
    inputs.forEach(inp => formData[inp.id] = inp.value);
    const orderData = JSON.parse(localStorage.getItem('rexes_order_data') || '{}');
    tg.sendData(JSON.stringify({ type: 'ORDER_FINAL', ...orderData, ...formData }));
}


// -- Shared Helper --
function openSupport() { tg.openTelegramLink('https://t.me/rexes_support'); }
function openAml() { window.location.href = 'https://rexes.world/chain/index'; }

// -- Location Modal --
const cityData = [
    { name: "ОАЭ, г. Дубай", id: "Dubai", currency: "AED", flag: "ae", currencies: [{ code: 'AED', flag: 'ae' }, { code: 'USD', flag: 'us' }] },
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
    if (show) { renderLocationList(); modal.classList.add('active'); }
    else modal.classList.remove('active');
}

function renderLocationList() {
    const container = document.getElementById('location-list');
    container.innerHTML = '';
    cityData.forEach(city => {
        const item = document.createElement('div');
        item.className = `location-item ${city.id === currentCityId ? 'selected' : ''}`;
        item.onclick = () => selectCity(city);
        item.innerHTML = `<span>${city.name}</span>${city.id === currentCityId ? '<div class="check-icon"><i class="fa-solid fa-check"></i></div>' : ''}`;
        container.appendChild(item);
    });
}

function selectCity(city, initialLoad = false) {
    currentCityId = city.id;

    // Dashboard Label
    const dashLabel = document.getElementById('current-city-label');
    if (dashLabel) {
        let name = city.name.includes(',') ? city.name.split(',')[1] : city.name;
        dashLabel.innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 6px;"></i> ${name.trim()}`;

        // Update Currency Selector
        const currencyContainer = document.getElementById('currency-selector');
        if (currencyContainer) {
            if (city.currencies) {
                // Render Toggle
                let html = `<div class="currency-toggle">`;
                city.currencies.forEach(c => {
                    html += `<div class="toggle-option ${c.code === city.currency ? 'active' : ''}" onclick="event.stopPropagation(); setCityCurrency('${city.id}','${c.code}')">
                        <img src="https://flagcdn.com/w80/${c.flag}.png" class="toggle-flag">${c.code}</div>`;
                });
                html += `</div>`;
                currencyContainer.innerHTML = html;
                currencyContainer.classList.remove('big-selector');
                currencyContainer.style.background = 'transparent'; currencyContainer.style.padding = '0';
            } else {
                currencyContainer.innerHTML = `<img src="https://flagcdn.com/w80/${city.flag}.png" class="currency-flag"><span id="currency-code">${city.currency}</span>`;
                currencyContainer.classList.add('big-selector');
                currencyContainer.style.background = ''; currencyContainer.style.padding = 'auto';
            }
        }

        prices.currentCurrency = city.currency;
        updateRates();
    }

    // Exchange Page Logic
    // If we are on exchange page (location modal called here), update page state
    if (document.getElementById('location-text')) {
        document.getElementById('location-text').textContent = city.name;
        prices.exchangeGive = city.currency;
        updateExchangeUI();
        fetchPrices();
    }

    if (!initialLoad) toggleLocationModal(false);
}

function setCityCurrency(cityId, currencyCode) {
    const city = cityData.find(c => c.id === cityId);
    if (city) {
        city.currency = currencyCode;
        selectCity(city);
    }
}

function updateRates() {
    if (document.getElementById('usdt-trc-buy')) {
        document.getElementById('usdt-trc-buy').textContent = translations[currentLang].loading;
        fetchPrices();
    }
}

function openSettings() { document.getElementById('settings-modal').classList.add('active'); tg.BackButton.show(); tg.BackButton.onClick(() => toggleSettingsModal(false)); }
function toggleSettingsModal(show) {
    if (show) document.getElementById('settings-modal').classList.add('active');
    else { document.getElementById('settings-modal').classList.remove('active'); tg.BackButton.hide(); }
}
