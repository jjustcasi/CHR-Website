# Civilian HR Website - MySQL Database Setup Guide

## 🗄️ Database Setup Instructions

### Step 1: Install Required Software

You need to have the following installed on your computer:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version` in terminal

2. **MySQL Server**
   - Download from: https://www.mysql.com/downloads/
   - For Windows: Use MySQL Community Server
   - For Mac: Use MySQL Community Server or HomeBrew
   - For Linux: Use package manager

3. **MySQL Workbench** (Optional but recommended for viewing data)
   - Download from: https://www.mysql.com/products/workbench/

---

### Step 2: Create the Database

#### Option A: Using MySQL Command Line

1. Open Command Prompt/Terminal
2. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```
   (Press Enter if no password is set)

3. Copy and paste the contents of `database_schema.sql` file and execute it in MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS civilian_hr;
   USE civilian_hr;
   
   -- Paste the rest of database_schema.sql here
   ```

#### Option B: Using MySQL Workbench

1. Open MySQL Workbench
2. Click on "File" → "Open SQL Script"
3. Select `database_schema.sql`
4. Click "Execute" button
5. The database will be created automatically

#### Option C: Using Terminal (Windows/Mac/Linux)

Navigate to your Website directory and run:
```bash
mysql -u root -p < database_schema.sql
```

---

### Step 3: Configure Environment Variables

1. In the Website folder, create a file named `.env` (copy from `.env.example`)

2. Edit `.env` with your MySQL credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=civilian_hr
   PORT=3000
   NODE_ENV=development
   ```

3. Save the file

---

### Step 4: Install Node.js Dependencies

1. Open Command Prompt/Terminal
2. Navigate to your Website folder:
   ```bash
   cd c:\Users\User\Desktop\Website
   ```
   (Or the path where you saved the Website folder)

3. Install all dependencies:
   ```bash
   npm install
   ```

   This will install:
   - express (web server framework)
   - mysql2 (database connection)
   - bcryptjs (password hashing)
   - cors (cross-origin support)
   - dotenv (environment variables)
   - nodemon (auto-restart on changes)

---

### Step 5: Start the Server

In your Terminal/Command Prompt, run:
```bash
npm start
```

Or for development mode with auto-restart:
```bash
npm run dev
```

You should see:
```
╔══════════════════════════════════════════╗
║   Civilian HR Server Started             ║
║   Running on: http://localhost:3000       ║
║   Database: civilian_hr                   ║
╚══════════════════════════════════════════╝
```

---

### Step 6: Access Your Website

1. Open your browser
2. Go to: `http://localhost:3000`
3. Your landing page will load with full database functionality

---

## 📝 Testing the Features

### Create a New Account (Sign Up)

1. Click "Sign Up" button
2. Fill in the form:
   - Full Name: John Doe
   - Email: john@example.com
   - Company: My Company
   - Password: Test@123
   - Confirm Password: Test@123
3. Check the Terms checkbox
4. Click "Create Account"

The data will be saved to your MySQL database!

### Login with Your Account

1. Click "Login" button
2. Use the "Continue with Google" option
3. After Google authentication, you can access protected pages

The system will verify your credentials against the database!

---

## 🔍 View Your Data in MySQL

### Using MySQL Command Line

1. Open Command Prompt/Terminal
2. Log in to MySQL:
   ```bash
   mysql -u root -p
   ```

3. Select the database:
   ```sql
   USE civilian_hr;
   ```

4. View all users:
   ```sql
   SELECT id, name, email, company, created_at, last_login FROM users;
   ```

5. View specific user:
   ```sql
   SELECT * FROM users WHERE email = 'john@example.com';
   ```

### Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. In the left panel, expand "Databases"
4. Click on "civilian_hr"
5. Click on "Tables"
6. Right-click on "users" table
7. Select "Select Rows - Limit 1000"
8. You'll see all registered users in a table view

---

## 📊 Database Tables

Your database includes the following tables:

### 1. **users** (Main table)
   - id (Auto-increment)
   - name
   - email (Unique)
   - company
   - password (Hashed with bcryptjs)
   - created_at
   - last_login
   - status

### 2. **employees** (Ready for employee records)
### 3. **leave_records** (Ready for leave management)
### 4. **attendance** (Ready for attendance tracking)
### 5. **training_programs** (Ready for training management)
### 6. **announcements** (Ready for HR announcements)
### 7. **login_audit** (Tracks login attempts)

---

## 🔐 Security Features Implemented

✅ **Password Hashing**: Passwords are hashed using bcryptjs
✅ **SQL Injection Prevention**: Using prepared statements
✅ **Input Validation**: Email and data validation
✅ **CORS Protection**: Cross-origin requests restricted
✅ **Error Handling**: Secure error messages
✅ **Login Audit Trail**: All login attempts are logged

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to MySQL"
- Ensure MySQL Server is running
- Check DB_HOST, DB_USER, DB_PASSWORD in .env file
- Make sure you created the database using database_schema.sql

### Issue: "Port 3000 already in use"
- Change PORT in .env file
- Or kill the process: `lsof -ti:3000 | xargs kill -9` (Mac/Linux)

### Issue: "Database doesn't exist"
- Run the database_schema.sql script again
- Check that you executed it with `USE civilian_hr;`

### Issue: "npm packages not installed"
- Delete node_modules folder and package-lock.json
- Run `npm install` again

### Issue: "Dependencies installation fails"
- Update npm: `npm install -g npm@latest`
- Clear cache: `npm cache clean --force`
- Try installing again: `npm install`

---

## 📡 API Endpoints Available

### Authentication Endpoints

**POST /api/signup**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "My Company",
  "password": "Test@123"
}
```

**POST /api/login**
```json
{
  "email": "john@example.com",
  "password": "Test@123"
}
```

### User Management Endpoints

**GET /api/users** - Get all users
**GET /api/users/:id** - Get specific user
**PUT /api/users/:id** - Update user
**DELETE /api/users/:id** - Delete user

### Health Check

**GET /api/health** - Check if server is running

---

## 🚀 Next Steps

1. ✅ Database setup complete
2. ✅ Login/Signup functionality working
3. Next: Create dashboard page to display user data
4. Next: Add employee management features
5. Next: Implement leave management
6. Next: Add training tracking
7. Next: Create admin panel

---

## 📞 Need Help?

If you encounter any issues:

1. Check the terminal output for error messages
2. Make sure MySQL is running
3. Verify all credentials in .env file
4. Check that port 3000 is not in use
5. Review the console.log messages in your browser's Developer Tools (F12)

---

**Database Setup Complete! 🎉**

You now have a fully functional Civilian HR website with MySQL database integration for storing user login details.
