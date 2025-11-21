# Deployment Guide

## Prerequisites

1. **Database**: You'll need a PostgreSQL database. [Neon](https://neon.tech) is recommended (free tier available)
2. **GitHub Account**: To host your code
3. **Vercel Account**: For deployment (free tier available)

## Step 1: Push to GitHub

1. Create a new repository on GitHub: https://github.com/new
   - Name it something like "oceanflow" or "maritime-logistics"
   - Keep it public or private as you prefer
   - **Don't** initialize with README (we already have code)

2. Add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set Up Database (Neon)

1. Go to https://neon.tech and create a free account
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@host/dbname`)
4. Run the schema migration:
   ```bash
   DATABASE_URL="your_connection_string_here" npm run db:push
   ```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variable:
   ```bash
   vercel env add DATABASE_URL
   ```
   Paste your Neon connection string when prompted.

5. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option B: Using Vercel Dashboard

1. Go to https://vercel.com and sign in with GitHub
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/public`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add `DATABASE_URL` with your Neon connection string
   - Add `NODE_ENV` = `production`

6. Click "Deploy"

## Important Notes

- The app uses PostgreSQL, so you **must** provide a `DATABASE_URL` environment variable
- The current setup uses Neon's serverless PostgreSQL driver (`@neondatabase/serverless`)
- First deployment might take 2-3 minutes to complete
- Vercel will automatically redeploy on every push to main branch

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify DATABASE_URL is accessible from Vercel's network

### Database Connection Issues
- Ensure you're using the connection string with SSL enabled
- Neon provides connection pooling by default, which works great with serverless

### API Routes Not Working
- Verify the routes are prefixed with `/api/`
- Check Vercel function logs in the dashboard

## Alternative: Deploy Backend Separately

If you prefer to keep backend and frontend separate:

1. **Backend** (Railway, Render, or Fly.io):
   - Deploy the Express server as a long-running process
   - These platforms better support WebSocket connections if needed

2. **Frontend** (Vercel or Netlify):
   - Deploy just the built frontend
   - Update API calls to point to your backend URL

This approach gives you more control but requires managing two deployments.
