RANDY'S CLEANING PROS — TEAM PORTAL
=====================================

WHAT THIS IS
A complete, self-hosted alternative to buying scheduling software.
One website, two logins: Admin and Employee.

GETTING STARTED
1. Upload all 6 files to your website host, in the same folder.
2. Open the site. Choose "Admin sign in". Default PIN is 1234 —
   change it right away in Settings > Security.
3. Go to Employees and add your crew. Each person gets a name and
   a PIN they'll use to sign in on their own phone.
4. Add customers, then create jobs and assign them.
5. Employees sign in on their own device, see today's jobs, get
   turn-by-turn directions, run the job timer, take before/after
   photos, check off the quality checklist, and collect a
   signature — all from their phone.

ADMIN PORTAL
- Dashboard: today's jobs, who's working, revenue, completed count
- Jobs: create, assign, search, filter, print work orders
- Customers: contact info, gate codes, pets, parking notes
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
- Quality checklist per job
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
1. Create a Supabase project.
2. Open the SQL editor and run supabase-schema.sql.
3. Open config.js and paste your Project URL and public anon key.
4. Re-upload config.js to your site.

IMPORTANT SECURITY NOTE
PINs in this version are a simple convenience lock, not bank-grade
security — anyone who guesses a PIN can sign in as that person.
Before storing real customer data online, add Supabase
Authentication and tighten the database policies (see the note
inside supabase-schema.sql).

ROADMAP — NOT BUILT YET
The dashboard mentions where this is headed: estimate cleaning
time from photos of a house, flag how dirty each room looks,
recommend crew size, and get more accurate over time by learning
from your own completed jobs. That needs an AI model connected to
photo uploads and a larger set of completed-job data than a new
account starts with — a natural next phase once you've logged
enough real jobs through this portal.
