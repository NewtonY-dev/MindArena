# MindArena Backend API

Educational Learning Platform Backend API built with Node.js, Express, and MySQL.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MindArena/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Set up the database**
   ```bash
   # Create the database
   npm run db:create
   
   # Initialize tables and seed data
   npm run db:init
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 Database Management

The project includes a comprehensive database management tool:

### Available Commands

```bash
# Create database (MySQL only)
npm run db:create

# Initialize database with tables and seed data
npm run db:init

# Check database health and connection
npm run db:health

# Reset database (development only)
npm run db:reset

# Show database configuration
npm run db:info
```

### Database Operations

- **Create Database**: Creates the MySQL database with proper charset and collation
- **Initialize**: Creates all tables and seeds initial data (grade levels, subjects, sample questions)
- **Health Check**: Tests database connection and verifies setup
- **Reset**: Drops and recreates all tables (development only)
- **Info**: Shows current database configuration

## 🛠️ Development

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mindarena
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_at_least_32_characters_long
JWT_EXPIRE=7d

# Security Configuration
BCRYPT_ROUNDS=12
CORS_ORIGIN=*
```

### Database Schema

The database includes the following tables:

- **users** - User accounts and profiles
- **grade_levels** - Educational grade levels (Grade 1-12)
- **subjects** - School subjects (Math, Science, etc.)
- **questions** - Practice questions with answers
- **attempts** - User answer attempts and results
- **user_subjects** - Many-to-many relationship between users and subjects

### API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### User Management
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me/profile` - Setup user profile
- `GET /api/users/me/stats` - Get dashboard statistics

#### Practice
- `GET /api/practice/questions` - Get practice questions

#### Attempts
- `POST /api/attempts` - Submit answer

#### Leaderboard
- `GET /api/leaderboard` - Get class leaderboard

#### Content Management
- `GET /api/grade-levels` - Get all grade levels
- `GET /api/subjects` - Get all subjects
- `GET /api/questions` - Get questions

#### Admin
- `GET /api/admin/users/top` - Get top users
- `GET /api/admin/users/search` - Search users

### API Documentation

Visit `http://localhost:5000/api/docs` for interactive API documentation.

## 🔧 Features

### Security
- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Security headers (Helmet)

### Performance
- Database connection pooling
- Response compression
- Efficient query optimization
- Proper indexing

### Error Handling
- Global error handler
- Custom error classes
- Environment-specific error responses
- Comprehensive logging

### Development Tools
- Database management CLI
- Environment validation
- Graceful shutdown
- Health checks

## 📝 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration and database setup
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── app.js           # Express app setup
├── scripts/             # Utility scripts
├── .env.example         # Environment template
├── package.json         # Dependencies and scripts
└── server.js            # Server entry point
```

## 🚀 Deployment

### Production Setup

1. **Set production environment**
   ```env
   NODE_ENV=production
   ```

2. **Use strong secrets**
   ```env
   JWT_SECRET=your_very_strong_production_secret_at_least_32_chars
   ```

3. **Configure database**
   ```env
   DB_HOST=your_production_db_host
   DB_USER=your_production_db_user
   DB_PASSWORD=your_production_db_password
   ```

4. **Install and start**
   ```bash
   npm install --production
   npm run db:init
   npm start
   ```

### Security Considerations

- Use strong JWT secrets (32+ characters)
- Enable HTTPS in production
- Configure proper CORS origins
- Use environment variables for secrets
- Regular database backups
- Monitor logs for suspicious activity

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Database health check
npm run db:health
```

## 📚 API Usage Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "displayName": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Questions
```bash
curl -X GET http://localhost:5000/api/practice/questions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MySQL is running
   - Verify database credentials in .env
   - Ensure database exists: `npm run db:create`

2. **JWT Secret Error**
   - Set a strong JWT_SECRET in .env (32+ characters)

3. **Port Already in Use**
   - Change PORT in .env or stop the conflicting service

4. **Permission Denied**
   - Check database user privileges
   - Ensure user can CREATE DATABASE and tables

### Getting Help

- Check the console output for detailed error messages
- Run `npm run db:health` to verify database setup
- Review the API documentation at `/api/docs`
- Check environment variables with `npm run db:info`
