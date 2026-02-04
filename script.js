const tg = window.Telegram.WebApp;

// State
// State
let prices = {
    USDT: 1.00,
    BTC: 0,
    ETH: 0,
    currentRate: 76.0,     // Current pair rate (e.g. USD to RUB)
    currentCurrency: 'RUB', // Current active currency code for RECEIVE
    currentSymbol: '₽',     // Current active currency symbol for RECEIVE

    // New State for "Give" Side
    currentGiveCoin: 'USDT (TRC20)',
    currentGiveCode: 'USDTTRC',
    currentGiveRate: 1.0 // Usually base
};

// Exchange Rates Mock (USD to X)
const RATES = {
    RUB: { buy: 78.2100, sell: 76.6600, symbol: '₽' },
    USD: { buy: 1.005, sell: 0.995, symbol: '$' }, // Added USD
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
        exchange_btn: "Обменять",
        support_btn: "Поддержка",
        settings_title: "Настройки",
        default_location: "Локация по умолчанию",
        orders: "Заявки",
        language: "Язык",
        support: "Поддержка",
        faq: "Вопросы и ответы",
        modal_exchange_title: "Обмен",
        modal_give: "Отдаете (USDT)",
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
        exchange_btn: "Exchange",
        support_btn: "Support",
        settings_title: "Settings",
        default_location: "Default Location",
        orders: "Orders",
        language: "Language",
        support: "Support",
        faq: "FAQ",
        modal_exchange_title: "Exchange",
        modal_give: "You Give (USDT)",
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

    // Refresh prices every 30 seconds
    setInterval(fetchPrices, 30000);
});

