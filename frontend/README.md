# 🎨 SolanaHunter Dashboard

**Dashboard מרהיב לניטור טוקנים בזמן אמת - 2026 Edition! 🚀**

## 📋 מה זה?

דשבורד מודרני ויפה לניטור טוקנים שנמצאו על ידי הבוט SolanaHunter.

## ✨ תכונות מרהיבות

- 🎨 **עיצוב מודרני** - TailwindCSS עם gradient backgrounds ואנימציות
- 📊 **טבלה אינטראקטיבית** - מיון, חיפוש, פילטרים מתקדמים
- 📈 **כרטיסי סטטיסטיקה** - עם hover effects ואנימציות
- 🔄 **עדכונים בזמן אמת** - Supabase Realtime (כשמוגדר)
- 🌙 **Dark Mode** - תמיכה מלאה ב-dark mode
- 📱 **Responsive** - עובד מושלם על מובייל ודסקטופ
- 🔗 **קישורים מהירים** - DexScreener ו-Solscan
- ✨ **אנימציות** - Fade-in, hover effects, pulse animations
- 🎯 **Progress Bars** - עם gradients דינמיים לפי ציון
- 🎨 **Gradient Backgrounds** - רקעים מרהיבים עם blur effects

## 🚀 התקנה

```bash
cd frontend
npm install
```

## ⚙️ הגדרה

1. העתק את `.env.example` ל-`.env.local`
2. הוסף את ה-Supabase credentials שלך:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🏃 הרצה

```bash
npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

## 📦 Build

```bash
npm run build
npm start
```

## 🚀 Deploy ל-Vercel

1. Push את הקוד ל-GitHub
2. לך ל-[vercel.com](https://vercel.com)
3. Import Project → בחר את ה-repo
4. הוסף את ה-environment variables
5. Deploy!

## 🎨 טכנולוגיות

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Supabase** - Database & Realtime
- **Lucide React** - Icons
- **Recharts** - Charts (מוכן לשימוש עתידי)

## 📝 הערות

- אם Supabase לא מוגדר, הדשבורד יציג mock data
- כל העדכונים בזמן אמת דורשים Supabase Realtime
- הדשבורד תומך בעברית מלאה (RTL)
