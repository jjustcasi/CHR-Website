const express = require('express');
const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost,http://127.0.0.1')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        name: 'chris_database_session',
        secret: process.env.SESSION_SECRET || 'dev_only_change_me',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: false
        }
    })
);

// ================== AUTH MIDDLEWARE ==================
function requireAuth(req, res, next) {
    if (req.session && req.session.userId) return next();
    return res.status(401).json({
        success: false,
        message: 'Authentication required'
    });
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.userId && req.session.role === 'admin') return next();
    return res.status(403).json({
        success: false,
        message: 'Administrator access required'
    });
}

function resolvePasswordColumn(columnNames) {
    if (columnNames.has('password')) return 'password';
    if (columnNames.has('password_hash')) return 'password_hash';
    return null;
}

function resolveIdentityColumn(columnNames) {
    if (columnNames.has('email')) return 'email';
    if (columnNames.has('username')) return 'username';
    return null;
}

function findColumnName(columnNames, candidates) {
    for (const candidate of candidates) {
        if (columnNames.has(candidate)) return candidate;
    }
    return null;
}

async function getUsersTableColumns(connection) {
    const [columns] = await connection.query(
        `SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT, EXTRA
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );

    return columns;
}

async function initializeFeatureTables() {
    const connection = await pool.getConnection();
    try {
        await connection.query(
            `CREATE TABLE IF NOT EXISTS announcements (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                posted_by VARCHAR(255) DEFAULT 'Administrator',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`
        );

        await connection.query(
            `CREATE TABLE IF NOT EXISTS leave_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                requester_name VARCHAR(255) NOT NULL,
                requester_email VARCHAR(255) NOT NULL,
                leave_type VARCHAR(100) NOT NULL,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason TEXT,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                admin_comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_leave_user (user_id),
                INDEX idx_leave_status (status)
            )`
        );

        await connection.query(
            `CREATE TABLE IF NOT EXISTS training_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                employee_name VARCHAR(255) NOT NULL,
                employee_email VARCHAR(255) NOT NULL,
                course_title VARCHAR(255) NOT NULL,
                provider VARCHAR(255),
                start_date DATE,
                end_date DATE,
                status ENUM('planned', 'ongoing', 'completed') DEFAULT 'planned',
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_training_user (user_id),
                INDEX idx_training_status (status)
            )`
        );

        await connection.query(
            `CREATE TABLE IF NOT EXISTS pds_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                user_email VARCHAR(255),
                full_name VARCHAR(255),
                contact_no VARCHAR(100),
                address TEXT,
                emergency_contact VARCHAR(255),
                school TEXT,
                position_title VARCHAR(255),
                department VARCHAR(255),
                skills TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_pds_user (user_id),
                INDEX idx_pds_email (user_email)
            )`
        );

        await connection.query(
            `CREATE TABLE IF NOT EXISTS performance_reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                employee_name VARCHAR(255) NOT NULL,
                employee_email VARCHAR(255) NOT NULL,
                review_period VARCHAR(100) NOT NULL,
                score DECIMAL(5,2) NOT NULL,
                remarks TEXT,
                status ENUM('draft', 'finalized') DEFAULT 'draft',
                evaluator VARCHAR(255) DEFAULT 'Administrator',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_performance_user (user_id)
            )`
        );
    } finally {
        connection.release();
    }
}

// MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'chris_database',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('MySQL Database Connected Successfully!');
        connection.release();
    })
    .catch(err => {
        console.error('Database Connection Error:', err.message);
    });

// ================== SIGNUP ROUTE ==================
app.post('/api/signup', async (req, res) => {
    try {
        const {
            name,
            firstName,
            lastName,
            fname,
            lname,
            email,
            birthday,
            gender,
            password
        } = req.body;

        const normalizedFirstName = String(firstName || fname || '').trim();
        const normalizedLastName = String(lastName || lname || '').trim();
        const fullName = String(name || `${normalizedFirstName} ${normalizedLastName}`.trim()).trim();

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        const connection = await pool.getConnection();

        try {
            const columns = await getUsersTableColumns(connection);
            const columnNames = new Set(columns.map(col => col.COLUMN_NAME));
            const identityColumn = resolveIdentityColumn(columnNames);
            const passwordColumn = resolvePasswordColumn(columnNames);

            if (!identityColumn || !passwordColumn) {
                return res.status(500).json({
                    success: false,
                    message: 'Users table must include email/username and password columns'
                });
            }

            const identityValue = identityColumn === 'email' ? email : (fullName || email);
            if (!identityValue) {
                return res.status(400).json({
                    success: false,
                    message: identityColumn === 'email' ? 'Email is required' : 'Username is required'
                });
            }

            const [existingUser] = await connection.query(
                `SELECT * FROM users WHERE ${identityColumn} = ? LIMIT 1`,
                [identityValue]
            );

            if (existingUser.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: identityColumn === 'email' ? 'Email already registered' : 'Username already registered'
                });
            }

            const hashedPassword = await bcryptjs.hash(password, 10);

            const requiredColumns = columns
                .filter(col => col.IS_NULLABLE === 'NO' && col.COLUMN_DEFAULT === null && !String(col.EXTRA).includes('auto_increment'))
                .map(col => col.COLUMN_NAME);

            const insertColumns = [];
            const insertParts = [];
            const insertValues = [];

            const firstNameColumn = findColumnName(columnNames, ['fname', 'Fname', 'first_name', 'firstName']);
            const lastNameColumn = findColumnName(columnNames, ['lname', 'Lname', 'last_name', 'lastName']);

            const addValueColumn = (column, value) => {
                insertColumns.push(column);
                insertParts.push('?');
                insertValues.push(value);
            };

            if (columnNames.has('name') && fullName) addValueColumn('name', fullName);
            if (firstNameColumn && normalizedFirstName) addValueColumn(firstNameColumn, normalizedFirstName);
            if (lastNameColumn && normalizedLastName) addValueColumn(lastNameColumn, normalizedLastName);
            if (columnNames.has('email') && email) addValueColumn('email', email);
            if (columnNames.has('username')) addValueColumn('username', fullName || (email ? email.split('@')[0] : 'user'));
            if (columnNames.has('birthday') && birthday) addValueColumn('birthday', birthday);
            if (columnNames.has('gender') && gender) addValueColumn('gender', gender);
            if (columnNames.has('role')) addValueColumn('role', 'employee');
            addValueColumn(passwordColumn, hashedPassword);

            if (columnNames.has('created_at')) {
                insertColumns.push('created_at');
                insertParts.push('NOW()');
            }

            const providedColumns = new Set(insertColumns);
            const missingRequired = requiredColumns.filter(col => !providedColumns.has(col));
            if (missingRequired.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required fields for users table: ${missingRequired.join(', ')}`
                });
            }

            await connection.query(
                `INSERT INTO users (${insertColumns.join(', ')}) VALUES (${insertParts.join(', ')})`,
                insertValues
            );

            res.status(201).json({
                success: true,
                message: 'Account created successfully'
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ================== LOGIN ROUTE ==================
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@civilianhr.local';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password required'
            });
        }

        if (email === adminEmail && password === adminPassword) {
            req.session.userId = 'admin';
            req.session.role = 'admin';
            req.session.name = 'Administrator';
            req.session.email = adminEmail;

            return res.json({
                success: true,
                message: 'Administrator login successful',
                data: {
                    id: 'admin',
                    name: 'Administrator',
                    email: adminEmail,
                    role: 'admin'
                }
            });
        }

        const connection = await pool.getConnection();

        try {
            const columns = await getUsersTableColumns(connection);
            const columnNames = new Set(columns.map(col => col.COLUMN_NAME));
            const identityColumn = resolveIdentityColumn(columnNames);
            const passwordColumn = resolvePasswordColumn(columnNames);

            if (!identityColumn || !passwordColumn) {
                return res.status(500).json({
                    success: false,
                    message: 'Users table must include email/username and password columns'
                });
            }

            const [users] = await connection.query(
                `SELECT * FROM users WHERE ${identityColumn} = ? LIMIT 1`,
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            const user = users[0];

            const isMatch = await bcryptjs.compare(password, user[passwordColumn]);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }

            req.session.userId = user.id || user.user_id;
            req.session.role = user.role === 'admin' ? 'admin' : 'employee';
            req.session.name = user.name || [user.fname, user.lname].filter(Boolean).join(' ').trim() || 'User';
            req.session.email = user.email || email;

            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;
            delete userWithoutPassword.password_hash;
            userWithoutPassword.role = req.session.role;

            res.json({
                success: true,
                message: 'Login successful',
                data: userWithoutPassword
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ================== SESSION ==================
app.get('/api/me', async (req, res) => {
    try {
        if (!req.session?.userId) {
            return res.json({ success: true, authenticated: false });
        }

        if (req.session.userId === 'admin' && req.session.role === 'admin') {
            return res.json({
                success: true,
                authenticated: true,
                data: {
                    id: 'admin',
                    name: req.session.name || 'Administrator',
                    email: req.session.email,
                    role: 'admin'
                }
            });
        }

        const connection = await pool.getConnection();

        try {
            const [users] = await connection.query(
                'SELECT * FROM users WHERE id = ?',
                [req.session.userId]
            );

            if (users.length === 0) {
                return res.json({ success: true, authenticated: false });
            }

            const user = { ...users[0] };
            delete user.password;
            delete user.password_hash;
            user.role = req.session.role || user.role || 'employee';

            res.json({
                success: true,
                authenticated: true,
                data: user
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('chris_database_session');
        res.json({ success: true });
    });
});

// ================== USERS CRUD ==================
app.get('/api/users', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [users] = await connection.query('SELECT * FROM users');
        const sanitizedUsers = users.map(user => {
            const record = { ...user };
            delete record.password;
            delete record.password_hash;
            return record;
        });
        res.json({ success: true, data: sanitizedUsers });
    } finally {
        connection.release();
    }
});

app.get('/api/users/:id', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [users] = await connection.query(
            'SELECT * FROM users WHERE id = ?',
            [req.params.id]
        );
        const user = users[0] ? { ...users[0] } : null;
        if (user) {
            delete user.password;
            delete user.password_hash;
        }
        res.json({ success: true, data: user });
    } finally {
        connection.release();
    }
});

app.put('/api/users/:id', requireAdmin, async (req, res) => {
    const { name, email, birthday, gender } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.query(
            'UPDATE users SET name=?, email=?, birthday=?, gender=? WHERE id=?',
            [name, email, birthday, gender, req.params.id]
        );
        res.json({ success: true });
    } finally {
        connection.release();
    }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.query('DELETE FROM users WHERE id=?', [req.params.id]);
        res.json({ success: true });
    } finally {
        connection.release();
    }
});

