import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Modal, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Terminal, GitBranch, Scan, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { usePhiaManusSocket } from './src/hooks/usePhiaManusSocket';
import { SocketProvider, useSocketContext } from './src/hooks/SocketContext';
import { WorkspaceScreen } from './src/screens/WorkspaceScreen';
import { GitScreen } from './src/screens/GitScreen';
import { FileNode } from './src/components/TreeView';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

// More Stack Screens
import { MoreScreen } from './src/screens/more/MoreScreen';
import { PromptsScreen } from './src/screens/more/PromptsScreen';
import { PromptDetailScreen } from './src/screens/more/PromptDetailScreen';
import { PromptSourcesScreen } from './src/screens/more/PromptSourcesScreen';
import { AddSourceScreen } from './src/screens/more/AddSourceScreen';
import { EditLocalPromptScreen } from './src/screens/more/EditLocalPromptScreen';
import { TipsScreen } from './src/screens/more/TipsScreen';
import { ExtensionsScreen } from './src/screens/more/ExtensionsScreen';
import { WebViewScreen } from './src/screens/more/WebViewScreen';
import { AppearanceScreen } from './src/screens/more/AppearanceScreen';
import { ThemeSourcesScreen } from './src/screens/more/ThemeSourcesScreen';
import { AddThemeSourceScreen } from './src/screens/more/AddThemeSourceScreen';
import { EditLocalThemeScreen } from './src/screens/more/EditLocalThemeScreen';

const Stack = createNativeStackNavigator();

