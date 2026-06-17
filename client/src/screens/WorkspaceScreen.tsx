import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Terminal, X, Send, Code, Play } from 'lucide-react-native';
import { useSocketContext } from '../hooks/SocketContext';
import { BottomSheetExplorer } from '../components/BottomSheetExplorer';
import { DiffViewer, DiffLine } from '../components/DiffViewer';
import { FileNode } from '../components/TreeView';

interface WorkspaceScreenProps {
    logs: string[];
    fsTree: FileNode | null;
    onLazyLoad: (path: string) => Promise<void>;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({ logs, fsTree, onLazyLoad }) => {
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
                    <View style={styles.promptContainer}>
                        <TextInput 
                            style={styles.promptInput} 
                            placeholder="Write a file with console log hello..." 
                            placeholderTextColor="#666"
                            value={promptText}
                            onChangeText={setPromptText}
                        />
                        <TouchableOpacity style={styles.promptSendBtn} onPress={handleExecutePrompt}>
                            <Send color="#fff" size={16} />
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Horizontal Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'agent' && styles.activeTab]} 
                    onPress={() => setActiveTab('agent')}
                >
                    <Terminal color={activeTab === 'agent' ? '#3b82f6' : '#888'} size={16} />
                    <Text style={[styles.tabText, activeTab === 'agent' && styles.activeTabText]}>Agent</Text>
                </TouchableOpacity>

                {openFiles.map(file => {
                    const filename = file.path.split(/[/\\]/).pop();
                    const isActive = activeTab === file.path;
                    return (
                        <TouchableOpacity 
                            key={file.path} 
                            style={[styles.tab, isActive && styles.activeTab]} 
                            onPress={() => setActiveTab(file.path)}
                        >
                            <Code color={isActive ? '#3b82f6' : '#888'} size={16} />
                            <Text style={[styles.tabText, isActive && styles.activeTabText]}>{filename}</Text>
                            <TouchableOpacity style={styles.closeBtn} onPress={() => closeFile(file.path)}>
                                <X color={isActive ? '#fff' : '#888'} size={14} />
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
    container: { flex: 1, backgroundColor: '#121212' },
    tabBar: { flexDirection: 'row', backgroundColor: '#181818', borderBottomWidth: 1, borderBottomColor: '#2a2a2a', maxHeight: 50 },
    tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRightWidth: 1, borderRightColor: '#2a2a2a', gap: 8 },
    activeTab: { backgroundColor: '#222', borderTopWidth: 2, borderTopColor: '#3b82f6' },
    tabText: { color: '#888', fontSize: 13, fontWeight: '500' },
    activeTabText: { color: '#fff' },
    closeBtn: { marginLeft: 4 },
    contentArea: { flex: 1, paddingBottom: 60 }, // Padding for bottom sheet collapsed state
    
    agentContainer: { flex: 1, padding: 16 },
    terminalHeader: { backgroundColor: '#2d2d2d', padding: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
    terminalTitle: { color: '#a0a0a0', fontFamily: 'monospace', fontSize: 12 },
    terminalBody: { backgroundColor: '#1e1e1e', padding: 12, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, flex: 1 },
    terminalText: { color: '#00ff00', fontFamily: 'monospace', fontSize: 12, marginBottom: 4 },

    fileViewerContainer: { flex: 1 },
    fileViewerScroll: { flex: 1 },
    fileViewerContent: { color: '#d4d4d4', fontFamily: 'monospace', fontSize: 13 },
    
    promptContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#181818', borderTopWidth: 1, borderTopColor: '#2a2a2a', alignItems: 'center' },
    promptInput: { flex: 1, backgroundColor: '#222', color: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: '#333' },
    promptSendBtn: { backgroundColor: '#3b82f6', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 }
});
