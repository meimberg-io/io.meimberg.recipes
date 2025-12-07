# Setup Guide

## Prerequisites

- Node.js 18+ installed
- Notion workspace with recipe database
- Notion integration created (see instructions below)

## Notion Integration Setup

### Step 1: Create Notion Integration

1. Visit https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Configure:
   - **Name**: "Recipe Menu App"
   - **Associated workspace**: Your workspace
   - **Capabilities**: 
     - ✅ Read content
     - ✅ Read comments (optional)
4. Click **Submit**
5. **Copy the token** (starts with `secret_`) - this is your `NOTION_TOKEN`

### Step 2: Get Database ID

1. Open your Notion recipe database
2. Copy the database URL
3. Extract the ID from the URL:
   ```
   https://www.notion.so/workspace/DATABASE_ID?v=...
   ```
   The Database ID is the string between the last `/` and `?`

### Step 3: Share Database with Integration

1. Open your recipe database in Notion
2. Click **"..."** menu (top right)
3. Select **"Connections"** → **"Add connections"**
4. Select your integration
5. Click **"Confirm"**

## Project Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local`:
   ```env
   NOTION_TOKEN=secret_xxxxx
   NOTION_DATABASE_ID=your-database-id
   REVALIDATE_SECRET=your-random-secret-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Webhook Setup (for revalidation)

Once deployed, configure Notion webhook:

1. In your Notion database, set up a webhook (if available) or use Notion's API
2. Webhook URL: `https://your-domain.com/api/revalidate`
3. Include header: `X-Revalidate-Secret: your-random-secret-here`
4. This will trigger site-wide revalidation on database changes

