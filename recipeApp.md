# RecipeApp — Project Requirements & Architecture

## Overview

RecipeApp is a personal Progressive Web App for managing recipes of any kind — food, soaps, fragrances, cosmetics, or anything that follows an ingredient + steps format. It is built for personal and family use, with no social features. It ships with a two-pronged converter (unit conversion + file conversion), a recipe scaling engine, and an AI-powered ingredient substitution assistant.

---

## Core Principles

- Personal and family use only — no social, sharing, or public features
- Works offline via PWA service worker caching
- Data-driven logic throughout — no canned/rehearsed responses
- Fully accessible at every level (see Accessibility section)
- Responsive from 300px to 2000px+ on all axes
- US/Metric unit toggle system-wide, configurable in settings and via quick-toggle
- Dark/light mode, configurable in settings and via quick-toggle
- Clean, warm, functional design — usable with messy hands mid-cook

---

## Tech Stack

### Frontend
- **Framework:** React + TypeScript
- **Styling:** SCSS with CSS custom properties for theming
- **State Management:** Zustand (lightweight, no boilerplate)
- **PWA:** Vite PWA plugin (service worker, manifest, offline caching)
- **Routing:** React Router v6
- **Accessibility:** Radix UI primitives for modals, dropdowns, tooltips (fully accessible out of the box)
- **Unit conversion logic:** Custom worker functions (see Converter section)
- **i18n / RTL:** react-i18next + CSS logical properties for RTL layout support

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** SQLite via Prisma ORM
- **Recipe scraper:** Cheerio + custom extraction logic (handles JSON-LD recipe schema, microdata, and fallback heuristics)
- **AI substitution:** Google Gemini API — model: `gemini-1.5-flash` (free tier: 1,500 requests/day, 1 million tokens/day — sufficient for personal/family use with significant headroom)
- **Auth:** None required (personal app); optional PIN lock for privacy if desired later

### Deployment
- Frontend: Vercel or Netlify (free tier)
- Backend: Railway or Render (free tier)
- Database: SQLite file on backend host, backed up periodically

---

## Feature Specifications

### 1. Recipe Management

#### Recipe Object Structure
```
Recipe {
  id: string (uuid)
  title: string
  description: string (optional)
  category: string (linked to Category)
  folder: string (linked to Folder)
  tags: Tag[]
  type: 'food' | 'beverage' | 'soap' | 'fragrance' | 'cosmetic' | 'other'
  servings: number
  servingUnit: string (e.g. "servings", "bars", "oz", "ml")
  prepTime: number (minutes)
  cookTime: number (minutes)
  totalTime: number (auto-calculated)
  ingredients: Ingredient[]
  steps: Step[]
  metrics: RecipeMetrics
  unitSystem: 'us' | 'metric' | 'inherit' (inherit = follow global setting)
  notes: string (optional)
  sourceUrl: string (optional, if imported)
  createdAt: datetime
  updatedAt: datetime
}

Ingredient {
  id: string
  name: string
  quantity: number
  unit: string
  notes: string (optional, e.g. "room temperature", "finely chopped")
  isOptional: boolean
}

Step {
  id: string
  order: number
  instruction: string
  timerMinutes: number (optional — triggers a timer UI element)
  image: string (optional, url/path)
}

RecipeMetrics {
  calories: number (optional)
  protein: number (optional, grams)
  fat: number (optional, grams)
  carbs: number (optional, grams)
  fiber: number (optional, grams)
  sodium: number (optional, mg)
  customMetrics: { label: string, value: string }[] (for non-food recipes e.g. "Cure Time: 4 weeks")
}

Tag {
  id: string
  label: string
  color: string (optional)
}
```

#### Built-in Dietary Tags (pre-seeded, user can add custom)
- Meat
- Dairy
- Parve
- Kosher
- Gluten Free
- Nut Free
- Soy Free
- Egg Free
- Vegetarian
- Vegan
- Halal
- Low Carb
- Keto
- Paleo

#### Recipe CRUD
- Create recipe manually via form
- Import recipe from URL (backend scraper — extracts title, ingredients, steps, and metadata from any major recipe site using JSON-LD schema or heuristics)
- Edit any field at any time
- Delete with confirmation dialog
- Duplicate a recipe as a starting point for a variation

