# Gişe Web

Event ticketing and AI-assisted discovery platform — **SOFT3111 Internet and Web Programming, Project #3**, Group 13, Işık University.

| Group member | Student ID |
| --- | --- |
| Deniz Baran | 23COMP1010 |
| Alper Erol | 23COMP1043 |
| Emre Kendirci | 23COMP1008 |

Detailed technical documentation (architecture, database design, screenshots): [`docs/Gise_Web_Project3_Documentation.pdf`](docs/Gise_Web_Project3_Documentation.pdf).

---

## 1. Implemented functionality

The static screens from Project #2 are now a working web application: Razor views rendered by a **C# / ASP.NET Core MVC** backend (same design and navigation as Project #2), a **relational SQLite database**, and **JavaScript** that talks to the backend with `fetch` and JSON.

**Accounts and roles** — registration, sign-in and sign-out with three roles (Attendee, Organizer, Admin); account settings (username with live availability check, e-mail, password with strength meter); light/dark mode.

**Workflows implemented end to end**

| # | Workflow | Steps |
| --- | --- | --- |
| 1 | **Buy tickets** (Attendee) | Search and filter events without page reload → event page → choose ticket tiers → seats are held for 10 minutes (live countdown) → card form (mock payment) → confirmation with one signed QR code per ticket → *Profil → Biletlerim*: show pass, print/PDF, cancel and refund until 48 h before the event |
| 2 | **Manage events** (Organizer) — full CRUD | **Create** an event with ticket tiers and cover image (optional "AI ile yaz" description) → publish or save as draft → **read** it in Keşfet and in *Profil → Etkinliklerim* with sales and revenue → **edit** details, tiers and capacities → **delete** it while no tickets are sold (otherwise unpublish) |
| 3 | **Door check-in** (Organizer) | *Giriş Kontrolü* → choose event → type the ticket code or scan the QR with the camera → green approval or red rejection (already used, cancelled, other event, forged) → live counter |
| 4 | **Moderation** (Admin) | Search/filter users → ban for 7/30 days or permanently (with undo) → banned user is signed out → unpublish or delete events → audit log of critical actions |

The bilingual **Gişe Asistan** (Turkish/English) from Project #2 now answers from live database data.

## 2. Installing and running

