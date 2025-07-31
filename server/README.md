# AceAI Backend Server

Backend API server for the AceAI coding platform with MongoDB integration.

## Features

- MongoDB database connection
- RESTful API for coding problems
- Problem CRUD operations
- Sample data seeding
- CORS enabled for frontend integration

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Database Setup

The server will automatically connect to MongoDB using the provided connection string.

To seed the database with sample problems:
```bash
node seed/sampleProblems.js
```

## API Endpoints

### Problems

- `GET /api/problems` - Get all problems (without test cases)
- `GET /api/problems/:id` - Get a specific problem (without test cases)
- `GET /api/problems/:id/with-tests` - Get a problem with test cases
- `POST /api/problems` - Create a new problem
- `PUT /api/problems/:id` - Update a problem
- `DELETE /api/problems/:id` - Delete a problem

### Example Usage

```bash
# Get all problems
curl http://localhost:5000/api/problems

# Get specific problem
curl http://localhost:5000/api/problems/two-sum

# Create a new problem
curl -X POST http://localhost:5000/api/problems \
  -H "Content-Type: application/json" \
  -d '{"problem_id": "new-problem", "title": "New Problem", ...}'
```

## Problem Schema

```javascript
{
  problem_id: String (required, unique),
  title: String (required),
  difficulty: String (enum: ['Easy', 'Medium', 'Hard']),
  description: String (required),
  examples: Array (required),
  constraints: Array (required),
  starter_code: Object (required),
  test_cases: Array (required, hidden by default)
}
```

## Environment Variables

The MongoDB connection string is configured in `config/database.js`. For production, consider using environment variables.

## Port

The server runs on port 5000 by default. You can change this by setting the `PORT` environment variable. 