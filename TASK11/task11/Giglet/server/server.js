const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
    secret: 'giglet_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

app.post('/api/auth/register', (req, res) => {
    const { username, password, email, role } = req.body;
    if (!role || (role !== 'Student' && role !== 'Employer')) {
        return res.status(400).json({ error: 'Please select a valid role' });
    }

    db.get(`SELECT id FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) {
            console.error('Registration error (username check):', err);
            return res.status(500).json({ error: 'Database error during registration' });
        }
        if (row) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        db.get(`SELECT id FROM users WHERE email = ?`, [email], (err, row) => {
            if (err) {
                console.error('Registration error (email check):', err);
                return res.status(500).json({ error: 'Database error during registration' });
            }
            if (row) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);
            db.run(`INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)`, 
                [username, hashedPassword, email, role], 
                function(err) {
                    if (err) {
                        console.error('Registration error (insert):', err);
                        return res.status(500).json({ error: `Registration failed: ${err.message}` });
                    }
                    req.session.userId = this.lastID;
                    req.session.username = username;
                    req.session.role = role;
                    res.json({ message: 'Signup successful', user: { id: this.lastID, username, role } });
                }
            );
        });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, user) => {
        if (err || !user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        res.json({ message: 'Logged in successfully', user: { id: user.id, username: user.username, role: user.role } });
    });
});

app.get('/api/auth/me', (req, res) => {
    if (req.session.userId) {
        res.json({ user: { id: req.session.userId, username: req.session.username, role: req.session.role } });
    } else {
        res.json({ user: null });
    }
});

app.post('/api/gigs', requireAuth, (req, res) => {
    const { title, description, budget, deadline } = req.body;
    db.run(`INSERT INTO gigs (title, description, budget, deadline, created_by) VALUES (?, ?, ?, ?, ?)`,
        [title, description, budget, deadline, req.session.userId],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to post gig' });
            res.json({ message: 'Gig posted', id: this.lastID });
        }
    );
});

app.get('/api/gigs', (req, res) => {
    db.all(`SELECT gigs.*, users.username as creator_name FROM gigs JOIN users ON gigs.created_by = users.id WHERE status = 'Open' ORDER BY id DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch gigs' });
        res.json(rows);
    });
});

app.get('/api/gigs/:id', (req, res) => {
    const gigId = req.params.id;
    db.get(`SELECT gigs.*, users.username as creator_name, users.email as creator_email, users.role as creator_role FROM gigs JOIN users ON gigs.created_by = users.id WHERE gigs.id = ?`, [gigId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch gig details' });
        if (!row) return res.status(404).json({ error: 'Gig not found' });

        const sendResponse = (gigData) => {
            if (gigData.assigned_to !== req.session.userId && gigData.created_by !== req.session.userId) {
                delete gigData.creator_email;
            }
            res.json(gigData);
        };

        if (row.status === 'In Progress' || row.status === 'Completed') {
            db.get(`SELECT completion_time FROM bids WHERE gig_id = ? AND bidder_id = ? AND status = 'Accepted'`, [gigId, row.assigned_to], (err, bid) => {
                if (bid) row.bid_duration = bid.completion_time;
                sendResponse(row);
            });
        } else {
            sendResponse(row);
        }
    });
});

app.get('/api/my-gigs', requireAuth, (req, res) => {
    db.all(`SELECT * FROM gigs WHERE created_by = ? OR assigned_to = ? ORDER BY id DESC`, [req.session.userId, req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch your gigs' });
        res.json(rows);
    });
});

app.post('/api/gigs/:id/bids', requireAuth, (req, res) => {
    const gigId = req.params.id;
    const { amount, completion_time } = req.body;
    db.run(`INSERT INTO bids (gig_id, bidder_id, amount, completion_time) VALUES (?, ?, ?, ?)`,
        [gigId, req.session.userId, amount, completion_time],
        function(err) {
            if (err) return res.status(500).json({ error: 'Failed to place bid' });
            res.json({ message: 'Bid placed' });
        }
    );
});

app.get('/api/gigs/:id/bids', requireAuth, (req, res) => {
    const gigId = req.params.id;
    db.get(`SELECT created_by FROM gigs WHERE id = ?`, [gigId], (err, gig) => {
        if (!gig) return res.status(404).json({ error: 'Gig not found' });
        if (gig.created_by !== req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

        db.all(`SELECT bids.*, users.username FROM bids JOIN users ON bids.bidder_id = users.id WHERE gig_id = ?`, [gigId], (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed to fetch bids' });
            res.json(rows);
        });
    });
});

app.post('/api/bids/:id/accept', requireAuth, (req, res) => {
    const bidId = req.params.id;
    
    db.get(`SELECT * FROM bids WHERE id = ?`, [bidId], (err, bid) => {
        if (!bid) return res.status(404).json({ error: 'Bid not found' });
        
        db.get(`SELECT * FROM gigs WHERE id = ?`, [bid.gig_id], (err, gig) => {
            if (gig.created_by !== req.session.userId) return res.status(403).json({ error: 'Unauthorized' });
            
            const acceptedAt = new Date().toISOString();
            db.run(`UPDATE gigs SET status = 'In Progress', assigned_to = ?, accepted_at = ? WHERE id = ?`, [bid.bidder_id, acceptedAt, gig.id], (err) => {
                if (err) return res.status(500).json({ error: 'Failed to accept bid' });
                
                db.run(`UPDATE bids SET status = 'Accepted' WHERE id = ?`, [bidId], (err) => {
                     res.json({ message: 'Bid accepted' });
                });
            });
        });
    });
});

app.post('/api/gigs/:id/complete', requireAuth, (req, res) => {
    const gigId = req.params.id;
    db.get(`SELECT * FROM gigs WHERE id = ?`, [gigId], (err, gig) => {
        if (!gig) return res.status(404).json({ error: 'Gig not found' });
        if (gig.created_by !== req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

        db.run(`UPDATE gigs SET status = 'Completed' WHERE id = ?`, [gigId], function(err) {
            if (err) return res.status(500).json({ error: 'Failed to complete gig' });
            
            const date = new Date().toISOString().split('T')[0];
            db.run(`INSERT INTO portfolio (user_id, gig_id, completed_date) VALUES (?, ?, ?)`, 
                [gig.assigned_to, gigId, date], 
                (err) => {
                    res.json({ message: 'Gig completed' });
                }
            );
        });
    });
});

app.put('/api/gigs/:id', requireAuth, (req, res) => {
    const gigId = req.params.id;
    const { title, description, budget, deadline } = req.body;
    
    db.get(`SELECT created_by FROM gigs WHERE id = ?`, [gigId], (err, row) => {
        if (!row) return res.status(404).json({ error: 'Gig not found' });
        if (row.created_by !== req.session.userId) return res.status(403).json({ error: 'Unauthorized' });

        db.run(`UPDATE gigs SET title = ?, description = ?, budget = ?, deadline = ? WHERE id = ?`,
            [title, description, budget, deadline, gigId],
            function(err) {
                if (err) return res.status(500).json({ error: 'Failed to update gig' });
                res.json({ message: 'Gig updated successfully' });
            }
        );
    });
});

app.get('/api/portfolio', requireAuth, (req, res) => {
    db.all(`SELECT portfolio.*, gigs.title, gigs.description FROM portfolio JOIN gigs ON portfolio.gig_id = gigs.id WHERE portfolio.user_id = ?`, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch portfolio' });
        res.json(rows);
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
