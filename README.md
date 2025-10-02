# Task Manager Application

## 🚀 Project Development Overview

### Development Process
This full-stack task management application was developed using an iterative approach, starting with a solid backend foundation and progressively enhancing the frontend experience. The development followed modern best practices including component-driven architecture, separation of concerns, and responsive design principles.

### Key Technical Decisions
- **Architecture Choice**: Opted for a traditional REST API architecture with React frontend and Node.js/Express backend for simplicity and maintainability
- **Database Selection**: Chose MongoDB for flexible schema design and seamless JavaScript integration via Mongoose ODM
- **State Management**: Implemented custom React hooks pattern to centralize task operations and improve code reusability
- **Styling Approach**: Used vanilla CSS with CSS custom properties for better performance and easier theming
- **API Design**: Followed RESTful conventions with proper HTTP status codes and error handling

### Development Challenges & Solutions
1. **Status Update Validation Issues**: Encountered 400 errors when updating task status due to backend requiring all fields. Resolved by modifying the frontend to send complete task data during status updates.

2. **Code Organization**: Initial implementation had all task functions in the main App component. Refactored to use custom hooks (`useTaskFunctions`) for better separation of concerns and reusability.

3. **Real-time UI Updates**: Needed to ensure UI immediately reflected changes without requiring page refresh. Implemented optimistic updates with proper error rollback mechanisms.

4. **Cross-Origin Resource Sharing**: Configured CORS middleware to handle frontend-backend communication during development while maintaining security for production.

5. **Responsive Design**: Balanced functionality across devices by implementing mobile-first CSS approach with strategic breakpoints and touch-friendly interactions.

---

A full-stack task management application built with React, Node.js, Express.js, and MongoDB. This application provides a complete CRUD interface for managing tasks with real-time updates and a responsive design.

## 🚀 Features

### Frontend (React)
- **Single Page Application**: Built with React 19 and Vite
- **Task Management**: Create, read, update, and delete tasks
- **Real-time Updates**: Immediate UI updates after CRUD operations
- **Status Management**: Track tasks with "To Do", "In Progress", and "Done" statuses
- **Filtering & Sorting**: Filter by status and sort by date, title, or status
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Form Validation**: Client-side validation with helpful error messages
- **Loading States**: Visual feedback during API operations
- **Error Handling**: Graceful error handling with user-friendly messages

### Backend (Node.js/Express)
- **RESTful API**: Complete CRUD operations with proper HTTP methods
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **Data Validation**: Server-side validation and sanitization
- **Error Handling**: Centralized error handling with descriptive messages
- **CORS Support**: Configurable cross-origin resource sharing
- **Environment Configuration**: Flexible environment-based setup

## 🛠 Tech Stack

### Frontend
- **React 19** - Frontend framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls
- **CSS3** - Modern styling with custom properties
- **ESLint** - Code linting

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## 📁 Project Structure

```
MissionPerformTakehome/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── TaskForm.jsx  # Form for adding/editing tasks
│   │   │   ├── TaskItem.jsx  # Individual task display
│   │   │   └── TaskList.jsx  # Task list with filtering/sorting
│   │   ├── services/         # API services
│   │   │   └── api.js        # Backend API integration
│   │   ├── App.jsx           # Main application component
│   │   ├── App.css           # Application styles
│   │   └── main.jsx          # Application entry point
│   ├── package.json          # Frontend dependencies
│   └── README.md             # Frontend documentation
├── backend/                  # Node.js/Express backend
│   ├── config/
│   │   └── database.js       # MongoDB connection
│   ├── middleware/
│   │   └── errorHandler.js   # Error handling middleware
│   ├── models/
│   │   └── Task.js           # Task schema and model
│   ├── routes/
│   │   └── tasks.js          # Task CRUD routes
│   ├── .env                  # Environment variables
│   ├── server.js             # Main server file
│   ├── package.json          # Backend dependencies
│   └── README.md             # Backend documentation
└── README.md                 # This file
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account or local MongoDB installation

### Quick Start

1. **Clone the repository:**
```bash
git clone <repository-url>
cd MissionPerformTakehome
```

2. **Set up the backend:**
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB connection string
npm run dev
```

3. **Set up the frontend:**
```bash
cd ../frontend
npm install
npm run dev
```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001
   - API Documentation: http://localhost:5001

### Detailed Setup

#### Backend Setup

1. Navigate to backend directory:
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

4. Update `.env` with your configuration:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
PORT=5001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

5. Start the development server:
```bash
npm run dev
```

#### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Update API configuration if needed in `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:5001/api';
```

4. Start the development server:
```bash
npm run dev
```

## 🔗 API Endpoints

Base URL: `http://localhost:5001/api`

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/health` | Server health check | None |
| GET | `/tasks` | Retrieve all tasks | None |
| GET | `/tasks/:id` | Retrieve a specific task | None |
| POST | `/tasks` | Create a new task | `{ title, description?, status? }` |
| PUT | `/tasks/:id` | Update a specific task | `{ title, description?, status? }` |
| DELETE | `/tasks/:id` | Delete a specific task | None |

### Task Schema

```javascript
{
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
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

## 🎨 Frontend Features

### Components

- **TaskForm**: Form component for creating and editing tasks
  - Input validation
  - Character counting
  - Error display
  - Loading states

- **TaskItem**: Individual task display component
  - Expandable descriptions
  - Quick status updates
  - Edit and delete actions
  - Formatted timestamps

- **TaskList**: Task collection management
  - Real-time filtering by status
  - Sorting by multiple criteria
  - Task statistics display
  - Empty state handling

### State Management

- Uses React Hooks (useState, useEffect) for state management
- Real-time UI updates after API operations
- Optimistic updates for better user experience
- Error state management with user feedback

### Responsive Design

- Mobile-first approach
- Breakpoints at 768px and 480px
- Touch-friendly interface on mobile
- Optimized layouts for different screen sizes

## 🚨 Error Handling

### Frontend
- Network error handling with retry options
- Form validation with real-time feedback
- Loading states during async operations
- User-friendly error messages

### Backend
- Centralized error handling middleware
- Input validation and sanitization
- MongoDB error handling
- Detailed error logging

## 🧪 Testing the API

You can test the API endpoints using curl, Postman, or the included test script:

```bash
cd backend
node test-api.js
```

### Example API Calls

```bash
# Get all tasks
curl http://localhost:5001/api/tasks

# Create a task
curl -X POST http://localhost:5001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","description":"This is a test","status":"To Do"}'

# Update a task
curl -X PUT http://localhost:5001/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Task","status":"Done"}'

# Delete a task
curl -X DELETE http://localhost:5001/api/tasks/TASK_ID
```

## 🚀 Deployment

### Backend Deployment

1. Set production environment variables:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://prod-user:password@prod-cluster.mongodb.net/taskmanager
PORT=5000
ALLOWED_ORIGINS=https://yourdomain.com
```

2. Deploy to platforms like:
   - Heroku
   - Railway
   - AWS EC2
   - DigitalOcean
   - Vercel (serverless)

### Frontend Deployment

1. Build for production:
```bash
npm run build
```

2. Deploy to platforms like:
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3
   - Any static file server

## 🔧 Development

### Available Scripts

#### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

#### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=5001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend (optional .env)
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check MongoDB URI in backend `.env`
   - Ensure MongoDB cluster is running
   - Verify network access and IP whitelist

2. **CORS Errors**
   - Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`
   - Ensure ports match between frontend and backend

3. **Port Already in Use**
   - Change `PORT` in backend `.env`
   - Kill process: `lsof -ti:PORT | xargs kill`

4. **Frontend Not Loading Tasks**
   - Check if backend server is running
   - Verify API_BASE_URL in `frontend/src/services/api.js`
   - Check browser console for errors

## 📋 Requirements Checklist

### Backend ✅
- [x] Node.js with Express.js
- [x] MongoDB integration with Mongoose
- [x] RESTful API endpoints:
  - [x] POST /tasks - Create a new task
  - [x] GET /tasks - Retrieve all tasks
  - [x] GET /tasks/:id - Retrieve a task by ID
  - [x] PUT /tasks/:id - Update a task by ID
  - [x] DELETE /tasks/:id - Delete a task by ID
- [x] Task schema with title, description, status, createdAt
- [x] Basic error handling
- [x] Environment variables for configuration

### Frontend ✅
- [x] React single-page application
- [x] Form to add new tasks
- [x] Task list displaying all task details
- [x] Edit and delete buttons for each task
- [x] Status update functionality (dropdown)
- [x] React Hooks for state and API calls
- [x] Responsive design with modern styling
- [x] Real-time UI updates after CRUD operations

### Integration ✅
- [x] Frontend connected to backend via Axios
- [x] Real-time updates to UI after operations
- [x] Proper error handling and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For questions or issues:
1. Check the troubleshooting section
2. Review the individual README files in frontend/ and backend/
3. Check the browser console for frontend issues
4. Check server logs for backend issues

---

**Built with ❤️ for efficient task management**
