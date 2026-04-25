# ⚡ Quick Start Guide

## 🚀 Get Up and Running in 5 Minutes

### Prerequisites
- MySQL Server installed and running
- Node.js installed

---

## ⏱️ Quick Setup Steps

### 1. Create Database (2 minutes)

Open MySQL and run:
```bash
mysql -u root -p < database_schema.sql
```

Or paste the contents of `database_schema.sql` directly into MySQL Workbench and execute.

---

### 2. Configure Environment (1 minute)

Create `.env` file in the Website folder with:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=civilian_hr
PORT=3000
NODE_ENV=development

# Required for sessions (change this)
SESSION_SECRET=change_me

# Required: Google login
GOOGLE_CLIENT_ID=
```

---

### 3. Install Dependencies (1 minute)

```bash
npm install
```

---

### 4. Start Server (1 minute)

```bash
npm start
```

See this output:
```
╔══════════════════════════════════════════╗
║   Civilian HR Server Started             ║
║   Running on: http://localhost:3000       ║
╚══════════════════════════════════════════╝
```

---

### 5. Test It! ✅

1. Open browser: `http://localhost:3000`
2. Click "Sign Up"
3. Fill form and submit
4. Check data in MySQL: `SELECT * FROM users;`

### Login (Google Authentication)

1. Click "Login"
2. Use "Continue with Google"
3. After Google authentication, you can access protected pages (like the admin dashboard)

---

## 📋 File Structure

```
Website/
├── index.html              # Landing page
├── styles.css              # Styling
├── script.js               # Frontend logic
├── server.js               # Backend server (Express + MySQL)
├── package.json            # Node dependencies
├── database_schema.sql     # MySQL setup script
├── .env.example           # Environment template
├── .env                   # Your config (create this)
├── SETUP_DATABASE.md      # Detailed guide
├── QUICK_START.md         # This file
└── README.md              # Project info
```

---

## 🧪 Test the Database

### View All Users
```sql
SELECT * FROM users;
```

### View Login Attempts
```sql
SELECT * FROM login_audit;
```

### Delete Test Data
```sql
DELETE FROM users WHERE email = 'test@example.com';
```

---

## 🛑 Stop the Server

Press `Ctrl + C` in your terminal.

---

## 💡 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| MySQL connection error | Check .env credentials, ensure MySQL is running |
| Port 3000 in use | Change PORT in .env or stop other apps |
| npm packages error | Run `npm install` again |
| 404 on /api/login | Ensure server is running on port 3000 |

---

## 🎯 What's Working

✅ User Registration (Sign Up)
✅ User Login with Password Hashing
✅ Password Verification
✅ Store user data in MySQL
✅ User validation
✅ Error handling

---

## 🔜 Next Steps

After setup is complete:

1. Create dashboard page (dashboard.html)
2. Add employee management features
3. Implement leave management system
4. Build training tracker
5. Create admin panel
6. Add authentication tokens
7. Deploy to production

---

## 📚 Full Documentation

For detailed setup instructions, see: `SETUP_DATABASE.md`

---

**Ready? Let's go! 🚀**

```bash
npm start
```

Open http://localhost:3000 in your browser!