**Requirement:** [.NET 10 SDK](https://dotnet.microsoft.com/download) (macOS: `brew install --cask dotnet-sdk`, Windows: installer from the link). Nothing else needs to be installed — SQLite is embedded and NuGet packages are restored automatically.

```bash
cd src/Gise.Web
dotnet run
```

Open **http://localhost:5102**. On the first start the application creates `src/Gise.Web/gise.db`, applies the database migration and inserts the demo data. Data you add is kept in this file and is still there after a restart.

- Open the solution `GiseWeb.slnx` in Visual Studio 2022 (17.13+), JetBrains Rider or VS Code to run it from an IDE.
- **Reset demo data:** stop the app and delete `src/Gise.Web/gise.db`.
- **Run the tests:** `dotnet test` in this folder (31 tests).

### Optional: live demo on Render

The repository contains a `Dockerfile` and a Render Blueprint (`render.yaml`). In the [Render dashboard](https://dashboard.render.com) choose **New → Blueprint**, select this repository and click **Apply**; Render builds the container and publishes it at `https://gise-web.onrender.com` (or a similar address). On the free plan the service sleeps after 15 minutes without visitors (the first request then takes about a minute) and the database is reset to the demo data when it restarts. Running locally as described above is the supported way to evaluate the project.

## 3. Configuration and dependencies

| Setting (`src/Gise.Web/appsettings.json`) | Purpose | Default |
| --- | --- | --- |
| `ConnectionStrings:Gise` | SQLite database file | `Data Source=gise.db` |
| `Gise:TicketSecret` | Key used to sign ticket QR codes (HMAC-SHA256) | development placeholder — change for a real deployment |
| `Gise:Ai:ApiKey` | Optional Anthropic API key for "AI ile yaz" | empty → built-in template is used |
| `Gise:Ai:Model` | Model used when a key is set | `claude-haiku-5-5` |
| `Gise:ShowDemoCodes` | Show sample ticket codes on the check-in page outside development (used on the demo server) | `false` |
| `PORT` (environment variable) | Port to listen on when hosted (set by Render; the Docker image uses 8080) | — |

No secrets are committed. To use a real language model, store the key outside the repository:
`cd src/Gise.Web && dotnet user-secrets init && dotnet user-secrets set "Gise:Ai:ApiKey" "<your key>"`.

| Dependency (NuGet) | Used for |
| --- | --- |
| ASP.NET Core MVC (.NET 10, part of the SDK) | Controllers, Razor views, cookie authentication, anti-forgery |
| Microsoft.EntityFrameworkCore.Sqlite 10.0.15 | Database access and migrations |
| Microsoft.EntityFrameworkCore.Design 10.0.15 | Migration tooling (`dotnet ef`) |
| BCrypt.Net-Next 4.2.0 | Password hashing |
| QRCoder 1.9.0 | QR codes on tickets |
| xUnit, Microsoft.AspNetCore.Mvc.Testing (tests only) | Unit and integration tests |

The frontend uses no external libraries (vanilla JavaScript and CSS).

## 4. Sample data and demo credentials

Demo accounts (fictional people, password for all: `Gise2026!`). The sign-in page also has one-click buttons.

| Role | Login |
| --- | --- |
| Attendee | `elif.kaya@ornek.com` |
| Organizer (Sahne Kolektif) | `mert@sahnekolektif.com` |
| Admin | `zeynep@gise.app` |
| Banned attendee (shows the login refusal) | `can.demir@ornek.com` |

Seed data: 18 users, 14 events (12 upcoming, 2 past), 3 ticket tiers per event, confirmed orders with tickets and audit log entries — see `src/Gise.Web/Data/DbSeeder.cs`. Event dates are relative to the first start, so the catalog is always in the future.

**Test cards** for the mock payment (nothing is charged): `4242 4242 4242 4242` is approved, `4000 0000 0000 0002` is declined. Use any future expiry (e.g. `08/29`) and any 3-digit CVC.

## 5. How the project requirements are met

**Frontend (JavaScript)** — `src/Gise.Web/wwwroot/js/`: one script per page plus `core.js` with shared code (fetch wrapper, form validator, toasts, bottom sheets, theme). Content is rendered from the database or loaded with `fetch`; every action shows success or error feedback, and empty states are shown when there is no data.

**Backend (C# / ASP.NET Core MVC)** — `Controllers/` handle pages and form posts, `Controllers/Api/` return JSON. Business logic lives in `Services/`: `TicketingService` (hold → pay → issue, refunds, check-in), `EventManagementService` (event create/update/delete), `EventQueryService` (catalog search), `CopywriterService` (AI copy). The frontend never decides prices, availability or permissions — the server does.

**Database and SQL** — SQLite through Entity Framework Core. Seven related tables: `Users`, `Events`, `TicketTiers`, `Orders`, `OrderItems`, `Tickets`, `AuditLogs`, with foreign keys, unique indexes (username, e-mail, order and ticket codes) and a check constraint `0 <= Sold <= Capacity`.
- **Scripts to recreate the database:** the EF Core migration in `src/Gise.Web/Data/Migrations/` (applied automatically on start) and the equivalent SQL script [`database/schema.sql`](database/schema.sql) (`sqlite3 gise.db < database/schema.sql`).
- **SQL operations:** everyday reads and writes use EF Core (which generates parameterized SQL); critical operations are written as explicit parameterized SQL, for example the atomic seat reservation `UPDATE TicketTiers SET Sold = Sold + @n WHERE Id = @id AND Sold + @n <= Capacity`, capacity changes during editing, cascading deletes, and the reporting queries with `JOIN … GROUP BY` (organizer sales, check-in counts, admin statistics).
- **CRUD on a principal entity:** events (and their ticket tiers) can be created, read, updated and deleted; tickets are created, read, updated (check-in) and cancelled.

**Asynchronous communication (Fetch API + JSON)**

| Endpoint | Used by |
| --- | --- |
| `GET /api/events?q=&category=&sort=&maxPrice=&from=&to=` | Keşfet search and filters, assistant |
| `GET /api/events/{id}` | Refreshing availability after a conflict |
| `POST /api/orders/hold` · `POST /api/orders/{code}/pay` · `DELETE /api/orders/{code}` | Checkout |
| `POST /api/tickets/{id}/cancel` | Refunds |
| `GET /api/account/username-available` · `PUT /api/account/{username,email,password,preferences}` | Registration, settings |
| `POST /api/organizer/copy` · `POST /api/organizer/events/{id}/status` · `DELETE /api/organizer/events/{id}` | AI copy, publish/unpublish, delete |
| `POST /api/organizer/checkin` · `GET /api/organizer/events/{id}/checkin-stats` | Door check-in |
| `GET /api/admin/users` · `POST /api/admin/users/{id}/ban` · `POST /api/admin/users/{id}/unban` | Admin |

**Validation** — rules are declared once on the view models (`ViewModels/ViewModels.cs`, DataAnnotations and `IValidatableObject`), checked in the browser from the generated `data-val-*` attributes, and always re-checked on the server. Examples: required fields, username pattern and uniqueness, password strength, Luhn card check and expiry, event at least 2 hours ahead, unique tier names, capacity not below tickets sold, cover file type/size/signature. Business rules (sold out, 6 tickets per person, 48-hour refund window, bans, ownership) are enforced in the services and by database constraints.

**Error handling** — business errors become RFC 7807 `application/problem+json` responses (400/401/402/403/404/409/410) or friendly pages; unexpected exceptions are logged and shown as a 500 page with a trace id; 404/403 pages are styled; the client adds a 12-second timeout, shows field errors next to inputs, and recovers from conflicts (refreshes availability, resets an expired hold). The AI copywriter times out after 4 seconds and falls back to a template.

**Security** — bcrypt password hashes, HTTP-only cookies, anti-forgery tokens on every state-changing request, role and ownership checks on the server, signed QR tickets, no card numbers stored, upload checks, parameterized SQL.

**Code organization (MVC)**

```
GiseWeb.slnx
Dockerfile, render.yaml  Container image and Render deployment (optional)
database/schema.sql      SQL script that recreates the database
docs/                    Technical documentation (PDF)
src/Gise.Web/
  Controllers/           MVC controllers (pages, form posts)
  Controllers/Api/       JSON API controllers
  Data/                  DbContext, migrations, seed data
  Models/                Entities
  Services/              Business logic
  ViewModels/            Form/request models with validation
  Views/                 Razor views and partials
  Infrastructure/        Auth cookie events, exception filter
  Helpers/               View helpers (icons, Turkish formatting)
  wwwroot/               css/, js/, img/
tests/Gise.Tests/        xUnit unit and integration tests
```

## 6. Contribution summary

| Member | Implemented |
| --- | --- |
| **Deniz Baran** — backend and database | ASP.NET Core MVC architecture and controllers; JSON API endpoints; services and business rules (ticket hold → payment → issue, refunds, check-in, event create/edit/delete, search, AI copywriter); authentication and role-based authorization; database design, EF Core migrations, SQL queries, seed data; error handling (ProblemDetails, status pages, logging) |
| **Alper Erol** — frontend | Razor views and layout adapted from the Project #2 design; JavaScript interactions (live search and filters, ticket selection and checkout sheet with countdown, event form with live preview and dynamic tiers, profile, settings, admin and check-in screens, camera QR scanning, assistant); fetch-based communication with the API; responsive and dark-mode styling |
| **Emre Kendirci** — testing and checks | Input validation rules on client and server; automated xUnit tests (purchase rules, concurrent overbooking, hold expiry, refunds, check-in, validation, API errors) and end-to-end browser checks of all workflows; bug reporting and verification; documentation and README |

## 7. Project #2 prototype

The static prototype submitted for Project #2 remains available on [GitHub Pages](https://denizbaran-boop.github.io/GiseWeb/). Its files are not needed to run this application.
