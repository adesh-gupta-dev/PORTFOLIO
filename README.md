 # Radiant Portfolio

 A modern, single‑page personal portfolio built with Vite + React + TypeScript and styled with Tailwind CSS. Designed for fast performance, clean animations, and strong SEO fundamentals without changing the visual design.

 ## Features
 - Single‑page layout with smooth section scrolling
 - Light/dark theme toggle
 - Animated hero headline and section reveals
 - Projects, skills, achievements, and contact sections
 - SEO metadata, Open Graph, Twitter cards, and sitemap

 ## Tech Stack
 - Vite
 - React 18 + TypeScript
 - Tailwind CSS
 - Framer Motion
 - tsparticles

 ## Getting Started
 1. Install dependencies  
    `pnpm install`
 2. Start the dev server  
    `pnpm dev`
 3. Build for production  
    `pnpm build`
 4. Preview the production build  
    `pnpm preview`

 ## Project Structure
 - `src/components` – UI sections and layout
 - `src/pages` – Page entry (single page)
 - `src/index.css` – Global styles + design system tokens
 - `public` – Static assets, `robots.txt`, `sitemap.xml`

 ## SEO
 SEO is configured in `index.html` with:
 - Title, description, canonical
 - Open Graph + Twitter card metadata
 - JSON‑LD person schema
 - `public/robots.txt` and `public/sitemap.xml`

 ## Customization
 - Update the content in `src/components/*Section.tsx`
 - Replace the social links in `src/components/HeroSection.tsx`, `Navbar.tsx`, `Footer.tsx`, and `ContactSection.tsx`
 - Update the profile image in `public/res/about.png`
 - Edit metadata in `index.html`

 ## License
 This project is open for personal portfolio use. Replace all personal details, links, and assets with your own.
