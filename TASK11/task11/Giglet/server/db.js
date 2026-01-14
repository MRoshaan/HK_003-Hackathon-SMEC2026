const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/giglet.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        createTables();
    }
});

function createTables() {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            email TEXT,
            role TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS gigs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            budget REAL,
            deadline TEXT,
            status TEXT DEFAULT 'Open',
            created_by INTEGER,
            assigned_to INTEGER,
            accepted_at TEXT,
            FOREIGN KEY(created_by) REFERENCES users(id),
            FOREIGN KEY(assigned_to) REFERENCES users(id)
        )`, (err) => {
            db.run("ALTER TABLE gigs ADD COLUMN accepted_at TEXT", (err) => {});
        });

        db.run(`CREATE TABLE IF NOT EXISTS bids (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gig_id INTEGER,
            bidder_id INTEGER,
            amount REAL,
            completion_time TEXT,
            status TEXT DEFAULT 'Pending',
            FOREIGN KEY(gig_id) REFERENCES gigs(id),
            FOREIGN KEY(bidder_id) REFERENCES users(id)
        )`, (err) => {
            db.run("ALTER TABLE bids ADD COLUMN completion_time TEXT", (err) => {});
        });

        db.run(`CREATE TABLE IF NOT EXISTS portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            gig_id INTEGER,
            completed_date TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(gig_id) REFERENCES gigs(id)
        )`);

        db.get("SELECT COUNT(*) as count FROM gigs", (err, row) => {
            if (row && row.count === 0) {
                const sampleGigs = [
                    ['Web Design', 'Landing page design.', 250, '2026-02-01', 1],
                    ['Assignment Formatting', 'Report formatting.', 50, '2026-01-20', 1],
                    ['Presentation Design', '15-slide PowerPoint.', 80, '2026-01-25', 1],
                    ['Data Entry', 'Excel spreadsheet task.', 40, '2026-01-22', 1],
                    ['Graphics', 'Instagram posts.', 100, '2026-01-30', 1]
                ];

                const stmt = db.prepare("INSERT INTO gigs (title, description, budget, deadline, created_by, status) VALUES (?, ?, ?, ?, ?, 'Open')");
                sampleGigs.forEach(gig => stmt.run(gig));
                stmt.finalize();
            }
        });
    });
}

module.exports = db;
