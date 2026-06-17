import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Puzzle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';

interface ExtensionsScreenProps {
    navigation: any;
    onClose: () => void;
}

export const ExtensionsScreen: React.FC<ExtensionsScreenProps> = ({ navigation, onClose }) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Extensions"
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            <View style={styles.center}>
                <View style={[styles.iconWrap, { backgroundColor: theme.surfaceElevated }]}>
                    <Puzzle color={theme.accent} size={48} />
                </View>
                <Text style={[styles.heading, { color: theme.textPrimary }]}>Coming Soon</Text>
                <Text style={[styles.sub, { color: theme.textSecondary }]}>
                    The Gemini CLI extension catalog is on its way.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    iconWrap: { width: 96, height: 96, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    heading: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
    sub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
