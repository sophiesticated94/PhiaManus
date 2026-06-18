import React from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Settings2, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useThemes } from '../../hooks/useThemes';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { ThemeSlider } from '../../components/more/ThemeSlider';

interface AppearanceScreenProps {
    navigation: any;
    onClose: () => void;
}

export const AppearanceScreen: React.FC<AppearanceScreenProps> = ({ navigation, onClose }) => {
    const { theme, themeState, setThemeState } = useTheme();
    const { categories, isLoading, refresh } = useThemes();

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader 
                title="Appearance" 
                onClose={onClose} 
                onBack={() => navigation.goBack()} 
                rightIcon={<Settings2 color={theme.textSecondary} size={20} />}
                onRightIcon={() => navigation.navigate('ThemeSourcesScreen')}
            />
            
            {isLoading && categories.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.accent} size="large" />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isLoading}
                            onRefresh={refresh}
                            tintColor={theme.accent}
                        />
                    }
                >
                    {categories.map(cat => (
                        <ThemeSlider
                            key={cat.category}
                            categoryTitle={cat.category}
                            themes={cat.themes}
                            value={themeState.category === cat.category ? themeState.value : 0}
                            isActive={themeState.category === cat.category}
                            onValueChange={(val) => setThemeState({ category: cat.category, value: val })}
                        />
                    ))}

                    <TouchableOpacity
                        style={[styles.addCustomBtn, { borderColor: theme.border }]}
                        onPress={() => navigation.navigate('EditLocalThemeScreen')}
                    >
                        <Plus color={theme.accent} size={16} />
                        <Text style={[styles.addCustomText, { color: theme.accent }]}>
                            Add Custom Theme
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 40 },
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
});

