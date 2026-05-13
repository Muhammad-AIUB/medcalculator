# MedCalc Pro - Enterprise Clinical Calculator Platform

A full-stack platform for evidence-based clinical calculators used by healthcare professionals.
Built with Next.js, NestJS, Prisma, PostgreSQL, and optional Redis caching.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS |
| Backend | NestJS 10, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Cache | Redis, optional |
| Auth | JWT |
| Testing | Jest, Playwright |

## Quick Start

Prerequisites:

- Node.js 20+
- npm
- PostgreSQL connection string, local or hosted
- Redis, optional

Create your environment file:

```powershell
copy .env.example .env
```

Edit `.env` and set at least:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

Install dependencies:

```powershell
cd E:\medical-calculator-platform\backend
npm install

cd E:\medical-calculator-platform\frontend
npm install
```

Start the backend in one terminal:

```powershell
cd E:\medical-calculator-platform\backend
npm run start:dev
```

Start the frontend in another terminal:

```powershell
cd E:\medical-calculator-platform\frontend
npm run dev
```

Open:

```text
Frontend: http://localhost:5001
Backend API: http://localhost:5000/api/v1
API docs: http://localhost:5000/api/docs
Health check: http://localhost:5000/api/v1/health
```

## Environment

| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Runtime PostgreSQL connection string | `postgresql://user:pass@localhost:5432/medical_calculator` |
| `DIRECT_URL` | Direct PostgreSQL URL for Prisma migrations | `postgresql://user:pass@localhost:5432/medical_calculator` |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | Backend port | `5000` |
| `JWT_SECRET` | JWT signing secret | `your-secret` |
| `JWT_EXPIRES_IN` | Token lifetime | `7d` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5001` |
| `NEXT_PUBLIC_API_URL` | Browser-visible backend API URL | `http://localhost:5000/api` |
| `NEXT_PUBLIC_APP_URL` | Frontend app URL | `http://localhost:5001` |
| `REDIS_URL` | Optional Redis URL | `redis://localhost:6379` |

Never commit `.env`.

## Development

Backend:

```powershell
cd backend
npm run start:dev
```

Frontend:

```powershell
cd frontend
npm run dev
```

Run tests:

```powershell
cd backend
npm test
```

Run Prisma commands:

```powershell
cd backend
npx prisma generate
npx prisma db push
npx prisma migrate dev
npx prisma studio
```

## API Documentation

Swagger UI:

```text
http://localhost:5000/api/docs
```

OpenAPI JSON:

```text
http://localhost:5000/api/docs-json
```

## Available Calculators

| Calculator | Category | Reference |
|---|---|---|
| BMI | General | WHO 2000 |
| eGFR | Nephrology | CKD-EPI 2021 |
| Child-Pugh | Hepatology | Child & Turcotte 1964 |
| MELD-Na | Hepatology | Kamath et al. 2001 |
| EDD | Obstetrics | Standard obstetric dating |
| SOFA | Critical Care | Vincent et al. 1996 |
| TSAT | Hematology | Standard iron studies |
| Vasopressor Intensity | Critical Care | VIS scoring |

## Project Structure

```text
backend/   NestJS API, Prisma schema, calculator engines
frontend/  Next.js app
```

## License

MIT
