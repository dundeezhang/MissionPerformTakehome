# Task Manager Frontend

A modern, responsive task management application built with React and Vite. This frontend provides a clean and intuitive interface for managing tasks with full CRUD operations.

## 🚀 Features

- **Task Management**: Create, read, update, and delete tasks
- **Real-time Updates**: Immediate UI updates after CRUD operations
- **Status Management**: Track tasks with "To Do", "In Progress", and "Done" statuses
- **Filtering & Sorting**: Filter tasks by status and sort by date, title, or status
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Form Validation**: Client-side validation with helpful error messages
- **Loading States**: Visual feedback during API operations
- **Error Handling**: Graceful error handling with user-friendly messages
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🛠 Tech Stack

- **React 19** - Frontend framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client for API calls
- **CSS3** - Styling with custom properties and modern layouts
- **ESLint** - Code linting and formatting

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── TaskForm.jsx     # Form component for adding/editing tasks
│   ├── TaskItem.jsx     # Individual task display component
│   └── TaskList.jsx     # Task list with filtering and sorting
├── services/            # API services
│   └── api.js          # Backend API integration
├── App.jsx             # Main application component
├── App.css             # Application styles
├── index.css           # Global styles
└── main.jsx            # Application entry point
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend server running (see backend README)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔗 Backend Integration

The frontend is designed to work with a RESTful API backend. All API calls are centralized in `src/services/api.js`.

### API Endpoints Used

The application expects the following backend endpoints:

- `GET /api/tasks` - Retrieve all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Retrieve a specific task
- `PUT /api/tasks/:id` - Update a specific task
- `DELETE /api/tasks/:id` - Delete a specific task

### Backend Configuration

Update the `API_BASE_URL` in `src/services/api.js` to match your backend server:

```javascript
const API_BASE_URL = "http://localhost:5000/api";
```

### Data Structure

Tasks are expected to have the following structure:

```javascript
{
  _id: "string",           // Unique identifier
  title: "string",         // Task title (required)
  description: "string",   // Task description (optional)
  status: "string",        // "To Do" | "In Progress" | "Done"
  createdAt: "string",     // ISO date string
  updatedAt: "string"      // ISO date string (optional)
}
```

## 🎨 Styling & Theming

The application uses CSS custom properties for consistent theming:

- **Responsive Design**: Mobile-first approach with breakpoints at 768px and 480px
- **Dark Mode Support**: Automatic detection of user's color scheme preference
- **Color Palette**: Modern blue-based color scheme with semantic color usage
- **Typography**: System font stack for optimal performance and readability

### Key Design Features

- Clean, modern interface with subtle shadows and rounded corners
- Consistent spacing using a 8px grid system
- Smooth transitions and hover effects
- Status-based color coding for tasks
- Loading states with animated spinners

## 🔧 Component Details

### TaskForm Component

Handles creating and editing tasks with:

- Form validation
- Character counting
- Error display
- Loading states during submission

### TaskItem Component

Displays individual tasks with:

- Expandable descriptions
- Quick status updates
- Edit and delete actions
- Formatted timestamps

### TaskList Component

Manages the task collection with:

- Real-time filtering by status
- Sorting by multiple criteria
- Task statistics display
- Empty state handling

## 🚨 Error Handling

The application includes comprehensive error handling:

- **Network Errors**: Displays user-friendly messages for connection issues
- **API Errors**: Shows specific error messages from the backend
- **Form Validation**: Real-time validation with helpful error messages
- **Loading States**: Visual feedback during async operations

## 📱 Responsive Design

The application is fully responsive with:

- **Desktop** (1200px+): Full feature layout with side-by-side components
- **Tablet** (768px-1199px): Stacked layout with optimized spacing
- **Mobile** (320px-767px): Single-column layout with touch-friendly controls

## ♿ Accessibility

The application follows accessibility best practices:

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- High contrast mode support
- Screen reader compatibility
- Focus management

## 🧪 Development

### Code Style

The project uses ESLint with React-specific rules. Run linting with:

```bash
npm run lint
```

### API Integration Notes

All backend API calls are marked with comments in the code:

```javascript
// BACKEND CALL: GET /tasks - Retrieve all tasks
const loadTasks = async () => {
  // ...
};
```

This makes it easy to identify where backend integration occurs.

### Development vs Production

The application includes development-specific features:

- Mock data fallback when backend is unavailable
- Detailed error logging in console
- Development-only API timeout settings

## 🚀 Deployment

### Building for Production

```bash
npm run build
```

This creates a `dist` folder with optimized static files ready for deployment.

### Environment Variables

Create a `.env` file for environment-specific configuration:

```env
VITE_API_BASE_URL=https://your-backend-api.com/api
VITE_APP_TITLE=Task Manager
```

### Deployment Platforms

The built application can be deployed to:

- **Vercel**: Zero-config deployment
- **Netlify**: Drag-and-drop deployment
- **GitHub Pages**: Static site hosting
- **AWS S3**: Static website hosting
- **Any static file server**

## 🤝 Contributing

1. Follow the existing code style
2. Add comments for backend API calls
3. Test responsive design on multiple devices
4. Ensure accessibility compliance
5. Update documentation as needed

## 📝 Task Schema

When the backend is implemented, tasks should follow this schema:

```javascript
{
  title: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    type: String,
    maxLength: 500
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
    type: Date
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Failed**
   - Ensure backend server is running
   - Check API_BASE_URL in `src/services/api.js`
   - Verify CORS settings on backend

2. **Tasks Not Loading**
   - Check browser console for errors
   - Verify backend endpoints are working
   - Check network tab in developer tools

3. **Styling Issues**
   - Clear browser cache
   - Check for CSS conflicts
   - Verify responsive design on different screen sizes

### Getting Help

- Check the browser console for detailed error messages
- Review the Network tab in developer tools for API issues
- Ensure all dependencies are properly installed

---

**Note**: This frontend is designed to work with the backend API. Make sure the backend server is running and accessible before using the application.
