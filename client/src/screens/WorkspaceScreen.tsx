import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Terminal, X, Send, Code, Play } from 'lucide-react-native';
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
        sendMessage({ type: 'PROMPT_EXECUTE', prompt: promptText, path: activeTab });
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
                    <View style={[styles.promptArea, { backgroundColor: theme.surfaceElevated, borderTopColor: theme.border }]}>
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
                        <View style={styles.promptInputRow}>
                            <TextInput 
                                style={[styles.promptInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]} 
                                placeholder="Write your prompt..." 
                                placeholderTextColor={theme.textMuted}
                                value={promptText}
                                onChangeText={setPromptText}
                            />
                            <TouchableOpacity style={[styles.promptSendBtn, { backgroundColor: theme.accent }]} onPress={handleExecutePrompt}>
                                <Send color="#fff" size={16} />
                            </TouchableOpacity>
                        </View>
                    </View>
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
    
    promptArea: { padding: 12, borderTopWidth: 1 },
    chipStrip: { flexDirection: 'row', marginBottom: 12 },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, marginRight: 8, gap: 6 },
    chipText: { fontSize: 12, fontWeight: '500' },
    clearChipsBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
    promptInputRow: { flexDirection: 'row', alignItems: 'center' },
    promptInput: { flex: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1 },
    promptSendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});
