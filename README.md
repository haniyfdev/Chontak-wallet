# 🏦 Cho'ntak — Virtual Bank Wallet

**Cho'ntak** — O'zbekiston bozori uchun yaratilgan virtual bank hamyon platformasi. Uzum Bank, Click va Payme kabi to'lov tizimlaridan ilhomlangan portfolio loyiha.

Har bir foydalanuvchi `7777-XXXX` formatidagi virtual karta orqali pul o'tkazmalari, balans boshqaruvi va tranzaksiya tarixini kuzatishi mumkin.

---

## 🏗 Arxitektura

```
┌─────────────────────────────────────────────────┐
│                   Frontend (React)              │
└──────────────────────┬──────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────┐
│                  FastAPI Backend                │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │   Auth   │ │  Cards   │ │  Transactions    │ │
│  │  Module  │ │  Module  │ │     Module       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Admin   │ │  Avatar  │ │   Saved Cards    │ │
│  │  Module  │ │  Module  │ │     Module       │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│                                                 │
│  ┌──────────────────┐ ┌──────────────────────┐  │
│  │ Commission Engine│ │  Idempotency Guard   │  │
│  └──────────────────┘ └──────────────────────┘  │
└────────┬──────────────────────────┬─────────────┘
         │                          │
    ┌────▼─────┐             ┌──────▼──────┐
    │PostgreSQL│             │    Redis    │
    │  (Data)  │             │  (Cache &   │
    │          │             │  Rate Limit)│
    └──────────┘             └─────────────┘
```

---

## ⚡ Texnologiyalar

| Texnologiya | Vazifasi |
|-------------|----------|
| **FastAPI** | Asinxron REST API framework |
| **PostgreSQL 16** | Asosiy ma'lumotlar bazasi |
| **SQLAlchemy 2.0** | Async ORM (asyncpg driver) |
| **Alembic** | Database migration management |
| **Redis 7** | Rate limiting, idempotency, refresh token |
| **Docker Compose** | Containerization va deployment |
| **JWT (python-jose)** | Access + Refresh token autentifikatsiya |
| **Passlib + Bcrypt** | Parol xeshlash |
| **Pydantic v2** | Ma'lumot validatsiyasi |

---

## 🔐 Autentifikatsiya

- **Access Token** — qisqa muddatli (15 daqiqa), har bir request uchun
- **Refresh Token** — uzoq muddatli (7 kun), Redis'da saqlanadi
- **Logout** — Redis'dan refresh token o'chiriladi, token invalidation
- **Parol** — bcrypt bilan xeshlanadi, plain text hech qachon saqlanmaydi

---

## 💳 Karta tizimi

- Har bir foydalanuvchiga `7777-XXXX-XXXX-XXXX` formatida virtual karta beriladi
- Karta raqami kriptografik `secrets` moduli orqali generatsiya qilinadi (custom checksum algoritmi)
- Yangi karta **FROZEN** holatda ochiladi — foydalanuvchi aktivlashtirishi kerak (real bank simulatsiyasi)
- Karta holatlari: `ACTIVE` → `FROZEN` → `EXPIRED` → `CLOSED`
- Limit: oddiy foydalanuvchi — 1 ta karta, Premium — 5 tagacha

---

## 💸 Tranzaksiya tizimi

### Atomic Operatsiyalar
Har bir pul o'tkazmasi `SELECT FOR UPDATE` va `async with db.begin()` yordamida atomic tarzda bajariladi. Concurrent request'larda race condition bo'lmaydi.

```
Sender kartadan yechish → Receiver kartaga qo'shish → Platform'ga komissiya
         ↓ Xatolik bo'lsa — hammasi ROLLBACK
```

### Komissiya
| Foydalanuvchi turi | Komissiya |
|--------------------|-----------|
| **USER** | 1% |
| **PREMIUM** | 0% |
| **ADMIN** | 0% |

Barcha komissiyalar `7777-0000-0000-0000` platform kartasiga tushadi.

### Tranzaksiya limitleri
| Foydalanuvchi turi | Maksimum |
|--------------------|----------|
| **USER** | 2,000,000 so'm |
| **PREMIUM** | 4,000,000 so'm |
| **Minimal summa** | 2,000 so'm |

### Xavfsizlik
- **Rate Limiting** — Redis orqali, 1 daqiqada 30 ta request (atomic INCR)
- **Idempotency Guard** — Header orqali kalit qabul qilish, takroriy tranzaksiya oldini olish (Redis NX flag)
- **Balans tekshiruvi** — CHECK constraint (`balance >= 0`), manfiy balans imkonsiz

---

## 🛡 Admin panel