// ... (existing code)

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
        // Check if other modals are open before hiding back button
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
        headers[0].textContent = lang === 'ru' ? 'Валюта' : 'Currency'; // Special case or add to dict
        headers[1].textContent = t.buy;
        headers[2].textContent = t.sell;
    }

    // Buttons
    document.querySelector('.btn-primary').innerHTML = `<i class="fa-solid fa-arrow-right-arrow-left"></i> ${t.exchange_btn}`;
    document.querySelector('.btn-secondary').innerHTML = `<i class="fa-regular fa-comment-dots"></i> ${t.support_btn}`;

    // Settings Modal
    document.getElementById('t-settings-title').textContent = t.settings_title;
    document.getElementById('t-default-location').textContent = t.default_location;
    document.getElementById('t-orders').textContent = t.orders;
    document.getElementById('t-language').textContent = t.language;
    document.getElementById('t-support').textContent = t.support;
    document.getElementById('t-faq').textContent = t.faq;
    document.getElementById('current-lang-code').textContent = lang.toUpperCase();

    // Exchange Modal
    document.querySelector('#exchange-modal .modal-title').textContent = t.modal_exchange_title;
    document.querySelectorAll('#exchange-modal .modal-label')[0].textContent = t.modal_give;
    // Special handling for the dynamic currency label
    const currencyLabel = document.getElementById('modal-currency-label');
    const currencyCode = currencyLabel ? currencyLabel.textContent : 'RUB';
    document.querySelectorAll('#exchange-modal .modal-label')[1].innerHTML = `${t.modal_get} (<span id="modal-currency-label">${currencyCode}</span>)`;

    document.querySelectorAll('#exchange-modal .modal-label')[2].textContent = t.modal_fio;
    document.querySelectorAll('#exchange-modal .modal-label')[3].textContent = t.modal_contact;
    document.querySelector('#exchange-modal .btn-primary').textContent = t.modal_confirm;

    // Location Modal
    document.querySelector('#location-modal .modal-title').textContent = t.modal_location_title;
    document.querySelector('#location-modal .modal-desc').textContent = t.modal_location_desc;

    // User Profile Loading
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

        if (user.username) {
            document.getElementById('contact').value = '@' + user.username;
        }

        if (user.photo_url) {
            const avatarEl = document.getElementById('avatar');
            avatarEl.style.background = 'none';
            avatarEl.style.border = 'none';
            avatarEl.innerHTML = `<img src="${user.photo_url}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
        } else {
            // Generate Avatar Color
            const colors = ['#FF5500', '#007AFF', '#34C759', '#AF52DE'];
            const color = colors[user.id % colors.length];
            const avatarEl = document.getElementById('avatar');
            avatarEl.style.background = color;
            avatarEl.style.border = 'none';
            avatarEl.innerHTML = `<span style="font-size:20px; color:white;">${user.first_name[0]}</span>`;
        }
    }
}

async function fetchPrices() {
    try {
        const buyRate = prices.currentBuy;
        const sellRate = prices.currentSell;
        const symbol = prices.currentSymbol;

        // Fetch BTC and ETH prices in USDT from Binance
        const [btcRes, ethRes] = await Promise.all([
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
        ]);

        const btcData = await btcRes.json();
        const ethData = await ethRes.json();

        if (btcData.price) prices.BTC = parseFloat(btcData.price);
        if (ethData.price) prices.ETH = parseFloat(ethData.price);

        // -- Update UI for 4 Rows, 2 Columns Each (Buy/Sell) --

        // Helper to format currency
        const fmt = (val) => val.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ' + symbol;

        // 1. Tether (USDT TRC20)
        document.getElementById('usdt-trc-buy').textContent = fmt(buyRate);
        document.getElementById('usdt-trc-sell').textContent = fmt(sellRate);

        // 2. Bitcoin (BTC)
        const btcBuy = prices.BTC * buyRate;
        const btcSell = prices.BTC * sellRate;
        document.getElementById('btc-buy').textContent = fmt(btcBuy);
        document.getElementById('btc-sell').textContent = fmt(btcSell);

        // 3. Ethereum (ETH)
        const ethBuy = prices.ETH * buyRate;
        const ethSell = prices.ETH * sellRate;
        document.getElementById('eth-buy').textContent = fmt(ethBuy);
        document.getElementById('eth-sell').textContent = fmt(ethSell);

        // 4. Tether (USDT ERC20)
        document.getElementById('usdt-erc-buy').textContent = fmt(buyRate);
        document.getElementById('usdt-erc-sell').textContent = fmt(sellRate);

    } catch (e) {
        console.error("Failed to fetch prices:", e);
    }
}

function updateRates() {
    // Find the current city data
    const city = cityData.find(c => c.id === currentCityId);

    if (city && city.currency && RATES[city.currency]) {
        const rateData = RATES[city.currency];

        // Check if explicit buy/sell exists, otherwise calculate mock spread
        if (rateData.buy !== undefined && rateData.sell !== undefined) {
            prices.currentBuy = rateData.buy;
            prices.currentSell = rateData.sell;
            prices.currentRate = rateData.buy; // Use Buy rate for calculator base
        } else {
            // Fallback for others: Buy = Rate, Sell = Rate * 0.985
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

    // Update Modal Label
    const modalLabel = document.getElementById('modal-currency-label');
    if (modalLabel) modalLabel.textContent = prices.currentCurrency;

    fetchPrices(); // Re-render
}

// Modal Logic
function toggleModal(show) {
    const modal = document.getElementById('exchange-modal');
    if (show) {
        modal.classList.add('active');
        tg.BackButton.show();
        tg.BackButton.onClick(() => toggleModal(false));

        // Update Modal UI
        updateModalLocation();
        updateModalLimits();
        updateModalRate();

    } else {
        modal.classList.remove('active');
        // If location modal is not open, hide back button
        const locModal = document.getElementById('location-modal');
        if (!locModal || !locModal.classList.contains('active')) {
            tg.BackButton.hide();
            tg.BackButton.offClick();
        }
    }
}

function updateModalLocation() {
    const city = cityData.find(c => c.id === currentCityId);
    if (city) {
        document.getElementById('modal-location-text').textContent = city.name;
    }
}

function updateModalLimits() {
    // Limit Update Logic
    const limitInEl = document.getElementById('limit-in');
    const limitOutEl = document.getElementById('limit-out');

    // Limits
    let minIn = 3500;
    let maxIn = 500000;

    // Different limits if BTC/ETH? For now assuming USDT logic for all "Give"
    // User request: "на крипту устанавливаем мин. значение - 3500..."

    limitInEl.textContent = `Лимит: ${minIn.toFixed(4)} - ${maxIn.toFixed(4)} ${prices.currentGiveCode}`;

    const curr = prices.currentCurrency;
    let min = 280000;
    let max = 5000000;

    if (curr === 'USD') {
        min = 2800;
        max = 350000;
    }
    // Logic for other currencies could be added here

    limitOutEl.textContent = `Лимит: ${min.toFixed(2)} - ${max.toFixed(2)} ${prices.currentSymbol}`;
}


function updateModalRate() {
    const rateEl = document.getElementById('modal-rate-display');
    const flagEl = document.getElementById('modal-currency-flag');

    // Give Icon Update
    const giveContainer = document.getElementById('give-icon-container');
    const giveImg = document.getElementById('give-icon-img');

    // Update Give Icon
    if (prices.currentGiveCode === 'BTC') {
        giveContainer.className = 'coin-icon bg-btc';
        giveContainer.innerHTML = '₿';
    } else if (prices.currentGiveCode === 'ETH') {
        giveContainer.className = 'coin-icon bg-eth';
        giveContainer.innerHTML = '<img src="ethereum.svg" style="width:100%; height:100%; filter: brightness(0) invert(1);">';
    } else {
        // USDTs
        const isErc = prices.currentGiveCode === 'USDTERC';
        giveContainer.className = isErc ? 'coin-icon bg-tether-erc' : 'coin-icon bg-tether';
        // Use existing SVGs or similar
        const src = isErc ? 'erc20.svg' : 'trc20.svg';
        giveContainer.innerHTML = `<img src="${src}" alt="T" style="width:100%; height:100%;">`;
    }

    // Rate Display
    if (rateEl) {
        // Calculate Rate based on Give coin price
        // prices.USDT = 1 (approx), prices.BTC = ..., prices.ETH = ...
        // prices.currentRate is USD -> Fiat Rate

        let multiplier = 1.0;
        if (prices.currentGiveCode.includes('BTC')) multiplier = prices.BTC;
        else if (prices.currentGiveCode.includes('ETH')) multiplier = prices.ETH;

        const finalRate = multiplier * prices.currentRate;

        rateEl.textContent = `1.0000 ${prices.currentGiveCode} ≈ ${finalRate.toFixed(4)} ${prices.currentSymbol}`;
    }

    // Update flag in Receive card
    if (flagEl) {
        // Find city flag
        const city = cityData.find(c => c.id === currentCityId);
        if (city) {
            let flag = city.flag;
            if (city.currencies) {
                const cObj = city.currencies.find(c => c.code === prices.currentCurrency);
                if (cObj) flag = cObj.flag;
            }
            flagEl.src = `https://flagcdn.com/w80/${flag}.png`;
        }
    }
}

