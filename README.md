# Employee Management System

A full-stack web application for managing employee information, built with React and Node.js.

## Features

- **Employee Management**: Register, update, and retire employees
- **Search & Filter**: Search employees by name, department, position, and status
- **Reports**: Export employee lists to Excel/PDF, organization charts
- **CSV Import**: Bulk import employees via CSV file
- **User Authentication**: JWT-based authentication with role-based access control
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT Authentication
- Express Validator

### Frontend
- React 18
- Material-UI (MUI)
- React Router
- Axios

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd employee-management
```

2. Install backend dependencies
```bash
cd backend
npm install
cp .env.example .env
```

3. Initialize the database
```bash
npm run migrate
npm run seed
```

4. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm start
```

3. Open http://localhost:3000 in your browser

### Demo Credentials
- Admin: `yamada.taro` / `password123`
- Employee: `suzuki.hanako` / `password123`

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middlewares/     # Auth, validation middlewares
│   │   ├── migrations/      # Database migrations and seeds
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Logger and utilities
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts (Auth)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.js           # Main application
│   └── package.json
│
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/password` - Change password

### Employees
- `GET /api/employees` - List employees with search/filter
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee (admin)
- `PUT /api/employees/:id` - Update employee (admin)
- `DELETE /api/employees/:id` - Retire employee (admin)
- `GET /api/employees/me` - Get own info
- `PUT /api/employees/me` - Update own info

### Master Data
- `GET /api/master/departments` - List departments
- `GET /api/master/positions` - List positions
- `GET /api/master/employment-types` - List employment types

### Import
- `GET /api/import/template` - Download CSV template
- `POST /api/import/csv` - Upload CSV for bulk import (admin)

### Reports
- `GET /api/reports/employees/excel` - Export employee list (Excel)
- `GET /api/reports/employees/pdf` - Export employee list (PDF)
- `GET /api/reports/departments/excel` - Export by department (Excel)
- `GET /api/reports/organization/pdf` - Export organization chart (PDF)
- `GET /api/reports/active/excel` - Export active employees (Excel)

## Security Features

- JWT token authentication with expiration
- Password hashing with bcrypt
- Rate limiting for login attempts
- Account lockout after failed attempts
- Role-based access control
- Input validation and sanitization
- CORS protection
- Helmet security headers

## License

MIT
