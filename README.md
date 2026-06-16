# InsertIQ

אפליקציית למידה למוצרי Iscar — גריידים, שימות, והתאמה לאפליקציה.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Prisma 6** + **PostgreSQL** (Neon.tech)
- **Tailwind CSS** + **shadcn/ui**

---

## פיתוח מקומי

### 1. צור בסיס נתונים חינמי ב-Neon.tech

1. כנס ל-[neon.tech](https://neon.tech) → New Project
2. העתק את ה-Connection String מ-Connection Details

### 2. הגדר משתני סביבה

ערוך את `.env.local`:
```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
```

### 3. הרץ Migrations

```bash
npx prisma migrate dev --name init
```

### 4. הפעל שרת פיתוח

```bash
npm run dev
```

פתח `http://localhost:3000`

---

## פריסה ל-Render.com

1. Push לGitHub
2. Render → New Web Service → connect repo
3. **Build Command:** `npm install && npx prisma generate && npm run build`
4. **Start Command:** `npm start`
5. **Environment Variable:** `DATABASE_URL` = חיבור Neon
6. **Pre-deploy:** `npx prisma migrate deploy`

### DNS — Subdomain

ב-Cloudflare/DNS provider שלך הוסף:
```
CNAME  insertiq  →  <app-name>.onrender.com
```

האפליקציה תהיה זמינה ב: `https://insertiq.rentflows.work`

---

## מבנה האפליקציה

```
/                    — Dashboard עם סטטיסטיקות
/admin/grades        — ניהול גריידים
/admin/inserts       — ניהול שימות
/admin/import        — ייבוא CSV מרוכז
/learn/quiz          — חידון תרחיש (בחר גרייד לפי אפליקציה+חומר)
/learn/flashcards    — כרטיסיות (גרייד → נחש תכונות)
/learn/match         — התאמה הפוכה (חומר+תנאים → גרייד)
```

## פורמט CSV לייבוא

### גריידים (`grades-template.csv`)
```
code,substrate,coatingType,isoMaterials,applications,conditions,advantages,disadvantages,vcMin,vcMax
IC908,Carbide,CVD,P;M,Turning;Milling,Stable;Unstable,Wear resistant,Brittle,100,300
```
ערכים מרובים מופרדים ב-`;`

### שימות (`inserts-template.csv`)
```
code,application,geometry,gradeId,materials,conditions,advantages,disadvantages
APMT1135PDER,Milling,Positive rake 35deg,<grade-id>,P20;Stainless,Stable,Low forces,Not for interrupted
```
