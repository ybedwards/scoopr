# Scoopr

An Uber-style marketplace for pet waste removal, launching in Philadelphia and its suburbs.
Customers book yard cleanups; independent scoopers sign up, get approved, and take the jobs.

| Folder | What it is |
| --- | --- |
| `apps/mobile` | Customer and scooper app for iPhone, Android and web (Expo / React Native) |
| `apps/admin` | Admin website for approving scoopers, setting prices and service area (Next.js) |
| `packages/shared` | Pricing rules, launch ZIP codes and database types used by both apps |
| `supabase` | Database schema, security rules and starter data |

## What works today (phase 1)

- Sign in with an emailed code, choosing "get my yard cleaned" or "work as a scooper".
- Customers add their yard (address, dogs, yard size, gate notes) and see live prices for
  twice weekly, weekly, every 2 weeks and one-time service. Addresses outside open ZIP codes are refused.
- Scoopers apply with their days, visits per day, tools, transport and ZIP codes, and see their status.
- Admins approve, reject or deactivate scoopers, edit every price and the commission, and open or
  close ZIP codes.

Booking, job matching, visits with photos and payments are phases 2 and 3.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run `supabase/migrations/20261008000000_init.sql`, then `supabase/seed.sql`.
3. In Authentication > Email Templates, make the "Magic Link" template show the code by including
   `{{ .Token }}`. The apps sign in with that 6-digit code.
4. Copy `apps/mobile/.env.example` to `apps/mobile/.env` and `apps/admin/.env.example` to
   `apps/admin/.env.local`, and fill in the project URL and publishable key (Settings > API).
5. Install and run:

   ```sh
   npm install
   npm run mobile   # Expo dev server; scan the QR code with Expo Go
   npm run admin    # admin site on http://localhost:3000
   ```

6. Make yourself an admin: sign in once in the app, then run this in the SQL editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

## Checks

```sh
npm test            # pricing and service area tests
npm run typecheck   # all packages
```

## Notes

- Prices are stored in cents. Default launch prices live in `packages/shared/src/pricing.ts`; after
  setup, change them on the admin Pricing page. If you edit the defaults or the ZIP list, regenerate
  `supabase/seed.sql` to match.
- Security is enforced in the database: users can only see their own data, scoopers cannot approve
  themselves, and only admins can change prices, the service area or admin roles.
