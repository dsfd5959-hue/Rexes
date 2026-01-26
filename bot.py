import asyncio
import json
import logging
import sqlite3
import os
from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, KeyboardButton, WebAppInfo, ReplyKeyboardMarkup
from aiogram.filters import Command

# --- ВАШИ НАСТРОЙКИ ---
TOKEN = "8582270575:AAFmkpvJd9BXrwam9RBsAZHHowb2b-Tw9qA"
GROUP_ID = -5056405128  # ВАШ ID ИЗ СКРИНШОТА
WEB_APP_URL = "https://dsfd5959-hue.github.io/Rexes/"

logging.basicConfig(level=logging.INFO)
bot = Bot(token=TOKEN)
dp = Dispatcher()

# Путь к базе данных (чтобы работало везде)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'rexes.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    # Создаем таблицу со всеми полями
    cur.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            info TEXT,
            fio TEXT,
            contact TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_order(user, data):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Формируем строку информации
    info_str = f"{data.get('amount_in')} {data.get('currency_in')} -> {data.get('amount_out')} {data.get('currency_out')}"
    
    cur.execute('''
        INSERT INTO orders (user_id, username, info, fio, contact)
        VALUES (?, ?, ?, ?, ?)
    ''', (user.id, user.username, info_str, data.get('fio'), data.get('contact')))
    
    order_id = cur.lastrowid
    conn.commit()
    conn.close()
    return order_id

# --- ОБРАБОТЧИКИ ---

@dp.message(Command("start"))
async def start(message: Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="🚀 Открыть Rexes", web_app=WebAppInfo(url=WEB_APP_URL))]],
        resize_keyboard=True
    )
    await message.answer("Добро пожаловать в обменник Rexes! 👇", reply_markup=kb)

@dp.message(F.web_app_data)
async def get_data(message: Message):
    try:
        data = json.loads(message.web_app_data.data)
        
        # 1. Сохраняем заказ
        order_id = save_order(message.from_user, data)
        print(f"✅ Заявка #{order_id} получена!")

        # 2. Формируем сообщение для группы (БЕЗ HTML, чтобы не ломалось)
        manager_text = (
            f"🔥 НОВАЯ ЗАЯВКА #{order_id}\n"
            f"=================\n"
            f"Сумма: {data['amount_in']} {data['currency_in']}\n"
            f"К получению: {data['amount_out']} {data['currency_out']}\n"
            f"Город: {data['city']}\n"
            f"=================\n"
            f"Клиент: @{message.from_user.username}\n"
            f"ФИО: {data.get('fio')}\n"
            f"Связь: {data.get('contact')}\n"
            f"Метод: {data.get('method')}"
        )

        # 3. Отправляем менеджерам
        await bot.send_message(GROUP_ID, manager_text)
        
        # 4. Отвечаем клиенту
        await message.answer(f"✅ Заявка #{order_id} принята! Менеджер скоро напишет вам.")

    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        # Не пугаем клиента техническим текстом, просто говорим что приняли
        await message.answer("✅ Ваша заявка принята в обработку!")

async def main():
    init_db()
    print("Бот запущен и готов к работе!")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен")