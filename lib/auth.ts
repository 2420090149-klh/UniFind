import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

export async function getUserFromRequest() {
    const headersList = await headers();
    const token = headersList.get('authorization')?.split(' ')[1];

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded as { userId: string, role: string, collegeId: string };
    } catch (e) {
        return null;
    }
}
