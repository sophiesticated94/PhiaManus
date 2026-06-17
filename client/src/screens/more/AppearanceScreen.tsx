import React, { useState } from 'react';
import { View, StyleSheet, Text, SectionList, RefreshControl, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Palette, Check, Settings2, Plus } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { useThemes } from '../../hooks/useThemes';
import { ScreenHeader } from '../../components/more/ScreenHeader';

interface AppearanceScreenProps {
    navigation: any;
    onClose: () => void;
}

export const AppearanceScreen: React.FC<AppearanceScreenProps> = ({ navigation, onClose }) => {
    const { theme, themeName, setTheme } = useTheme();
    const {
        categories,
        sources,
        isLoading,
        refresh,
        addSource,
        removeSource,
        addLocalTheme,
    } = useThemes();

    const sections = categories.map(cat => ({
        title: cat.category,
        data: cat.themes,
    }));

    const renderItem = ({ item }: { item: any }) => {
        const isActive = themeName === item.id;
        
        return (
            <TouchableOpacity 
                style={[styles.row, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.border }]}
                onPress={() => setTheme(item.id)}
                activeOpacity={0.7}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={[styles.colorPreview, { backgroundColor: item.colors.bg }]}>
                        <View style={[styles.colorPreviewInner, { backgroundColor: item.colors.accent }]} />
                    </View>
                    <Text style={[styles.rowText, { color: theme.textPrimary, fontWeight: isActive ? 'bold' : 'normal' }]}>
                        {item.name}
                    </Text>
                </View>
                {isActive && <Check color={theme.accent} size={20} />}
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }: { section: { title: string } }) => (
        <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>{section.title}</Text>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader 
                title="Appearance" 
                onClose={onClose} 
                onBack={() => navigation.goBack()} 
                rightIcon={<Settings2 color={theme.textSecondary} size={20} />}
                onRightIcon={() =>
                    navigation.navigate('ThemeSourcesScreen', {
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
                                navigation.navigate('EditLocalThemeScreen', {
                                    onSave: addLocalTheme,
                                })
                            }
                        >
                            <Plus color={theme.accent} size={16} />
                            <Text style={[styles.addCustomText, { color: theme.accent }]}>
                                Add Custom Theme
                            </Text>
                        </TouchableOpacity>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingBottom: 40 },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 4,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        marginBottom: 2,
    },
    rowText: {
        fontSize: 15,
    },
    colorPreview: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorPreviewInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
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
