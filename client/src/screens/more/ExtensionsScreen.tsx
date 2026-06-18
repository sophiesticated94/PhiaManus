import React, { useState, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Image,
    RefreshControl,
} from 'react-native';
import { TouchableOpacity, FlatList } from 'react-native-gesture-handler';
import { Settings2, Star, ChevronDown, ArrowUpDown } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { useExtensions, Extension } from '../../hooks/useExtensions';

interface ExtensionsScreenProps {
    navigation: any;
    onClose: () => void;
}

type SortMode = 'stars_desc' | 'stars_asc' | 'name_asc' | 'name_desc';

const SORT_LABELS: Record<SortMode, string> = {
    stars_desc: 'Stars ↓',
    stars_asc: 'Stars ↑',
    name_asc: 'Name A→Z',
    name_desc: 'Name Z→A',
};

const SORT_CYCLE: SortMode[] = ['stars_desc', 'stars_asc', 'name_asc', 'name_desc'];

function formatStars(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
}

export const ExtensionsScreen: React.FC<ExtensionsScreenProps> = ({ navigation, onClose }) => {
    const { theme } = useTheme();
    const { extensions, sources, isLoading, refresh, addSource, removeSource } = useExtensions();

    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState<string>('All');
    const [sortMode, setSortMode] = useState<SortMode>('stars_desc');

    // Collect all unique tags
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        extensions.forEach(ext => ext.tags.forEach(t => tagSet.add(t)));
        return ['All', ...Array.from(tagSet).sort()];
    }, [extensions]);

    const filtered = useMemo(() => {
        let result = [...extensions];

        // Filter by tag
        if (selectedTag !== 'All') {
            result = result.filter(e => e.tags.includes(selectedTag));
        }

        // Filter by search
        const q = search.trim();
        if (q) {
            const fuse = new Fuse(result, {
                keys: ['name', 'author', 'description', 'tags'],
                threshold: 0.4,
            });
            result = fuse.search(q).map(res => res.item);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortMode) {
                case 'stars_desc': return b.stars - a.stars;
                case 'stars_asc': return a.stars - b.stars;
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
            }
        });

        return result;
    }, [extensions, selectedTag, search, sortMode]);

    const cycleSortMode = () => {
        const idx = SORT_CYCLE.indexOf(sortMode);
        setSortMode(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length]);
    };

    const renderExtensionCard = ({ item }: { item: Extension }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}
            onPress={() => navigation.navigate('ExtensionDetailScreen', { extension: item })}
            activeOpacity={0.75}
        >
            <View style={styles.cardHeader}>
                {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.surface }]} />
                )}
                <View style={styles.cardMeta}>
                    <Text style={[styles.cardName, { color: theme.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.cardAuthor, { color: theme.textMuted }]}>@{item.author}/{item.name}</Text>
                </View>
                <View style={styles.starsRow}>
                    <Text style={[styles.starsText, { color: theme.textSecondary }]}>{formatStars(item.stars)}</Text>
                    <Star color="#f59e0b" size={14} fill="#f59e0b" />
                </View>
                <Text style={[styles.chevron, { color: theme.textMuted }]}>›</Text>
            </View>

            <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={3}>
                {item.description}
            </Text>

            {item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                    {item.tags.map(tag => (
                        <TouchableOpacity
                            key={tag}
                            style={[
                                styles.tag,
                                {
                                    backgroundColor: selectedTag === tag ? theme.accent + '30' : theme.surface,
                                    borderColor: selectedTag === tag ? theme.accent : theme.border,
                                }
                            ]}
                            onPress={() => setSelectedTag(selectedTag === tag ? 'All' : tag)}
                        >
                            <Text style={[styles.tagText, { color: selectedTag === tag ? theme.accent : theme.textMuted }]}>
                                {tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Extensions"
                subtitle={selectedTag === 'All' ? 'All' : selectedTag}
                onBack={() => navigation.goBack()}
                onClose={onClose}
                rightIcon={<Settings2 color={theme.textSecondary} size={20} />}
                onRightIcon={() =>
                    navigation.navigate('ExtensionSourcesScreen', {
                        sources,
                        onRemoveSource: removeSource,
                        onAddSource: addSource,
                    })
                }
            />

            {/* Category filter chips */}
            <FlatList
                horizontal
                data={allTags}
                keyExtractor={t => t}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterBar}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            {
                                backgroundColor: selectedTag === item ? theme.accent : theme.surface,
                                borderColor: selectedTag === item ? theme.accent : theme.border,
                            }
                        ]}
                        onPress={() => setSelectedTag(item)}
                    >
                        <Text style={[styles.filterChipText, { color: selectedTag === item ? '#fff' : theme.textSecondary }]}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            {/* Sort button */}
            <View style={[styles.sortBar, { borderBottomColor: theme.border }]}>
                <Text style={[styles.resultCount, { color: theme.textMuted }]}>
                    {filtered.length} extension{filtered.length !== 1 ? 's' : ''}
                </Text>
                <TouchableOpacity style={[styles.sortBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={cycleSortMode}>
                    <ArrowUpDown color={theme.textSecondary} size={14} />
                    <Text style={[styles.sortBtnText, { color: theme.textSecondary }]}>{SORT_LABELS[sortMode]}</Text>
                </TouchableOpacity>
            </View>

            {isLoading && extensions.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.accent} size="large" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={renderExtensionCard}
                    contentContainerStyle={styles.list}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={theme.accent} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                                No extensions found for "{search || selectedTag}"
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Search bar pinned at bottom */}
            <View style={[styles.searchBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <TextInput
                    style={[styles.searchInput, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary }]}
                    placeholder="🔍  Search name, author, description..."
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
    filterBar: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginRight: 8,
    },
    filterChipText: { fontSize: 13, fontWeight: '500' },
    sortBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    resultCount: { fontSize: 13 },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    sortBtnText: { fontSize: 13, fontWeight: '500' },
    list: { padding: 16, paddingBottom: 100 },
    card: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 10,
    },
    avatarPlaceholder: {
        width: 38,
        height: 38,
        borderRadius: 10,
    },
    cardMeta: { flex: 1 },
    cardName: { fontSize: 15, fontWeight: '600' },
    cardAuthor: { fontSize: 12, marginTop: 1 },
    starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    starsText: { fontSize: 13, fontWeight: '500' },
    chevron: { fontSize: 20 },
    cardDesc: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: {
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    tagText: { fontSize: 11, fontWeight: '600' },
    empty: { alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 15 },
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
