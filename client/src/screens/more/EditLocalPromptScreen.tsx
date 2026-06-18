import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { MagicWandInput } from '../../components/MagicWandInput';
import { TagPill } from '../../components/more/TagPill';
import { useSocketContext } from '../../hooks/SocketContext';
import { LocalPrompt, usePrompts } from '../../hooks/usePrompts';

const ICON_OPTIONS = [
    'code', 'zap', 'shield', 'lightbulb', 'git-branch', 'database', 'server',
    'eye', 'check-circle', 'bug', 'refresh-cw', 'layers', 'cpu', 'book',
    'message-square', 'activity', 'smartphone', 'paintbrush', 'file-text',
];

const BG_OPTIONS = [
    '#e91e8c', '#f97316', '#06b6d4', '#8b5cf6', '#3b82f6',
    '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#14b8a6',
];

interface EditLocalPromptScreenProps {
    navigation: any;
    route: {
        params: {
            prompt?: LocalPrompt;
        };
    };
    onClose: () => void;
}

export const EditLocalPromptScreen: React.FC<EditLocalPromptScreenProps> = ({
    navigation,
    route,
    onClose,
}) => {
    const { theme } = useTheme();
    const { isConnected, sendMessage, lastMessage } = useSocketContext();
    const { prompt } = route.params ?? {};
    const { addLocalPrompt, editLocalPrompt } = usePrompts();
    const isEditing = !!prompt;

    const [title, setTitle] = useState(prompt?.title ?? '');
    const [subtitle, setSubtitle] = useState(prompt?.subtitle ?? '');
    const [body, setBody] = useState(prompt?.body ?? '');
    const [tagsInput, setTagsInput] = useState((prompt?.tags ?? []).join(', '));
    const [selectedIcon, setSelectedIcon] = useState(prompt?.icon ?? 'code');
    const [selectedBg, setSelectedBg] = useState(prompt?.iconBg ?? '#e91e8c');
    const [isEnhancing, setIsEnhancing] = useState(false);

    // Listen for enhancement chunks
    React.useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.type === 'DELTA_CHUNK' && isEnhancing) {
            setBody(prev => prev + lastMessage.chunk);
        } else if (lastMessage.type === 'PATCH_PROPOSAL') {
            setIsEnhancing(false);
            // Auto-reject since we only want the streamed text
            if (lastMessage.patchId) {
                sendMessage({ type: 'PATCH_REJECT', patchId: lastMessage.patchId });
            }
        }
    }, [lastMessage, isEnhancing]);

    const handleMagicWand = () => {
        if (!body.trim()) {
            Alert.alert('Empty Prompt', 'Write some text first before enhancing it.');
            return;
        }
        setIsEnhancing(true);
        const enhancePrompt = `Enhance and expand this developer prompt into a clear, structured, actionable prompt for an AI coding assistant. Preserve the intent but make it specific, with numbered steps and clear output expectations:\n\n${body}`;
        setBody('');
        sendMessage({ type: 'PROMPT_EXECUTE', prompt: enhancePrompt, path: '' });
    };

    const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const handleSave = async () => {
        if (!title.trim() || !body.trim()) {
            Alert.alert('Missing Fields', 'Title and body are required.');
            return;
        }
        const data: Omit<LocalPrompt, 'id'> = {
            title: title.trim(),
            subtitle: subtitle.trim(),
            body: body.trim(),
            tags: parsedTags,
            icon: selectedIcon,
            iconColor: '#ffffff',
            iconBg: selectedBg,
        };
        if (isEditing && prompt) {
            await editLocalPrompt(prompt.id, data);
        } else {
            await addLocalPrompt(data);
        }
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.bg }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScreenHeader
                title={isEditing ? 'Edit Prompt' : 'New Prompt'}
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
                <Text style={[styles.label, { color: theme.textSecondary }]}>Title *</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="Prompt title"
                    placeholderTextColor={theme.textMuted}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>Subtitle</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="Short description"
                    placeholderTextColor={theme.textMuted}
                    value={subtitle}
                    onChangeText={setSubtitle}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>Prompt Body *</Text>
                <MagicWandInput
                    value={body}
                    onChangeText={setBody}
                    onMagicWand={handleMagicWand}
                    isEnhancing={isEnhancing}
                    isConnected={isConnected}
                    placeholder="Write your prompt instructions here..."
                    minHeight={140}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>Tags (comma-separated)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surfaceElevated, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="Universal, Documentation"
                    placeholderTextColor={theme.textMuted}
                    value={tagsInput}
                    onChangeText={setTagsInput}
                />
                {parsedTags.length > 0 && (
                    <View style={styles.pillRow}>
                        {parsedTags.map(tag => <TagPill key={tag} label={tag} />)}
                    </View>
                )}

                <Text style={[styles.label, { color: theme.textSecondary }]}>Icon Background</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                    {BG_OPTIONS.map(color => (
                        <TouchableOpacity
                            key={color}
                            style={[
                                styles.colorDot,
                                { backgroundColor: color },
                                selectedBg === color && styles.colorDotSelected,
                            ]}
                            onPress={() => setSelectedBg(color)}
                        />
                    ))}
                </ScrollView>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                    onPress={handleSave}
                >
                    <Text style={styles.saveBtnText}>{isEditing ? 'Save Changes' : 'Save Prompt'}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    body: { padding: 20, gap: 6, paddingBottom: 40 },
    label: { fontSize: 13, fontWeight: '500', marginTop: 16, marginBottom: 6 },
    input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    colorRow: { marginVertical: 4 },
    colorDot: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
    colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
    saveBtn: { marginTop: 28, padding: 16, borderRadius: 14, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

