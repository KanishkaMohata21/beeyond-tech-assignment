import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

import fs from 'fs';

export const uploadToS3 = async (
    file: Express.Multer.File
): Promise<string> => {
    const fileExtension = path.extname(file.originalname);
    const key = `media/${uuidv4()}${fileExtension}`;

    const fileStream = fs.createReadStream(file.path);

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
        Body: fileStream,
        ContentType: file.mimetype,
    });

    try {
        await s3Client.send(command);

        // Clean up temp file
        fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });

        const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
        return fileUrl;
    } catch (err) {
        // Still try to cleanup on error
        fs.unlink(file.path, () => { });
        throw err;
    }
};

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
    // Extract key from URL: https://bucket.s3.region.amazonaws.com/media/uuid.ext
    const url = new URL(fileUrl);
    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: key,
    });

    await s3Client.send(command);
};
