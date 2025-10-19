# Production Environment Variables for Vercel

## Required Environment Variables:

### Database
DATABASE_URL=postgresql://neondb_owner:npg_NKaoQzH2Wh8l@ep-square-waterfall-adxk2gwq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

### NextAuth (Generate new secret for production)
NEXTAUTH_SECRET=your_production_secret_here
NEXTAUTH_URL=https://your-app-name.vercel.app

### OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

## Instructions:
1. Copy these variables to your Vercel dashboard
2. Replace "your_production_secret_here" with a new secret
3. Replace "your-app-name" with your actual Vercel domain
4. Add your OpenAI API key