| Endpoint | Vazifasi |
|----------|----------|
| `POST /deposit` | Admin kartasiga pul qo'yish |
| `GET /platform-card` | Platform karta balansi |
| `GET /all-users` | Foydalanuvchilar ro'yxati (qidiruv, pagination) |
| `GET /all-cards` | Barcha kartalar (egasi bo'yicha qidiruv) |
| `GET /all-transactions` | Barcha tranzaksiyalar (filter: summa, sana, karta) |
| `PATCH /status-card/{id}` | Karta holatini o'zgartirish |
| `PATCH /user-role/{id}` | Foydalanuvchi rolini o'zgartirish |
| `GET /verify-balance/{id}` | Bitta karta balansini audit qilish |
| `GET /verify-all-balance` | Barcha kartalar balans auditi (ledger reconciliation) |
| `GET /dashboard` | Statistika: umumiy balans, kunlik aylanma, success/failed % |

### Verify Balance (Ledger Reconciliation)
Har bir kartaning `balance` field'i tranzaksiya tarixidan qayta hisoblanadi. Agar farq topilsa — tizimda bug bor. Real fintech tizimlarida bu jarayon avtomatik (cron job) yoki auditor tomonidan bajariladi.

---

## 📁 Loyiha strukturasi

```
chontak/
├── app/
│   ├── models/
│   │   ├── user.py          # User model + UserRole enum
│   │   ├── card.py           # Card model + StatusCard enum + owner_name property
│   │   ├── transaction.py    # Transaction model + TypeTransaction, StatusTransaction
│   │   ├── avatar.py         # Avatar model
│   │   └── saved_card.py     # SavedCard model
│   ├── routers/
│   │   ├── auth.py           # Register, Login, Refresh, Logout, Profile
│   │   ├── cards.py          # Card CRUD, Freeze/Unfreeze
│   │   ├── transactions.py   # Send money, Transaction history
│   │   ├── admin.py          # Admin panel (13 endpoint)
│   │   ├── avatar.py         # Avatar upload/delete + rate limiting
│   │   └── saved_card.py     # Saved cards CRUD
│   ├── schemas/
│   │   ├── user.py           # Pydantic request/response schemas
│   │   ├── card.py
│   │   └── transaction.py
│   ├── services/
│   │   ├── auth.py           # JWT, password hashing, get_current_user
│   │   ├── card.py           # Card number generation
│   │   ├── transaction.py    # Validator, lock functions, rate limiter, idempotency
│   │   └── admin.py          # check_admin, role/status change functions
│   ├── database.py           # Async SQLAlchemy engine + session
│   ├── config.py             # Pydantic Settings (.env)
│   ├── redis_client.py       # Redis async connection
│   └── main.py               # FastAPI app, CORS, routers, health check
├── alembic/
│   └── versions/             # Migration files
├── static/avatars/           # Uploaded avatar images
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
├── .env
└── README.md
```

---

## 🚀 Ishga tushirish

### 1. Reponi klonlash
```bash
git clone https://github.com/your-username/chontak.git
cd chontak
```

### 2. Environment sozlash
`.env.example` dan `.env` yarating:
```dotenv
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/chontak_db
REDIS_URL=redis://redis:6379
PLATFORM_CARD=7777000000000000
```

### 3. Docker bilan ishga tushirish
```bash
docker-compose up --build
```

Bu buyruq 3 ta container ishga tushiradi:
- **app** — FastAPI server (port 8000)
- **db** — PostgreSQL 16 (port 5432)
- **redis** — Redis 7 (port 6379)

### 4. Migration'larni ishga tushirish
```bash
docker exec -it chontak-app-1 alembic upgrade head
```

### 5. Swagger UI
Brauzerda oching: **http://localhost:8000/docs**

---

## 🗃 Database schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│    users     │     │    cards     │     │  transactions    │
├──────────────┤     ├──────────────┤     ├──────────────────┤
│ id (UUID PK) │◄──┐ │ id (UUID PK) │◄──┐ │ id (String PK)   │
│ full_name    │   │ │ user_id (FK) │──►│ │ from_card_id(FK) │
│ phone_number │   │ │ balance      │   │ │ to_card_id (FK)  │
│ hashed_pass  │   │ │ card_number  │   │ │ amount           │
│ role         │   │ │ status       │   └─│ commission       │
│ created_at   │   │ │ expiry_date  │     │ type             │
└──────────────┘   │ │ created_at   │     │ status           │
       │           │ └──────────────┘     │ description      │
       │           │                      │ created_at       │
       │           │                      │ completed_at     │
       │           │                      └──────────────────┘
       │           │
  ┌────▼───────┐   │  ┌──────────────┐
  │  avatars   │   │  │ saved_cards  │
  ├────────────┤   │  ├──────────────┤
  │ id (UUID)  │   │  │ id (UUID)    │
  │ user_id(FK)│   └──│ owner_user_id│
  │ photo_url  │      │ card_number  │
  └────────────┘      │ card_holder  │
                      │ alias        │
                      └──────────────┘
```

---

## 🔑 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/register` | Ro'yxatdan o'tish |
| POST | `/login` | Tizimga kirish (access + refresh token) |
| POST | `/refresh` | Access tokenni yangilash |
| POST | `/logout` | Tizimdan chiqish |
| GET | `/me` | Profil ma'lumotlari |
| PATCH | `/me` | Profilni tahrirlash |
| PATCH | `/change-password` | Parolni o'zgartirish |

### Cards (`/api/card`)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/` | Yangi karta ochish |
| GET | `/` | Kartalar ro'yxati |
| GET | `/{card_id}` | Karta tafsilotlari |
| PATCH | `/{card_id}/freeze` | Kartani muzlatish |
| PATCH | `/{card_id}/unfreeze` | Kartani aktivlashtirish |

### Transactions (`/api/transactions`)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/` | Pul o'tkazish (rate limited + idempotent) |
| GET | `/` | Tranzaksiya tarixi (filter + pagination) |
| GET | `/{transaction_id}` | Tranzaksiya tafsilotlari |

### Saved Cards (`/api/saved-cards`)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/` | Kartani saqlash |
| GET | `/` | Saqlangan kartalar (qidiruv) |
| GET | `/{id}` | Saqlangan karta tafsiloti |
| PATCH | `/{id}` | Alias tahrirlash |
| DELETE | `/{id}` | Saqlangan kartani o'chirish |

### Admin (`/api/admin`)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/deposit` | Admin kartasiga pul qo'yish |
| GET | `/platform-card` | Platform karta balansi |
| GET | `/all-users` | Foydalanuvchilar ro'yxati (qidiruv, pagination) |
| GET | `/one-users/{user_id}` | Bitta foydalanuvchi tafsiloti |
| GET | `/all-cards` | Barcha kartalar (egasi bo'yicha qidiruv) |
| GET | `/one-card/{card_id}` | Bitta karta tafsiloti |
| GET | `/all-transactions` | Barcha tranzaksiyalar (filter: summa, sana, karta) |
| GET | `/one-transaction/{id}` | Bitta tranzaksiya tafsiloti |
| PATCH | `/status-card/{user_id}` | Karta holatini o'zgartirish |
| PATCH | `/user-role/{user_id}` | Foydalanuvchi rolini o'zgartirish |
| GET | `/verify-balance/{card_id}` | Bitta karta balans auditi |
| GET | `/verify-all-balance` | Barcha kartalar balans auditi (ledger reconciliation) |
| GET | `/dashboard` | Statistika: umumiy balans, kunlik aylanma, success/failed % |

### Avatar (`/api/avatar`)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/` | Avatar yuklash (rate limited) |
| DELETE | `/{user_id}` | Avatarni o'chirish |

---

## 🧪 Xavfsizlik xususiyatlari

| Xususiyat | Texnologiya | Maqsad |
|-----------|-------------|--------|
| Password Hashing | bcrypt | Parolni buzishdan himoya |
| JWT + Refresh | python-jose + Redis | Sessiya boshqaruvi |
| Atomic Transactions | SELECT FOR UPDATE | Race condition oldini olish |
| Rate Limiting | Redis INCR (atomic) | DDoS va brute force himoyasi |
| Idempotency | Redis NX flag | Takroriy tranzaksiya oldini olish |
| Balance CHECK | PostgreSQL constraint | Manfiy balans imkonsiz |
| Role-Based Access | ADMIN/PREMIUM/USER | Ruxsat boshqaruvi |
| CORS Middleware | FastAPI | Cross-origin himoyasi |

---

## ⚙ Konfiguratsiya

| O'zgaruvchi | Tavsif | Default |
|-------------|--------|---------|
| `SECRET_KEY` | JWT signing key | — |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token muddati | 15 |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token muddati | 7 |
| `DATABASE_URL` | PostgreSQL connection | — |
| `REDIS_URL` | Redis connection | redis://localhost:6379 |
| `PLATFORM_CARD` | Platform karta raqami | 7777000000000000 |

---

## 📝 Production eslatmalari

- `allow_origins = ["*"]` → production'da aniq domain qo'yish kerak
- Rate limiting parametrlari (limit, window) config'ga ko'chirilishi kerak
- Platform account seed data Alembic migration orqali yaratilgan
- Verify-balance — production'da faqat admin/internal uchun, demo maqsadida ochiq

---

## 👤 Muallif

**Haniyf** — Backend Developer, Tashkent, Uzbekistan

---

## 📄 Litsenziya

MIT License