#### Organization
- **Folders:** User-created named folders (e.g. "Shabbat Meals", "Desserts", "Cleaning Products")
- **Categories:** System-level categories by recipe type (Food, Beverages, Soap, Fragrance, etc.) — user can also create custom categories
- **Tags:** Multi-select, color-coded, filterable
- **Search:** Full-text search across title, ingredients, tags, notes
- **Filters:** By tag, category, folder, dietary restriction, unit system
- **Sort:** By name, date created, date modified, cook time, calories

---

### 2. Unit System Toggle

A global setting that affects how all units display across the app. Overridable per-recipe.

- **US/Imperial:** cups, tablespoons, teaspoons, oz, lb, °F, inches
- **Metric:** ml, liters, grams, kg, °C, cm

The toggle is accessible from:
- Settings page (persistent)
- Quick-toggle button in the header (like dark/light mode switch)

When toggled, all displayed values re-render in the selected unit system in real time. No page reload.

---

### 3. The Converter — Two-Pronged

The converter is a standalone section of the app accessible from the sidebar. It has two modes, switchable via tabs or a top toggle.

#### Prong 1: Unit Converter

Covers cooking and general measurement conversions. Organized by category:

**Cooking Volume**
- tsp ↔ tbsp ↔ cup ↔ fl oz ↔ pint ↔ quart ↔ gallon
- ml ↔ cl ↔ dl ↔ liter

**Weight / Mass**
- oz ↔ lb ↔ gram ↔ kg ↔ mg

**Temperature**
- °F ↔ °C ↔ K

**Length** (for baking pan sizes, etc.)
- inch ↔ cm ↔ mm

**General Volume**
- cubic inch ↔ cubic cm ↔ cubic foot ↔ liter

**Recipe Scaling**
- A dedicated sub-tool: enter original servings → target servings → all ingredient quantities update proportionally
- Works inline on any open recipe OR as a standalone calculator

**Worker functions folder structure:**
```
/converters
  /core
    types.ts                — shared types and interfaces
    conversionEngine.ts     — routes input to correct handler
  /handlers
    imageHandler.ts         — FFmpeg.wasm image conversions
    audioHandler.ts         — FFmpeg.wasm audio conversions
    videoHandler.ts         — FFmpeg.wasm video conversions
    documentHandler.ts      — txt, md, html, rtf conversions
    dataHandler.ts          — JSON, CSV, XML, YAML, TOML
    unitHandler.ts          — all unit conversions (NEW)
  /utils
    ffmpegLoader.ts         — FFmpeg.wasm singleton loader
    fileUtils.ts            — file read/write helpers, MIME utils, format catalog
    unitUtils.ts            — conversion math, scaling logic (NEW)
```

**unitHandler.ts responsibilities:**
- Pure functions, no side effects
- All conversion factors defined as constants
- Handles rounding to sensible precision (e.g. 2.00000000001 cups → 2 cups)
- Handles cross-system conversions (e.g. cups → ml)
- Exposes: `convert(value, fromUnit, toUnit)`, `scaleIngredients(ingredients, fromServings, toServings)`

#### Prong 2: File Converter

The full file converter built previously, integrated here as the second tab of the Converter section.

**Supported via FFmpeg.wasm (client-side, no upload):**
- Images: JPG, PNG, WebP, GIF, BMP, TIFF, AVIF, ICO
- Audio: MP3, WAV, OGG, FLAC, AAC, M4A, Opus
- Video: MP4, WebM, MOV, AVI, MKV, GIF

**Supported via pure JS (client-side):**
- Data: JSON ↔ CSV ↔ XML ↔ YAML ↔ TOML
- Documents: TXT ↔ MD ↔ HTML ↔ RTF

**Required server headers for FFmpeg.wasm (SharedArrayBuffer):**
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Required npm packages:**
```
@ffmpeg/ffmpeg
@ffmpeg/util
```

**Vite dev config:**
```js
server: {
  headers: {
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Embedder-Policy": "require-corp"
  }
}
```

---

