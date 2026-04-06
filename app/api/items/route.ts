import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const subdomain = searchParams.get('subdomain');
        const search = searchParams.get('search');
        const category = searchParams.get('category');
        const date = searchParams.get('date');

        if (!subdomain) {
            return NextResponse.json({ error: 'Subdomain required' }, { status: 400 });
        }

        const college = await prisma.college.findUnique({
            where: { subdomain }
        });

        if (!college) {
            return NextResponse.json({ error: 'College not found' }, { status: 404 });
        }

        // Build Prisma query object
        const where: any = {
            collegeId: college.id,
        };

        if (search) {
            where.OR = [
                { title: { contains: search } },
                { description: { contains: search } }
            ];
        }

        if (category) {
            where.category = category;
        }

        if (date) {
            // Prisma date filtering
            const targetDate = new Date(date);
            const nextDay = new Date(targetDate);
            nextDay.setDate(targetDate.getDate() + 1);

            where.dateLost = {
                gte: targetDate,
                lt: nextDay
            };
        }

        const items = await prisma.item.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                finder: {
                    select: { name: true, email: true }
                },
                owner: {
                    select: { name: true, email: true }
                }
            }
        });

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

        if (!title || !category || !subdomain) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const college = await prisma.college.findUnique({
            where: { subdomain }
        });

        if (!college) {
            return NextResponse.json({ error: 'College not found' }, { status: 404 });
        }

        const id = crypto.randomUUID();

        const item = await prisma.item.create({
            data: {
                id,
                title,
                description,
                category,
                dateLost: new Date(dateLost),
                locationFloor,
                locationRoom,
                imageUrl,
                status: 'REPORTED',
                finderId: user.userId,
                collegeId: college.id
            }
        });

        return NextResponse.json({ message: 'Item reported successfully', id: item.id });
    } catch (error) {
        console.error('Create item error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
