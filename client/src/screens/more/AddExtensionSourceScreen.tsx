import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';

interface AddExtensionSourceScreenProps {
    navigation: any;
    route: { params: { onAdd: (repo: string) => Promise<void> } };
    onClose: () => void;
}

export const AddExtensionSourceScreen: React.FC<AddExtensionSourceScreenProps> = ({
    navigation,
    route,
    onClose,
}) => {
    const { theme } = useTheme();
    const { onAdd } = route.params;
    const [repo, setRepo] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [preview, setPreview] = useState<{ name: string; description: string; stars: number } | null>(null);

    const normalizeRepo = (input: string): string => {
        const trimmed = input.trim();
        // Handle full GitHub URLs like https://github.com/owner/repo
        const match = trimmed.match(/github\.com\/([^/\s]+\/[^/\s]+)/);
        if (match) return match[1].replace(/\.git$/, '');
        return trimmed;
    };

    const validate = async () => {
        const normalized = normalizeRepo(repo);
        if (!normalized || !normalized.includes('/')) {
            Alert.alert('Invalid Format', 'Enter a GitHub repo as "owner/repo" or paste the full GitHub URL.');
            return;
        }
        setIsValidating(true);
        setPreview(null);
        try {
            const response = await fetch(`https://api.github.com/repos/${normalized}`);
            if (!response.ok) throw new Error(`Repository not found (HTTP ${response.status})`);
            const data = await response.json();
            setPreview({
                name: data.full_name,
                description: data.description ?? '',
                stars: data.stargazers_count ?? 0,
            });
            setRepo(normalized);
        } catch (e: any) {
            Alert.alert('Validation Failed', e.message ?? 'Could not reach GitHub API.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleAdd = async () => {
        if (!preview) {
            await validate();
            return;
        }
        await onAdd(repo);
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScreenHeader title="Add Extension" onBack={() => navigation.goBack()} onClose={onClose} />
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>GitHub Repository</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="owner/repo or https://github.com/owner/repo"
                    placeholderTextColor={theme.textMuted}
                    value={repo}
                    onChangeText={text => { setRepo(text); setPreview(null); }}
                    autoCapitalize="none"
                    keyboardType="url"
                />

                {preview && (
                    <View style={[styles.preview, { backgroundColor: theme.accentSoft }]}>
                        <CheckCircle color={theme.success} size={16} />
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.previewName, { color: theme.success }]}>{preview.name}</Text>
                            {preview.description ? (
                                <Text style={[styles.previewDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                                    {preview.description}
                                </Text>
                            ) : null}
                            <Text style={[styles.previewStars, { color: theme.textMuted }]}>★ {preview.stars} stars</Text>
                        </View>
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
                            {preview ? 'Add Extension' : 'Validate & Preview'}
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
    label: { fontSize: 13, fontWeight: '500', marginTop: 8, marginBottom: 6 },
    input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    preview: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10, marginTop: 4 },
    previewName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    previewDesc: { fontSize: 13, lineHeight: 18, marginBottom: 2 },
    previewStars: { fontSize: 12 },
    btn: { marginTop: 24, padding: 16, borderRadius: 14, alignItems: 'center' },
    btnText: { fontSize: 16, fontWeight: '600' },
});

