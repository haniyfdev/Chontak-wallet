# Cho'ntak Frontend — Kerakli kutubxonalar

## O'rnatish kerak bo'lgan paketlar:

```bash
npm install zustand react-router-dom axios lucide-react
```

## Mavjud bo'lishi kerak bo'lgan paketlar (odatda vite bilan keladi):
- react
- react-dom
- tailwindcss

## Tailwind CSS sozlash (agar sozlanmagan bo'lsa):
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### tailwind.config.js:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

### src/index.css (mavjudga qo'shing):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## API URL o'zgartirish:
src/api/index.js faylida:
```js
const BASE_URL = "https://chontak-wallet.onrender.com";
```
Backend boshqa portda ishlasa, shu yerni o'zgartiring.

## Fayllar joylashuvi:
```
ch_front/src/
├── api/
│   └── index.js          ← API calls
├── store/
│   └── authStore.js      ← Auth state (Zustand)
├── components/
│   └── Layout.jsx        ← Sidebar + main layout
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── DashboardPage.jsx
│   ├── TransactionsPage.jsx
│   ├── SendMoneyPage.jsx
│   ├── CardsPage.jsx
│   ├── ProfilePage.jsx
│   ├── SavedCardsPage.jsx
│   └── SubscriptionPage.jsx
└── App.jsx               ← Routing
```
