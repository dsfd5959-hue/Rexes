const tg = window.Telegram.WebApp;

// State
// State
let prices = {
    USDT: 1.00,
    BTC: 0,
    ETH: 0,
    currentRate: 76.0,     // Current pair rate (e.g. USD to RUB)
    currentCurrency: 'RUB', // Current active currency code
    currentSymbol: '₽'      // Current active currency symbol
};

// Exchange Rates Mock (USD to X)
const RATES = {
    RUB: { buy: 78.2100, sell: 76.6600, symbol: '₽' },
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

function calculateExchange() {
    const amountIn = parseFloat(document.getElementById('amount-in').value);
    const amountOut = document.getElementById('amount-out');

    if (!isNaN(amountIn)) {
        amountOut.value = (amountIn * prices.currentRate).toFixed(2);
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
    const fio = document.getElementById('fio').value;
    const contact = document.getElementById('contact').value;
    const city = currentCityId; // Use global variable

    if (!amountIn || !fio || !contact) {
        tg.showAlert("Заполните все поля!");
        return;
    }

    const data = {
        type: 'ORDER',
        coin: 'USDT',
        amount_in: amountIn,
        currency_in: 'USDT',
        amount_out: amountOut,
        currency_out: 'RUB',
        city: city,
        fio: fio,
        contact: contact,
        method: 'DASHBOARD_LIVE'
    };

    tg.sendData(JSON.stringify(data));
    setTimeout(() => tg.close(), 50);
}

// -- Location Modal Logic --

const cityData = [
    { name: "ОАЭ, г. Дубай", id: "Dubai", currency: "AED", flag: "ae" },
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

    // Simplify city names for the button label
    if (cityName.includes("Россия, г.")) cityName = cityName.replace("Россия, г. ", "");
    else if (cityName.includes("ОАЭ, г.")) cityName = cityName.replace("ОАЭ, г. ", "");
    else if (cityName.includes("Турция, г.")) cityName = cityName.replace("Турция, г. ", "");
    else if (cityName.includes("Грузия, г.")) cityName = cityName.replace("Грузия, г. ", "");
    else if (cityName.includes("Армения, г.")) cityName = cityName.replace("Армения, г. ", "");
    else if (cityName.includes("Бразилия, г.")) cityName = cityName.replace("Бразилия, г. ", "");
    else if (cityName.includes("Аргентина, г.")) cityName = cityName.replace("Аргентина, г. ", "");

    document.getElementById('current-city-label').innerHTML = `<i class="fa-solid fa-location-dot" style="margin-right: 6px;"></i> ${cityName}`;

    // Update Currency Selector
    if (city.currency && city.flag) {
        document.getElementById('currency-flag').src = `https://flagcdn.com/w80/${city.flag}.png`;
        document.getElementById('currency-code').textContent = city.currency;
    }

    // Close Modal
    toggleLocationModal(false);

    // Update Rates logic
    updateRates();
}

// Override updateRates to use currentCityId
// function updateRates() { ... } needs modification in existing code or we override it here?
// The submitOrder function also uses document.getElementById('city-selector').value which is GONE.
// We need to fix submitOrder and updateRates.

