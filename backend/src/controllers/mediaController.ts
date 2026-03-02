import { Response } from 'express';
import mongoose from 'mongoose';
import Media from '../models/Media';
import { AuthRequest } from '../middleware/authMiddleware';
import { uploadToS3, deleteFromS3 } from '../utils/s3';

// POST /media/upload
export const uploadMedia = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No files provided.' });
            return;
        }

        const uploadedMedia = await Promise.all(
            files.map(async (file) => {
                let mediaType: 'image' | 'video' | 'audio' = 'image';
                if (file.mimetype.startsWith('video/')) mediaType = 'video';
                else if (file.mimetype.startsWith('audio/')) mediaType = 'audio';
                const fileUrl = await uploadToS3(file);

                const media = await Media.create({
                    user_id: req.user!.id,
                    media_type: mediaType,
                    file_url: fileUrl,
                });
                return media;
            })
        );

        res.status(201).json({
            message: `${uploadedMedia.length} media item(s) uploaded successfully.`,
            media: uploadedMedia.length === 1 ? uploadedMedia[0] : uploadedMedia,
        });
    } catch (error) {
        console.error('Upload media error:', error);
        res.status(500).json({ message: 'Failed to upload media.' });
    }
};

// GET /media?page=1&limit=20
export const getMedia = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        const [media, total] = await Promise.all([
            Media.find({ user_id: req.user!.id })
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit),
            Media.countDocuments({ user_id: req.user!.id }),
        ]);

        res.status(200).json({
            media,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get media error:', error);
        res.status(500).json({ message: 'Failed to fetch media.' });
    }
};

// PATCH /media/:id/favorite
export const toggleFavorite = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid media ID.' });
            return;
        }

        const media = await Media.findById(id);

        if (!media) {
            res.status(404).json({ message: 'Media not found.' });
            return;
        }

        // Ownership check
        if (media.user_id.toString() !== req.user!.id) {
            res.status(403).json({ message: 'Access denied. This media does not belong to you.' });
            return;
        }

        // Toggle favorite
        media.is_favorite = !media.is_favorite;
        await media.save();

        res.status(200).json({
            message: `Media ${media.is_favorite ? 'added to' : 'removed from'} favorites.`,
            media,
        });
    } catch (error) {
        console.error('Toggle favorite error:', error);
        res.status(500).json({ message: 'Failed to toggle favorite.' });
    }
};

// GET /media/favorites
export const getFavorites = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const media = await Media.find({
            user_id: req.user!.id,
            is_favorite: true,
        }).sort({ created_at: -1 });

        res.status(200).json({ media });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({ message: 'Failed to fetch favorites.' });
    }
};

// DELETE /media/:id
export const deleteMedia = async (
    req: AuthRequest,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({ message: 'Invalid media ID.' });
            return;
        }

        const media = await Media.findById(id);

        if (!media) {
            res.status(404).json({ message: 'Media not found.' });
            return;
        }

        // Ownership check
        if (media.user_id.toString() !== req.user!.id) {
            res.status(403).json({ message: 'Access denied. This media does not belong to you.' });
            return;
        }

        // Delete from S3
        await deleteFromS3(media.file_url);

        // Delete from DB
        await Media.findByIdAndDelete(id);

        res.status(200).json({ message: 'Media deleted successfully.' });
    } catch (error) {
        console.error('Delete media error:', error);
        res.status(500).json({ message: 'Failed to delete media.' });
    }
};
