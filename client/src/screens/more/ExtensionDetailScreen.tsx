import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Image } from 'react-native';
import { ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../../theme/ThemeContext';
import { TouchableOpacity } from 'react-native';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { Extension, useExtensions } from '../../hooks/useExtensions';

interface ExtensionDetailScreenProps {
    navigation: any;
    route: { params: { extension: Extension } };
    onClose: () => void;
}

export const ExtensionDetailScreen: React.FC<ExtensionDetailScreenProps> = ({ navigation, route, onClose }) => {
    const { theme } = useTheme();
    const { extension } = route.params;
    const [readme, setReadme] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isInstalling, setIsInstalling] = useState(false);

    const { installedExtensions, installExtension, uninstallExtension, toggleExtension } = useExtensions();
    
    const installedState = installedExtensions.find(e => e.id === extension.repo);
    const isInstalled = !!installedState;
    const isEnabled = installedState?.status === 'enabled';

    // When installing, if it suddenly becomes installed, turn off spinner
    useEffect(() => {
        if (isInstalled && isInstalling) {
            setIsInstalling(false);
        }
    }, [isInstalled, isInstalling]);

    useEffect(() => {
        async function fetchReadme() {
            setIsLoading(true);
            setError(null);
            try {
                const branches = ['main', 'master'];
                let text: string | null = null;
                for (const branch of branches) {
                    const url = `https://raw.githubusercontent.com/${extension.repo}/${branch}/README.md`;
                    const res = await fetch(url);
                    if (res.ok) {
                        text = await res.text();
                        break;
                    }
                }
                if (!text) throw new Error('README not found');
                setReadme(text);
            } catch (e: any) {
                setError(e.message ?? 'Could not load README');
            } finally {
                setIsLoading(false);
            }
        }
        fetchReadme();
    }, [extension.repo]);

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
        th: { backgroundColor: theme.surfaceElevated, padding: 10 },
        td: { padding: 10, borderTopWidth: 1, borderTopColor: theme.border },
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
                title={extension.name}
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                {/* Extension metadata card */}
                <View style={[styles.metaCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    {extension.avatarUrl ? (
                        <Image source={{ uri: extension.avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]} />
                    )}
                    <View style={styles.metaText}>
                        <Text style={[styles.metaName, { color: theme.textPrimary }]}>{extension.name}</Text>
                        <Text style={[styles.metaAuthor, { color: theme.textMuted }]}>@{extension.author}</Text>
                        <Text style={[styles.metaRepo, { color: theme.accent }]}>
                            github.com/{extension.repo}
                        </Text>
                    </View>
                    <View style={styles.starsBox}>
                        <Text style={[styles.starsNum, { color: theme.textPrimary }]}>
                            {extension.stars >= 1000 ? `${(extension.stars / 1000).toFixed(1)}k` : extension.stars}
                        </Text>
                        <Text style={[styles.starLabel, { color: theme.textMuted }]}>★ stars</Text>
                    </View>
                </View>

                {extension.tags.length > 0 && (
                    <View style={styles.tagsRow}>
                        {extension.tags.map(tag => (
                            <View key={tag} style={[styles.tag, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <Text style={[styles.tagText, { color: theme.textMuted }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Actions Row */}
                <View style={styles.actionsRow}>
                    {!isInstalled ? (
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: theme.accent }]}
                            onPress={() => {
                                setIsInstalling(true);
                                installExtension(extension);
                            }}
                            disabled={isInstalling}
                        >
                            {isInstalling ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.primaryBtnText}>Install Extension</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[styles.secondaryBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                                onPress={() => toggleExtension(extension.repo)}
                            >
                                <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
                                    {isEnabled ? 'Disable' : 'Enable'}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.dangerBtn, { borderColor: theme.danger }]}
                                onPress={() => uninstallExtension(extension.repo)}
                            >
                                <Text style={[styles.dangerBtnText, { color: theme.danger }]}>Uninstall</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.secondaryBtn, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
                                onPress={() => {}}
                            >
                                <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>Manage</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {isLoading ? (
                    <View style={styles.center}>
                        <ActivityIndicator color={theme.accent} size="large" />
                        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Fetching README...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.center}>
                        <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                    </View>
                ) : (
                    <Markdown style={markdownStyles}>{readme ?? ''}</Markdown>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: 16 },
    metaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginBottom: 12,
    },
    avatar: { width: 48, height: 48, borderRadius: 12 },
    avatarPlaceholder: { width: 48, height: 48, borderRadius: 12 },
    metaText: { flex: 1 },
    metaName: { fontSize: 17, fontWeight: '700' },
    metaAuthor: { fontSize: 13, marginTop: 1 },
    metaRepo: { fontSize: 12, marginTop: 2 },
    starsBox: { alignItems: 'center' },
    starsNum: { fontSize: 16, fontWeight: '700' },
    starLabel: { fontSize: 11 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 20 },
    tag: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
    tagText: { fontSize: 11, fontWeight: '600' },
    center: { paddingTop: 40, alignItems: 'center', gap: 12 },
    loadingText: { fontSize: 14 },
    errorText: { fontSize: 15 },
    actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
    primaryBtn: {
        flex: 1,
        minWidth: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    secondaryBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryBtnText: { fontSize: 14, fontWeight: '600' },
    dangerBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    dangerBtnText: { fontSize: 14, fontWeight: '600' },
});