### 4. Ingredient Substitution Database

A curated, AI-assisted feature for finding ingredient replacements.

#### Data-driven substitution DB (backend, SQLite)
Pre-seeded with common substitutions organized by:
- **Dietary:** e.g. butter → coconut oil (vegan), eggs → flax egg (vegan), milk → oat milk (dairy-free)
- **Allergen:** e.g. all-purpose flour → almond flour (gluten-free), peanut butter → sunflower seed butter (nut-free)
- **Availability:** e.g. buttermilk → milk + vinegar, cake flour → AP flour + cornstarch
- **Ratio:** every substitution includes the conversion ratio (e.g. 1 egg = 1 tbsp ground flax + 3 tbsp water)

#### AI-powered assistant (Gemini free tier)
- User can type a free-form question: "What can I use instead of heavy cream in a pasta sauce?"
- Backend sends structured prompt to Gemini with recipe context + question
- Response is parsed and displayed as structured substitution cards, not raw chat text
- Fallback: if AI is unavailable, surface the local DB results instead
- The AI feature is clearly labeled as a bonus tool, not the primary path

#### UI
- Accessible from the recipe view inline ("substitute" button next to each ingredient)
- Also accessible as a standalone tool in the Converter/Tools section
- Search by ingredient name → returns all known substitutions with ratios and notes

---

### 5. Recipe Import (URL Scraper)

- User pastes any recipe URL into an import field
- Backend fetches the page, extracts recipe data using:
  1. JSON-LD `@type: Recipe` structured data (preferred — most major sites use this)
  2. microdata / RDFa fallback
  3. Heuristic DOM parsing fallback (title, ingredient lists, ordered steps)
- Extracted data populates the new recipe form for user review and editing before saving
- User can correct anything before saving — import is a starting point, not gospel
- Images from the source can optionally be saved or linked

**Package:** `cheerio` for HTML parsing on the backend

---

### 6. Step Timer

- Any recipe step can have an optional timer attached (set in minutes/seconds)
- When viewing a recipe in "cook mode", a timer button appears on steps that have one
- Tapping starts a countdown
- Uses the Web Notifications API to alert when done (PWA, works in background)
- Multiple timers can run simultaneously (e.g. "boil pasta" and "simmer sauce" at the same time)

---

### 7. Cook Mode

A distraction-free, large-text view optimized for following a recipe while cooking:
- One step shown at a time with prev/next navigation
- Ingredients panel accessible via slide-in drawer or collapsible sidebar
- Timer buttons visible on relevant steps
- Screen keep-awake via WakeLock API (prevents phone screen from sleeping)
- Large touch targets everywhere (min 44x44px, preferably 48x48px)

---

### 8. Settings

- **Unit system:** US / Metric
- **Dark / Light mode**
- **Default recipe type** (Food, Soap, etc.)
- **AI assistant:** Toggle on/off, displays remaining free tier quota if trackable
- **Data:** Export all recipes as JSON, import from JSON backup
- **Optional PIN lock** for privacy (future consideration)

---

## Accessibility Requirements

Full compliance target: **WCAG 2.2 AA**, Section 508, ADA Title III digital accessibility.

### Semantic & Structure
- Semantic HTML throughout (nav, main, aside, article, section, header, footer)
- Landmark regions on every page
- Logical heading hierarchy (h1 → h2 → h3, never skipped)
- Skip navigation link at top of every page
- Breadcrumb navigation where applicable
- Consistent navigation patterns across all views

### Keyboard & Focus
- Full keyboard navigation for every interaction
- Logical tab order matching visual flow
- Visible focus indicator on all interactive elements (not just outline — styled clearly)
- Focus trapping in modals and dialogs
- Escape key closes modals
- Arrow key navigation within menus and dropdowns

### Screen Readers
- ARIA roles, labels, and descriptions on all interactive elements
- Accessible name computation verified for icon-only buttons
- Alt text on all meaningful images; `aria-hidden="true"` on decorative images
- ARIA-live regions for dynamic content updates (conversion results, save confirmations, timer alerts)
- Status messages announced to screen readers without focus shift

