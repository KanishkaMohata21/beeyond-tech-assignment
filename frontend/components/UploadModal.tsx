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
import { Audio } from 'expo-av';
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
    const recordingRef = React.useRef<Audio.Recording | null>(null);
    const { isUploading, uploadProgress } = useAppSelector((s) => s.media);
    const isOnline = useAppSelector((s) => s.network.isOnline);
    const [error, setError] = useState<string | null>(null);
    const [selectedAssets, setSelectedAssets] = useState<(ImagePicker.ImagePickerAsset | { uri: string; type: 'audio'; fileName: string })[]>([]);
    const [uploadingIndex, setUploadingIndex] = useState(0);
    const [totalToUpload, setTotalToUpload] = useState(0);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const { colors } = useTheme();

    React.useEffect(() => {
        return () => {
            if (recordingRef.current) {
                recordingRef.current.stopAndUnloadAsync().catch(() => { });
                recordingRef.current = null;
            }
        };
    }, []);

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
                selectionLimit: 5 - selectedAssets.length,
            });

            if (result.canceled || result.assets.length === 0) return;

            addAssets(result.assets);
        } catch (err: any) {
            setError('Failed to pick media.');
        }
    };

    const takeCapture = async (type: 'photo' | 'video') => {
        try {
            setError(null);
            const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
            if (!cameraPermission.granted) {
                setError('Camera permission is required.');
                return;
            }

            if (selectedAssets.length >= 5) {
                setError('Maximum 5 files allowed.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: type === 'photo' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
                quality: 0.8,
                allowsEditing: false,
            });

            if (result.canceled || result.assets.length === 0) return;

            addAssets(result.assets);
        } catch (err: any) {
            setError('Failed to capture media.');
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                setError('Microphone permission is required.');
                return;
            }

            if (selectedAssets.length >= 5) {
                setError('Maximum 5 files allowed.');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );
            setRecording(recording);
            recordingRef.current = recording;
            setIsRecording(true);
            setRecordingDuration(0);

            const interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

            (recording as any)._durationInterval = interval;
        } catch (err) {
            setError('Failed to start recording.');
        }
    };

    const stopRecording = async () => {
        if (!recording) return;

        try {
            setIsRecording(false);
            if ((recording as any)._durationInterval) {
                clearInterval((recording as any)._durationInterval);
            }
            await recording.stopAndUnloadAsync();
            const uri = recording.getURI();
            setRecording(null);
            recordingRef.current = null;
            setRecordingDuration(0);

            if (uri) {
                const asset = {
                    uri,
                    type: 'audio' as const,
                    fileName: `recording_${Date.now()}.m4a`,
                };
                setSelectedAssets(prev => {
                    if (prev.length >= 5) return prev;
                    return [...prev, asset];
                });
            }
        } catch (err) {
            console.error('Stop recording error:', err);
            setError('Failed to stop recording.');
            setRecording(null);
            recordingRef.current = null;
            setIsRecording(false);
            setRecordingDuration(0);
        }
    };

    const addAssets = (newAssets: any[]) => {
        const MAX_SIZE = 50 * 1024 * 1024;
        const validAssets = newAssets.filter(a => (a.fileSize || 0) <= MAX_SIZE);

        if (validAssets.length < newAssets.length) {
            setError('Some files are too large. Max size is 50MB.');
        }

        setSelectedAssets(prev => {
            const combined = [...prev, ...validAssets];
            return combined.slice(0, 5);
        });
    };

    const uploadSelected = async () => {
        if (selectedAssets.length === 0) return;

        setTotalToUpload(selectedAssets.length);
        setError(null);

        const assetsToUpload = selectedAssets.map(asset => ({
            uri: asset.uri,
            type: asset.type as 'image' | 'video' | 'audio',
            fileName: (asset as any).fileName || `upload_${Date.now()}.${asset.type === 'video' ? 'mp4' : 'jpg'}`,
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

                    <ScrollView bounces={false} style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
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
                        ) : (
                            <>
                                {selectedAssets.length > 0 && (
                                    <View style={styles.previewSection}>
                                        <Text style={[styles.selectedCount, { color: colors.textSecondary }]}>
                                            {selectedAssets.length} file{selectedAssets.length > 1 ? 's' : ''} selected (max 5)
                                        </Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
                                            {selectedAssets.map((asset, index) => (
                                                <View key={index} style={styles.previewItem}>
                                                    {asset.type === 'audio' ? (
                                                        <View style={[styles.previewImage, { backgroundColor: colors.surfaceLight, alignItems: 'center', justifyContent: 'center' }]}>
                                                            <Ionicons name="musical-notes" size={32} color={colors.primary} />
                                                            <Text style={{ fontSize: 10, color: colors.textSecondary }}>Audio</Text>
                                                        </View>
                                                    ) : (
                                                        <Image source={{ uri: asset.uri }} style={[styles.previewImage, { backgroundColor: colors.surfaceLight }]} />
                                                    )}
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
                                )}

                                {selectedAssets.length < 5 && (
                                    <View style={styles.optionsGrid}>
                                        <View style={styles.optionSection}>
                                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Gallery</Text>
                                            <View style={styles.buttonRow}>
                                                <TouchableOpacity style={[styles.optionButton, !isOnline && styles.disabledButton]} onPress={() => pickMedia('image')} disabled={!isOnline}>
                                                    <View style={[styles.iconCircle, { backgroundColor: '#6C63FF20', borderColor: colors.border }]}>
                                                        <Ionicons name="image" size={24} color={colors.primary} />
                                                    </View>
                                                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>Images</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.optionButton, !isOnline && styles.disabledButton]} onPress={() => pickMedia('video')} disabled={!isOnline}>
                                                    <View style={[styles.iconCircle, { backgroundColor: '#FF6B9D20', borderColor: colors.border }]}>
                                                        <Ionicons name="videocam" size={24} color={colors.accent} />
                                                    </View>
                                                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>Videos</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        <View style={styles.optionSection}>
                                            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Capture</Text>
                                            <View style={styles.buttonRow}>
                                                <TouchableOpacity style={[styles.optionButton, !isOnline && styles.disabledButton]} onPress={() => takeCapture('photo')} disabled={!isOnline}>
                                                    <View style={[styles.iconCircle, { backgroundColor: '#4CAF5020', borderColor: colors.border }]}>
                                                        <Ionicons name="camera" size={24} color="#4CAF50" />
                                                    </View>
                                                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>Photo</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={[styles.optionButton, !isOnline && styles.disabledButton]} onPress={() => takeCapture('video')} disabled={!isOnline}>
                                                    <View style={[styles.iconCircle, { backgroundColor: '#FF980020', borderColor: colors.border }]}>
                                                        <Ionicons name="videocam" size={24} color="#FF9800" />
                                                    </View>
                                                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>Video</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[styles.optionButton, !isOnline && styles.disabledButton]}
                                                    onPress={isRecording ? stopRecording : startRecording}
                                                    disabled={!isOnline}
                                                >
                                                    <View style={[styles.iconCircle, { backgroundColor: isRecording ? '#F4433620' : '#2196F320', borderColor: colors.border }]}>
                                                        <Ionicons name={isRecording ? "stop" : "mic"} size={24} color={isRecording ? "#F44336" : "#2196F3"} />
                                                    </View>
                                                    <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                                                        {isRecording ? `${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')}` : "Audio"}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            </>
                        )}

                        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
                        </TouchableOpacity>
                    </ScrollView>
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
        paddingTop: SPACING.lg,
        paddingHorizontal: SPACING.lg,
        maxHeight: '90%',
        ...SHADOWS.medium,
    },
    contentScroll: {
        width: '100%',
    },
    contentContainer: {
        paddingBottom: SPACING.xxl,
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
    optionsGrid: {
        gap: SPACING.lg,
        marginVertical: SPACING.md,
    },
    optionSection: {
        gap: SPACING.sm,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: SPACING.xs,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: SPACING.lg,
        flexWrap: 'wrap',
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
