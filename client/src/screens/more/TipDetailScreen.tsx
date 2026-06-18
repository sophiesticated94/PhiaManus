import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { Tip } from '../../hooks/useTips';

interface TipDetailScreenProps {
    navigation: any;
    route: { params: { tip: Tip } };
    onClose: () => void;
}

export const TipDetailScreen: React.FC<TipDetailScreenProps> = ({ navigation, route, onClose }) => {
    const { theme } = useTheme();
    const { tip } = route.params;

    const markdownStyles = {
        body: { color: theme.textPrimary, fontSize: 15, lineHeight: 24 },
        heading1: { color: theme.textPrimary, fontSize: 22, fontWeight: '700' as const, marginBottom: 8, marginTop: 0 },
        heading2: { color: theme.textPrimary, fontSize: 18, fontWeight: '700' as const, marginTop: 20, marginBottom: 8 },
        heading3: { color: theme.textSecondary, fontSize: 15, fontWeight: '600' as const, marginTop: 16, marginBottom: 4 },
        paragraph: { color: theme.textSecondary, marginBottom: 12, lineHeight: 22 },
        code_inline: {
            backgroundColor: theme.surfaceElevated,
            color: theme.accent,
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
            fontFamily: 'monospace',
            fontSize: 13,
        },
        fence: {
            backgroundColor: theme.surfaceElevated,
            borderRadius: 10,
            padding: 16,
            marginVertical: 12,
        },
        code_block: {
            backgroundColor: theme.surfaceElevated,
            borderRadius: 10,
            padding: 16,
            fontFamily: 'monospace',
            fontSize: 13,
            color: theme.textPrimary,
        },
        blockquote: {
            backgroundColor: theme.accentSoft,
            borderLeftColor: theme.accent,
            borderLeftWidth: 3,
            paddingLeft: 12,
            paddingVertical: 4,
            marginVertical: 12,
            borderRadius: 4,
        },
        table: {
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            marginVertical: 12,
        },
        th: {
            backgroundColor: theme.surfaceElevated,
            padding: 10,
        },
        td: {
            padding: 10,
            borderTopWidth: 1,
            borderTopColor: theme.border,
        },
        tr: {
            borderBottomWidth: 0,
        },
        th_text: { color: theme.textPrimary, fontWeight: '600' as const },
        td_text: { color: theme.textSecondary },
        bullet_list: { marginBottom: 12 },
        ordered_list: { marginBottom: 12 },
        list_item: { color: theme.textSecondary, marginBottom: 4 },
        hr: { backgroundColor: theme.border, marginVertical: 16 },
        strong: { color: theme.textPrimary, fontWeight: '700' as const },
        em: { color: theme.textSecondary, fontStyle: 'italic' as const },
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title={tip.title}
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
            >
                <View style={styles.metaBadge}>
                    <View style={[styles.iconBadge, { backgroundColor: tip.iconBg }]}>
                        <Text style={styles.iconText}>{tip.icon}</Text>
                    </View>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>{tip.subtitle}</Text>
                </View>
                <Markdown style={markdownStyles}>
                    {tip.body}
                </Markdown>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: 20 },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 20,
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: { fontSize: 22 },
    subtitle: { flex: 1, fontSize: 14, lineHeight: 20 },
});

