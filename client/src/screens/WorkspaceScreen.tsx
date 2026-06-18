import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform, Animated, PanResponder, useWindowDimensions } from 'react-native';
import { Terminal, X, Send, Code, Play, Image as ImageIcon, AtSign, Settings2, GripHorizontal } from 'lucide-react-native';
import { useSocketContext } from '../hooks/SocketContext';
import { BottomSheetExplorer } from '../components/BottomSheetExplorer';
import { DiffViewer, DiffLine } from '../components/DiffViewer';
import { FileNode } from '../components/TreeView';
import { useTheme } from '../theme/ThemeContext';

interface WorkspaceScreenProps {
    logs: string[];
    fsTree: FileNode | null;
    onLazyLoad: (path: string) => Promise<void>;
    promptChips: { promptId: string, title: string }[];
    onRemoveChip: (id: string) => void;
    onClearChips: () => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({ 
    logs, fsTree, onLazyLoad, promptChips, onRemoveChip, onClearChips 
}) => {
    const { theme } = useTheme();
    const { sendMessage, lastMessage } = useSocketContext();
    const [activeTab, setActiveTab] = useState<string>('agent');
    const [openFiles, setOpenFiles] = useState<{ path: string, content: string }[]>([]);
    
    // LLM State
    const [promptText, setPromptText] = useState('');
    const [isLLMExecuting, setIsLLMExecuting] = useState(false);
    const [streamChunks, setStreamChunks] = useState<string>('');
    const [proposedPatch, setProposedPatch] = useState<{ patchId: string, diff: DiffLine[] } | null>(null);
    const streamScrollRef = useRef<ScrollView>(null);

    // LLM Settings
    const [engine, setEngine] = useState<'low' | 'med' | 'hi'>('med');
    const [preparePlan, setPreparePlan] = useState(false);
    const [settingsExpanded, setSettingsExpanded] = useState(false);

    // Prompt Resizer
    const { height: screenHeight } = useWindowDimensions();
    const minHeight = 60;
    const maxHeight = screenHeight / 3;
    const promptHeight = useRef(new Animated.Value(minHeight)).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                let newHeight = minHeight - gestureState.dy;
                if (newHeight < minHeight) newHeight = minHeight;
                if (newHeight > maxHeight) newHeight = maxHeight;
                promptHeight.setValue(newHeight);
            },
            onPanResponderRelease: (evt, gestureState) => {
                promptHeight.extractOffset();
            }
        })
    ).current;

    // Listen for file read responses and LLM events
    React.useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'FILE_READ_RESPONSE') {
            const { path, content } = lastMessage;
            setOpenFiles(prev => {
                if (!prev.find(f => f.path === path)) {
                    return [...prev, { path, content }];
                }
                // Update content if already open
                return prev.map(f => f.path === path ? { ...f, content } : f);
            });
            setActiveTab(path);
        } else if (lastMessage.type === 'DELTA_CHUNK') {
            setStreamChunks(prev => prev + lastMessage.chunk);
        } else if (lastMessage.type === 'PATCH_PROPOSAL') {
            setIsLLMExecuting(false);
            if (lastMessage.patchId) {
                setProposedPatch({ patchId: lastMessage.patchId, diff: lastMessage.diff });
            }
        } else if (lastMessage.type === 'PATCH_APPLIED') {
            setProposedPatch(null);
            setStreamChunks('');
            onClearChips();
            if (lastMessage.success && activeTab !== 'agent') {
                sendMessage({ type: 'REQUEST_FILE_READ', path: activeTab });
            }
        } else if (lastMessage.type === 'ERROR') {
            setIsLLMExecuting(false);
        }
    }, [lastMessage]);

    const handleFilePress = (path: string) => {
        if (!openFiles.find(f => f.path === path)) {
            sendMessage({ type: 'REQUEST_FILE_READ', path });
        } else {
            setActiveTab(path);
        }
    };

    const closeFile = (path: string) => {
        setOpenFiles(prev => prev.filter(f => f.path !== path));
        if (activeTab === path) {
            setActiveTab('agent');
        }
    };

    const handleExecutePrompt = () => {
        if (activeTab === 'agent' || !promptText.trim()) return;
        setIsLLMExecuting(true);
        setStreamChunks('');
        setProposedPatch(null);
        sendMessage({ 
            type: 'PROMPT_EXECUTE', 
            prompt: promptText, 
            path: activeTab,
            settings: { engine, preparePlan }
        });
        setPromptText('');
    };

    const renderAgentTab = () => (
        <View style={styles.agentContainer}>
            <View style={styles.terminalHeader}>
                <Text style={styles.terminalTitle}>PhiaManus Terminal</Text>
            </View>
            <ScrollView style={styles.terminalBody}>
                {logs.map((log, index) => <Text key={index} style={styles.terminalText}>{log}</Text>)}
            </ScrollView>
        </View>
    );

    const renderFileTab = (file: { path: string, content: string }) => (
        <View style={styles.fileViewerContainer}>
            {!isLLMExecuting && !proposedPatch && (
                <ScrollView style={styles.fileViewerScroll} contentContainerStyle={{ padding: 16 }}>
                    <Text style={styles.fileViewerContent}>{file.content}</Text>
                </ScrollView>
            )}

            {isLLMExecuting && (
                <ScrollView 
                    style={[styles.fileViewerScroll, { backgroundColor: '#111' }]} 
                    contentContainerStyle={{ padding: 16 }}
                    ref={streamScrollRef}
                    onContentSizeChange={() => streamScrollRef.current?.scrollToEnd({ animated: true })}
                >
                    <Text style={styles.fileViewerContent}>{streamChunks}</Text>
                </ScrollView>
            )}

            {proposedPatch && (
                <DiffViewer 
                    diff={proposedPatch.diff} 
                    onApprove={() => sendMessage({ type: 'PATCH_APPROVE', patchId: proposedPatch.patchId })} 
                    onReject={() => sendMessage({ type: 'PATCH_REJECT', patchId: proposedPatch.patchId })} 
                />
            )}

            {!isLLMExecuting && !proposedPatch && (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <Animated.View style={[styles.promptArea, { height: promptHeight, backgroundColor: theme.surfaceElevated, borderTopColor: theme.border }]}>
                        <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                            <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
                        </View>
                        
                        {settingsExpanded && (
                            <View style={[styles.settingsBar, { borderBottomColor: theme.border }]}>
                                <View style={styles.settingsRow}>
                                    <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Engine:</Text>
                                    {['low', 'med', 'hi'].map(e => (
                                        <TouchableOpacity 
                                            key={e} 
                                            onPress={() => setEngine(e as any)}
                                            style={[styles.engineBtn, engine === e && { backgroundColor: theme.accent }]}
                                        >
                                            <Text style={[styles.engineText, { color: engine === e ? '#fff' : theme.textPrimary }]}>{e.toUpperCase()}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <View style={styles.settingsRow}>
                                    <Text style={[styles.settingsLabel, { color: theme.textSecondary }]}>Prepare Plan:</Text>
                                    <TouchableOpacity 
                                        onPress={() => setPreparePlan(!preparePlan)}
                                        style={[styles.toggleBtn, preparePlan && { backgroundColor: theme.accent }]}
                                    >
                                        <Text style={[styles.toggleText, { color: preparePlan ? '#fff' : theme.textPrimary }]}>{preparePlan ? 'ON' : 'OFF'}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {promptChips.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipStrip}>
                                {promptChips.map(chip => (
                                    <View key={chip.promptId} style={[styles.chip, { backgroundColor: theme.surfaceHighlight, borderColor: theme.borderSubtle }]}>
                                        <Text style={[styles.chipText, { color: theme.textPrimary }]}>{chip.title}</Text>
                                        <TouchableOpacity onPress={() => onRemoveChip(chip.promptId)}>
                                            <X color={theme.textSecondary} size={14} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.clearChipsBtn} onPress={onClearChips}>
                                    <X color={theme.textSecondary} size={16} />
                                </TouchableOpacity>
                            </ScrollView>
                        )}

                        <View style={styles.promptInputWrapper}>
                            <TextInput 
                                style={[styles.promptInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]} 
                                placeholder="Write your prompt..." 
                                placeholderTextColor={theme.textMuted}
                                value={promptText}
                                onChangeText={setPromptText}
                                multiline
                            />
                            <View style={styles.promptActions}>
                                <TouchableOpacity onPress={() => setSettingsExpanded(!settingsExpanded)} style={styles.actionIcon}>
                                    <Settings2 color={settingsExpanded ? theme.accent : theme.textSecondary} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionIcon}>
                                    <ImageIcon color={theme.textSecondary} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionIcon}>
                                    <AtSign color={theme.textSecondary} size={20} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.promptSendBtn, { backgroundColor: theme.accent }]} onPress={handleExecutePrompt}>
                                    <Send color="#fff" size={16} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Horizontal Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: theme.surfaceElevated, borderBottomColor: theme.border }]}>
                <TouchableOpacity 
                    style={[styles.tab, { borderRightColor: theme.border }, activeTab === 'agent' && { backgroundColor: theme.surfaceHighlight, borderTopColor: theme.accent, borderTopWidth: 2 }]} 
                    onPress={() => setActiveTab('agent')}
                    onLongPress={() => {
                        import('react-native').then(({ Alert }) => {
                            Alert.alert('Tab Options', undefined, [
                                { text: 'Close All Tabs', onPress: () => { setOpenFiles([]); setActiveTab('agent'); }, style: 'destructive' },
                                { text: 'Cancel', style: 'cancel' }
                            ]);
                        });
                    }}
                >
                    <Terminal color={activeTab === 'agent' ? theme.accent : theme.textSecondary} size={16} />
                    <Text style={[styles.tabText, { color: activeTab === 'agent' ? theme.textPrimary : theme.textSecondary }]}>Agent</Text>
                </TouchableOpacity>

                {openFiles.map(file => {
                    const filename = file.path.split(/[/\\]/).pop();
                    const isActive = activeTab === file.path;
                    return (
                        <TouchableOpacity 
                            key={file.path} 
                            style={[styles.tab, { borderRightColor: theme.border }, isActive && { backgroundColor: theme.surfaceHighlight, borderTopColor: theme.accent, borderTopWidth: 2 }]} 
                            onPress={() => setActiveTab(file.path)}
                            onLongPress={() => {
                                import('react-native').then(({ Alert }) => {
                                    Alert.alert('Tab Options', undefined, [
                                        { text: 'Close All But This', onPress: () => { setOpenFiles([file]); setActiveTab(file.path); } },
                                        { text: 'Close All Tabs', onPress: () => { setOpenFiles([]); setActiveTab('agent'); }, style: 'destructive' },
                                        { text: 'Cancel', style: 'cancel' }
                                    ]);
                                });
                            }}
                        >
                            <Code color={isActive ? theme.accent : theme.textSecondary} size={16} />
                            <Text style={[styles.tabText, { color: isActive ? theme.textPrimary : theme.textSecondary }]}>{filename}</Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => closeFile(file.path)}>
                                <X color={isActive ? theme.textPrimary : theme.textSecondary} size={14} />
                            </TouchableOpacity>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            <View style={styles.contentArea}>
                {activeTab === 'agent' 
                    ? renderAgentTab() 
                    : renderFileTab(openFiles.find(f => f.path === activeTab)!)
                }
            </View>

            <BottomSheetExplorer 
                fileTree={fsTree} 
                onFilePress={handleFilePress} 
                onLazyLoad={onLazyLoad} 
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabBar: { flexDirection: 'row', borderBottomWidth: 1, maxHeight: 50 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRightWidth: 1, gap: 8 },
    tabText: { fontSize: 13, fontWeight: '500' },
    closeBtn: { marginLeft: 4 },
    contentArea: { flex: 1, paddingBottom: 60 },
    
    agentContainer: { flex: 1, padding: 16 },
    terminalHeader: { backgroundColor: '#2d2d2d', padding: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    terminalTitle: { color: '#a0a0a0', fontFamily: 'monospace', fontSize: 12 },
    terminalBody: { backgroundColor: '#1e1e1e', padding: 12, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, flex: 1 },
    terminalText: { color: '#00ff00', fontFamily: 'monospace', fontSize: 12, marginBottom: 4 },

    fileViewerContainer: { flex: 1 },
    fileViewerScroll: { flex: 1 },
    fileViewerContent: { color: '#d4d4d4', fontFamily: 'monospace', fontSize: 13 },
    
    promptArea: { borderTopWidth: 1 },
    dragHandleContainer: { height: 20, alignItems: 'center', justifyContent: 'center', width: '100%' },
    dragHandle: { width: 40, height: 4, borderRadius: 2 },
    settingsBar: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, marginBottom: 8, gap: 12 },
    settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    settingsLabel: { fontSize: 13, width: 85, fontWeight: '500' },
    engineBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    engineText: { fontSize: 12, fontWeight: '600' },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    toggleText: { fontSize: 12, fontWeight: '600' },
    
    chipStrip: { flexDirection: 'row', marginBottom: 12, paddingHorizontal: 12 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8, gap: 6 },
    chipText: { fontSize: 12, fontWeight: '500' },
    clearChipsBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    
    promptInputWrapper: { flex: 1, paddingHorizontal: 12, paddingBottom: 12 },
    promptInput: { flex: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, textAlignVertical: 'top' },
    promptActions: { flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'flex-end', gap: 4 },
    actionIcon: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    promptSendBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }
});
