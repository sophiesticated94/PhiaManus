import React from 'react';
import { View, StyleSheet, Text,   Alert } from 'react-native';
import { TouchableOpacity, FlatList } from 'react-native-gesture-handler';
import { Plus, Trash2, Globe, FileJson } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { ThemeSource } from '../../hooks/useThemes';

interface ThemeSourcesScreenProps {
    navigation: any;
    route: {
        params: {
            sources: ThemeSource[];
            onRemoveSource: (id: string) => void;
            onAddSource: (name: string, url: string) => void;
        };
    };
    onClose: () => void;
}

export const ThemeSourcesScreen: React.FC<ThemeSourcesScreenProps> = ({ navigation, route, onClose }) => {
    const { theme } = useTheme();
    const { sources, onRemoveSource, onAddSource } = route.params;

    const handleDelete = (source: ThemeSource) => {
        if (source.id === 'default') return;
        Alert.alert(
            'Remove Source',
            `Remove "${source.name}"? Themes from this source will no longer appear in your app.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onRemoveSource(source.id) },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Theme Sources"
                onBack={() => navigation.goBack()}
                onClose={onClose}
                rightIcon={<Plus color={theme.accent} size={22} />}
                onRightIcon={() =>
                    navigation.navigate('AddThemeSourceScreen', { onAddSource })
                }
            />
            <FlatList
                data={sources}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Text style={[styles.hint, { color: theme.textMuted }]}>
                        Each source is a remote JSON file following the PhiaManus theme schema.
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={[styles.row, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                        <View style={[styles.typeIcon, { backgroundColor: item.type === 'remote' ? theme.accentSoft : theme.surfaceHighlight }]}>
                            {item.id === 'default'
                                ? <FileJson color={theme.accent} size={16} />
                                : <Globe color={theme.accent} size={16} />
                            }
                        </View>
                        <View style={styles.info}>
                            <Text style={[styles.sourceName, { color: theme.textPrimary }]}>{item.name}</Text>
                            {item.url && (
                                <Text style={[styles.sourceUrl, { color: theme.textMuted }]} numberOfLines={1}>
                                    {item.url}
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
    sourceUrl: { fontSize: 12, marginTop: 2 },
    deleteBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});
