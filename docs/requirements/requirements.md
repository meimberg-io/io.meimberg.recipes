# Recipe Menu App - Requirements Document

## Project Overview

A Next.js/React application to display recipes from a Notion workspace, styled like a restaurant menu.

## Tech Stack

- **Framework**: Next.js (App Router)
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Data Source**: Notion API
- **Language**: TypeScript (assumed)

## Design Specifications (from screenshots)

### Layout Structure

1. **Header Section**:
   - Dark banner with blurred kitchen background image
   - Red book icon on the left
   - Large white title: "Bei Meimbergs"
   - Full-width dark background

2. **Navigation**:
   - Horizontal category tabs below header:
     - Frühstück (Breakfast)
     - Vorspeisen (Appetizers)
     - Hauptspeisen (Main Courses) - active state highlighted
     - Suppen (Soups)
     - Nachspeisen (Desserts)
   - Each tab has a small icon (grid/overlapping squares)
   - Sub-category dropdown bar below main navigation
   - Search and filter icons on the right

3. **Recipe Grid (Menu View)**:
   - 3-column responsive grid layout
   - Recipe cards with:
     - Square/rectangular dish image at top
     - Bold white title
     - Lighter colored description text
     - Flags/icons for origin (German, Mexican, Thai flags)
     - Dietary indicators (e.g., green "Vegetarisch" label)
     - Red dot icons for special indicators

4. **Recipe Detail View**:
   - Two-column layout:
     - **Left Sidebar** (fixed width):
       - Header with "Bei Meimbergs" title and red book icon (blurred kitchen background)
       - Category navigation tabs (same as menu view)
       - Recipe list/cards in sidebar (thumbnail, title, description, tags)
       - Footer: "Erstellt von meimberg.io"
     - **Right Content Area** (scrollable):
       - Large recipe image with origin flag overlay (e.g., American flag)
       - Recipe title (large, bold white)
       - **Metadata Section** (structured list):
         - Kategorie (Category): green pill tag
         - Kurzbeschreibung (Short Description): text
         - Vegetarisch (Vegetarian): green pill tag if applicable
         - ✔ Speisekarte (Menu Card): checkbox indicator
         - Status: green pill tag (e.g., "Final")
         - URL: link to source recipe
         - Tags: additional tags
       - **Ingredients Section**:
         - Heading: "Zutaten" (Ingredients)
         - Bulleted list of ingredients with quantities
         - Indented items for optional/serving ingredients

### Styling

- **Color Scheme**: Dark theme
  - Background: Dark grey/black
  - Text: White and light grey
  - Accent: Red (book icon)
  - Images: Full color food photos
- **Typography**: Clean, modern sans-serif
- **Layout**: Responsive grid, card-based design
- **Theme**: Restaurant menu aesthetic

## Notion Database Structure

### Properties

Based on the Notion database structure:

- **Title** (Title property) - Recipe name
- **Kategorie** (Category) - Select property (Frühstück, Vorspeisen, Hauptspeisen, Suppen, Nachspeisen)
- **Kurzbeschreibung** (Short Description) - Text property
- **Vegetarisch** (Vegetarian) - Select property with options:
  - "vegetarisch"
  - "teilweise vegetarisch"
  - "Vegetarische Option Verfügbar"
  - (May change in future - should be flexible)
- **Speisekarte** (Menu Card) - Checkbox property
  - **Filter**: Only recipes with `speisekarte == true` should be shown
- **Status** - Select property (not used in app, only for Notion administration)
- **URL** - URL property (not shown in list view, only in detail view)
- **Tags** - Multi-select property (not shown in list view, only in detail view)
- **Comments** - Not used for now
- **Cover Picture** - Cover image property
- **Rich Text Content** (in page body):
  - Ingredients (richtext)
  - Cooking steps (richtext)
  - Additional pictures (richtext)

### Display Requirements

**List/Menu View:**
- Title
- Kurzbeschreibung (description)
- Cover picture
- Kategorie (for filtering)
- Vegetarisch (if applicable, as pill tag)

**Detail View:**
- All list view fields
- URL (if available)
- Tags (if available)
- Full rich text content (ingredients, cooking steps, pictures)
- Status (not displayed, but available in data)

### Data Sync Strategy

- **Real-time with Next.js SSR caching**
- Use Next.js ISR (Incremental Static Regeneration) for caching
- Webhook endpoint for invalidation: `/api/revalidate`
  - Will be triggered by Notion webhook on database changes
  - Invalidates entire site (no partial invalidation needed)
- For future search/dynamic filters: Use Notion API directly (client-side)
- No structured storage in the app (all data from Notion)

### 2. UX/UI Design - Additional Details

