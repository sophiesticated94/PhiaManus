import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { Palette, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';

interface AppearanceScreenProps {
    navigation: any;
    onClose: () => void;
}

const THEME_OPTIONS = [
    { id: 'pink', name: 'Original Pink' },
    { id: 'cottonCandy', name: 'Cotton Candy' },
    { id: 'barbieCore', name: 'Barbie Core' },
    { id: 'lilacDream', name: 'Lilac Dream' },
    { id: 'cherryBlossom', name: 'Cherry Blossom' },
    { id: 'roseGold', name: 'Rose Gold' },
    { id: 'uglyMan', name: 'Ugly Man Theme' },
];

export const AppearanceScreen: React.FC<AppearanceScreenProps> = ({ navigation, onClose }) => {
    const { theme, themeName, setTheme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader title="Appearance" onClose={onClose} onBack={() => navigation.goBack()} />
            
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.accent }]}>
                            <Palette color="#fff" size={18} />
                        </View>
                        <View>
                            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Themes</Text>
                            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>Select your preferred aesthetic.</Text>
                        </View>
                    </View>

                    <View style={styles.list}>
                        {THEME_OPTIONS.map((t, index) => {
                            const isActive = themeName === t.id;
                            const isLast = index === THEME_OPTIONS.length - 1;
                            
                            return (
                                <TouchableOpacity 
                                    key={t.id} 
                                    style={[styles.row, !isLast && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                                    onPress={() => setTheme(t.id)}
                                >
                                    <Text style={[styles.rowText, { color: theme.textPrimary, fontWeight: isActive ? 'bold' : 'normal' }]}>
                                        {t.name}
                                    </Text>
                                    {isActive && <Check color={theme.accent} size={20} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16 },
    card: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    list: {
        marginTop: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    rowText: {
        fontSize: 15,
    },
});
