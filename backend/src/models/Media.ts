import mongoose, { Document, Schema } from 'mongoose';

export interface IMedia extends Document {
    user_id: mongoose.Types.ObjectId;
    media_type: 'image' | 'video';
    file_url: string;
    is_favorite: boolean;
    created_at: Date;
}

const mediaSchema = new Schema<IMedia>({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
        index: true,
    },
    media_type: {
        type: String,
        enum: ['image', 'video'],
        required: [true, 'Media type is required'],
    },
    file_url: {
        type: String,
        required: [true, 'File URL is required'],
    },
    is_favorite: {
        type: Boolean,
        default: false,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model<IMedia>('Media', mediaSchema);