- **Recipe Display**:
  - ✅ Confirmed: Clicking a recipe card shows detailed view with:
    - Large recipe image (cover picture)
    - Full metadata (category, description, dietary info, URL, tags)
    - Complete ingredients list (from richtext)
    - Cooking steps (from richtext)
    - Additional pictures (from richtext)
  - Should there be a back button or breadcrumb navigation?

- **Filtering & Search**:
  - What should the search functionality search? (recipe names, descriptions, ingredients?)
  - What sub-categories should the dropdown show? (specific to each main category?)
  - Should filtering by dietary restrictions be available? (vegetarian, etc.)

- **Responsive Design**:
  - Mobile breakpoints: How should the 3-column grid adapt? (1 column on mobile?)
  - Should navigation tabs scroll horizontally on mobile?

### 3. Features

- **Navigation**:
  - ✅ Confirmed: Two views:
    - Menu view: Full-width grid with category tabs
    - Detail view: Two-column layout with sidebar navigation
  - Footer: "Erstellt von meimberg.io" (Created by meimberg.io)

- **Search & Filtering**:
  - Search by recipe name?
  - Filter by category, dietary restrictions, cooking time?
  - Any other filtering needs?

- **Additional Features**:
  - Print-friendly view?
  - Share functionality?
  - Recipe scaling (servings calculator)?
  - Any user interaction (favorites, ratings)?

### 4. Deployment

- **Hosting**:
  - Where should this be deployed? (Vercel, your own server, etc.)
  - Any specific domain/subdomain?

- **Environment**:
  - Should Notion API credentials be environment variables?
  - Any other environment configuration needed?

### 5. Performance & SEO

- **Performance**:
  - Expected number of recipes?
  - Any performance requirements?

- **SEO**:
  - Should individual recipes have their own URLs for sharing?
  - Meta tags, Open Graph support needed?

## Implementation Plan

1. **Project Setup**:
   - Initialize Next.js 15 project with TypeScript
   - Configure Tailwind CSS
   - Set up project structure

2. **Notion API Integration**:
   - Install `@notionhq/client` package
   - Create API route handlers for fetching recipes
   - Filter recipes by `speisekarte == true`
   - Parse Notion richtext blocks for ingredients and cooking steps
   - Handle images from Notion

3. **Data Models**:
   - TypeScript types for Recipe, Category, Vegetarian options
   - Type-safe Notion API response parsing

4. **UI Components**:
   - Header component with blurred background
   - Category navigation tabs
   - Recipe grid (3-column, responsive)
   - Recipe card component
   - Recipe detail view (two-column layout)
   - Sidebar navigation
   - Metadata display with pill tags
   - Rich text renderer for ingredients/steps

5. **Styling**:
   - Dark theme with Tailwind CSS
   - Responsive design (mobile: 1 column, tablet: 2 columns, desktop: 3 columns)
   - Pill-shaped tags for categories and dietary info
   - Blurred header background effect

6. **Routing**:
   - Menu view: `/` or `/menu`
   - Recipe detail: `/recipes/[slug]` or `/recipes/[id]`

## Notion Setup Instructions

### 1. Create Notion Integration

1. Go to https://www.notion.so/my-integrations
2. Click **"+ New integration"**
3. Fill in:
   - **Name**: "Recipe Menu App" (or any name)
   - **Logo**: Optional
   - **Associated workspace**: Select your workspace
4. Select **Capabilities**:
   - ✅ Read content
   - ✅ Read comments (optional, not used now)
   - ✅ Update content (optional, if you want to update from app later)
5. Click **Submit**
6. Copy the **Internal Integration Token** (starts with `secret_`) - this is your `NOTION_TOKEN`

### 2. Get Database ID

1. Open your Notion recipe database
2. Look at the URL - it will look like:
   ```
   https://www.notion.so/your-workspace/DATABASE_ID?v=...
   ```
3. The Database ID is the long string between the last `/` and the `?`
   - Example: If URL is `https://www.notion.so/abc123def456?v=...`
   - Database ID is: `abc123def456`
4. You can also extract it: Copy the database link, the ID is the part before `?` after the last `/`

### 3. Share Database with Integration

1. Open your recipe database in Notion
2. Click the **"..."** menu (top right)
3. Select **"Connections"** or **"Add connections"**
4. Find and select your integration (the one you just created)
5. Click **"Confirm"**

### 4. Environment Variables

Create `.env.local` with:
```env
NOTION_TOKEN=secret_xxxxx
NOTION_DATABASE_ID=your-database-id-here
REVALIDATE_SECRET=your-random-secret-for-webhook
```

## Next Steps

Once you have the Notion token and database ID:
1. Add them to `.env.local`
2. We'll set up the webhook endpoint for revalidation
3. Start building the UI components

## References

- Screenshots available in: `docs/requirements/screenshots/`
- Notion API Documentation: https://developers.notion.com/

