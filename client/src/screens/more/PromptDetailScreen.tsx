import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Clipboard,
} from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { TagPill } from '../../components/more/TagPill';
import { Prompt } from '../../hooks/usePrompts';
import { useSocketContext } from '../../hooks/SocketContext';

interface PromptDetailScreenProps {
    navigation: any;
    route: {
        params: {
            prompt: Prompt;
        };
    };
    onClose: () => void;
}

export const PromptDetailScreen: React.FC<PromptDetailScreenProps> = ({
    navigation,
    route,
    onClose,
}) => {
    const { theme } = useTheme();
    const { prompt } = route.params;
    const { sendMessage } = useSocketContext();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await Clipboard.setString(prompt.body);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleUse = () => {
        sendMessage({ type: 'SAVE_CONTEXT', promptId: prompt.id, title: prompt.title, body: prompt.body });
        onClose();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title={prompt.title}
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Icon + Subtitle + Tags */}
                <View style={styles.meta}>
                    <View style={[styles.iconBadge, { backgroundColor: prompt.iconBg }]}>
                        <Text style={styles.iconText}>✦</Text>
                    </View>
                    <View style={styles.metaText}>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            {prompt.subtitle}
                        </Text>
                        {prompt.tags.length > 0 && (
                            <View style={styles.tags}>
                                {prompt.tags.map(tag => (
                                    <TagPill key={tag} label={tag} />
                                ))}
                            </View>
                        )}
                    </View>
                </View>

                {/* Body */}
                <View style={[styles.bodyCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <Text style={[styles.body, { color: theme.textPrimary }]}>{prompt.body}</Text>
                </View>
            </ScrollView>

            {/* Actions */}
            <View style={[styles.actions, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                    onPress={handleUse}
                >
                    <Text style={styles.primaryBtnText}>Use in Antigravity</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopy}>
                    <Text style={[styles.secondaryBtnText, { color: copied ? theme.success : theme.textSecondary }]}>
                        {copied ? 'Copied! ✓' : 'Copy to Clipboard'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    meta: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 14 },
    iconBadge: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    iconText: { fontSize: 22, color: '#fff' },
    metaText: { flex: 1 },
    subtitle: { fontSize: 15, lineHeight: 21, marginBottom: 8 },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    bodyCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
    body: { fontSize: 15, lineHeight: 24 },
    actions: {
        borderTopWidth: StyleSheet.hairlineWidth,
        padding: 16,
        paddingBottom: 24,
        gap: 4,
    },
    primaryBtn: {
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    secondaryBtn: { padding: 14, alignItems: 'center' },
    secondaryBtnText: { fontSize: 15, fontWeight: '500' },
});

