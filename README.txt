Tahzeeb Hall - Management Website (demo v4)
Open index.html in a modern browser. No install or server needed.

Demo sign-ins
  Owner:   owner / Owner@2026
  Manager: kamran.yousaf / Manager@2026  (also sadia.rehman; jawad.ahmed is inactive)

Owner menu:   Calendar, Bookings, Managers
Manager menu: Calendar, Bookings (Bookings only if the Owner allows it)

Structure
  index.html       page shell
  css/styles.css   design system + slot calendar (mobile first)
  css/auth.css     login, manager management, modals
  js/auth.js       authentication, sessions, roles, audit log (swap for a real API later)
  js/app.js        calendar, bookings, holds, noise checks
  js/admin.js      Owner-only Managers module

Demo notes: data lives in memory/browser localStorage. Passwords are salted PBKDF2 hashes;
real security requires a server-side backend.
