import React from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { TouchableOpacity, FlatList } from 'react-native-gesture-handler';
import { Plus, Trash2, Globe, Package } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { ExtensionSource } from '../../hooks/useExtensions';

interface ExtensionSourcesScreenProps {
    navigation: any;
    route: {
        params: {
            sources: ExtensionSource[];
            onRemoveSource: (id: string) => Promise<void>;
            onAddSource: (repo: string) => Promise<void>;
        };
    };
    onClose: () => void;
}

export const ExtensionSourcesScreen: React.FC<ExtensionSourcesScreenProps> = ({
    navigation,
    route,
    onClose,
}) => {
    const { theme } = useTheme();
    const { sources, onRemoveSource, onAddSource } = route.params;

    const handleDelete = (source: ExtensionSource) => {
        if (source.id === 'default') return;
        Alert.alert(
            'Remove Extension',
            `Remove "${source.name}" from your extension list?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onRemoveSource(source.id) },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Extension Sources"
                onBack={() => navigation.goBack()}
                onClose={onClose}
                rightIcon={<Plus color={theme.accent} size={22} />}
                onRightIcon={() =>
                    navigation.navigate('AddExtensionSourceScreen', { onAdd: onAddSource })
                }
            />
            <FlatList
                data={sources}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Text style={[styles.hint, { color: theme.textMuted }]}>
                        Add GitHub repositories to include them in your Extensions list.
                        Enter a repo as "owner/repo" (e.g. "obra/superpowers").
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={[styles.row, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                        <View style={[styles.typeIcon, { backgroundColor: item.type === 'default' ? theme.accentSoft : theme.surfaceHighlight }]}>
                            {item.type === 'default'
                                ? <Package color={theme.accent} size={16} />
                                : <Globe color={theme.textSecondary} size={16} />
                            }
                        </View>
                        <View style={styles.info}>
                            <Text style={[styles.sourceName, { color: theme.textPrimary }]}>{item.name}</Text>
                            {item.repo && (
                                <Text style={[styles.sourceRepo, { color: theme.textMuted }]} numberOfLines={1}>
                                    github.com/{item.repo}
                                </Text>
                            )}
                        </View>
                        {item.id !== 'default' && (
                            <TouchableOpacity
                                style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                                onPress={() => handleDelete(item)}
                            >
                                <Trash2 color={theme.danger} size={16} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16, paddingBottom: 40 },
    hint: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        gap: 12,
    },
    typeIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: { flex: 1 },
    sourceName: { fontSize: 15, fontWeight: '500' },
    sourceRepo: { fontSize: 12, marginTop: 2 },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
