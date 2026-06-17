import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';

interface MenuRowProps {
    icon?: ReactNode;
    iconBg?: string;
    title: string;
    subtitle?: string;
    rightValue?: string;
    rightElement?: ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
}

export const MenuRow: React.FC<MenuRowProps> = ({
    icon,
    iconBg,
    title,
    subtitle,
    rightValue,
    rightElement,
    onPress,
    showChevron = true,
}) => {
    const { theme } = useTheme();

    const content = (
        <View style={styles.row}>
            {icon && (
                <View
                    style={[
                        styles.iconBadge,
                        { backgroundColor: iconBg ?? theme.accent },
                    ]}
                >
                    {icon}
                </View>
            )}
            <View style={styles.textGroup}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightElement ?? (
                rightValue !== undefined ? (
                    <Text style={[styles.rightValue, { color: theme.textMuted }]}>{rightValue}</Text>
                ) : (
                    onPress && showChevron && (
                        <ChevronRight color={theme.textMuted} size={16} />
                    )
                )
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 14,
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textGroup: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        fontWeight: '500',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    rightValue: {
        fontSize: 14,
    },
});
