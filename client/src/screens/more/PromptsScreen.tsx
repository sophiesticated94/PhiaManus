import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { Settings2, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { Prompt, PromptCategory, usePrompts } from '../../hooks/usePrompts';

interface PromptsScreenProps {
    navigation: any;
    onSendPrompt: (prompt: Prompt) => void;
    onClose: () => void;
}

export const PromptsScreen: React.FC<PromptsScreenProps> = ({ navigation, onSendPrompt, onClose }) => {
    const { theme } = useTheme();
    const {
        categories,
        sources,
        isLoading,
        refresh,
        addSource,
        removeSource,
        addLocalPrompt,
        editLocalPrompt,
        deleteLocalPrompt,
    } = usePrompts();
    const [search, setSearch] = useState('');

    const filteredSections = useCallback(() => {
        if (!search.trim()) return categories;
        const q = search.toLowerCase();
        return categories
            .map(cat => ({
                ...cat,
                prompts: cat.prompts.filter(
                    p =>
                        p.title.toLowerCase().includes(q) ||
                        p.subtitle.toLowerCase().includes(q)
                ),
            }))
            .filter(cat => cat.prompts.length > 0);
    }, [categories, search]);

    const sections = filteredSections().map(cat => ({
        title: cat.category,
        data: cat.prompts,
        sourceId: cat.sourceId,
    }));

    const renderItem = ({ item }: { item: Prompt }) => (
        <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surfaceElevated }]}
            onPress={() => navigation.navigate('PromptDetailScreen', { prompt: item, onSendPrompt })}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBadge, { backgroundColor: item.iconBg }]}>
                <Text style={styles.iconText}>✦</Text>
            </View>
            <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={2}>
                    {item.subtitle}
                </Text>
            </View>
            <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{section.title}</Text>
    );

    const renderSectionFooter = () => <View style={{ height: 8 }} />;

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Prompts"
                onBack={() => navigation.goBack()}
                onClose={onClose}
                rightIcon={<Settings2 color={theme.textSecondary} size={20} />}
                onRightIcon={() =>
                    navigation.navigate('PromptSourcesScreen', {
                        sources,
                        onRemoveSource: removeSource,
                        onAddSource: addSource,
                    })
                }
            />

            {isLoading && categories.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.accent} size="large" />
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    renderSectionFooter={renderSectionFooter}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={refresh}
                            tintColor={theme.accent}
                        />
                    }
                    ListFooterComponent={
                        <TouchableOpacity
                            style={[styles.addCustomBtn, { borderColor: theme.border }]}
                            onPress={() =>
                                navigation.navigate('EditLocalPromptScreen', {
                                    onSave: addLocalPrompt,
                                })
                            }
                        >
                            <Plus color={theme.accent} size={16} />
                            <Text style={[styles.addCustomText, { color: theme.accent }]}>
                                Add Custom Prompt
                            </Text>
                        </TouchableOpacity>
                    }
                />
            )}

            {/* Sticky search bar at bottom */}
            <View style={[styles.searchBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary }]}
                    placeholder="🔍  Search prompts..."
                    placeholderTextColor={theme.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 16, paddingBottom: 80 },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        paddingTop: 20,
        paddingBottom: 8,
        paddingHorizontal: 4,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 2,
        gap: 12,
    },
    iconBadge: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    iconText: { fontSize: 18, color: '#fff' },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
    rowSub: { fontSize: 12, lineHeight: 16 },
    chevron: { fontSize: 20, fontWeight: '300' },
    addCustomBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'center',
        marginTop: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    addCustomText: { fontSize: 15, fontWeight: '500' },
    searchBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    searchInput: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 15,
    },
});
