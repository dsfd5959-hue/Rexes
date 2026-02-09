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
    GEL: { symbol: '₾', type: 'forex', name: "Lari", flag: 'ge' },
    TRY: { symbol: '₺', binance: 'USDTTRY', name: "Lira", flag: 'tr' },
    AMD: { symbol: '֏', type: 'forex', name: "Dram", flag: 'am' },
    BRL: { symbol: 'R$', binance: 'USDTBRL', name: "Real", flag: 'br' },
    ARS: { symbol: '$', binance: 'USDTARS', name: "Peso", flag: 'ar' },

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
    } else {
        initDashboard();
    }

    // Interval Update
    setInterval(fetchPrices, 10000);
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
        const spreadConfig = { RUB: 0.02, TRY: 0.02, default: 0.01 };
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

function updateExchangeLimits() {
    const giveCode = prices.exchangeGive;
    const meta = CURRENCY_META[giveCode];

    // Demo Limits
    let min = 1000, max = 100000;
    if (giveCode === 'RUB') { min = 300000; max = 30000000; }
    else if (meta.type === 'crypto') { min = 100; max = 50000; }
    else if (giveCode === 'AED') { min = 5000; max = 500000; }

    document.getElementById('give-limit').textContent = `Лимит: ${min.toLocaleString()} - ${max.toLocaleString()} ${meta.symbol}`;
}

function updateExchangeRateLogic() {
    const give = prices.exchangeGive;
    const get = prices.exchangeGet;

    // We have prices.currentBuy/Sell which is Fiat/USDT rate
    // We need Rate: How much Get for 1 Give?

    let rate = 0;
    let rateText = "";

    // Case 1: Fiat -> USDT
    // User Buys USDT. We use Sell rate? No, Dealer Sells USDT. Price is 'Buy' rate usually (High).
    // Let's use prices.currentBuy (amount of Fiat per 1 USDT)
    // Rate (Get/Give) = 1 / prices.currentBuy

    if (CURRENCY_META[give].type !== 'crypto' && get.startsWith('USDT')) {
        const marketRate = prices.currentBuy;
        rate = 1 / marketRate;
        // Display: Market Rate (Fiat per USDT)
        rateText = `${marketRate.toFixed(2)} ${CURRENCY_META[give].symbol} ≈ 1.0000 USDT`;
    }
    // Case 2: USDT -> Fiat
    // User Sells USDT. Dealer Buys. Use prices.currentSell (Low).
    else if (give.startsWith('USDT') && CURRENCY_META[get].type !== 'crypto') {
        const marketRate = prices.currentSell;
        rate = marketRate; // Get (Fiat) = Give * Rate
        rateText = `${marketRate.toFixed(2)} ${CURRENCY_META[get].symbol} ≈ 1.0000 USDT`;
    }

    prices.exchangeRate = rate;
    document.getElementById('exchange-rate-display').textContent = rateText;

    calculateGetAmount();
}

function calculateGetAmount() {
    const giveAmount = parseFloat(document.getElementById('give-amount').value) || 0;

    // Logic dependent on direction
    const rate = prices.exchangeRate;
    let getAmount = 0;

    // If Fiat -> USDT: Rate was 1/FiatPrice (small number). 
    // If USDT -> Fiat: Rate was FiatPrice (large number).

    // Or simplified:
    const give = prices.exchangeGive;

    if (CURRENCY_META[give].type !== 'crypto') {
        // Fiat -> Crypto
        // Give / BuyPrice
        getAmount = giveAmount / prices.currentBuy;
    } else {
        // Crypto -> Fiat
        // Give * SellPrice
        getAmount = giveAmount * prices.currentSell;
    }

    document.getElementById('get-amount').value = getAmount > 0 ? getAmount.toFixed(4) : '';

    // Update Get Limit
    // Rough calc
    const isRub = prices.exchangeGive === 'RUB';
    const baseMin = isRub ? 300000 : 1000;
    const baseMax = isRub ? 30000000 : 100000;

    // If input is crypto, logic differs, but let's keep simple
    // Convert Limits to Get Currency
    let minGet = 0, maxGet = 0;

    if (CURRENCY_META[give].type !== 'crypto') {
        minGet = baseMin / prices.currentBuy;
        maxGet = baseMax / prices.currentBuy;
    } else {
        // Give is Crypto (e.g. 100 USDT)
        minGet = 100 * prices.currentSell;
        maxGet = 50000 * prices.currentSell;
    }

    const getSymbol = CURRENCY_META[prices.exchangeGet].symbol;
    document.getElementById('get-limit').textContent = `Лимит: ${minGet.toFixed(2)} - ${maxGet.toFixed(2)} ${getSymbol}`;
}

