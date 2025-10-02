# Task Manager Backend API

A RESTful API backend for the Task Manager application built with Node.js, Express.js, and MongoDB. This API provides complete CRUD operations for task management with proper error handling and validation.

## 🚀 Features

- **RESTful API**: Complete CRUD operations for task management
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **Data Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Centralized error handling with descriptive messages
- **CORS Support**: Configurable cross-origin resource sharing
- **Environment Configuration**: Flexible environment-based configuration
- **Graceful Shutdown**: Proper cleanup on server termination

## 🛠 Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js        # MongoDB connection configuration
├── middleware/
│   └── errorHandler.js    # Centralized error handling
├── models/
│   └── Task.js           # Task schema and model
├── routes/
│   └── tasks.js          # Task CRUD routes
├── .env                  # Environment variables
├── .gitignore           # Git ignore file
├── package.json         # Dependencies and scripts
├── server.js            # Main server file
└── README.md            # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account or local MongoDB installation

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB connection string and other configurations:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

6. For production:
```bash
npm start
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (placeholder)

## 🔗 API Endpoints

Base URL: `http://localhost:5000/api`

### Health Check
- `GET /health` - Server health status

### Tasks

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/tasks` | Retrieve all tasks | None |
| GET | `/tasks/:id` | Retrieve a specific task | None |
| POST | `/tasks` | Create a new task | `{ title, description?, status? }` |
| PUT | `/tasks/:id` | Update a specific task | `{ title, description?, status? }` |
| DELETE | `/tasks/:id` | Delete a specific task | None |

### Request/Response Examples

#### Create Task
```http
POST /api/tasks
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API documentation",
  "status": "To Do"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API documentation",
  "status": "To Do",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

#### Get All Tasks
```http
GET /api/tasks
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API documentation",
    "status": "In Progress",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:15:00.000Z"
  }
]
```

#### Update Task
```http
PUT /api/tasks/507f1f77bcf86cd799439011
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API documentation",
  "status": "Done"
}
```

#### Delete Task
```http
DELETE /api/tasks/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "message": "Task deleted successfully",
  "deletedTask": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API documentation",
    "status": "Done",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T11:15:00.000Z"
  }
}
```

## 📊 Data Schema

### Task Model

```javascript
{
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
    default: ''
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Done'],
    default: 'To Do'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Field Validation

- **title**: Required, 1-200 characters, trimmed
- **description**: Optional, max 1000 characters, trimmed
- **status**: Must be one of: "To Do", "In Progress", "Done"
- **createdAt**: Automatically set on creation
- **updatedAt**: Automatically updated on modification

## 🚨 Error Handling

The API includes comprehensive error handling for various scenarios:

### Common Error Responses

#### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["Title is required", "Status must be one of: To Do, In Progress, Done"]
}
```

#### Not Found (404)
```json
{
  "success": false,
  "error": "Task not found"
}
```

#### Invalid ID Format (400)
```json
{
  "success": false,
  "error": "Invalid task ID format"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `ALLOWED_ORIGINS` | CORS allowed origins | localhost:3000,localhost:5173 |

### CORS Configuration

The server is configured to accept requests from specified origins. Update `ALLOWED_ORIGINS` in your `.env` file:

```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://yourdomain.com
```

## 🗄️ Database

### MongoDB Setup

1. **MongoDB Atlas** (Recommended for production):
   - Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a cluster
   - Get connection string
   - Add to `.env` file

2. **Local MongoDB**:
   - Install MongoDB locally
   - Start MongoDB service
   - Use connection string: `mongodb://localhost:27017/taskmanager`

### Database Collections

- **tasks**: Stores all task documents

## 🛡️ Security Considerations

- Input validation and sanitization
- MongoDB injection prevention through Mongoose
- CORS configuration for allowed origins
- Environment variable protection
- Error message sanitization in production

## 🚀 Deployment

### Production Environment

1. Set `NODE_ENV=production` in environment variables
2. Use a production MongoDB database
3. Configure proper CORS origins
4. Set up process manager (PM2) for Node.js
5. Configure reverse proxy (Nginx) if needed

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/taskmanager
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com
```

### Deployment Platforms

- **Heroku**: Easy deployment with Git
- **Railway**: Modern deployment platform
- **AWS EC2**: Full control over server environment
- **DigitalOcean**: Simple cloud hosting
- **Vercel**: Serverless deployment

## 📝 API Testing

### Using curl

```bash
# Get all tasks
curl http://localhost:5000/api/tasks

# Create a task
curl -X POST http://localhost:5000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"This is a test","status":"To Do"}'

# Update a task
curl -X PUT http://localhost:5000/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Task","status":"Done"}'

# Delete a task
curl -X DELETE http://localhost:5000/api/tasks/TASK_ID
```

### Using Postman

Import the following collection or create requests manually:

1. **GET** `http://localhost:5000/api/tasks`
2. **POST** `http://localhost:5000/api/tasks` with JSON body
3. **GET** `http://localhost:5000/api/tasks/:id`
4. **PUT** `http://localhost:5000/api/tasks/:id` with JSON body
5. **DELETE** `http://localhost:5000/api/tasks/:id`

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB URI in `.env`
   - Ensure MongoDB cluster is running
   - Verify network access and IP whitelist

2. **CORS Errors**
   - Add frontend URL to `ALLOWED_ORIGINS`
   - Check if frontend and backend ports match configuration

3. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Kill process using the port: `lsof -ti:5000 | xargs kill`

4. **Validation Errors**
   - Check request body format
   - Ensure required fields are provided
   - Verify data types match schema

### Logging

The server logs all requests and errors. Check console output for:
- Request logs: `timestamp - METHOD /path`
- Error logs: Detailed error information
- Database connection status

## 🤝 Contributing

1. Follow existing code style and structure
2. Add proper error handling for new routes
3. Update API documentation for new endpoints
4. Test all CRUD operations thoroughly
5. Ensure MongoDB validation rules are properly implemented

## 📄 License

This project is licensed under the ISC License.

---

**Note**: This backend API is designed to work with the Task Manager frontend. Ensure both applications are running and properly configured for full functionality.
