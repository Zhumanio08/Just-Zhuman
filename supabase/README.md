# Just Zhuman - Supabase Deployment (Easy Setup)

## 🚀 Quick Setup (One File!)

### Step 1: Deploy the Database

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Open the **SQL Editor** tab
4. Run the **entire** contents of `supabase/deploy/deploy.sql`

That's it! All tables, indexes, triggers, RLS policies, and storage buckets are created.

### Step 2: Configure Environment Variables

Create `.env.local` in your project root:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials from:
# Project Settings → API
```

### Step 3: Run the App

```bash
cd /home/zhuman/Just-Zhuman
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📁 File Structure

```
supabase/
├── deploy/
│   └── deploy.sql           # ONE file - run this in SQL Editor
├── README.md                # This file
```

## ✅ What Gets Created

| Component | Details |
|-----------|---------|
| **Tables** | `users`, `posts`, `likes`, `comments` |
| **Indexes** | Performance optimization on foreign keys |
| **Triggers** | Auto-update `updated_at` timestamps |
| **RLS Policies** | Secure data access (owner-only posts, user-only comments) |
| **Storage** | `post_media` and `comment_media` buckets |
| **Storage Policies** | Secure upload/download of media |

## 🔐 Security Notes

- **RLS enabled** on all tables
- **Owner-only posts** - Only post owner can edit/delete
- **User-only comments** - Users can only edit/delete own comments
- **Public read** - Feed, posts, and comments are publicly readable
- **Env variables** - Never commit `.env.local` to GitHub

## 🐛 Troubleshooting

### Error: "relation 'posts' does not exist"
**Cause:** Running files individually in wrong order.  
**Fix:** Run the **entire** `deploy.sql` file at once in the SQL Editor.

### Error: "relation already exists"
**Cause:** Running the file twice.  
**Fix:** The `IF NOT EXISTS` clauses prevent this, but old tables may remain. Drop them first:

```sql
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then run `deploy.sql` again.

## 📖 Next Steps

1. Get your Supabase credentials from **Project Settings → API**
2. Create `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Run the app: `npm install && npm run dev`

