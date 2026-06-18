import React from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { useTips, Tip } from '../../hooks/useTips';

interface TipsScreenProps {
    navigation: any;
    onClose: () => void;
}

export const TipsScreen: React.FC<TipsScreenProps> = ({ navigation, onClose }) => {
    const { theme } = useTheme();
    const { categories, isLoading } = useTips();

    const sections = categories.map(cat => ({
        title: cat.category,
        data: cat.tips,
    }));

    const renderItem = ({ item }: { item: Tip }) => (
        <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.surfaceElevated }]}
            onPress={() => navigation.navigate('TipDetailScreen', { tip: item })}
            activeOpacity={0.7}
        >
            <View style={[styles.iconBadge, { backgroundColor: item.iconBg }]}>
                <Text style={styles.iconText}>{item.icon}</Text>
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

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Tips & Tricks"
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={theme.accent} size="large" />
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    renderSectionFooter={() => <View style={{ height: 8 }} />}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { paddingHorizontal: 16, paddingBottom: 40 },
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
    iconText: { fontSize: 20 },
    rowText: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
    rowSub: { fontSize: 12, lineHeight: 16 },
    chevron: { fontSize: 20, fontWeight: '300' },
});

