import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { useAppDispatch } from '@/store';
import { registerThunk, loginThunk } from '@/store/thunks/authThunks';
import { SPACING, RADIUS, FONTS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/constants/ThemeContext';

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { colors } = useTheme();

    const handleRegister = async () => {
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            Toast.show({ type: 'error', text1: 'Please fill in all fields' });
            return;
        }

        if (password.length < 6) {
            Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
            return;
        }

        if (password !== confirmPassword) {
            Toast.show({ type: 'error', text1: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            await dispatch(registerThunk({ email: email.trim(), password })).unwrap();
            await dispatch(loginThunk({ email: email.trim(), password })).unwrap();
            Toast.show({ type: 'success', text1: 'Account created!' });
            router.replace('/(tabs)/gallery');
        } catch (err: any) {
            const message = typeof err === 'string'
                ? err
                : err?.message || 'Something went wrong';
            Toast.show({
                type: 'error',
                text1: 'Registration Failed',
                text2: message,
                visibilityTime: 4000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <LinearGradient
                            colors={['#FF6B9D', '#6C63FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.logoGradient}
                        >
                            <Ionicons name="person-add" size={36} color="#FFFFFF" />
                        </LinearGradient>
                    </View>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join the cloud media gallery</Text>
                </View>

                <View style={styles.form}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary }]}
                            placeholder="Email address"
                            placeholderTextColor={colors.textMuted}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary }]}
                            placeholder="Password"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                            style={[styles.input, { color: colors.textPrimary }]}
                            placeholder="Confirm password"
                            placeholderTextColor={colors.textMuted}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.registerButton, loading && styles.disabledButton]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={['#FF6B9D', '#6C63FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.registerButtonText}>Create Account</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text style={[styles.linkText, { color: colors.accent }]}>Sign In</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xxl,
    },
    logoContainer: {
        marginBottom: SPACING.lg,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        ...SHADOWS.glow,
    },
    title: {
        ...FONTS.hero,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        ...FONTS.regular,
        fontSize: 16,
    },
    form: {
        gap: SPACING.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        paddingHorizontal: SPACING.md,
        height: 56,
    },
    inputIcon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    registerButton: {
        marginTop: SPACING.sm,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.glow,
    },
    disabledButton: {
        opacity: 0.7,
    },
    gradientButton: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: RADIUS.lg,
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.xl,
    },
    footerText: {
        fontSize: 15,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
