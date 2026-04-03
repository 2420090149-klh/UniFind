import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const colleges = db.prepare('SELECT * FROM College').all();
        return NextResponse.json({ colleges });
    } catch (e) {
        console.error('API Error:', e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
