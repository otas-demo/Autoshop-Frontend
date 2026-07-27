# Design System & UI Tokens

This ruleset outlines styling tokens and reusable UI specifications to keep layouts consistent, modern, and high-end.

## 1. Color Palette Definitions
Use Tailwind classes corresponding to our curated palette. Avoid random inline hexadecimal values:
- **Primary Brand Color**: Indigo/Blue `#2216a8`
  - Filled theme background: `bg-[#2216a8] hover:bg-[#2216a8]/90`
  - Text highlights: `text-[#2216a8] hover:text-[#2216a8]/80`
  - Borders: `border-indigo-200`
- **Secondary Accents**:
  - Emerald / Success: `text-emerald-700 bg-emerald-50 border-emerald-100` (or theme white success toasts)
  - Red / Danger: `text-red-600 bg-red-50 border-red-150`
  - Amber / Warning: `text-amber-600 bg-amber-50 border-amber-100`
- **Neutral Grays**:
  - Backgrounds: `bg-slate-50`, `bg-slate-100`
  - Typography: `text-slate-800` (main text), `text-slate-500` (subtitles/labels), `text-slate-400` (disabled/hints)
  - Borders: `border-slate-100`, `border-slate-200`

## 2. Typography & Spacing
- **Fonts**: Use Outfit/Inter weights. 
  - Main Page Headers: `text-2xl font-bold text-slate-800`
  - Subheaders/Cards: `text-base font-semibold text-slate-800`
  - Labels: `text-sm font-semibold text-slate-500`
- **Spacing**: Use uniform increments:
  - Inside card wrappers: `p-4 sm:p-6`
  - Form layout spacing: `space-y-4`, `space-y-6`
  - Gap utilities: `gap-3`, `gap-4`

## 3. Reusable UI Specifications
- **Action Buttons (Pill Style)**:
  - **Primary Filled**: `px-4 py-2 text-sm font-semibold rounded-full bg-[#2216a8] text-white hover:bg-[#2216a8]/90 transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 cursor-pointer`
  - **Secondary Bordered**: `px-4 py-2 text-sm font-semibold rounded-full border border-indigo-200 text-[#2216a8] bg-white hover:bg-indigo-50/50 transition-all flex items-center gap-1.5 cursor-pointer`
  - **Danger Action**: `px-4 py-2 text-sm font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 transition-all shadow-md shadow-red-600/10 flex items-center gap-1.5 cursor-pointer`
- **Card Patterns**:
  - Settings panels and cards: `bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm`
- **Inputs & Form Controls**:
  - Inputs, date pickers, select menus: `w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2216a8] focus:border-transparent outline-none transition-all`

## 4. Anti-Inline Styles Mandate
- Do **NOT** write arbitrary inline styles (`style={{ color: '#2216a8' }}`). Always prioritize Tailwind utility classes or custom CSS variables defined in global styles.
