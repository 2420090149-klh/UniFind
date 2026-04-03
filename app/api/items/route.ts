import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
// Fallback helper
function generateId() {
    return crypto.randomUUID();
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const subdomain = searchParams.get('subdomain');
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const date = searchParams.get('date');
        const type = searchParams.get('type'); // 'lost' vs 'found' ? 
        // Actually lost/found depends on if finderId is set or ownerId is set?
        // Prompt: "find you lost item or add a lost item".
        // "add a lost item" -> I found something (Finder).
        // "Find my lost item" -> I am owner looking for Found items.
        // So we mainly serve "Found" items which have finderId.
        // We filter by status != 'RETURNED' generally.

        if (!subdomain) {
            return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
        }

        const college = db.prepare('SELECT id FROM College WHERE subdomain = ?').get(subdomain) as any;
        if (!college) {
            return NextResponse.json({ error: 'College not found' }, { status: 404 });
        }

        let query = 'SELECT * FROM Item WHERE collegeId = ?';
        const params: any[] = [college.id];

        if (search) {
            query += ' AND (title LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ' AND category = ?';
            params.push(category);
        }

        if (date) {
            // Simple date match or range?
            // "filter... with the date given"
            // Let's assume exact date match on dateLost (which is mostly dateFound for finder reporting)
            // Stored as ISO string or timestamp? 
            // Better-sqlite3 stores date as string usually if passed as string.
            // Using LIKE for partial match on YYYY-MM-DD
            query += ' AND dateLost LIKE ?';
            params.push(`${date}%`);
        }

        query += ' ORDER BY createdAt DESC';

        const items = db.prepare(query).all(...params);
        return NextResponse.json({ items });
    } catch (error) {
        console.error('Get items error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const user = await getUserFromRequest();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, category, dateLost, locationFloor, locationRoom, imageUrl, subdomain } = body;

        // Validation
        if (!title || !category || !subdomain) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const college = db.prepare('SELECT id FROM College WHERE subdomain = ?').get(subdomain) as any;
        if (!college) {
            return NextResponse.json({ error: 'College not found' }, { status: 404 });
        }

        if (college.id !== user.collegeId) {
            // User from different college trying to post?
            // Maybe allow it if they are physically there, but for now restrict.
            // Actually, user logs in to a specific domain. Token has collegeId.
        }

        const id = generateId();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO Item (
                id, title, description, category, dateLost, 
                locationFloor, locationRoom, imageUrl, status, 
                finderId, collegeId, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REPORTED', ?, ?, ?, ?)
        `).run(
            id, title, description, category, dateLost,
            locationFloor, locationRoom, imageUrl,
            user.userId, college.id, now, now
        );

        return NextResponse.json({ message: 'Item reported successfully', id });
    } catch (error) {
        console.error('Create item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
