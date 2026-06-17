import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface SectionCardProps {
    label: string;
    children: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({ label, children }) => {
    const { theme } = useTheme();

    const childrenArray = React.Children.toArray(children);

    return (
        <View style={styles.wrapper}>
            <Text style={[styles.label, { color: theme.textMuted }]}>{label.toUpperCase()}</Text>
            <View
                style={[
                    styles.card,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
            >
                {childrenArray.map((child, index) => (
                    <View key={index}>
                        {child}
                        {index < childrenArray.length - 1 && (
                            <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 28,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.8,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 66,
    },
});
