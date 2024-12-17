# Streakus Maximus

## CS546 Project by Manas Acharekar (CWID: 10475301)

Streakus Maximus is a habit tracking application that helps users build lasting habits through the power of streaks and consistent progress tracking. The app features daily, weekly, and monthly habit tracking, detailed analytics, smart reminders, and achievement tracking to keep users motivated on their journey to better habits.

## Setup Instructions

### Prerequisites

- Node.js (v20 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn
- SMTP server access (for email notifications)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# General
NODE_ENV="development"
PORT="3000"
APP_URL="http://localhost:3000"

# Session
SESSION_SECRET="GET OVAAA HEEAAAUGGGHHH"

# Email (SendGrid)
EMAIL_USER="manasspams98@gmail.com"
EMAIL_API_KEY="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"

# Database
MONGODB_URI="mongodb+srv://manasacharekar98:wJUugtCCHfKVjosg@streakusmaximus.nz1jq.mongodb.net/?retryWrites=true&w=majority&appName=StreakusMaximus"
```

### Installation Steps

1. Clone the repository

```bash
git clone https://github.com/maniach1998/streakus-maximus.git
cd streakus-maximus
```

2. Install dependencies

```bash
npm install
```

3. Build Tailwind CSS

```bash
npm run build:css
```

4. Start the application

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

### Available Scripts

- `npm start`: Starts the application in production mode
- `npm run dev`: Starts the application in development mode with nodemon
- `npm run build:css`: Builds Tailwind CSS for production

## Routes Documentation

### Authentication Routes

```
GET  /auth/login         - Renders login page
POST /auth/login         - Handles login submission
GET  /auth/register      - Renders registration page
POST /auth/register      - Handles registration submission
GET  /auth/logout        - Handles user logout
GET  /auth/verify/:token - Handles email verification
```

### Dashboard Routes

```
GET /dashboard           - Renders dashboard with top habits and streaks
```

### Habit Routes

```
GET    /habits              - Renders all habits page (active and inactive)
GET    /habits/new          - Renders create new habit form
POST   /habits/new          - Creates a new habit
GET    /habits/:id          - Renders single habit details
GET    /habits/:id/edit     - Renders edit habit form
PUT    /habits/:id/edit     - Updates habit details
GET    /habits/:id/stats    - Renders habit statistics
GET    /habits/:id/streaks  - Renders habit streak history
```

### Profile Routes

```
GET  /profile            - Renders user profile
GET  /settings          - Renders user settings
PUT  /settings          - Updates user settings
```

### API Routes

```
POST   /api/habits/:id/complete    - Marks a habit as complete
POST   /api/habits/:id/deactivate  - Deactivates a habit
POST   /api/habits/:id/reactivate  - Reactivates a habit
POST   /api/settings/verify/resend - Resends verification email
```

### API Response Format

All API routes return JSON responses in the following format:

```json
{
  "success": boolean,
  "message": "Status message",
  "data": {
    // Response data object
  }
}
```

### Error Handling

- All routes include error handling
- API routes return appropriate HTTP status codes
- Form submissions include validation
- Authentication is required for protected routes

### Additional Features

- Email verification system
- Reminder scheduling system
- Streak calculation system
- Progress tracking
- Analytics generation

## A few example accounts

```
email: manas.acharekar98@gmail.com
password: Manas@1998

email: acharekar.manas11@gmail.com
password: Manas@1998
```

NOTE: THERE IS NO SEED FILE, USING MONGODB ATLAS
