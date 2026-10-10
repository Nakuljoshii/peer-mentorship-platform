# Peer Mentorship Platform API

A backend API for a peer mentorship platform that allows users to register as mentors or mentees, manage mentor profiles, discover mentors, manage availability, and book mentorship appointments.

## Phase 1 — Core Backend & Mentorship Management

Phase 1 focuses on building the core backend functionality required for the peer mentorship platform.

### Phase 1 Features

- User registration and login
- JWT-based authentication
- Role-based authorization
- Mentor profile management
- Mentor discovery and search
- Mentor availability management
- Appointment booking and management
- Appointment conflict prevention
- Swagger/OpenAPI API documentation

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express.js | Web framework |
| TypeScript | Programming language |
| MongoDB | Database |
| Mongoose | MongoDB ODM |
| JWT | Authentication |
| bcrypt | Password hashing |
| Swagger / OpenAPI | API documentation |
| Vitest | Testing |
| Postman | API testing |

## Project Structure

```text
peer_mentoship/
│
├── src/
│   ├── config/
│   │   └── database.ts
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── mentor.controller.ts
│   │   └── appointment.controller.ts
│   │
│   ├── docs/
│   │   └── swagger.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── MentorProfile.ts
│   │   └── Appointment.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── mentor.routes.ts
│   │   └── appointment.routes.ts
│   │
│   ├── types/
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   └── AppError.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   └── jwt.test.ts
│
├── postman/
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
## Phase 2 — Chat, Feedback, Notifications & Dashboards

### REST endpoints

All paths below are prefixed with `/api/v1`. Endpoints marked authenticated require `Authorization: Bearer <accessToken>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/chat/conversations` | List conversations for the signed-in mentor or mentee |
| POST | `/chat/conversations` | Create/retrieve a conversation (`mentorId` for mentees; `menteeId` for mentors; optional `appointmentId`) |
| GET | `/chat/conversations/:conversationId/messages?page=1&limit=20` | Retrieve messages, paginated |
| POST | `/chat/conversations/:conversationId/messages` | Send `{ "content": "..." }` |
| POST | `/feedback` | Mentee reviews a completed session using `{ "appointmentId": "...", "rating": 1-5, "comment": "..." }` |
| GET | `/feedback/mine` | Feedback received by mentors or given by mentees |
| GET | `/feedback/mentors/:mentorId/ratings` | Average rating and total ratings for a mentor |
| GET | `/notifications?page=1&limit=20` | List the signed-in user's notifications |
| PATCH | `/notifications/:id/read` | Mark a notification as read |
| GET | `/dashboard` | Role-specific mentor or mentee dashboard |

Notifications are created for appointment creation, confirmation, cancellation, new messages and feedback received. Conversation, message, feedback and notification documents include timestamps. Feedback can only be submitted by the mentee for a completed appointment, and each appointment can be reviewed once.

### Real-time chat (Socket.IO)

The Socket.IO server runs on the same host/port as the REST API. Connect with the JWT in Socket.IO's `auth` payload:

```js
const socket = io(API_BASE_URL, { auth: { token: accessToken } });
socket.emit('conversation:join', conversationId, console.log);
socket.emit('message:send', { conversationId, content: 'Hello' }, console.log);
socket.on('message:new', (message) => console.log(message));
```

The server checks the JWT and verifies conversation participation before joining rooms or sending messages. Install dependencies with `npm install` after pulling the project, then run `npm run build`, `npm test`, and `npm start`. API docs are available at `/api/docs`; health check is `/api/health`.

### Deployment

`render.yaml` contains the deployment configuration. Set `MONGODB_URI` to your hosted MongoDB connection string and `CORS_ORIGIN` to the frontend origin in the hosting dashboard. Do not commit `.env` or production credentials. The live URL is assigned by the hosting provider after deployment.
