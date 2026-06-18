import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ChevronLeft, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    onClose: () => void;
    rightIcon?: ReactNode;
    onRightIcon?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    subtitle,
    onBack,
    onClose,
    rightIcon,
    onRightIcon,
}) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const paddingTop = Platform.OS === 'android' ? insets.top : 0;

    return (
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.bg, paddingTop }]}>
            {/* Left */}
            <View style={styles.side}>
                {onBack && (
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
                        onPress={onBack}
                    >
                        <ChevronLeft color={theme.textPrimary} size={20} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Center */}
            <View style={styles.centerBlock}>
                <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={[styles.subtitle, { color: theme.textMuted }]} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>

            {/* Right */}
            <View style={[styles.side, styles.sideRight]}>
                {rightIcon && onRightIcon && (
                    <TouchableOpacity
                        style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
                        onPress={onRightIcon}
                    >
                        {rightIcon}
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: theme.surfaceElevated }]}
                    onPress={onClose}
                >
                    <X color={theme.textPrimary} size={18} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 14,
        paddingTop: Platform.OS === 'ios' ? 14 : 0, // Fallback for iOS
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    side: {
        width: 80,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sideRight: {
        justifyContent: 'flex-end',
    },
    centerBlock: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '600',
    },
    subtitle: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 1,
    },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