// ================== ANNOUNCEMENTS ==================
app.get('/api/announcements', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT * FROM announcements ORDER BY created_at DESC'
        );
        res.json({ success: true, data: rows });
    } finally {
        connection.release();
    }
});

app.post('/api/announcements', requireAdmin, async (req, res) => {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.query(
            'INSERT INTO announcements (title, content, posted_by) VALUES (?, ?, ?)',
            [title, content, req.session.name || 'Administrator']
        );
        res.status(201).json({ success: true, message: 'Announcement posted' });
    } finally {
        connection.release();
    }
});

app.put('/api/announcements/:id', requireAdmin, async (req, res) => {
    const { title, content } = req.body;
    const connection = await pool.getConnection();
    try {
        await connection.query(
            'UPDATE announcements SET title = ?, content = ? WHERE id = ?',
            [title, content, req.params.id]
        );
        res.json({ success: true, message: 'Announcement updated' });
    } finally {
        connection.release();
    }
});

app.delete('/api/announcements/:id', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Announcement deleted' });
    } finally {
        connection.release();
    }
});

// ================== LEAVE MANAGEMENT ==================
app.post('/api/leaves', requireAuth, async (req, res) => {
    const { leaveType, startDate, endDate, reason } = req.body;
    if (!leaveType || !startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'Leave type and dates are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.query(
            `INSERT INTO leave_requests (user_id, requester_name, requester_email, leave_type, start_date, end_date, reason)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.session.userId === 'admin' ? null : req.session.userId,
                req.session.name || 'Employee',
                req.session.email || '',
                leaveType,
                startDate,
                endDate,
                reason || null
            ]
        );
        res.status(201).json({ success: true, message: 'Leave request submitted' });
    } finally {
        connection.release();
    }
});

app.get('/api/leaves', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        let query = 'SELECT * FROM leave_requests ORDER BY created_at DESC';
        const params = [];

        if (req.session.role !== 'admin') {
            query = 'SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC';
            params.push(req.session.userId);
        }

        const [rows] = await connection.query(query, params);
        res.json({ success: true, data: rows });
    } finally {
        connection.release();
    }
});

app.patch('/api/leaves/:id/review', requireAdmin, async (req, res) => {
    const { status, comment } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.query(
            'UPDATE leave_requests SET status = ?, admin_comment = ? WHERE id = ?',
            [status, comment || null, req.params.id]
        );
        res.json({ success: true, message: 'Leave request reviewed' });
    } finally {
        connection.release();
    }
});

// ================== TRAINING MONITORING ==================
app.get('/api/training', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        let query = 'SELECT * FROM training_records ORDER BY created_at DESC';
        const params = [];

        if (req.session.role !== 'admin') {
            query = 'SELECT * FROM training_records WHERE user_id = ? ORDER BY created_at DESC';
            params.push(req.session.userId);
        }

        const [rows] = await connection.query(query, params);
        res.json({ success: true, data: rows });
    } finally {
        connection.release();
    }
});

app.post('/api/training', requireAdmin, async (req, res) => {
    const {
        userId,
        employeeName,
        employeeEmail,
        courseTitle,
        provider,
        startDate,
        endDate,
        status,
        remarks
    } = req.body;

    if (!employeeName || !employeeEmail || !courseTitle) {
        return res.status(400).json({ success: false, message: 'Employee and course details are required' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.query(
            `INSERT INTO training_records
             (user_id, employee_name, employee_email, course_title, provider, start_date, end_date, status, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId || null,
                employeeName,
                employeeEmail,
                courseTitle,
                provider || null,
                startDate || null,
                endDate || null,
                status || 'planned',
                remarks || null
            ]
        );
        res.status(201).json({ success: true, message: 'Training record added' });
    } finally {
        connection.release();
    }
});

