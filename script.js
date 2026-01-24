const tg = window.Telegram.WebApp;

// State
let prices = {
    USDT: 1.00,
    BTC: 0,
    ETH: 0,
    USD_RUB: 98.5 // Fallback/Baseline
};

document.addEventListener('DOMContentLoaded', () => {
    tg.expand();
    initUserProfile();
    fetchPrices();

    // Refresh prices every 30 seconds
    setInterval(fetchPrices, 30000);
});


function initUserProfile() {
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').textContent = `${user.first_name}`;
        document.getElementById('user-username').textContent = user.username ? '@' + user.username : '';

        if (user.username) {
            document.getElementById('contact').value = '@' + user.username;
        }

        // Generate Avatar Color
        const colors = ['#FF5500', '#007AFF', '#34C759', '#AF52DE'];
        const color = colors[user.id % colors.length];
        const avatarEl = document.getElementById('avatar');
        avatarEl.style.background = color;
        avatarEl.style.border = 'none';
        avatarEl.innerHTML = `<span style="font-size:20px; color:white;">${user.first_name[0]}</span>`;
    }
}

async function fetchPrices() {
    try {
        const rubRate = prices.USD_RUB;

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
        const fmt = (val) => val.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + ' ₽';

        // 1. Tether (USDT TRC20)
        // Buy = Base Rate, Sell = Base Rate * 0.98 (spread mock)
        document.getElementById('usdt-trc-buy').textContent = fmt(rubRate);
        document.getElementById('usdt-trc-sell').textContent = fmt(rubRate * 0.985);

        // 2. Bitcoin (BTC)
        const btcRub = prices.BTC * rubRate;
        document.getElementById('btc-buy').textContent = fmt(btcRub);
        document.getElementById('btc-sell').textContent = fmt(btcRub * 0.98);

        // 3. Ethereum (ETH)
        const ethRub = prices.ETH * rubRate;
        document.getElementById('eth-buy').textContent = fmt(ethRub);
        document.getElementById('eth-sell').textContent = fmt(ethRub * 0.98);

        // 4. Tether (USDT ERC20) - Same as TRC20 usually
        document.getElementById('usdt-erc-buy').textContent = fmt(rubRate);
        document.getElementById('usdt-erc-sell').textContent = fmt(rubRate * 0.985);

    } catch (e) {
        console.error("Failed to fetch prices:", e);
    }
}

function updateRates() {
    // Mock logic: changing city might change the local cash rate
    const city = currentCityId;
    if (city === 'Dubai') {
        prices.USD_RUB = 100.0; // Example: more expensive there
    } else {
        prices.USD_RUB = 98.5;
    }
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
        amountOut.value = (amountIn * prices.USD_RUB).toFixed(2);
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
    { name: "ОАЭ, г. Дубай", id: "Dubai" },
    { name: "Россия, г. Санкт-Петербург", id: "Saint-Petersburg" },
    { name: "Грузия, г. Тбилиси", id: "Tbilisi" },
    { name: "Турция, г. Стамбул", id: "Istanbul" },
    { name: "Армения, г. Ереван", id: "Yerevan" },
    { name: "Россия, г. Москва", id: "Moscow", default: true },
    { name: "Россия, г. Краснодар", id: "Krasnodar" },
    { name: "Бразилия, г. Сан-Паулу", id: "Sao-Paulo" },
    { name: "Аргентина, г. Буэнос-Айрес", id: "Buenos-Aires" },
    { name: "Россия, г. Новосибирск", id: "Novosibirsk" }
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

    let btnText = "📍 " + city.name;
    // Cleanup country prefix for button to keep it short if needed, 
    // or keep full as user asked for "concise" earlier but now "panel with visible cities".
    // Let's shorten it for the button: 
    if (city.name.includes("Россия, г.")) btnText = "📍 " + city.name.replace("Россия, г. ", "");
    else if (city.name.includes("ОАЭ, г.")) btnText = "🇦🇪 " + city.name.replace("ОАЭ, г. ", "");
    else if (city.name.includes("Турция, г.")) btnText = "🇹🇷 " + city.name.replace("Турция, г. ", "");
    else if (city.name.includes("Грузия, г.")) btnText = "🇬🇪 " + city.name.replace("Грузия, г. ", "");
    else if (city.name.includes("Армения, г.")) btnText = "🇦🇲 " + city.name.replace("Армения, г. ", "");
    else if (city.name.includes("Бразилия, г.")) btnText = "🇧🇷 " + city.name.replace("Бразилия, г. ", "");
    else if (city.name.includes("Аргентина, г.")) btnText = "🇦🇷 " + city.name.replace("Аргентина, г. ", "");

    document.getElementById('current-city-label').textContent = btnText;

    // Close Modal
    toggleLocationModal(false);

    // Update Rates logic
    updateRates();
}

// Override updateRates to use currentCityId
// function updateRates() { ... } needs modification in existing code or we override it here?
// The submitOrder function also uses document.getElementById('city-selector').value which is GONE.
// We need to fix submitOrder and updateRates.