function swapCurrencies() {
    const temp = prices.exchangeGive;
    prices.exchangeGive = prices.exchangeGet;
    prices.exchangeGet = temp;

    document.getElementById('give-amount').value = '';
    document.getElementById('get-amount').value = '';

    updateExchangeUI();
    fetchPrices(); // Re-fetch for new direction
}

function refreshExchangeRate() {
    fetchPrices();
    const btn = document.querySelector('.refresh-btn i');
    if (btn) {
        btn.style.transition = 'transform 0.5s';
        btn.style.transform = 'rotate(360deg)';
        setTimeout(() => btn.style.transform = 'rotate(0deg)', 500);
    }
}

// -- Modal Logic (Exchange) --

let activeSelector = null;

function openCurrencyModal(type) {
    activeSelector = type;
    const modal = document.getElementById('currency-modal');
    const list = document.getElementById('currency-list-items');
    list.innerHTML = '';

    // Filter: If Give is Fiat, Get IS Crypto.
    // So if selecting Give: Show Fiats (+ maybe Cryptos if we allow Crypto->Crypto later)
    // For now enforce Fiat <-> Stable

    const otherCode = type === 'give' ? prices.exchangeGet : prices.exchangeGive;
    const otherIsCrypto = CURRENCY_META[otherCode].type === 'crypto';

    Object.keys(CURRENCY_META).forEach(code => {
        const meta = CURRENCY_META[code];
        const isCrypto = meta.type === 'crypto';

        // Don't show same
        if (code === otherCode) return;

        // Enforce Pair Logic (One Fiat, One Crypto)
        if (otherIsCrypto && isCrypto) return;
        if (!otherIsCrypto && !isCrypto) return;

        const item = document.createElement('div');
        item.className = 'currency-list-item';
        item.onclick = () => selectExchangeCurrency(code);

        const img = isCrypto ? meta.flag : `https://flagcdn.com/w80/${meta.flag}.png`;

        item.innerHTML = `
            <div class="currency-item-left">
                <img src="${img}" class="currency-icon-large">
                <div>
                     <div style="font-weight:600; color:white;">${code}</div>
                     <div style="font-size:12px; color:#888;">${meta.name}</div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });

    modal.classList.add('active');
}

function toggleCurrencyModal(show) {
    const modal = document.getElementById('currency-modal');
    if (show) modal.classList.add('active');
    else modal.classList.remove('active');
}

function selectExchangeCurrency(code) {
    if (activeSelector === 'give') prices.exchangeGive = code;
    else prices.exchangeGet = code;

    toggleCurrencyModal(false);
    updateExchangeUI();
    fetchPrices();
}

// -- Order --
function submitOrder() {
    tg.sendData(JSON.stringify({
        type: 'ORDER',
        give: prices.exchangeGive,
        get: prices.exchangeGet,
        amount: document.getElementById('give-amount').value
    }));
}


// -- Shared Helper --
function openSupport() { tg.openTelegramLink('https://t.me/rexes_support'); }
function openAml() { window.location.href = 'https://rexes.world/chain/index'; }

// -- Location Modal --
const cityData = [
    { name: "ОАЭ, г. Дубай", id: "Dubai", currency: "AED", flag: "ae", currencies: [{ code: 'AED', flag: 'ae' }, { code: 'USD', flag: 'us' }] },
    { name: "Россия, г. Санкт-Петербург", id: "Saint-Petersburg", currency: "RUB", flag: "ru" },
    { name: "Грузия, г. Тбилиси", id: "Tbilisi", currency: "GEL", flag: "ge" },
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

    // Update Dashboard Logic
    const dashLabel = document.getElementById('current-city-label');
    if (dashLabel) {
        let name = city.name.includes(',') ? city.name.split(',')[1] : city.name;
        dashLabel.innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 6px;"></i> ${name.trim()}`;

        // Update Selector
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

        // Update Dashboard Prices
        prices.currentCurrency = city.currency;
        updateRates();
    }

    // Logic for Exchange Page
    // If we change city via modal on exchange page (if we add one there), handle it.
    // Currently exchange page just reads init city.

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
