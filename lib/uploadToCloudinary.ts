/**
 * Uploads a file directly from the browser to Cloudinary.
 *
 * Flow:
 *  1. GET /api/upload/sign  — our server returns a signed credential (tiny, no file data)
 *  2. POST directly to Cloudinary — the file goes from browser → Cloudinary, never through Vercel
 *
 * This completely bypasses Vercel's 4.5 MB serverless body-size limit.
 *
 * @param file  The File object from an <input type="file">
 * @returns     The Cloudinary secure_url string
 * @throws      Error with a user-readable message on failure
 */
export async function uploadToCloudinary(file: File): Promise<string> {
    // 1. Get a signed credential from our server
    const signRes = await fetch('/api/upload/sign');
    if (!signRes.ok) {
        const err = await signRes.json().catch(() => ({}));
        throw new Error(err.error || 'Could not get upload credentials from server');
    }
    const { cloudName, apiKey, timestamp, folder, signature } = await signRes.json();

    // 2. Upload the raw file directly to Cloudinary
    const form = new FormData();
    form.append('file', file);
    form.append('api_key', apiKey);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: form }
    );

    const result = await uploadRes.json();

    if (!uploadRes.ok || result.error) {
        throw new Error(result.error?.message || 'Cloudinary upload failed');
    }

    return result.secure_url as string;
}
