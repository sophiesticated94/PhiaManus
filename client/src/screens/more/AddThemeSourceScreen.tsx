import React, { useState } from 'react';
import { View, StyleSheet, Text, TextInput} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';

interface AddThemeSourceScreenProps {
    navigation: any;
    route: {
        params: {
            onAddSource: (name: string, url: string) => void;
        };
    };
    onClose: () => void;
}

export const AddThemeSourceScreen: React.FC<AddThemeSourceScreenProps> = ({ navigation, route, onClose }) => {
    const { theme } = useTheme();
    const { onAddSource } = route.params;
    
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');

    const handleSave = () => {
        if (!name.trim() || !url.trim()) return;
        onAddSource(name.trim(), url.trim());
        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Add Theme Source"
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            <View style={styles.content}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Source Name</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="e.g. My Community Themes"
                    placeholderTextColor={theme.textMuted}
                    value={name}
                    onChangeText={setName}
                />
                
                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>JSON URL</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="https://example.com/themes.json"
                    placeholderTextColor={theme.textMuted}
                    value={url}
                    onChangeText={setUrl}
                    autoCapitalize="none"
                    keyboardType="url"
                />

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: (!name || !url) ? 0.5 : 1 }]}
                    onPress={handleSave}
                    disabled={!name || !url}
                >
                    <Text style={styles.saveText}>Save Source</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    saveBtn: {
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
