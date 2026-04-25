# Civilian HR Website - Complete Setup Guide

> A professional HR management website with MySQL database integration for storing user login details, employee information, and HR operations.

## 📁 Project Files

```
Website/
├── index.html                  # Landing page with login/signup modals
├── admin-dashboard.html        # View all registered users (Admin Panel)
├── styles.css                  # Landing page styling
├── script.js                   # Frontend logic and API calls
├── server.js                   # Express.js backend server
├── package.json                # Node.js dependencies
├── database_schema.sql         # MySQL database schema
├── .env.example               # Environment variables template
├── .env                       # Your configuration (create this)
├── README.md                  # This file
├── QUICK_START.md             # Quick 5-minute setup guide
├── SETUP_DATABASE.md          # Detailed database setup guide
└── node_modules/              # Installed dependencies (auto-created)
```

---

## 🚀 Getting Started (5 Minutes)

### 1. Install MySQL & Node.js
- MySQL: https://www.mysql.com/downloads/
- Node.js: https://nodejs.org/

### 2. Create Database
```bash
mysql -u root -p < database_schema.sql
```

### 3. Create `.env` File
Copy from `.env.example` and update your MySQL credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=civilian_hr
PORT=3000
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Start Server
```bash
npm start
```

### 6. Open Browser
Go to: `http://localhost:3000`

---

## 📊 Database Structure

### Users Table
Stores all registered user accounts with encrypted passwords.

```sql
users:
├── id (Primary Key)
├── name
├── email (Unique)
├── company
├── password (Hashed)
├── created_at
├── last_login
└── status
```

**Sample Query:**
```sql
SELECT id, name, email, company, created_at, last_login FROM users;
```

### Additional Tables (Ready for Future Features)
- **employees**: Employee profiles and records
- **leave_records**: Leave requests and approvals
- **attendance**: Daily attendance tracking
- **training_programs**: Training courses
- **training_enrollments**: Employee training enrollment
- **announcements**: HR announcements and notices
- **login_audit**: Login attempt audit trail

---

## ✨ Key Features Implemented

### ✅ Frontend
- Professional responsive landing page
- Login modal with form validation
- Sign up modal with password confirmation
- Mobile-friendly design
- Smooth animations and transitions

### ✅ Backend
- Express.js REST API
- MySQL database integration
- Password hashing with bcryptjs
- CORS support
- Error handling
- Input validation

### ✅ Database Features
- Secure password storage
- User authentication
- Email uniqueness validation
- Login tracking
- Timestamp tracking

### ✅ Admin Panel
- View all registered users
- Search users by name/email
- User statistics and analytics
- Delete user accounts
- View user details
- Last login tracking

---

## 🔗 API Endpoints

### Authentication

**POST** `/api/signup` - Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "ABC Corp",
  "password": "SecurePassword123"
}
```

**POST** `/api/login` - Login user
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123"
}
```

### User Management

**GET** `/api/users` - Get all users (Admin)
**GET** `/api/users/:id` - Get specific user
**PUT** `/api/users/:id` - Update user
**DELETE** `/api/users/:id` - Delete user
**GET** `/api/health` - Server health check

---

## 🔐 Security Features

✅ **Password Hashing**: bcryptjs with salt rounds
✅ **SQL Injection Prevention**: Parameterized queries
✅ **Email Validation**: Format verification
✅ **CORS Protection**: Cross-origin restrictions
✅ **Input Sanitization**: Data validation
✅ **Error Handling**: Safe error messages
✅ **Login Audit**: All login attempts logged

---

## 📱 Pages & Features

### Landing Page (`index.html`)
- Navigation bar with logo
- Hero section
- Vision & Mission
- 6 Key Features (Employee Management, Leave Management, etc.)
- Goals section
- Footer with social links
- Login modal
- Sign up modal

### Admin Dashboard (`admin-dashboard.html`)
- View all registered users
- User statistics
- Search functionality
- User details view
- Delete user capability
- Last login tracking
- Company count
- New users this month

---

## 🧪 Testing

### Create Test Account
1. Open `http://localhost:3000`
2. Click "Sign Up"
3. Fill in form:
   - Name: Test User
   - Email: test@example.com
   - Company: Test Company
   - Password: Test@123
4. Submit

### View Data in MySQL
```sql
SELECT * FROM users;
SELECT * FROM login_audit;
```

### Test Login
1. Click "Login"
2. Enter email and password
3. Check if login succeeds

### Admin Dashboard
1. Open `http://localhost:3000/admin-dashboard.html`
2. View all registered users
3. Search by name or email
4. View user details
5. Delete test accounts

---

## 🛠️ Development

### Start Development Server (Auto-Reload)
```bash
npm run dev
```

### View Server Logs
Check terminal output for:
- Database connection status
- API request details
- Error messages

