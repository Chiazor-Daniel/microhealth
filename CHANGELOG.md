# MicroHealth Website Changes

## What was changed

1. **Replaced all marketing images** (`src/app/App.tsx` `IMGS` object) with Unsplash photos selected from black-doctor / African-healthcare searches so the site shows Black healthcare workers and patients instead of the previous generic/white imagery.

2. **Rewrote the landing page** (`/`) to match the MicroHealth pitch deck:
   - New hero copy: "Healthcare that meets you where you live & work."
   - New CTAs: "Find a Care Unit" and "See How It Works".
   - New stat strip using the deck's Nigeria PHC data.
   - New trust strip: Estates, Markets, Workplaces, Schools, Religious Centres, Transport Hubs.
   - Feature cards now describe Community POC Units, MicroHealth OS, and Preventive/Affordable Care.
   - Split feature now shows unit performance rather than hospital wards.
   - Stats banner uses deck market figures ($109B Africa spend, $32.9B PHC opportunity, 70% reliance on PHC, 1:5,000 doctor ratio).
   - How-it-works now describes locating a unit, booking/walking in, and receiving follow-up care.
   - Testimonials updated to community care-unit roles with quotes from black Nigerian doctors.
   - Footer updated with new page links and Africa-focused tagline.

3. **Added marketing pages** (all use shared `MarketingNav` / `MarketingFooter` and POC-network content):
   - `/about` — Problem + Solution from the pitch deck.
   - `/solution` — Physical units, operating system, partnerships, public-health education, and the 4-step care flow.
   - `/pricing` — Pay-per-visit, Family Care Plan, Employer/Group Plan.
   - `/partners` — Estate/market associations, employers, HMOs/NGOs, labs/pharmacies.
   - `/contact` — Contact form + contact details.
   - `/pitch` — Investor pitch summary: $100k for 5% equity, use of funds, milestones, and deck request CTA.

4. **Updated routes** in `App()` to include all new marketing pages.

5. **Updated page metadata** in `index.html` title and description.

## Pages the site now has

### Public / Marketing
- `/` Landing page
- `/about` Why MicroHealth
- `/solution` Our Solution
- `/pricing` Pricing
- `/partners` Partner With Us
- `/contact` Contact
- `/pitch` Investor Pitch

### Product demos
- `/login` Staff login
- `/admin/*` Admin dashboard
- `/patient/login` Patient login
- `/patient/*` Patient portal

## Image sources
All images are from Unsplash and were chosen using searches such as "black doctors", "african hospital", and "african healthcare". Replace with your own licensed photography when ready for production.

## Build status
`npm run build` completes successfully.

## Second-pass image audit (stricter)
Re-verified every image in the `IMGS` object to ensure all people shown are Black/African. The remaining NCI-sourced ambiguous photos (`hero`, `heroAlt`, `docLaptop`, `community`, `pharmacy`/`doc3`) were replaced with free, non-Unsplash+ Unsplash images surfaced by `black doctor` / African healthcare searches:

- `hero`: Bruno Rodrigues — man in blue scrub suit wearing a stethoscope.
- `heroAlt` / `doc2`: Ato Aikins — woman wearing a white coat and a stethoscope.
- `doc3`: Bruno Rodrigues — man in blue crew neck t-shirt wearing a stethoscope.
- `docLaptop`: Francis Odeyemi — woman sitting at a table with a laptop.
- `community`: Hush Naidoo — dentist holding syringe into boy's mouth (Black dentist and child).
- `pharmacy`: Hush Naidoo — man inside laboratory experiments writing down details.
- `doc1`: Francisco Venâncio — doctor sitting at the table in front of girl (Angola).
- `clinic` and `equipment` remain unchanged because they contain no people.

The third testimonial name was updated from `Dr. Fatima Bello` to `Dr. Chinedu Nwosu` to match the male doctor image now used for `doc3`.

All replacement URLs return HTTP 200 and `npm run build` still passes.
