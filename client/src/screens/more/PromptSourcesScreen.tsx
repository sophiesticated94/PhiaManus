import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
} from 'react-native';
import { TouchableOpacity, FlatList } from 'react-native';
import { Plus, Trash2, Globe, HardDrive } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { usePrompts, PromptSource } from '../../hooks/usePrompts';

interface PromptSourcesScreenProps {
    navigation: any;
    onClose: () => void;
}

export const PromptSourcesScreen: React.FC<PromptSourcesScreenProps> = ({
    navigation,
    onClose,
}) => {
    const { theme } = useTheme();
    const { sources, removeSource, addSource } = usePrompts();

    const handleDelete = (source: PromptSource) => {
        if (source.id === 'default') return;
        Alert.alert(
            'Remove Source',
            `Remove "${source.name}"? Prompts from this source will no longer appear in your library.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeSource(source.id) },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Prompt Sources"
                onBack={() => navigation.goBack()}
                onClose={onClose}
                rightIcon={<Plus color={theme.accent} size={22} />}
                onRightIcon={() =>
                    navigation.navigate('AddSourceScreen')
                }
            />
            <FlatList
                data={sources}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <Text style={[styles.hint, { color: theme.textMuted }]}>
                        Each source is a remote JSON file following the PhiaManus prompt schema.
                    </Text>
                }
                renderItem={({ item }) => {
                    let rowBg = theme.surfaceElevated;
                    if (item.id === 'default') {
                        rowBg = theme.accentSoft; // Pinky for default
                    } else if (item.type === 'remote') {
                        // Baby-pink for user remote sources
                        // Assuming theme.accent is hex, we can use an opacity wrapper, but let's just use a fixed color or light accent
                        rowBg = theme.accent + '20'; 
                    }

                    return (
                        <TouchableOpacity style={[styles.row, { backgroundColor: rowBg, borderColor: theme.border }]} activeOpacity={0.7}>
                            <View style={[styles.typeIcon, { backgroundColor: item.type === 'remote' ? theme.accentSoft : theme.surfaceHighlight }]}>
                                {item.type === 'remote'
                                    ? <Globe color={theme.accent} size={16} />
                                    : <HardDrive color={theme.textSecondary} size={16} />
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
                            {item.id !== 'default' && item.type !== 'local' && (
                                <TouchableOpacity
                                    style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.1)' }]}
                                    onPress={() => handleDelete(item)}
                                >
                                    <Trash2 color={theme.danger} size={16} />
                                </TouchableOpacity>
                            )}
                        </TouchableOpacity>
                    );
                }}
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

