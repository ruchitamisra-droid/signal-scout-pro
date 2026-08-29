# Signal Scout Pro

Build a web app called "Signal Scout" - a lead-scoring and prospecting dashboard for a GTM/sales team at VEED, an AI video creation platform whose customers are marketing teams, agencies, UGC/ad creators, and enterprises that produce a lot of video content.



Core features:



1. Modern, clean SaaS dashboard UI (dark navy background, one bright accent color for scores/badges). Header: app name "Signal Scout" with tagline "Find and score video-marketing-ready leads for VEED."



2. A way to add a lead via a form: Company name, Website, Industry (dropdown: Agency, E-commerce, SaaS, Media/Entertainment, Enterprise, Other), Employee count range (1-10, 11-50, 51-200, 201-1000, 1000+), and three yes/no toggles: "Runs paid social/video ads", "Publishes video content regularly (YouTube/TikTok/Instagram)", "Has in-house marketing or creative team".



3. Also support bulk-adding leads by pasting/uploading CSV with those same columns, parsed client-side.



4. A client-side scoring engine (plain JS, no external API needed) computing an "ICP Fit Score" 0-100 per lead using weighted rules: +30 if publishes video regularly, +25 if runs paid ads, +20 if has in-house marketing/creative team, +15 based on industry (Agency/Media/E-commerce highest, Enterprise medium, SaaS/Other lower), +10 based on company size (11-200 employees is the sweet spot and scores highest, very small or very large score lower). Bucket into tiers: Hot (75-100, red/orange badge), Warm (45-74, yellow badge), Cold (0-44, gray badge).



5. For each lead, auto-generate a short one-line "Outreach angle" string based on which signals are true, referencing a specific real VEED feature — e.g. paid ads signal -> mention AI avatars for fast ad-variant testing; publishes video regularly -> mention auto-subtitles and multi-language localization to scale distribution; agency industry -> mention brand kits to keep every client's videos on-brand. Combine into a natural single sentence per lead.



6. Main dashboard: sortable/filterable table of all leads — columns: Company, Industry, Size, Score, Tier (color-coded badge), Outreach Angle, Edit/Delete actions. Default sort by score descending. Filters by tier and industry.



7. Summary stat cards at the top: Total leads, # Hot, # Warm, # Cold, Average score.



8. "Export to CSV" button for the full lead table.



9. Persist all lead data with Supabase so it survives refresh — no auth/login needed, single shared workspace is fine.



10. A short "About this project" section/footer: "Built as a portfolio project for founding GTM / GTM sales roles — demonstrating ICP definition, signal-based lead scoring, and sales-ready messaging generation, using VEED's real customer profile as the example."



11. Seed the table with 6-8 realistic example leads (real-sounding company names, mixed industries/sizes/signals) so it's populated on first load, not empty.



Prioritize the scoring table and dashboard working well over extra pages. Use React + Tailwind + Supabase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/67ec9cd6-9c7d-4d32-baa3-8547e64737f5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
