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

    const confirmRemove = (id: string) => {
        Alert.alert(
            "Remove Source",
            "Are you sure you want to remove this theme source?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Remove", style: "destructive", onPress: () => onRemoveSource(id) }
            ]
        );
    };

    const renderItem = ({ item }: { item: ThemeSource }) => (
        <View style={[styles.row, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.border }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.accent + '20' }]}>
                {item.id === 'default' ? (
                    <FileJson color={theme.accent} size={20} />
                ) : (
                    <Globe color={theme.accent} size={20} />
                )}
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.nameText, { color: theme.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.urlText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.url || 'Local bundled'}
                </Text>
            </View>
            {item.id !== 'default' && (
                <TouchableOpacity onPress={() => confirmRemove(item.id)} style={styles.deleteBtn}>
                    <Trash2 color={theme.danger} size={20} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Theme Sources"
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            <FlatList
                data={sources}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.accent }]}
                onPress={() => navigation.navigate('AddThemeSourceScreen', { onAddSource })}
            >
                <Plus color="#fff" size={24} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    list: { padding: 16 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: { flex: 1 },
    nameText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
    urlText: { fontSize: 13 },
    deleteBtn: { padding: 8 },
    fab: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
});
