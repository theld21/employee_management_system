# Company Management API

This is a RESTful API for a company management system with attendance tracking and hierarchical user management.

## Features

- User Authentication (Register/Login)
- Hierarchical User Management (Level 1, 2, and 3)
- Group Management
- Attendance Tracking (Check-in/Check-out)
- Attendance Request Management with Approval Workflow

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication

## Project Structure

```
server/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middlewares/    # Custom middleware
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   └── index.js        # Application entry point
├── .env                # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Project dependencies
└── README.md           # Project documentation
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables in `.env` file
4. Start the server:
   ```
   npm start
   ```
   For development:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user info

### Attendance

- `POST /api/attendance/check-in` - Check in
- `POST /api/attendance/check-out` - Check out
- `GET /api/attendance/my` - Get user's attendance records
- `GET /api/attendance/today` - Get today's attendance
- `GET /api/attendance/team` - Get team attendance (for managers)

### Attendance Requests

- `POST /api/requests` - Create a new attendance change request
- `GET /api/requests/my` - Get user's requests
- `GET /api/requests/pending` - Get pending requests (for managers)
- `PUT /api/requests/level2/:requestId` - Process request at level 2
- `PUT /api/requests/level1/:requestId` - Process request at level 1

### Groups

- `POST /api/groups` - Create a new group
- `GET /api/groups` - Get all groups
- `GET /api/groups/:groupId` - Get a specific group
- `PUT /api/groups/:groupId` - Update a group
- `POST /api/groups/:groupId/members` - Add member to group
- `DELETE /api/groups/:groupId/members/:userId` - Remove member from group

## Hierarchical Structure

The system uses a 3-level hierarchical structure:

1. Level 1 (Top Management)
   - Can manage Level 2 groups
   - Has final approval for attendance requests

2. Level 2 (Middle Management)
   - Managed by Level 1
   - Can manage Level 3 groups
   - First approval stage for attendance requests

3. Level 3 (Employee)
   - Managed by Level 2
   - Can submit attendance requests

## Request Approval Flow

1. Employee (Level 3) submits a request
2. Manager (Level 2) reviews and approves/rejects
3. If approved by Level 2, the request goes to Level 1
4. Level 1 makes the final decision

## MongoDB Models

- User
- Group
- Attendance
- AttendanceRequest 