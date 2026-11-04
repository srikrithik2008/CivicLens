# CivicLens

Build an app that a civic issue reporting web app called "FixMyCity" where citizens report local problems like potholes, broken streetlights, and garbage.

Users (citizens) can:

- Sign up and log in with email

- Submit a report with: title, description, category (pothole, streetlight, garbage, water, other), a photo upload, and location

- View all reports on an interactive map with colored pins by status

- Upvote reports and see how many upvotes each has

- Track the status of their own reports

Admins can:

- See a dashboard of all reports in a table with filters (category, status)

- Change status: Reported → In Progress → Resolved

- Add a comment when updating status

Tech: React, Tailwind, Supabase (auth, Postgres database, storage for photos), Leaflet with OpenStreetMap for the map.

Design: clean, modern, mobile-first, with a green and white color scheme. Include a landing page with a hero section and a "Report an Issue" button.

Start with: landing page, authentication, and the report submission form with photo upload.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/acae6e13-7aa8-487c-96a2-91100b252033).

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