### Forms & Inputs
- Every input has a visible, associated label (not placeholder-only)
- Error identification: errors are described in text, not color alone
- Error prevention: form validation before submit with clear inline messages
- Accessible file upload controls (not just styled div)
- Accessible drag-and-drop with keyboard-operable alternative (click to upload)
- Unit input validation is announced accessibly

### Color & Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 for large text and UI components
- Non-text contrast (icons, borders) minimum 3:1
- Never use color as the sole means of conveying information
- High contrast mode support (CSS `forced-colors` media query)
- Dark mode contrast compliant separately verified

### Responsive & Zoom
- Reflow at 320px width (content not cut off, no horizontal scroll)
- 200% zoom support without loss of content or functionality
- Text resizing up to 200% without overflow
- `prefers-reduced-motion` respected — all transitions/animations disabled when set

### Modals & Dialogs
- Built on Radix UI Dialog — accessible by default
- Focus trapped within open modal
- Focus returns to trigger element on close
- Announced to screen readers on open

### Tables
- `th` with `scope` attribute for all data tables
- Table captions or summaries where appropriate

### Touch & Pointer
- Minimum pointer target size 24x24px; preferred 44x44px
- Touch targets never overlapping

### Timer & Timeouts
- Any auto-updating content (timers) announced via ARIA-live
- No session timeouts in this app (personal PWA), but any timed interactions have user control

### Media
- Captions for any instructional video content
- Plain language throughout

### Localization
- react-i18next configured from day one even if only English initially
- CSS logical properties (`margin-inline-start` instead of `margin-left`) for RTL support
- RTL layout tested and functional

### Accessible Icon Buttons
- Every icon-only button has `aria-label`
- SVG icons have `aria-hidden="true"` (the label is on the button, not the icon)

### Theming
- Contrast-safe color tokens for both light and dark themes
- Theme switching does not cause focus loss

---

## Folder & File Structure

```
recipeApp/
├── frontend/
│   ├── public/
│   │   └── manifest.json               # PWA manifest
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── SkipNav.tsx
│   │   │   ├── recipe/
│   │   │   │   ├── RecipeCard.tsx
│   │   │   │   ├── RecipeForm.tsx
│   │   │   │   ├── RecipeView.tsx
│   │   │   │   ├── CookMode.tsx
│   │   │   │   ├── IngredientRow.tsx
│   │   │   │   ├── StepRow.tsx
│   │   │   │   └── TimerButton.tsx
│   │   │   ├── converter/
│   │   │   │   ├── ConverterShell.tsx  # tab switcher between Unit and File
│   │   │   │   ├── UnitConverter.tsx
│   │   │   │   ├── FileConverter.tsx   # from personal site converter
│   │   │   │   └── ScalingTool.tsx
│   │   │   ├── substitution/
│   │   │   │   ├── SubstitutionSearch.tsx
│   │   │   │   └── SubstitutionCard.tsx
│   │   │   └── ui/
│   │   │       ├── Toggle.tsx          # reusable US/Metric + dark/light toggle
│   │   │       ├── TagBadge.tsx
│   │   │       ├── Modal.tsx           # wraps Radix Dialog
│   │   │       ├── Tooltip.tsx         # wraps Radix Tooltip
│   │   │       └── SearchBar.tsx
│   │   ├── converters/                 # worker functions (shared with personal site)
│   │   │   ├── core/
│   │   │   │   ├── types.ts
│   │   │   │   └── conversionEngine.ts
│   │   │   ├── handlers/
│   │   │   │   ├── imageHandler.ts
│   │   │   │   ├── audioHandler.ts
│   │   │   │   ├── videoHandler.ts
│   │   │   │   ├── documentHandler.ts
│   │   │   │   ├── dataHandler.ts
│   │   │   │   └── unitHandler.ts      # NEW — cooking + general unit math
│   │   │   └── utils/
│   │   │       ├── ffmpegLoader.ts
│   │   │       ├── fileUtils.ts
│   │   │       └── unitUtils.ts        # NEW — conversion constants + scaling logic
│   │   ├── pages/
│   │   │   ├── Home.tsx                # recipe library view
│   │   │   ├── RecipeDetail.tsx
│   │   │   ├── RecipeEdit.tsx
│   │   │   ├── CookModePage.tsx
│   │   │   ├── ConverterPage.tsx
│   │   │   ├── SubstitutionsPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── store/
│   │   │   ├── recipeStore.ts          # Zustand — recipe CRUD and state
│   │   │   ├── settingsStore.ts        # Zustand — unit system, theme, prefs
│   │   │   └── timerStore.ts           # Zustand — active timers
│   │   ├── hooks/
│   │   │   ├── useUnitSystem.ts        # reads global unit pref, returns formatted values
│   │   │   ├── useTheme.ts
│   │   │   └── useTimer.ts
│   │   ├── styles/
│   │   │   ├── _tokens.scss            # color, spacing, type tokens
│   │   │   ├── _themes.scss            # light/dark CSS custom properties
│   │   │   ├── _reset.scss
│   │   │   └── main.scss
│   │   ├── i18n/
│   │   │   └── en.json                 # English strings (RTL-ready structure)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts                  # includes COOP/COEP headers + PWA plugin
│   └── tsconfig.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── recipes.ts              # CRUD endpoints
│   │   │   ├── scraper.ts              # URL import endpoint
│   │   │   ├── substitutions.ts        # DB lookup + AI assist endpoint
│   │   │   └── export.ts               # JSON export/import
│   │   ├── services/
│   │   │   ├── scraperService.ts       # cheerio extraction logic
│   │   │   ├── substitutionService.ts  # DB query + Gemini API call
│   │   │   └── geminiService.ts        # Gemini API wrapper
│   │   ├── db/
│   │   │   ├── schema.prisma           # Prisma schema
│   │   │   └── seed.ts                 # substitution DB seed data
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   └── index.ts                    # Express app entry
│   ├── prisma/
│   │   └── schema.prisma
│   └── tsconfig.json
│
└── recipeApp.md                        # this document
```