function MoreStack({ onClose, onSendPrompt }: { onClose: () => void, onSendPrompt: (prompt: any) => void }) {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                <Stack.Screen name="MoreScreen">
                    {props => <MoreScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="AppearanceScreen">
                    {props => <AppearanceScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="ThemeSourcesScreen">
                    {props => <ThemeSourcesScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="AddThemeSourceScreen">
                    {props => <AddThemeSourceScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="EditLocalThemeScreen">
                    {props => <EditLocalThemeScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="PromptsScreen">
                    {props => <PromptsScreen {...props} onClose={onClose} onSendPrompt={onSendPrompt} />}
                </Stack.Screen>
                <Stack.Screen name="PromptDetailScreen">
                    {props => <PromptDetailScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="PromptSourcesScreen">
                    {props => <PromptSourcesScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="AddSourceScreen">
                    {props => <AddSourceScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="EditLocalPromptScreen">
                    {props => <EditLocalPromptScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="TipsScreen">
                    {props => <TipsScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="ExtensionsScreen">
                    {props => <ExtensionsScreen {...props} onClose={onClose} />}
                </Stack.Screen>
                <Stack.Screen name="WebViewScreen">
                    {props => <WebViewScreen {...props} onClose={onClose} />}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
}

function AppContent() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const [permission, requestPermission] = useCameraPermissions();
    const [isScanning, setIsScanning] = useState(false);
    const [mainTab, setMainTab] = useState<'workspace' | 'git'>('workspace');
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [manualCode, setManualCode] = useState('');
    
    // Core state passed to Workspace
    const [logs, setLogs] = useState<string[]>(['> Initializing PhiaManus Terminal...']);
    const [fsTree, setFsTree] = useState<FileNode | null>(null);
    const [promptChips, setPromptChips] = useState<{ promptId: string, title: string }[]>([]);

    const { isConnected, connectionType, error, connect, lastMessage, sendMessage } = useSocketContext();

    const addLog = (msg: string) => setLogs(prev => [...prev.slice(-25), `> ${msg}`]);

    useEffect(() => {
        if (isConnected) {
            addLog(`Connected securely via ${connectionType.toUpperCase()}`);
            setIsScanning(false);
            sendMessage({ type: 'REQUEST_FS_TREE' });
        } else if (error) {
            addLog(`Error: ${error}`);
        }
    }, [isConnected, connectionType, error]);

    const updateNodeChildren = (node: FileNode, path: string, newChildren: FileNode[]): boolean => {
        if (node.path === path) {
            node.children = newChildren;
            node.isLarge = false;
            return true;
        }
        if (node.children) {
            for (const child of node.children) {
                if (updateNodeChildren(child, path, newChildren)) return true;
            }
        }
        return false;
    };

    useEffect(() => {
        if (!lastMessage) return;
        if (lastMessage.type === 'FS_TREE_RESPONSE') {
            setFsTree(lastMessage.payload);
            addLog('Workspace tree loaded.');
        } else if (lastMessage.type === 'DIR_CHILDREN_RESPONSE') {
            setFsTree((prev) => {
                if (!prev) return prev;
                const clone = JSON.parse(JSON.stringify(prev));
                updateNodeChildren(clone, lastMessage.path, lastMessage.payload);
                return clone;
            });
            addLog(`Loaded children for ${lastMessage.path}`);
        } else if (lastMessage.type === 'CONTEXT_LIST_RESPONSE') {
            setPromptChips(lastMessage.items ?? []);
        }
    }, [lastMessage]);

    const handleLazyLoad = useCallback(async (path: string) => {
        sendMessage({ type: 'REQUEST_DIR_CHILDREN', path });
        return new Promise<void>(resolve => setTimeout(resolve, 500));
    }, [sendMessage]);

    const handleManualConnect = () => {
        try {
            // atob decoding (React Native has global atob)
            const decoded = atob(manualCode.trim());
            setIsManualEntry(false);
            setManualCode('');
            handleBarcodeScanned({ data: decoded });
        } catch (e) {
            console.error('Failed to parse manual code', e);
            // Ignore for now, maybe show error later
        }
    };

    const startScanning = async () => {
        if (!permission?.granted) {
            const result = await requestPermission();
            if (!result.granted) return;
        }
        setIsScanning(true);
    };

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        if (data && data.startsWith('phiamanus://')) {
            setIsScanning(false);
            const ipMatch = data.match(/[?&]ip=([^&]+)/);
            const portMatch = data.match(/[?&]port=([^&]+)/);
            const pairIdMatch = data.match(/[?&]pairId=([^&]+)/);
            const tokenMatch = data.match(/[?&]token=([^&]+)/);

            if (pairIdMatch && tokenMatch) {
                connect({ 
                    ip: ipMatch ? ipMatch[1] : undefined, 
                    port: portMatch ? portMatch[1] : undefined, 
                    pairId: pairIdMatch[1], 
                    token: tokenMatch[1] 
                });
            }
        }
    };

    const handleSendPrompt = (prompt: any) => {
        setIsMoreOpen(false);
        setMainTab('workspace');
        sendMessage({ type: 'SAVE_CONTEXT', promptId: prompt.id, title: prompt.title, body: prompt.body });
    };

    const handleRemoveChip = (id: string) => {
        sendMessage({ type: 'REMOVE_CONTEXT', promptId: id });
    };

    const handleClearChips = () => {
        promptChips.forEach(chip => {
            sendMessage({ type: 'REMOVE_CONTEXT', promptId: chip.promptId });
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: theme.bg }]}>
            <StatusBar barStyle="light-content" />
            
            {/* Header & Main Segmented Control */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={[styles.segmentControl, { backgroundColor: theme.surface }]}>
                    <TouchableOpacity 
                        style={[styles.segmentBtn, mainTab === 'workspace' && { backgroundColor: theme.surfaceHighlight }]} 
                        onPress={() => setMainTab('workspace')}
                    >
                        <Terminal color={mainTab === 'workspace' ? theme.textPrimary : theme.textSecondary} size={18} />
                        <Text style={[styles.segmentText, { color: mainTab === 'workspace' ? theme.textPrimary : theme.textSecondary }, mainTab === 'workspace' && styles.segmentTextActive]}>Workspace</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.segmentBtn, mainTab === 'git' && { backgroundColor: theme.surfaceHighlight }]} 
                        onPress={() => setMainTab('git')}
                    >
                        <GitBranch color={mainTab === 'git' ? theme.textPrimary : theme.textSecondary} size={18} />
                        <Text style={[styles.segmentText, { color: mainTab === 'git' ? theme.textPrimary : theme.textSecondary }, mainTab === 'git' && styles.segmentTextActive]}>Git</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.headerIcons}>
                    <View style={styles.statusDot}>
                        {isConnected ? <CheckCircle color={theme.success} size={16} /> : <XCircle color={theme.danger} size={16} />}
                    </View>
                    <TouchableOpacity onPress={() => setIsMoreOpen(true)} style={styles.moreBtn}>
                        <MoreHorizontal color={theme.textPrimary} size={20} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content Area */}
            <View style={styles.content}>
                {isScanning ? (
                    <View style={styles.scannerContainer}>
                        <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={handleBarcodeScanned} />
                        <TouchableOpacity style={styles.cancelScanButton} onPress={() => setIsScanning(false)}>
                            <Text style={{ color: '#fff' }}>Abort Scan</Text>
                        </TouchableOpacity>
                    </View>
                ) : !isConnected ? (
                    <View style={styles.disconnectedContainer}>
                        <Scan color={theme.accent} size={64} style={{ marginBottom: 20 }} />
                        <Text style={[styles.disconnectedTitle, { color: theme.textPrimary }]}>Not Connected</Text>
                        <Text style={[styles.disconnectedSub, { color: theme.textSecondary }]}>Scan your PhiaManus IDE QR code to begin.</Text>
                        
                        {error && (
                            <View style={{ backgroundColor: theme.danger + '20', padding: 12, borderRadius: 8, marginBottom: 20 }}>
                                <Text style={{ color: theme.danger, textAlign: 'center' }}>{error}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={[styles.scanButton, { backgroundColor: theme.accent, marginBottom: 16 }]} onPress={startScanning}>
                            <Text style={styles.scanButtonText}>Scan Pairing QR</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity onPress={() => setIsManualEntry(true)}>
                            <Text style={{ color: theme.textSecondary, textDecorationLine: 'underline' }}>Enter Code Manually</Text>
                        </TouchableOpacity>

                        <Modal visible={isManualEntry} transparent animationType="fade" onRequestClose={() => setIsManualEntry(false)}>
                            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                                <View style={{ backgroundColor: theme.surface, padding: 20, borderRadius: 12, width: '100%' }}>
                                    <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>Manual Connection</Text>
                                    <Text style={{ color: theme.textSecondary, marginBottom: 16 }}>Paste the Base64 connection code from VS Code.</Text>
                                    <TextInput
                                        style={{ backgroundColor: theme.bg, color: theme.textPrimary, padding: 12, borderRadius: 8, marginBottom: 16, fontFamily: 'monospace' }}
                                        placeholder="Paste code here..."
                                        placeholderTextColor={theme.textSecondary}
                                        value={manualCode}
                                        onChangeText={setManualCode}
                                        multiline
                                    />
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                                        <TouchableOpacity onPress={() => setIsManualEntry(false)} style={{ padding: 10 }}>
                                            <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleManualConnect} style={{ backgroundColor: theme.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}>
                                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Connect</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    </View>
                ) : mainTab === 'workspace' ? (
                    <WorkspaceScreen 
                        logs={logs} 
                        fsTree={fsTree} 
                        onLazyLoad={handleLazyLoad} 
                        promptChips={promptChips}
                        onRemoveChip={handleRemoveChip}
                        onClearChips={handleClearChips}
                    />
                ) : (
                    <GitScreen />
                )}
            </View>

            <Modal visible={isMoreOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsMoreOpen(false)}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <MoreStack onClose={() => setIsMoreOpen(false)} onSendPrompt={handleSendPrompt} />
                </GestureHandlerRootView>
            </Modal>
        </View>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <ThemeProvider>
                    <SocketProvider>
                        <AppContent />
                    </SocketProvider>
                </ThemeProvider>
            </GestureHandlerRootView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    segmentControl: { flex: 1, flexDirection: 'row', borderRadius: 8, padding: 4, marginRight: 16 },
    segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 6, gap: 8 },
    segmentBtnActive: { },
    segmentText: { fontWeight: '600', fontSize: 14 },
    segmentTextActive: { },
    headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusDot: { padding: 4 },
    moreBtn: { padding: 4 },
    content: { flex: 1 },
    scannerContainer: { flex: 1, borderRadius: 16, overflow: 'hidden', margin: 16 },
    cancelScanButton: { position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#ef4444', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
    disconnectedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    disconnectedTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    disconnectedSub: { fontSize: 16, textAlign: 'center', marginBottom: 32 },
    scanButton: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
    scanButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
