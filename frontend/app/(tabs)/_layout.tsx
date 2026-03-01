import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/constants/ThemeContext';

export default function TabsLayout() {
    const insets = useSafeAreaInsets();
    const { colors } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    borderTopColor: colors.border,
                    borderTopWidth: 1,
                    paddingTop: 8,
                    paddingBottom: Math.max(insets.bottom, 16),
                    height: 64 + Math.max(insets.bottom, 16),
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="gallery"
                options={{
                    title: 'Gallery',
                    tabBarIcon: ({ focused, color }) => (
                        <View>
                            {focused && (
                                <LinearGradient
                                    colors={['#6C63FF', '#8B83FF']}
                                    style={styles.activeIndicator}
                                />
                            )}
                            <Ionicons name={focused ? 'images' : 'images-outline'} size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="favorites"
                options={{
                    title: 'Favorites',
                    tabBarIcon: ({ focused, color }) => (
                        <View>
                            {focused && (
                                <LinearGradient
                                    colors={['#FF6B9D', '#FF8FB5']}
                                    style={styles.activeIndicator}
                                />
                            )}
                            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <View>
                            {focused && (
                                <LinearGradient
                                    colors={['#6C63FF', '#FF6B9D']}
                                    style={styles.activeIndicator}
                                />
                            )}
                            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    activeIndicator: {
        position: 'absolute',
        top: -10,
        left: '50%',
        marginLeft: -14,
        width: 20,
        height: 3,
        borderRadius: 2,
    },
});
