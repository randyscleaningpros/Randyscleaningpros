RANDY'S CLEANING PROS — TEAM PORTAL
=====================================

WHAT THIS IS
A complete, self-hosted alternative to buying scheduling software.
One page, two logins: Admin and Employee. It now lives inside your
main Randy's Cleaning Pros website folder as "team-portal.html" —
renamed from "index.html" so it doesn't overwrite your site's real
homepage. It uses its own stylesheet, "portal-styles.css" (also
renamed, so it doesn't overwrite your site's styles.css), retinted
to your site's navy/green/gold and Montserrat/Open Sans fonts.

GETTING STARTED
1. Upload team-portal.html, portal-styles.css, app.js, and config.js
   into the same folder as the rest of your website (same folder as
   index.html, styles.css, etc).
2. Visit yoursite.com/team-portal.html. Choose "Admin sign in".
   Default PIN is 1234 — change it right away in Settings > Security.
3. Go to Employees and add your crew. Each person gets a name and
   a PIN they'll use to sign in on their own phone.
4. Add customers, then create jobs and assign them.
5. Employees sign in on their own device at the same address, see
   today's jobs, get turn-by-turn directions, run the job timer,
   take before/after photos, check off the quality checklist, and
   collect a signature — all from their phone.

Tip: since this page isn't linked from your public menu, its web
address only works for people you give it to directly. Bookmark it
on each phone once, or add a discreet link somewhere your crew will
find it (a footer link, a text message, etc).

ADMIN PORTAL
- Dashboard: today's jobs, who's working, revenue, completed count
- Jobs: create, assign, search, filter, print work orders, print
  invoices, record payments, one-click rebook a past customer
- Customers: contact info, gate codes, pets, parking notes, rebook
- Employees: add/remove crew, set pay rate and PIN
- Mileage: every business trip, exportable for tax records
- Payroll: hours and pay by employee for any date range, from
  actual timer data (not guesswork)
- Reports: estimate accuracy and employee performance over time
- Settings: hourly rate, minimum job price, admin PIN

EMPLOYEE PORTAL
- Today's jobs only, in order
- One tap to open GPS directions to the address
- Start/finish timer — this is what powers payroll and reports
- Before and after photos (compressed automatically to keep the
  app fast — no configuration needed)
- Gold Standard Quality Score checklist per job (Kitchen completed,
  Bathrooms completed, Floors inspected, Trash removed, Final
  walkthrough completed) — the job can't be marked finished until
  every item is checked off
- Customer signature capture, right on the phone
- Printable work order
- Their own mileage log

AUTOMATIC PRICING & TIME ESTIMATES
Set your hourly rate and minimum price once in Settings. Every job
form calculates estimated labor time from the rooms and condition
selected, then prices it automatically. As employees complete jobs
with the timer running, the Reports tab tracks how far off each
estimate was — the raw material for sharper future estimates.

LOCAL MODE VS ONLINE DATABASE
The portal works immediately with no setup, storing data in the
browser (local mode). To sync across devices — so an employee's
phone and the office computer see the same jobs — connect a free
Supabase project:
1. Create a Supabase project (or use your existing one).
2. Open the SQL editor and run supabase-schema.sql.
3. Open config.js — your anon/publishable key is already filled
   in. Paste in your Project URL (Project Settings > API).
4. Re-upload config.js to your site.

IMPORTANT SECURITY NOTE
PINs in this version are a simple convenience lock, not bank-grade
security — anyone who guesses a PIN can sign in as that person.
Before storing real customer data online, add Supabase
Authentication and tighten the database policies (see the note
inside supabase-schema.sql).

RELATIONSHIP TO YOUR OLDER TOOLS
This portal replaces the earlier employee-portal-google-maps.html
estimate builder and job-checklist.html print sheet with one
combined system — job creation now includes the estimate math, and
the employee view includes the checklist, photos, and signature
that job-checklist.html covered separately. Those two older files
can stay on the site as a backup for now; nothing about this portal
depends on them.

WHAT'S NEW IN THIS UPDATE
Real, working additions — no outside accounts needed:
- Customer profiles: alarm code, key location, entry instructions,
  favorite cleaner, birthday, referral source, VIP flag, do-not-book
  flag (warns you when booking them), extra properties per customer,
  photo gallery pulled from their past jobs
- Quotes: mark a job as a quote instead of a booking, set an
  expiration date, print it, then one click to approve and convert
  it to a scheduled job
- Recurring plans + pricing templates: tag a customer as weekly/
  biweekly/monthly for an automatic discount; jobs can be priced as
  Residential, Commercial, or Airbnb turnover at different rates
  (set the multipliers in Settings)
- Jobs are now editable — reschedule the date, reassign the
  employee, change the room list, without deleting and recreating
- Double-booking warning if you assign an employee who already has
  a job that date
- Damage reports and reclean requests, logged by the employee on
  the job itself
- Customer satisfaction star rating (1-5) on completed jobs
- Upcoming birthday reminders on the dashboard
- Reports now include income (today / 7 days / 30 days), a rough
  profit-per-job table (price minus labor cost at that employee's
  rate), and employee ranking by jobs completed

WHAT THIS PORTAL STILL DOESN'T DO
Some things need a paid outside service before any code can talk to
them — I can wire these in once you have the account:
- Real payments (Stripe, Square, PayPal, ACH) — needs a merchant
  account; this portal only tracks that a payment happened
- Texting customers or staff (Twilio) — needs a texting account
- Calendar sync (Google/Outlook), QuickBooks export, Mailchimp,
  Zapier — each is its own paid integration
- AI features (estimate assistant, route optimization, voice notes,
  photo quality scoring, coaching) — each needs its own AI service
- Barcode/QR inventory scanning — needs camera-based scanning logic
  plus a real inventory database structure
- True two-factor auth, encryption, and automatic backups — this
  portal's PIN login is a convenience lock, not enterprise security
- Multi-location/franchise management — this is a single-business
  tool as built

ROADMAP — NOT BUILT YET
The dashboard mentions where this is headed: estimate cleaning
time from photos of a house, flag how dirty each room looks,
recommend crew size, and get more accurate over time by learning
from your own completed jobs. That needs an AI model connected to
photo uploads and a larger set of completed-job data than a new
account starts with — a natural next phase once you've logged
enough real jobs through this portal.
