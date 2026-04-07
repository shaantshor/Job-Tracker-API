# Job Tracker API

A RESTful API for tracking job applications, built with Node.js, Express, and PostgreSQL. Track applications, contacts, timeline events, and get stats on your job search progress.

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Jest](https://img.shields.io/badge/Tests-Jest-C21325?logo=jest&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- **Authentication** — Register, login, JWT-protected routes
- **Applications CRUD** — Create, read, update, delete job applications
- **Status Tracking** — 8 statuses: wishlist, applied, screening, interviewing, offer, accepted, rejected, withdrawn
- **Auto Timeline** — Status changes automatically logged as timeline events
- **Contacts** — Link recruiter/hiring manager contacts to applications
- **Search & Filter** — Search by company/role, filter by status, sort by any field
- **Pagination** — Configurable page size with metadata
- **Stats Dashboard** — Total apps, weekly count, response rate, status breakdown
- **Security** — Helmet, CORS, rate limiting, bcrypt password hashing

## Quick Start

### With Docker Compose (recommended)

```bash
git clone https://github.com/shaantshor/job-tracker-api.git
cd job-tracker-api
docker compose up -d
```

The API will be available at `http://localhost:3000`.

### Manual Setup

```bash
# Clone and install
git clone https://github.com/shaantshor/job-tracker-api.git
cd job-tracker-api
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start PostgreSQL and create the database
createdb job_tracker

# Run migrations and seed data
npm run migrate
npm run seed

# Start the server
npm run dev
```

## API Documentation

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Applications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/applications` | List applications (paginated, filterable) | Yes |
| GET | `/api/applications/:id` | Get single application with contacts & timeline | Yes |
| POST | `/api/applications` | Create a new application | Yes |
| PUT | `/api/applications/:id` | Update an application | Yes |
| DELETE | `/api/applications/:id` | Delete an application | Yes |
| GET | `/api/applications/stats/overview` | Get application statistics | Yes |

### Contacts

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/applications/:id/contacts` | Add a contact to an application | Yes |
| PUT | `/api/contacts/:id` | Update a contact | Yes |
| DELETE | `/api/contacts/:id` | Delete a contact | Yes |

### Timeline

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/applications/:id/timeline` | Add a timeline event | Yes |

### Example Requests

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "Jane Doe"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

**Create Application:**
```bash
curl -X POST http://localhost:3000/api/applications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "company": "Google",
    "role": "Backend Engineer",
    "status": "applied",
    "location": "London",
    "remote_type": "hybrid",
    "salary_min": 65000,
    "salary_max": 85000,
    "visa_sponsorship": true,
    "priority": "high"
  }'
```

**List Applications (with filters):**
```bash
curl "http://localhost:3000/api/applications?status=applied&search=Google&sort=created_at&order=desc&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Update Status:**
```bash
curl -X PUT http://localhost:3000/api/applications/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"status": "interviewing"}'
```

**Get Stats:**
```bash
curl http://localhost:3000/api/applications/stats/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Query Parameters for GET /api/applications

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | — | Filter by status |
| `search` | string | — | Search company or role (case-insensitive) |
| `sort` | string | `created_at` | Sort field: created_at, updated_at, company, role, status, applied_date, priority |
| `order` | string | `desc` | Sort order: asc, desc |
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |

## Database Schema

```
users
├── id (PK)
├── email (UNIQUE)
├── password_hash
├── name
└── created_at

applications
├── id (PK)
├── user_id (FK → users)
├── company
├── role
├── url
├── status (CHECK: wishlist|applied|screening|interviewing|offer|accepted|rejected|withdrawn)
├── salary_min
├── salary_max
├── currency (default: GBP)
├── location
├── remote_type (CHECK: onsite|hybrid|remote)
├── visa_sponsorship
├── notes
├── applied_date
├── response_date
├── priority (CHECK: low|medium|high)
├── created_at
└── updated_at

contacts
├── id (PK)
├── application_id (FK → applications, CASCADE)
├── name
├── role
├── email
├── linkedin_url
├── notes
└── created_at

timeline_events
├── id (PK)
├── application_id (FK → applications, CASCADE)
├── event_type
├── description
└── event_date
```

## Architecture Decisions

### Why PostgreSQL over MongoDB

Job application data is inherently relational — applications belong to users, contacts belong to applications, timeline events reference applications. PostgreSQL's foreign keys with `ON DELETE CASCADE` ensure referential integrity. The `CHECK` constraints on status, remote_type, and priority enforce valid values at the database level, not just the application level.

### Why JWT Authentication

JWTs are stateless — no server-side session storage needed. The token contains the user ID and email, so every authenticated request is self-contained. This makes the API horizontally scalable without shared session stores.

### Why Raw SQL over an ORM

Raw SQL with parameterised queries (via `pg`) gives full control over query construction, particularly for the dynamic filtering and sorting in the list endpoint. There's no ORM abstraction layer to debug or work around. The queries are readable, performant, and the `$1, $2` parameterisation prevents SQL injection.

### Why CHECK Constraints

Database-level `CHECK` constraints on `status`, `remote_type`, and `priority` columns act as a last line of defence. Even if validation middleware is bypassed or a new endpoint is added without validation, the database rejects invalid values. Defence in depth.

## Project Structure

```
job-tracker-api/
├── src/
│   ├── index.js                 # Express app setup, middleware, routes
│   ├── config/
│   │   └── db.js                # PostgreSQL connection pool
│   ├── controllers/
│   │   ├── auth.controller.js   # Register, login, me
│   │   ├── applications.controller.js  # CRUD + stats
│   │   ├── contacts.controller.js      # Contact CRUD
│   │   └── timeline.controller.js      # Timeline events
│   ├── db/
│   │   ├── migrate.js           # Schema migration
│   │   └── seed.js              # Demo data (18 UK applications)
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── errorHandler.js      # Global error handler
│   │   └── validate.js          # Express-validator middleware
│   └── routes/
│       ├── auth.routes.js
│       ├── applications.routes.js
│       └── contacts.routes.js
├── tests/
│   ├── setup.js                 # Test DB setup, migration, cleanup
│   ├── auth.test.js             # Auth endpoint tests
│   └── applications.test.js     # Application endpoint tests
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .eslintrc.json
├── package.json
└── LICENSE
```

## Running Tests

Tests use a separate `job_tracker_test` database to avoid affecting development data.

```bash
# Create the test database
createdb job_tracker_test

# Run tests
npm test

# Run with coverage
npx jest --coverage --runInBand --forceExit --detectOpenHandles
```

## License

[MIT](LICENSE)
