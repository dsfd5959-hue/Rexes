import asyncio
import json
import logging
import sqlite3
import os
from datetime import datetime

from aiogram import Bot, Dispatcher, F
from aiogram.types import Message, KeyboardButton, WebAppInfo, ReplyKeyboardMarkup
from aiogram.filters import Command

# ---------------- НАСТРОЙКИ ----------------
# ВАЖНО: лучше хранить токен в переменных окружения:
# Linux/Mac:  export BOT_TOKEN="123:ABC"
# Windows PS: setx BOT_TOKEN "123:ABC"
TOKEN = os.getenv("BOT_TOKEN", "REPLACE_ME")
GROUP_ID = -5056405128  # ID вашей группы/супергруппы (должен быть с минусом)
WEB_APP_URL = "https://rexes.world/chain/index.html"
# -------------------------------------------

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("rexes-bot")

bot = Bot(token=TOKEN)
dp = Dispatcher()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "rexes.db")


def _ensure_column(cur: sqlite3.Cursor, table: str, col: str, col_type: str) -> None:
    cur.execute(f"PRAGMA table_info({table})")
    cols = {row[1] for row in cur.fetchall()}
    if col not in cols:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Базовая таблица (если её ещё нет)
    cur.execute(
        '''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT,
            info TEXT,
            fio TEXT,
            contact TEXT
        )
        '''
    )

    # Миграции (если база уже существует) — добавим колонки, не ломая старое
    try:
        _ensure_column(cur, "orders", "payload_json", "TEXT")
        _ensure_column(cur, "orders", "created_at", "TEXT")
    except Exception as e:
        log.warning("DB migration warning: %s", e)

    conn.commit()
    conn.close()


def normalize_order_payload(raw: dict) -> dict:
    """Приводим разные форматы данных к одному виду."""
    # Новый формат из MiniApp (script.js)
    if raw.get("type") == "ORDER_FINAL":
        amount_in = raw.get("giveAmount")
        currency_in = raw.get("give")
        amount_out = raw.get("getAmount")
        currency_out = raw.get("get")

        fio = raw.get("holder_name") or raw.get("fio") or ""
        city = raw.get("city") or raw.get("city_name") or raw.get("city_id") or ""

        # контакты: соберём в одну строку
        parts = []
        if raw.get("phone"):
            parts.append(f"phone: {raw.get('phone')}")
        if raw.get("telegram"):
            parts.append(f"telegram: {raw.get('telegram')}")
        if raw.get("email"):
            parts.append(f"email: {raw.get('email')}")
        if raw.get("contact"):
            parts.append(str(raw.get("contact")))
        contact = "\n".join(parts).strip()

        # Реквизиты (могут быть разные)
        details = []
        for k in ["card_number", "sender_card", "wallet_address"]:
            if raw.get(k):
                details.append(f"{k}: {raw.get(k)}")

        method = raw.get("method") or "exchange"

        return {
            "amount_in": amount_in,
            "currency_in": currency_in,
            "amount_out": amount_out,
            "currency_out": currency_out,
            "city": city,
            "fio": fio,
            "contact": contact,
            "method": method,
            "details": "\n".join(details).strip(),
        }

    # Старый формат (как у вас было в bot.py раньше)
    return {
        "amount_in": raw.get("amount_in"),
        "currency_in": raw.get("currency_in"),
        "amount_out": raw.get("amount_out"),
        "currency_out": raw.get("currency_out"),
        "city": raw.get("city", ""),
        "fio": raw.get("fio", ""),
        "contact": raw.get("contact", ""),
        "method": raw.get("method", "exchange"),
        "details": "",
    }


def save_order(user, normalized: dict, raw_payload: dict) -> int:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    info_str = f"{normalized.get('amount_in')} {normalized.get('currency_in')} -> {normalized.get('amount_out')} {normalized.get('currency_out')}"
    payload_json = json.dumps(raw_payload, ensure_ascii=False)

    # Поймём, есть ли новые колонки
    cur.execute("PRAGMA table_info(orders)")
    cols = {row[1] for row in cur.fetchall()}

    if "payload_json" in cols and "created_at" in cols:
        cur.execute(
            '''
            INSERT INTO orders (user_id, username, info, fio, contact, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''',
            (
                user.id,
                user.username or "",
                info_str,
                normalized.get("fio", ""),
                normalized.get("contact", ""),
                payload_json,
                datetime.utcnow().isoformat(),
            ),
        )
    else:
        cur.execute(
            '''
            INSERT INTO orders (user_id, username, info, fio, contact)
            VALUES (?, ?, ?, ?, ?)
            ''',
            (
                user.id,
                user.username or "",
                info_str,
                normalized.get("fio", ""),
                normalized.get("contact", ""),
            ),
        )

    order_id = cur.lastrowid
    conn.commit()
    conn.close()
    return order_id


@dp.message(Command("start"))
async def start(message: Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="🚀 Открыть Rexes", web_app=WebAppInfo(url=WEB_APP_URL))]],
        resize_keyboard=True,
    )
    await message.answer("Добро пожаловать в обменник Rexes! 👇", reply_markup=kb)


@dp.message(F.web_app_data)
async def get_data(message: Message):
    try:
        raw = json.loads(message.web_app_data.data)
        normalized = normalize_order_payload(raw)

        # Базовая валидация, чтобы не сохранять мусор
        if not normalized.get("amount_in") or not normalized.get("currency_in") or not normalized.get("currency_out"):
            raise ValueError(f"Bad payload: {raw}")

        order_id = save_order(message.from_user, normalized, raw)

        user_display = (
            f"@{message.from_user.username}"
            if message.from_user.username
            else f"{message.from_user.first_name} (id: {message.from_user.id})"
        )

        manager_text = (
            f"🔥 НОВАЯ ЗАЯВКА #{order_id}\n"
            f"=================\n"
            f"Отдаёт: {normalized.get('amount_in')} {normalized.get('currency_in')}\n"
            f"Получает: {normalized.get('amount_out')} {normalized.get('currency_out')}\n"
            f"Город: {normalized.get('city')}\n"
            f"=================\n"
            f"Клиент: {user_display}\n"
            f"ФИО: {normalized.get('fio')}\n"
            f"Связь:\n{normalized.get('contact')}\n"
        )

        if normalized.get("details"):
            manager_text += f"Реквизиты:\n{normalized.get('details')}\n"

        manager_text += f"Метод: {normalized.get('method')}"

        await bot.send_message(GROUP_ID, manager_text)
        await message.answer(f"✅ Заявка #{order_id} принята! Менеджер скоро напишет вам.")

    except Exception as e:
        log.exception("WEB_APP_DATA error: %s", e)
        await message.answer("❌ Не удалось отправить заявку. Проверьте данные и попробуйте ещё раз.")


async def main():
    if TOKEN == "REPLACE_ME":
        raise RuntimeError("Вы не задали BOT_TOKEN. Задайте переменную окружения BOT_TOKEN или вставьте токен в код.")
    init_db()
    log.info("Бот запущен и готов к работе!")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот остановлен")
