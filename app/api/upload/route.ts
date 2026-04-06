import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            console.error('Cloudinary env vars missing:', { cloudName: !!cloudName, apiKey: !!apiKey, apiSecret: !!apiSecret });
            return NextResponse.json({ success: false, error: 'Cloudinary not configured on server' }, { status: 500 });
        }

        // Convert file to base64 data URI
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        // Build signed upload parameters (sorted alphabetically — required by Cloudinary)
        const timestamp = Math.round(Date.now() / 1000);
        const folder = 'unifind';

        // Generate SHA-1 signature using Node.js crypto (works on Vercel)
        // Format: alphabetically sorted key=value pairs + api_secret (no & before secret)
        const paramStr = `folder=${folder}&timestamp=${timestamp}`;
        const sigStr = `${paramStr}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(sigStr).digest('hex');

        // Upload to Cloudinary using signed upload
        const formData = new FormData();
        formData.append('file', dataUri);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('folder', folder);
        formData.append('signature', signature);

        const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
        );

        const result = await uploadRes.json();

        if (!uploadRes.ok || result.error) {
            console.error('Cloudinary upload failed:', JSON.stringify(result.error));
            return NextResponse.json(
                { success: false, error: result.error?.message || 'Cloudinary upload failed' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, url: result.secure_url });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        console.error('Upload route error:', message);
        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}
