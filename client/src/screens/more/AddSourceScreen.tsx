import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';

import { usePrompts } from '../../hooks/usePrompts';

interface AddSourceScreenProps {
    navigation: any;
    onClose: () => void;
}

export const AddSourceScreen: React.FC<AddSourceScreenProps> = ({ navigation, onClose }) => {
    const { theme } = useTheme();
    const { addSource } = usePrompts();
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const validate = async () => {
        if (!name.trim() || !url.trim()) {
            Alert.alert('Missing Fields', 'Please enter both a name and a URL.');
            return;
        }
        setIsValidating(true);
        setPreview(null);
        try {
            const response = await fetch(url.trim());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('Invalid format: expected an array of categories');
            const totalPrompts = data.reduce((sum: number, cat: any) => sum + (cat.prompts?.length ?? 0), 0);
            setPreview(`✓ Found ${totalPrompts} prompts in ${data.length} categories`);
        } catch (e: any) {
            Alert.alert('Validation Failed', e.message ?? 'Could not parse the prompt source.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleAdd = async () => {
        if (!preview) {
            await validate();
            return;
        }
        await addSource(name.trim(), url.trim());
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScreenHeader title="Add Source" onBack={() => navigation.goBack()} onClose={onClose} />
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Source Name</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="My Prompt Library"
                    placeholderTextColor={theme.textMuted}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>JSON URL</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="https://example.com/prompts.json"
                    placeholderTextColor={theme.textMuted}
                    value={url}
                    onChangeText={text => { setUrl(text); setPreview(null); }}
                    autoCapitalize="none"
                    keyboardType="url"
                />

                {preview && (
                    <View style={[styles.preview, { backgroundColor: theme.accentSoft }]}>
                        <CheckCircle color={theme.success} size={16} />
                        <Text style={[styles.previewText, { color: theme.success }]}>{preview}</Text>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: preview ? theme.accent : theme.surfaceHighlight }]}
                    onPress={handleAdd}
                    disabled={isValidating}
                >
                    {isValidating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={[styles.btnText, { color: preview ? '#fff' : theme.textSecondary }]}>
                            {preview ? 'Add Source' : 'Validate & Preview'}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    body: { padding: 20, gap: 8 },
    label: { fontSize: 13, fontWeight: '500', marginTop: 16, marginBottom: 6 },
    input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    preview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginTop: 4 },
    previewText: { fontSize: 14, fontWeight: '500' },
    btn: { marginTop: 24, padding: 16, borderRadius: 14, alignItems: 'center' },
    btnText: { fontSize: 16, fontWeight: '600' },
});