---

## Database Schema (Prisma / SQLite)

```prisma
model Recipe {
  id          String   @id @default(uuid())
  title       String
  description String?
  type        String   @default("food")
  servings    Float
  servingUnit String   @default("servings")
  prepTime    Int?
  cookTime    Int?
  notes       String?
  sourceUrl   String?
  unitSystem  String   @default("inherit")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  folderId    String?
  folder      Folder?  @relation(fields: [folderId], references: [id])
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])

  ingredients Ingredient[]
  steps       Step[]
  metrics     RecipeMetrics?
  tags        RecipeTag[]
}

model Ingredient {
  id         String  @id @default(uuid())
  recipeId   String
  recipe     Recipe  @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  name       String
  quantity   Float
  unit       String
  notes      String?
  isOptional Boolean @default(false)
  order      Int
}

model Step {
  id           String  @id @default(uuid())
  recipeId     String
  recipe       Recipe  @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  order        Int
  instruction  String
  timerMinutes Float?
  imageUrl     String?
}

model RecipeMetrics {
  id       String  @id @default(uuid())
  recipeId String  @unique
  recipe   Recipe  @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  calories Float?
  protein  Float?
  fat      Float?
  carbs    Float?
  fiber    Float?
  sodium   Float?
}

model Folder {
  id      String   @id @default(uuid())
  name    String
  recipes Recipe[]
}

model Category {
  id      String   @id @default(uuid())
  name    String
  recipes Recipe[]
}

model Tag {
  id      String      @id @default(uuid())
  label   String      @unique
  color   String?
  recipes RecipeTag[]
}

model RecipeTag {
  recipeId String
  tagId    String
  recipe   Recipe @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  tag      Tag    @relation(fields: [tagId], references: [id])
  @@id([recipeId, tagId])
}

model Substitution {
  id          String  @id @default(uuid())
  ingredient  String
  substitute  String
  ratio       String
  notes       String?
  dietaryType String?
  allergenFree String?
}
```

---

## Converter — Unit Handler Spec

**unitUtils.ts — conversion constants and math**

All base conversions go through a single canonical unit per category (e.g. everything converts to/from `ml` for volume, `grams` for weight, `°C` for temperature). This means adding a new unit only requires two entries in the constants map — to canonical and from canonical.

