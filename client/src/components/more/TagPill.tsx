import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
    Universal:      { bg: '#1e3a5f', text: '#60a5fa' },
    Documentation:  { bg: '#2d1b69', text: '#a78bfa' },
    Architecture:   { bg: '#1a3a2a', text: '#34d399' },
    Backend:        { bg: '#3a1a1a', text: '#f87171' },
    Frontend:       { bg: '#1a2a3a', text: '#38bdf8' },
    Mobile:         { bg: '#2a1a3a', text: '#c084fc' },
    Testing:        { bg: '#1a3a1a', text: '#4ade80' },
    Refactoring:    { bg: '#3a2a1a', text: '#fb923c' },
    Security:       { bg: '#3a1a2a', text: '#f472b6' },
    Performance:    { bg: '#1a3a3a', text: '#2dd4bf' },
};

const DEFAULT_COLOR = { bg: '#2a2a2a', text: '#aaaaaa' };

interface TagPillProps {
    label: string;
    bg?: string;
    textColor?: string;
}

export const TagPill: React.FC<TagPillProps> = ({ label, bg, textColor }) => {
    const colors = TAG_COLORS[label] ?? DEFAULT_COLOR;
    const pillBg = bg ?? colors.bg;
    const pillText = textColor ?? colors.text;

    return (
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
            <Text style={[styles.label, { color: pillText }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
    },
});
