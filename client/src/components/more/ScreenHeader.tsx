import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ChevronLeft, X } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface ScreenHeaderProps {
    title: string;
    onBack?: () => void;
    onClose: () => void;
    rightIcon?: ReactNode;
    onRightIcon?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
    title,
    onBack,
    onClose,
    rightIcon,
    onRightIcon,
}) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.bg }]}>
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
            <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={1}>
                {title}
            </Text>

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
        paddingVertical: 14,
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
    title: {
        flex: 1,
        textAlign: 'center',
        fontSize: 17,
        fontWeight: '600',
    },
    iconBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