// ================== PDS ==================
app.get('/api/pds', requireAuth, async (req, res) => {
    const requestedUserId = req.query.userId ? Number(req.query.userId) : null;
    const targetUserId = req.session.role === 'admin' && requestedUserId ? requestedUserId : req.session.userId;

    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT * FROM pds_records WHERE user_id = ? LIMIT 1',
            [targetUserId]
        );
        res.json({ success: true, data: rows[0] || null });
    } finally {
        connection.release();
    }
});

app.put('/api/pds', requireAuth, async (req, res) => {
    const { fullName, contactNo, address, emergencyContact, school, positionTitle, department, skills } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.query(
            `INSERT INTO pds_records
             (user_id, user_email, full_name, contact_no, address, emergency_contact, school, position_title, department, skills)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             user_email = VALUES(user_email),
             full_name = VALUES(full_name),
             contact_no = VALUES(contact_no),
             address = VALUES(address),
             emergency_contact = VALUES(emergency_contact),
             school = VALUES(school),
             position_title = VALUES(position_title),
             department = VALUES(department),
             skills = VALUES(skills)`,
            [
                req.session.userId,
                req.session.email || null,
                fullName || req.session.name || null,
                contactNo || null,
                address || null,
                emergencyContact || null,
                school || null,
                positionTitle || null,
                department || null,
                skills || null
            ]
        );
        res.json({ success: true, message: 'PDS updated successfully' });
    } finally {
        connection.release();
    }
});