```typescript
// Volume — canonical: ml
const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  cl: 10,
  dl: 100,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  floz: 29.5735,
  cup: 236.588,
  pint: 473.176,
  quart: 946.353,
  gallon: 3785.41,
};

// Weight — canonical: grams
const WEIGHT_TO_GRAMS: Record<string, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

// Temperature — special case, not linear, handled with formula functions
// °F to °C: (F - 32) × 5/9
// °C to K:  C + 273.15

// Length — canonical: mm
const LENGTH_TO_MM: Record<string, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  inch: 25.4,
  foot: 304.8,
};
```

**unitHandler.ts — exposed API**

```typescript
interface UnitConversionResult {
  value: number;
  formatted: string;    // e.g. "2.5 cups"
  fromUnit: string;
  toUnit: string;
}

interface ScaledIngredient extends Ingredient {
  scaledQuantity: number;
  scaledFormatted: string;
}

// Convert a single value
convert(value: number, fromUnit: string, toUnit: string): UnitConversionResult

// Scale all ingredients in a recipe
scaleIngredients(
  ingredients: Ingredient[],
  fromServings: number,
  toServings: number
): ScaledIngredient[]

// Get all valid target units given a source unit
getCompatibleUnits(fromUnit: string): string[]
```

---

## API Endpoints (Backend)

```
GET    /api/recipes              — list all recipes (supports ?tag=, ?folder=, ?search=, ?type=)
POST   /api/recipes              — create recipe
GET    /api/recipes/:id          — get single recipe with all relations
PUT    /api/recipes/:id          — update recipe
DELETE /api/recipes/:id          — delete recipe

POST   /api/recipes/import       — import from URL { url: string }
GET    /api/recipes/export       — export all as JSON

GET    /api/folders              — list folders
POST   /api/folders              — create folder
DELETE /api/folders/:id          — delete folder

GET    /api/tags                 — list all tags
POST   /api/tags                 — create tag

GET    /api/substitutions?q=     — search substitution DB by ingredient name
POST   /api/substitutions/ai     — AI substitution query { ingredient, context, recipeId? }
```

---

## Environment Variables

```
# Backend
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=your_gemini_key_here
PORT=3001

# Frontend
VITE_API_URL=http://localhost:3001
```

---

## PWA Configuration

- **Manifest:** name, short_name, icons (192, 512), theme_color, background_color, display: standalone
- **Service Worker:** cache-first for static assets, network-first for API calls
- **Offline fallback:** cached recipe data available offline; converter (unit prong) works fully offline; file converter works offline (WASM loaded and cached); AI substitution gracefully degrades to local DB offline

---

## Implementation Phases

### Phase 1 — Foundation
- Project scaffold (Vite + React + TypeScript + SCSS)
- Prisma schema + SQLite setup
- Express backend skeleton
- Zustand stores (recipe, settings, timer)
- Theme system (dark/light tokens)
- Unit system toggle infrastructure
- Sidebar + routing

### Phase 2 — Recipe Core
- Recipe list view
- Recipe create/edit form (all fields)
- Recipe detail view
- Folder and tag management
- Search and filter

### Phase 3 — Converter
- Unit converter (unitUtils + unitHandler)
- File converter (port from personal site)
- ConverterShell tab switcher
- Recipe scaling tool (inline on recipe + standalone)

### Phase 4 — Power Features
- URL recipe importer (backend scraper)
- Cook mode
- Step timers + WakeLock
- Substitution DB (seeded)
- AI substitution assistant (Gemini)

### Phase 5 — Polish & Compliance
- Full accessibility audit against checklist
- PWA offline testing
- Responsive testing 300px–2000px+
- Dark mode contrast verification
- prefers-reduced-motion pass
- RTL layout testing
- Export/import data

---

## Reference Apps (for UX inspiration)

- **Paprika** — URL import, auto grocery lists, clean organization
- **SideChef** — step-by-step cook mode with timers
- **Mela** — clean, minimal UI, fast recipe browsing
- **Pestle** — minimalist aesthetic, beautiful typography
- **Cooklist** — grocery list grouped by store section
- **Whisk** — recipe aggregation and content parsing

---


