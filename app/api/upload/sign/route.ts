import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * GET /api/upload/sign
 *
 * Returns a short-lived Cloudinary signed upload credential.
 * The client uses these to POST the file DIRECTLY to Cloudinary,
 * bypassing Vercel's 4.5 MB serverless body-size limit entirely.
 */
export async function GET() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey    = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.error('Cloudinary env vars missing');
        return NextResponse.json(
            { error: 'Cloudinary not configured on server' },
            { status: 500 }
        );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder    = 'unifind';

    // Params must be sorted alphabetically before hashing
    const paramStr  = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
        .createHash('sha1')
        .update(`${paramStr}${apiSecret}`)
        .digest('hex');

    return NextResponse.json({
        cloudName,
        apiKey,
        timestamp,
        folder,
        signature,
    });
}
