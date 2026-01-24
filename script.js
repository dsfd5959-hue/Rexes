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
    // Mock logic
    const city = document.getElementById('city-selector').value;
    if (city === 'Dubai') {
        prices.USD_RUB = 100.0;
    } else {
        prices.USD_RUB = 98.5;
    }
    fetchPrices();
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
    // UPDATED LINK
    tg.openTelegramLink('https://t.me/rexes_support');
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
