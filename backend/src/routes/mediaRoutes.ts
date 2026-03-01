import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { upload } from '../middleware/upload';
import {
    uploadMedia,
    getMedia,
    toggleFavorite,
    getFavorites,
    deleteMedia,
} from '../controllers/mediaController';

const router = Router();

// All media routes require authentication
router.use(authMiddleware);

router.post('/upload', upload.array('files', 5), uploadMedia);
router.get('/', getMedia);
router.patch('/:id/favorite', toggleFavorite);
router.get('/favorites', getFavorites);
router.delete('/:id', deleteMedia);

export default router;
