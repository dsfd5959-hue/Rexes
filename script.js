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
        // Fetch BTC and ETH prices in USDT from Binance
        const [btcRes, ethRes] = await Promise.all([
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT'),
            fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT')
        ]);

        const btcData = await btcRes.json();
        const ethData = await ethRes.json();

        if (btcData.price) prices.BTC = parseFloat(btcData.price);
        if (ethData.price) prices.ETH = parseFloat(ethData.price);

        // Update UI
        // Assuming we want to show price in RUB approx, we multiply by USD_RUB
        // Or if the design implies USDT price, we show that.
        // Based on "77.9700 P" in screenshot, it's RUB.

        const rubRate = prices.USD_RUB; // Fixed for now or could fetch freely

        document.getElementById('price-usdt').textContent = `${rubRate.toFixed(2)} ₽`;
        document.getElementById('price-btc').textContent = `${(prices.BTC * rubRate).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`;
        document.getElementById('price-eth').textContent = `${(prices.ETH * rubRate).toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽`;

    } catch (e) {
        console.error("Failed to fetch prices:", e);
    }
}

function updateRates() {
    // Mock logic: changing city might change the local cash rate
    const city = document.getElementById('city-selector').value;
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
        tg.BackButton.hide();
        tg.BackButton.offClick();
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
    tg.openTelegramLink('https://t.me/rexes_support_bot');
}

function submitOrder() {
    const amountIn = document.getElementById('amount-in').value;
    const amountOut = document.getElementById('amount-out').value;
    const fio = document.getElementById('fio').value;
    const contact = document.getElementById('contact').value;
    const city = document.getElementById('city-selector').value;

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
