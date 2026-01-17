# Americas College Football Rankings (ACFBR)

An independent college football ranking system where Americas football pundits (podcasters, analysts, experts) cast votes each week based on their opinions, observations, and experience. Completely independent of ESPN and the college playoff committee.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Mobile**: React Native (to be implemented)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Containerization**: Docker & Docker Compose
- **Authentication**: JWT tokens
- **Drag & Drop**: @dnd-kit

## Features

- User registration and authentication
- Weekly ballot casting with drag-and-drop ranking interface
- Public rankings page showing aggregated top 25 teams
- Team data synced from TheSportsDB API
- Mobile-first responsive design

## Getting Started

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Setup

1. **Clone the repository** (if not already done)

2. **Start the Docker containers**:
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL database on port 5432
   - Next.js application on port 3000

3. **Run database migrations**:
   ```bash
   docker-compose exec app npm run db:migrate
   ```

4. **Sync teams from TheSportsDB API**:
   ```bash
   docker-compose exec app npm run db:sync-teams
   ```

5. **Access the application**:
   - Web app: http://localhost:3000
   - Database: localhost:5432 (postgres/postgres)

### Local Development (without Docker)

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/acfbr
   JWT_SECRET=your-secret-key-change-in-production
   SPORTSDB_API_KEY=428457
   ```

3. **Start PostgreSQL** (if not using Docker):
   ```bash
   # Using Docker for just the database
   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=acfbr postgres:15-alpine
   ```

4. **Run migrations**:
   ```bash
   npm run db:migrate
   ```

5. **Sync teams**:
   ```bash
   npm run db:sync-teams
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

## Project Structure

```
acfbr/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── ballot/        # Ballot submission
│   │   ├── rankings/      # Public rankings
│   │   └── teams/         # Team data
│   ├── ballot/            # Ballot casting page
│   ├── rankings/          # Public rankings page
│   ├── register/          # Registration page
│   ├── signin/            # Sign in page
│   └── page.tsx           # Landing page
├── lib/                    # Utility libraries
│   ├── auth.ts            # Authentication helpers
│   ├── db.ts              # Database connection
│   ├── db-schema.sql      # Database schema
│   └── api-clients.ts     # External API clients
├── scripts/                # Utility scripts
│   ├── migrate.js         # Database migration
│   └── sync-teams.js      # Team data sync
├── docker-compose.yml      # Docker Compose configuration
├── Dockerfile             # Docker image definition
└── package.json           # Dependencies and scripts
```

## Pages

1. **Landing Page** (`/`): Description and purpose with signin/registration links
2. **Registration Page** (`/register`): User registration form
3. **Sign In Page** (`/signin`): User authentication
4. **Ballot Page** (`/ballot`): Drag-and-drop ranking interface (requires authentication)
5. **Rankings Page** (`/rankings`): Public display of top 25 aggregated rankings

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signout` - User sign out
- `GET /api/teams` - Get all teams (requires authentication)
- `POST /api/ballot` - Submit ballot (requires authentication)
- `GET /api/rankings` - Get aggregated rankings (public)

## Database Schema

- **users**: User accounts
- **teams**: College football teams
- **ballots**: User ballots per week
- **ballot_rankings**: Individual team rankings within ballots

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `SPORTSDB_API_KEY`: TheSportsDB API key (default: 428457)

## Future Enhancements

- React Native mobile app
- Week/season management system
- Historical rankings view
- User profile pages
- Email notifications
- Admin dashboard

## License

Private project - All rights reserved