// ================== PERFORMANCE ==================
app.get('/api/performance', requireAuth, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        let query = 'SELECT * FROM performance_reviews ORDER BY created_at DESC';
        const params = [];

        if (req.session.role !== 'admin') {
            query = 'SELECT * FROM performance_reviews WHERE user_id = ? ORDER BY created_at DESC';
            params.push(req.session.userId);
        }

        const [rows] = await connection.query(query, params);
        res.json({ success: true, data: rows });
    } finally {
        connection.release();
    }
});

app.post('/api/performance', requireAdmin, async (req, res) => {
    const { userId, employeeName, employeeEmail, reviewPeriod, score, remarks, status } = req.body;
    if (!employeeName || !employeeEmail || !reviewPeriod || score === undefined) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.query(
            `INSERT INTO performance_reviews
             (user_id, employee_name, employee_email, review_period, score, remarks, status, evaluator)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userId || null,
                employeeName,
                employeeEmail,
                reviewPeriod,
                score,
                remarks || null,
                status || 'draft',
                req.session.name || 'Administrator'
            ]
        );
        res.status(201).json({ success: true, message: 'Performance review saved' });
    } finally {
        connection.release();
    }
});

// ================== ADMIN ANALYTICS ==================
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const [[userStats]] = await connection.query('SELECT COUNT(*) AS totalUsers FROM users');
        const [[pendingLeaves]] = await connection.query(
            `SELECT COUNT(*) AS total FROM leave_requests WHERE status = 'pending'`
        );
        const [[announcementCount]] = await connection.query(
            'SELECT COUNT(*) AS total FROM announcements'
        );
        const [[trainingCount]] = await connection.query(
            'SELECT COUNT(*) AS total FROM training_records'
        );

        res.json({
            success: true,
            data: {
                totalUsers: userStats.totalUsers || 0,
                pendingLeaves: pendingLeaves.total || 0,
                totalAnnouncements: announcementCount.total || 0,
                totalTrainingRecords: trainingCount.total || 0
            }
        });
    } finally {
        connection.release();
    }
});

// ================== STATIC ==================
app.use(express.static(__dirname));

// Keep compatibility for old admin dashboard URL.
app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// ================== HEALTH ==================
app.get('/api/health', (req, res) => {
    res.json({ success: true });
});

// ================== START ==================
const PORT = process.env.PORT || 3000;
initializeFeatureTables()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(error => {
        console.error('Failed to initialize feature tables:', error.message);
        process.exit(1);
    });

module.exports = app;
