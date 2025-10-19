# Production Database Setup for Vercel

## Option 1: PlanetScale (Recommended)
1. Go to [PlanetScale](https://planetscale.com/)
2. Create a new database
3. Get your connection string
4. Add to Vercel environment variables as `DATABASE_URL`

## Option 2: Neon (PostgreSQL)
1. Go to [Neon](https://neon.tech/)
2. Create a new project
3. Get your connection string
4. Add to Vercel environment variables as `DATABASE_URL`

## Option 3: Supabase (PostgreSQL)
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Get your connection string
4. Add to Vercel environment variables as `DATABASE_URL`

## Environment Variables for Vercel:
- `DATABASE_URL` - Your production database connection string
- `NEXTAUTH_SECRET` - Your NextAuth secret (generate a new one for production)
- `NEXTAUTH_URL` - Your Vercel domain (e.g., https://your-app.vercel.app)
- `OPENAI_API_KEY` - Your OpenAI API key for ChatGPT

## Database Migration:
1. Update your Prisma schema for production database
2. Run migrations: `npx prisma migrate deploy`
3. Seed the database: `npx prisma db seed`
