import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
    try {
        const data = await req.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        console.log(`Uploading file: ${file.name}, size: ${bytes.byteLength} bytes`);

        // Upload to Cloudinary using a Promise wrapper for the upload_stream
        const result: any = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'unifind-items',
                    resource_type: 'auto',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({ 
            success: true, 
            url: result.secure_url,
            public_id: result.public_id 
        });

    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Cloudinary upload failed. Check your API credentials.' 
        }, { status: 500 });
    }
}
