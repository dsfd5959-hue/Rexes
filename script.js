const tg = window.Telegram.WebApp;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    tg.expand();

    // Auto-fill user data
    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').textContent = `${user.first_name} ${user.last_name || ''}`.trim();
        document.getElementById('user-username').textContent = user.username ? '@' + user.username : 'No username';

        // Auto-fill contact if possible
        if (user.username) {
            document.getElementById('contact').value = '@' + user.username;
        }

        // Avatar Logic (Mock, as direct URL needs backend)
        const avatarEl = document.getElementById('avatar');
        // We could use user.photo_url if available (rarely in webapp basic data),
        // For now, we keep the icon placeholder but maybe colorize it based on ID
        const colors = ['#FF5500', '#007AFF', '#34C759', '#AF52DE'];
        const color = colors[user.id % colors.length];
        avatarEl.style.background = color;
        avatarEl.innerHTML = `<span style="font-size:20px; color:white;">${user.first_name[0]}</span>`;
    }

    // Hide MainButton as we use custom UI
    if (tg.MainButton.isVisible) tg.MainButton.hide();
});

const RATE = 98.0;

function calculateExchange(source) {
    const amountIn = document.getElementById('amount-in');
    const amountOut = document.getElementById('amount-out');

    if (source === 'in') {
        const val = parseFloat(amountIn.value);
        if (!isNaN(val)) {
            amountOut.value = (val * RATE).toFixed(2);
        } else {
            amountOut.value = '';
        }
    } else {
        const val = parseFloat(amountOut.value);
        if (!isNaN(val)) {
            amountIn.value = (val / RATE).toFixed(2);
        } else {
            amountIn.value = '';
        }
    }
}

function openSettings() {
    tg.showAlert("Настройки пока недоступны в демо-режиме.");
}

function openSupport() {
    tg.openTelegramLink('https://t.me/rexex_support_bot'); // Replace with actual support
}

function submitOrder() {
    const fio = document.getElementById('fio').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const city = document.getElementById('city').value;
    const amountIn = document.getElementById('amount-in').value;
    const amountOut = document.getElementById('amount-out').value;
    const currencyOut = document.getElementById('currency-out').value;

    // Validation
    if (!amountIn || !amountOut) {
        tg.showAlert("Введите сумму обмена");
        return;
    }
    if (!fio) {
        tg.showAlert("Пожалуйста, укажите ФИО");
        return;
    }
    if (!contact) {
        tg.showAlert("Укажите контакт для связи");
        return;
    }

    // Data Construction
    const data = {
        type: 'ORDER',
        coin: 'USDT',
        amount_in: amountIn,
        currency_in: 'USDT',
        amount_out: amountOut,
        currency_out: currencyOut, // Now dynamic from selector
        city: city,
        fio: fio,
        contact: contact, // Now visible/editable in the form
        method: 'TWA_PREMIUM_BLUE'
    };

    const dataJson = JSON.stringify(data);

    // UX Confirmation with new style
    tg.showConfirm(
        `Обмен: ${amountIn} USDT\nНа: ${amountOut} ${currencyOut}\n\nГород: ${city}\n\nВсе верно?`,
        function (ok) {
            if (ok) {
                try {
                    tg.sendData(dataJson);
                    setTimeout(() => tg.close(), 50);
                } catch (e) {
                    tg.showAlert("Ошибка отправки: " + e.message);
                }
            }
        }
    );
}
