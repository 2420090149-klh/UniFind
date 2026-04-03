const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
// using custom uuid function below

// Simple UUID generator if uuid package not installed
function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const dbPath = path.join(process.cwd(), 'unifind.db');
const db = new Database(dbPath);

async function main() {
    const password = await bcrypt.hash('admin123', 10);
    const collegeId = uuid();
    const adminId = uuid();

    // Check if college exists
    const existingCollege = db.prepare('SELECT * FROM College WHERE subdomain = ?').get('klhb');

    if (!existingCollege) {
        db.prepare('INSERT INTO College (id, name, subdomain) VALUES (?, ?, ?)').run(collegeId, 'KL University', 'klhb');
        console.log('College created');

        db.prepare('INSERT INTO User (id, email, password, name, role, collegeId) VALUES (?, ?, ?, ?, ?, ?)').run(
            adminId, 'admin@klhb.com', password, 'Floor Admin', 'ADMIN', collegeId
        );
        console.log('Admin user created');
    } else {
        console.log('College already exists, skipping seed');
    }
}

main().catch(console.error);