### Debug API Calls
1. Open DevTools (F12)
2. Go to Console tab
3. Check for network errors
4. Review API responses

---

## 📝 File Descriptions

### server.js
- Express.js web server
- MySQL database connection
- REST API endpoints
- Authentication logic
- Error handling

### script.js
- Modal open/close functions
- Form submission handlers
- API call integration
- Local storage management
- Animation effects

### styles.css
- Responsive design
- Grid and flexbox layouts
- Gradient backgrounds
- Hover animations
- Mobile breakpoints

### database_schema.sql
- Database creation
- Table definitions
- Indexes for performance
- Sample data queries

---

## ⚙️ Configuration

### Environment Variables (.env)

```
# Database
DB_HOST=localhost          # MySQL host
DB_USER=root              # MySQL username
DB_PASSWORD=              # MySQL password
DB_NAME=civilian_hr       # Database name

# Server
PORT=3000                 # Server port
NODE_ENV=development      # Environment mode
```

---

## 🐛 Troubleshooting

### MySQL Connection Error
**Problem**: Cannot connect to database
**Solution**:
1. Ensure MySQL is running
2. Check credentials in .env
3. Verify database exists: `SHOW DATABASES;`
4. Check username/password

### Port 3000 Already in Use
**Problem**: Address already in use error
**Solution**:
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### npm Packages Not Installing
**Problem**: Dependency installation fails
**Solution**:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Database Schema Not Applied
**Problem**: Tables don't exist
**Solution**:
```bash
mysql -u root -p civilian_hr < database_schema.sql
# Or paste database_schema.sql contents in MySQL Workbench
```

---

## 📈 Next Steps

### Phase 1: Core Features (Current)
✅ User Registration & Login
✅ Database Storage
✅ Admin Dashboard

### Phase 2: Employee Management
- [ ] Employee profiles
- [ ] Employee records
- [ ] Department management
- [ ] Job positions

### Phase 3: Leave Management
- [ ] Leave requests
- [ ] Approval workflow
- [ ] Leave balance tracking
- [ ] Leave history

### Phase 4: Attendance
- [ ] Check-in/Check-out
- [ ] Attendance reports
- [ ] Late tracking
- [ ] Absence management

### Phase 5: Training
- [ ] Training programs
- [ ] Enrollment management
- [ ] Progress tracking
- [ ] Certificates

### Phase 6: Advanced Features
- [ ] Dashboard with charts
- [ ] Reports generation
- [ ] Chatbot integration
- [ ] Email notifications
- [ ] Mobile app

---

## 📚 Learning Resources

### MySQL
- [MySQL Official Docs](https://dev.mysql.com/doc/)
- [MySQL Tutorial](https://www.w3schools.com/mysql/)

### Node.js & Express
- [Express Docs](https://expressjs.com/)
- [Node.js Docs](https://nodejs.org/docs/)

### REST API Design
- [RESTful API Best Practices](https://restfulapi.net/)

---

## 💡 Tips & Best Practices

1. **Always Use .env**: Never hardcode credentials
2. **Backup Database**: Regular backups of data
3. **Use Strong Passwords**: Encourage secure passwords
4. **SQL Injection Prevention**: Always use prepared statements
5. **Error Logging**: Monitor server logs
6. **Database Indexes**: Use indexes on frequently queried columns
7. **HTTPS in Production**: Always use HTTPS for production
8. **Rate Limiting**: Implement rate limiting for API
9. **Data Validation**: Validate all user inputs
10. **API Documentation**: Keep API docs updated

---

## 📞 Support

### Common Questions

**Q: Can I change the database name?**
A: Yes, update `DB_NAME` in .env and create new database

**Q: How do I backup my data?**
A: Use `mysqldump civilian_hr > backup.sql`

**Q: Can I deploy to production?**
A: Yes, but use HTTPS, environment variables, and secure passwords

**Q: How do I add more features?**
A: Add new tables in database_schema.sql, create API endpoints in server.js

---

## 📄 License

This project is open for modification and use.

---

## ✅ Checklist

- [x] Database setup complete
- [x] Server running on port 3000
- [x] Login/Signup functional
- [x] Data stored in MySQL
- [x] Admin dashboard working
- [x] Password hashing enabled
- [x] API endpoints created
- [ ] Ready for production (add HTTPS, authentication tokens, etc.)

---

## 🎉 You're All Set!

Your Civilian HR website is now fully functional with a MySQL database for storing user login details and more.

**Start the server:**
```bash
npm start
```

**Open in browser:**
```
http://localhost:3000
```

**View admin panel:**
```
http://localhost:3000/admin-dashboard.html
```

**Happy coding! 🚀**

---

**Last Updated**: April 25, 2026
**Version**: 1.0.0