// -- New Currency Selector Modal Logic --

let selectorType = 'receive'; // 'give' or 'receive'

function toggleCurrencyModal(show) {
    const modal = document.getElementById('currency-modal');
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

function openCurrencySelector(type) {
    selectorType = type;
    const list = document.getElementById('currency-list');
    list.innerHTML = '';

    if (type === 'give') {
        document.getElementById('currency-modal-title').textContent = 'Отдаете';

        const options = [
            { code: 'USDTTRC', name: 'Tether TRC20', icon: 'trc20.svg', type: 'img' },
            { code: 'USDTERC', name: 'Tether ERC20', icon: 'erc20.svg', type: 'img' },
            { code: 'BTC', name: 'Bitcoin', icon: '₿', type: 'text', bg: 'bg-btc' },
            { code: 'ETH', name: 'Ethereum', icon: 'ethereum.svg', type: 'img-eth' }
        ];

        options.forEach(opt => {
            const item = document.createElement('div');
            item.className = 'location-item';
            item.onclick = () => selectCurrency(opt.code, 'give');

            let iconHtml = '';
            if (opt.type === 'text') {
                iconHtml = `<div class="rate-icon ${opt.bg}">${opt.icon}</div>`;
            } else if (opt.type === 'img-eth') {
                iconHtml = `<div class="rate-icon bg-eth"><img src="ethereum.svg" style="filter: brightness(0) invert(1);"></div>`;
            } else {
                // Tether colors
                const bgClass = opt.code === 'USDTERC' ? 'bg-tether-erc' : 'bg-tether';
                iconHtml = `<div class="rate-icon ${bgClass}"><img src="${opt.icon}"></div>`;
            }

            item.innerHTML = `
                <div style="display:flex; align-items:center;">
                    ${iconHtml}
                    <span>${opt.name}</span>
                </div>
            `;
            list.appendChild(item);
        });

    } else {
        document.getElementById('currency-modal-title').textContent = 'Получаете';

        // Show currencies available in current city
        const city = cityData.find(c => c.id === currentCityId);
        let currencies = [];

        if (city.currencies) {
            currencies = city.currencies;
        } else {
            currencies = [{ code: city.currency, flag: city.flag }];
        }

        currencies.forEach(curr => {
            const item = document.createElement('div');
            item.className = 'location-item';
            item.onclick = () => selectCurrency(curr.code, 'receive');

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap: 12px;">
                    <img src="https://flagcdn.com/w80/${curr.flag}.png" style="width:24px; height:24px; border-radius:50%; object-fit:cover;">
                    <span>${curr.code}</span>
                </div>
            `;
            list.appendChild(item);
        });
    }

    toggleCurrencyModal(true);
}

function selectCurrency(code, type) {
    if (type === 'give') {
        prices.currentGiveCode = code;
    } else {
        // Handle Receive (City currency switch)
        // Reuse setCityCurrency logic but just for state
        const city = cityData.find(c => c.id === currentCityId);
        if (city) {
            setCityCurrency(city.id, code);
        }
    }

    toggleCurrencyModal(false);
    updateModalLimits();
    updateModalRate();
    calculateExchange();
}

function calculateExchange() {
    // Needs update for BTC/ETH rates!
    const amountIn = parseFloat(document.getElementById('amount-in').value);
    const amountOut = document.getElementById('amount-out');

    if (!isNaN(amountIn)) {
        let multiplier = 1.0;
        if (prices.currentGiveCode.includes('BTC')) multiplier = prices.BTC;
        else if (prices.currentGiveCode.includes('ETH')) multiplier = prices.ETH;

        // price.currentRate is 1 USD -> X Fiat
        const rate = multiplier * prices.currentRate;

        amountOut.value = (amountIn * rate).toFixed(2);
    } else {
        amountOut.value = '';
    }
}

function openSettings() {
    tg.showAlert("Настройки скоро будут доступны!");
}

function openSupport() {
    // UPDATED LINK
    tg.openTelegramLink('https://t.me/rexes_support');
}

function submitOrder() {
    const amountIn = document.getElementById('amount-in').value;
    const amountOut = document.getElementById('amount-out').value;
    const city = currentCityId; // Use global variable

    if (!amountIn) {
        tg.showAlert("Введите сумму!");
        return;
    }

    const data = {
        type: 'ORDER',
        coin: 'USDT',
        amount_in: amountIn,
        currency_in: 'USDT',
        amount_out: amountOut,
        currency_out: prices.currentCurrency,
        city: city,
        method: 'DASHBOARD_LIVE'
    };

    tg.sendData(JSON.stringify(data));
    setTimeout(() => tg.close(), 50);
}

// -- Location Modal Logic --

const cityData = [
    // Dubai with multiple currencies
    {
        name: "ОАЭ, г. Дубай",
        id: "Dubai",
        currency: "USD", // Default
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
        // Restore BackButton only if not initial deep view (simplified logic)
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

function selectCity(city) {
    currentCityId = city.id;

    // Update Main UI Button
    // Map text correctly? The design uses simplified text in button vs full text in list
    // Logic: Use full text or mapping? Let's use simplified mapping or just the name from list
    // The previous selector used "📍 Москва", let's reconstruct that style

    let cityName = city.name;

    // Simplified city name logic
    if (cityName.includes("Россия, г.")) cityName = cityName.replace("Россия, г. ", "");
    else if (cityName.includes("ОАЭ, г.")) cityName = cityName.replace("ОАЭ, г. ", "");
    else if (cityName.includes("Турция, г.")) cityName = cityName.replace("Турция, г. ", "");
    else if (cityName.includes("Грузия, г.")) cityName = cityName.replace("Грузия, г. ", "");
    else if (cityName.includes("Армения, г.")) cityName = cityName.replace("Армения, г. ", "");
    else if (cityName.includes("Бразилия, г.")) cityName = cityName.replace("Бразилия, г. ", "");
    else if (cityName.includes("Аргентина, г.")) cityName = cityName.replace("Аргентина, г. ", "");

    document.getElementById('current-city-label').innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 6px;"></i> ${cityName}`;

    // Update Currency Selector
    const currencyContainer = document.getElementById('currency-selector');

    // Check if city has multiple currencies
    if (city.currencies && city.currencies.length > 0) {
        // Create Toggle Interface
        // Remove 'big-selector' class if it interferes, or reuse container
        // We'll replace the content entirely

        let toggleHtml = `<div class="currency-toggle">`;
        city.currencies.forEach(curr => {
            const isActive = (curr.code === city.currency); // Check default or current state
            toggleHtml += `
                <div class="toggle-option ${isActive ? 'active' : ''}" onclick="event.stopPropagation(); setCityCurrency('${city.id}', '${curr.code}')">
                    <img src="https://flagcdn.com/w80/${curr.flag}.png" class="toggle-flag" alt="${curr.code}">
                    ${curr.code}
                </div>
            `;
        });
        toggleHtml += `</div>`;

        // Remove padding if using toggle to fit nicely? 
        // Or keep container and replace innerHTML
        currencyContainer.innerHTML = toggleHtml;
        currencyContainer.classList.remove('big-selector'); // Remove styling collision if necessary, or keep
        // Actually .big-selector has padding which might affect toggle.
        // Let's reset padding for this case in JS or CSS.
        currencyContainer.style.padding = '0';
        currencyContainer.style.border = 'none'; // Already removed but just in case
        currencyContainer.style.background = 'transparent'; // Let toggle handle bg

    } else {
        // Standard Single Currency
        // Restore styling
        currencyContainer.classList.add('big-selector');
        currencyContainer.style.padding = '';
        currencyContainer.style.background = '';

        currencyContainer.innerHTML = `
            <img src="https://flagcdn.com/w80/${city.flag}.png" id="currency-flag" class="currency-flag" alt="Flag">
            <span id="currency-code">${city.currency}</span>
        `;
    }

    // Close Modal
    toggleLocationModal(false);

    // Update Rates logic
    updateRates();
}

// New function to handle toggle switch
function setCityCurrency(cityId, currencyCode) {
    // Update the cityData state
    const city = cityData.find(c => c.id === cityId);
    if (city) {
        city.currency = currencyCode; // Update current selection
        // Find flag for this currency
        const currObj = city.currencies.find(c => c.code === currencyCode);
        if (currObj) city.flag = currObj.flag;

        // Re-render the toggle to show active state
        selectCity(city);
    }
}

// Override updateRates to use currentCityId
// function updateRates() { ... } needs modification in existing code or we override it here?
// The submitOrder function also uses document.getElementById('city-selector').value which is GONE.
// We need to fix submitOrder and updateRates.

