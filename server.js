// server.js
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Database Connection =====
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) {
        console.error('MySQL connection failed:', err);
        process.exit(1);
    }
    console.log('✅ MySQL Connected');
});

// ===== Middleware =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: process.env.SESSION_SECRET || 'secret123',
    resave: false,
    saveUninitialized: false
}));

// ===== Auth Middleware =====
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// ===== Routes =====

// Redirect root to login if not logged in
app.get('/', (req, res) => {
    if (req.session.user) {
        return res.redirect('/shop');
    }
    res.redirect('/login');
});

// Show login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err) return res.status(500).send('Server error');
        if (results.length === 0) return res.status(400).send('Invalid email or password');

        const match = await bcrypt.compare(password, results[0].password);
        if (!match) return res.status(400).send('Invalid email or password');

        req.session.user = { id: results[0].id, name: results[0].name, email: results[0].email };
        res.redirect('/shop');
    });
});

// Show register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Handle register
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error registering user');
            }
            res.redirect('/login');
        }
    );
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

// ===== SHOP ROUTES =====

// Serve shop page (protected)
app.get('/shop', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

// Get products (for shop page AJAX)
app.get('/api/products', requireAuth, (req, res) => {
    db.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Server error');
        }
        res.json(results);
    });
});

// Place an order (no orders table; insert directly into order_items)
app.post('/order', requireAuth, (req, res) => {
    const productId = Number(req.body.product_id);
    const qty = Number(req.body.quantity);
    if (!Number.isInteger(productId) || productId <= 0) {
        return res.status(400).json({ message: 'Invalid product' });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ message: 'Invalid quantity' });
    }

    db.query('SELECT price FROM products WHERE id = ?', [productId], (err, productResults) => {
        if (err || productResults.length === 0) {
            return res.status(400).json({ message: 'Invalid product' });
        }

        const unit_price = Number(productResults[0].price);
        const total = unit_price * qty;

        // Check if order_items has a user_id column; if yes, use user_id. Otherwise, try using order_id = user id.
        db.query("SHOW COLUMNS FROM order_items LIKE 'user_id'", (colErr, colRows) => {
            if (colErr) {
                console.error(colErr);
                return res.status(500).json({ message: 'Server error' });
            }
            const hasUserId = Array.isArray(colRows) && colRows.length > 0;
            if (hasUserId) {
                db.query(
                    'INSERT INTO order_items (user_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                    [req.session.user.id, productId, qty, unit_price],
                    (itemErr) => {
                        if (itemErr) {
                            console.error(itemErr);
                            return res.status(500).json({ message: 'Error adding order item' });
                        }
                        return res.json({ message: 'Order item added', total });
                    }
                );
            } else {
                // Fallback: use order_id field with the user id value (requires no FK to orders)
                db.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                    [req.session.user.id, productId, qty, unit_price],
                    (itemErr2) => {
                        if (itemErr2) {
                            console.error(itemErr2);
                            return res.status(500).json({ message: 'Error adding order item. If you removed the orders table, update order_items to have user_id instead of order_id.' });
                        }
                        return res.json({ message: 'Order item added', total });
                    }
                );
            }
        });
    });
});

// ===== Start Server =====
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
