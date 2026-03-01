import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ActivityIndicator,
    ScrollView,
    Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';
import { useAppDispatch, useAppSelector } from '@/store';
import { uploadMediaThunk, refreshMediaThunk } from '@/store/thunks/mediaThunks';

interface UploadModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function UploadModal({ visible, onClose }: UploadModalProps) {
    const dispatch = useAppDispatch();
    const { isUploading, uploadProgress } = useAppSelector((s) => s.media);
    const isOnline = useAppSelector((s) => s.network.isOnline);
    const [error, setError] = useState<string | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [uploadingIndex, setUploadingIndex] = useState(0);
    const [totalToUpload, setTotalToUpload] = useState(0);
    const { colors } = useTheme();

    const pickMedia = async (mediaType: 'image' | 'video') => {
        try {
            setError(null);

            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                setError('Permission to access media library is required.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    mediaType === 'image'
                        ? ImagePicker.MediaTypeOptions.Images
                        : ImagePicker.MediaTypeOptions.Videos,
                quality: 0.8,
                allowsMultipleSelection: true,
                selectionLimit: 5,
            });

            if (result.canceled || result.assets.length === 0) return;

            // Limit to 5
            let assets = result.assets.slice(0, 5);

            // Check file size (50MB limit)
            const MAX_SIZE = 50 * 1024 * 1024;
            const oversized = assets.filter(a => (a.fileSize || 0) > MAX_SIZE);

            if (oversized.length > 0) {
                setError(`Some files are too large. Max size is 50MB. (${oversized.length} file(s) rejected)`);
                assets = assets.filter(a => (a.fileSize || 0) <= MAX_SIZE);
            }

            if (assets.length === 0 && oversized.length > 0) return;

            setSelectedAssets(assets);
        } catch (err: any) {
            setError('Failed to pick media.');
        }
    };

    const uploadSelected = async () => {
        if (selectedAssets.length === 0) return;

        setTotalToUpload(selectedAssets.length);
        setError(null);

        const assetsToUpload = selectedAssets.map(asset => ({
            uri: asset.uri,
            type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video',
            fileName: asset.fileName || `upload_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
        }));

        try {
            await dispatch(uploadMediaThunk(assetsToUpload)).unwrap();
            dispatch(refreshMediaThunk());
            setSelectedAssets([]);
            setUploadingIndex(0);
            setTotalToUpload(0);
            onClose();
        } catch (err: any) {
            setError(`Failed to upload media. ${typeof err === 'string' ? err : ''}`);
        }
    };

    const removeAsset = (index: number) => {
        setSelectedAssets((prev) => prev.filter((_, i) => i !== index));
    };

    const handleClose = () => {
        if (!isUploading) {
            setSelectedAssets([]);
            setError(null);
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Upload Media</Text>

                    {!isOnline && (
                        <View style={styles.offlineWarning}>
                            <Ionicons name="cloud-offline" size={16} color={colors.warning} />
                            <Text style={[styles.offlineText, { color: colors.warning }]}>Upload unavailable while offline</Text>
                        </View>
                    )}

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                        </View>
                    )}

                    {isUploading ? (
                        <View style={styles.progressContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                                Uploading Media... {uploadProgress}%
                            </Text>
                            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceLight }]}>
                                <View
                                    style={[styles.progressBarFill, { width: `${uploadProgress}%`, backgroundColor: colors.primary }]}
                                />
                            </View>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
                                Processing transfer...
                            </Text>
                        </View>
                    ) : selectedAssets.length > 0 ? (
                        /* Preview selected assets */
                        <View style={styles.previewSection}>
                            <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
                                {selectedAssets.length} file{selectedAssets.length > 1 ? 's' : ''} selected (max 5)
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                                {selectedAssets.map((asset, index) => (
                                    <View key={index} style={styles.previewItem}>
                                        <Image source={{ uri: asset.uri }} style={[styles.previewImage, { backgroundColor: colors.surfaceLight }]} />
                                        <TouchableOpacity style={[styles.removeButton, { backgroundColor: colors.surface }]} onPress={() => removeAsset(index)}>
                                            <Ionicons name="close-circle" size={20} color={colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                style={[styles.uploadButton, !isOnline && styles.disabledButton]}
                                onPress={uploadSelected}
                                disabled={!isOnline}
                            >
                                <Ionicons name="cloud-upload" size={20} color="#FFFFFF" />
                                <Text style={styles.uploadButtonText}>Upload {selectedAssets.length} file{selectedAssets.length > 1 ? 's' : ''}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.optionButton, !isOnline && styles.disabledButton]}
                                onPress={() => pickMedia('image')}
                                disabled={!isOnline}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: '#6C63FF20', borderColor: colors.border }]}>
                                    <Ionicons name="image" size={28} color={colors.primary} />
                                </View>
                                <Text style={[styles.optionText, { color: colors.textPrimary }]}>Images</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.optionButton, !isOnline && styles.disabledButton]}
                                onPress={() => pickMedia('video')}
                                disabled={!isOnline}
                            >
                                <View style={[styles.iconCircle, { backgroundColor: '#FF6B9D20', borderColor: colors.border }]}>
                                    <Ionicons name="videocam" size={28} color={colors.accent} />
                                </View>
                                <Text style={[styles.optionText, { color: colors.textPrimary }]}>Videos</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                        <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.lg,
        paddingBottom: SPACING.xxl,
        ...SHADOWS.medium,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        ...FONTS.large,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    offlineWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF980020',
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        marginBottom: SPACING.md,
        gap: 8,
    },
    offlineText: {
        fontSize: 13,
        fontWeight: '500',
    },
    errorContainer: {
        backgroundColor: '#FF525220',
        borderRadius: RADIUS.sm,
        padding: SPACING.sm,
        marginBottom: SPACING.md,
    },
    errorText: {
        fontSize: 13,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING.xl,
        marginVertical: SPACING.lg,
    },
    optionButton: {
        alignItems: 'center',
        gap: SPACING.sm,
    },
    disabledButton: {
        opacity: 0.4,
    },
    iconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    optionText: {
        ...FONTS.regular,
        fontWeight: '500',
    },
    progressContainer: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        gap: SPACING.md,
    },
    progressText: {
        ...FONTS.medium,
    },
    progressBarBg: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    previewSection: {
        marginVertical: SPACING.md,
        gap: SPACING.md,
    },
    selectedCount: {
        ...FONTS.regular,
        textAlign: 'center',
    },
    previewScroll: {
        flexGrow: 0,
    },
    previewItem: {
        width: 80,
        height: 80,
        marginRight: SPACING.md,
        marginTop: SPACING.sm,
        borderRadius: RADIUS.md,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: RADIUS.md,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        zIndex: 10,
        borderRadius: 12,
        ...SHADOWS.small,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: '#6C63FF',
        borderRadius: RADIUS.lg,
        paddingVertical: SPACING.md,
        ...SHADOWS.glow,
    },
    uploadButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: SPACING.md,
        marginTop: SPACING.sm,
    },
    cancelText: {
        ...FONTS.medium,
    },
});
