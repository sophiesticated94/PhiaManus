import React, { useEffect, useState, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhiaManusSocket } from './src/hooks/usePhiaManusSocket';
import { Terminal, RefreshCcw, CheckCircle, XCircle, Maximize2, Minimize2, X, Send } from 'lucide-react-native';
import { TreeView, FileNode } from './src/components/TreeView';
import { DiffViewer, DiffLine } from './src/components/DiffViewer';

function TerminalUI() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [logs, setLogs] = useState<string[]>(['> Initializing PhiaManus Terminal...']);
  
  const { isConnected, connectionType, error, connect, restoreConnection, lastMessage, sendMessage } = usePhiaManusSocket();

  const [fsTree, setFsTree] = useState<FileNode | null>(null);
  const [activeFile, setActiveFile] = useState<{ path: string, content: string } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Phase 4 states
  const [promptText, setPromptText] = useState('');
  const [isLLMExecuting, setIsLLMExecuting] = useState(false);
  const [streamChunks, setStreamChunks] = useState<string>('');
  const [proposedPatch, setProposedPatch] = useState<{ patchId: string, diff: DiffLine[] } | null>(null);
  const streamScrollRef = useRef<ScrollView>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-15), `> ${msg}`]);
  };

  useEffect(() => {
    restoreConnection();
    addLog('Attempting to restore previous session...');
  }, [restoreConnection]);

  useEffect(() => {
    if (isConnected) {
      addLog(`Connected securely via ${connectionType.toUpperCase()}`);
      setIsScanning(false);
      sendMessage({ type: 'REQUEST_FS_TREE' });
      addLog('Requesting workspace tree...');
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
    if (lastMessage) {
      if (lastMessage.type === 'FS_TREE_RESPONSE') {
        setFsTree(lastMessage.payload);
        addLog('Workspace tree loaded successfully.');
      } else if (lastMessage.type === 'DIR_CHILDREN_RESPONSE') {
        setFsTree((prev) => {
          if (!prev) return prev;
          const clone = JSON.parse(JSON.stringify(prev));
          updateNodeChildren(clone, lastMessage.path, lastMessage.payload);
          return clone;
        });
        addLog(`Loaded children for ${lastMessage.path}`);
      } else if (lastMessage.type === 'FILE_READ_RESPONSE') {
        setActiveFile({ path: lastMessage.path, content: lastMessage.content });
        addLog(`Opened ${lastMessage.path}`);
      } else if (lastMessage.type === 'DELTA_CHUNK') {
        setStreamChunks(prev => prev + lastMessage.chunk);
      } else if (lastMessage.type === 'PATCH_PROPOSAL') {
        setIsLLMExecuting(false);
        if (lastMessage.patchId) {
          setProposedPatch({ patchId: lastMessage.patchId, diff: lastMessage.diff });
          addLog(`Received patch proposal: ${lastMessage.patchId}`);
        } else {
          addLog(`LLM finished but proposed no changes.`);
        }
      } else if (lastMessage.type === 'PATCH_APPLIED') {
        addLog(lastMessage.success ? 'Patch applied successfully.' : 'Patch rejected/failed.');
        setProposedPatch(null);
        setStreamChunks('');
        if (lastMessage.success && activeFile) {
            // Re-read file to show updated content
            sendMessage({ type: 'REQUEST_FILE_READ', path: activeFile.path });
        }
      } else if (lastMessage.type === 'ERROR') {
        addLog(`Server Error: ${lastMessage.message}`);
        setIsLLMExecuting(false);
      }
    }
  }, [lastMessage]);

  const startScanning = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        addLog('Error: Camera permission denied.');
        return;
      }
    }
    setIsScanning(true);
    addLog('Scanning for PhiaManus QR code...');
  };

  const handleBarcodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (data && data.startsWith('phiamanus://')) {
      setIsScanning(false);
      addLog(`Found QR code...`);
      
      try {
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
      } catch (e) {
        addLog('Error: Failed to parse URI.');
      }
    }
  };

  const handleLazyLoad = useCallback(async (path: string) => {
    addLog(`Lazy loading directory: ${path}`);
    sendMessage({ type: 'REQUEST_DIR_CHILDREN', path });
    return new Promise<void>(resolve => setTimeout(resolve, 500));
  }, [sendMessage]);

  const handleExecutePrompt = () => {
      if (!activeFile || !promptText.trim()) return;
      setIsLLMExecuting(true);
      setStreamChunks('');
      setProposedPatch(null);
      addLog(`Sending prompt to Gemini...`);
      sendMessage({ type: 'PROMPT_EXECUTE', prompt: promptText, path: activeFile.path });
  };

  const renderFileViewer = () => {
    if (!activeFile) return null;
    return (
      <View style={[styles.fileViewerContainer, isFullscreen && styles.fullscreenViewer]}>
        <View style={styles.fileViewerHeader}>
          <Text style={styles.fileViewerTitle} numberOfLines={1}>{activeFile.path}</Text>
          <View style={styles.fileViewerActions}>
            <TouchableOpacity onPress={() => setIsFullscreen(!isFullscreen)} style={styles.iconBtn}>
              {isFullscreen ? <Minimize2 color="#fff" size={20} /> : <Maximize2 color="#fff" size={20} />}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setActiveFile(null); setIsFullscreen(false); }} style={styles.iconBtn}>
              <X color="#ff5f56" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {!isLLMExecuting && !proposedPatch && (
            <ScrollView style={styles.fileViewerScroll} contentContainerStyle={{ padding: 10 }}>
            <Text style={styles.fileViewerContent}>{activeFile.content}</Text>
            </ScrollView>
        )}

        {isLLMExecuting && (
            <ScrollView 
                style={[styles.fileViewerScroll, { backgroundColor: '#111' }]} 
                contentContainerStyle={{ padding: 10 }}
                ref={streamScrollRef}
                onContentSizeChange={() => streamScrollRef.current?.scrollToEnd({ animated: true })}
            >
                <Text style={styles.fileViewerContent}>{streamChunks}</Text>
            </ScrollView>
        )}

        {proposedPatch && (
            <DiffViewer 
                diff={proposedPatch.diff} 
                onApprove={() => { addLog('Approving patch...'); sendMessage({ type: 'PATCH_APPROVE', patchId: proposedPatch.patchId }); }} 
                onReject={() => { addLog('Rejecting patch...'); sendMessage({ type: 'PATCH_REJECT', patchId: proposedPatch.patchId }); }} 
            />
        )}

        {!isLLMExecuting && !proposedPatch && (
            <View style={styles.promptContainer}>
                <TextInput 
                    style={styles.promptInput} 
                    placeholder="Ask PhiaManus to modify this file..." 
                    placeholderTextColor="#666"
                    value={promptText}
                    onChangeText={setPromptText}
                    multiline
                />
                <TouchableOpacity style={styles.promptSendBtn} onPress={handleExecutePrompt}>
                    <Send color="#000" size={18} />
                </TouchableOpacity>
            </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Terminal color="#00ff00" size={24} />
        <Text style={styles.headerTitle}>PHIAMANUS_CLIENT V1</Text>
      </View>

      <View style={styles.content}>
        {isScanning ? (
          <View style={styles.scannerContainer}>
            <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={handleBarcodeScanned} />
            <TouchableOpacity style={styles.cancelScanButton} onPress={() => setIsScanning(false)}>
              <Text style={styles.buttonText}>Abort Scan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mainLayout}>
             <View style={styles.terminalWindow}>
                <View style={styles.terminalHeader}>
                  <Text style={styles.terminalTitle}>bash - root@phiamanus</Text>
                </View>
                <ScrollView style={styles.terminalBody}>
                  {logs.map((log, index) => <Text key={index} style={styles.terminalText}>{log}</Text>)}
                </ScrollView>
             </View>

             {isConnected && fsTree && (
                <View style={styles.workspaceContainer}>
                  <ScrollView style={styles.treeScroll}>
                    <TreeView 
                      data={fsTree} 
                      onFilePress={(path) => { addLog(`Requesting ${path}...`); sendMessage({ type: 'REQUEST_FILE_READ', path }); }} 
                      onLazyLoad={handleLazyLoad}
                    />
                  </ScrollView>
                </View>
             )}

             {!isFullscreen && renderFileViewer()}
          </View>
        )}
      </View>

      {/* Fullscreen Modal View */}
      <Modal visible={isFullscreen} animationType="slide" onRequestClose={() => setIsFullscreen(false)}>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {renderFileViewer()}
        </View>
      </Modal>

      {!isFullscreen && (
        <View style={styles.statusPanel}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>STATUS:</Text>
            {isConnected ? (
              <View style={styles.statusBadge}>
                  <CheckCircle color="#00ff00" size={16} />
                  <Text style={styles.statusTextSuccess}> CONNECTED ({connectionType})</Text>
              </View>
            ) : (
              <View style={styles.statusBadge}>
                  <XCircle color="#ff5f56" size={16} />
                  <Text style={styles.statusTextError}> DISCONNECTED</Text>
              </View>
            )}
          </View>
          {!isConnected && !isScanning && (
            <TouchableOpacity style={styles.actionButton} onPress={startScanning}>
              <RefreshCcw color="#000" size={20} />
              <Text style={styles.actionButtonText}>SCAN PAIRING QR</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function App() {
  return <SafeAreaProvider><TerminalUI /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#00ff00', fontSize: 18, fontWeight: 'bold', marginLeft: 10, fontFamily: 'monospace' },
  content: { flex: 1, padding: 10 },
  scannerContainer: { flex: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  cancelScanButton: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.8)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#333' },
  buttonText: { color: '#fff', fontFamily: 'monospace' },
  mainLayout: { flex: 1, flexDirection: 'column' },
  terminalWindow: { flex: 0.3, backgroundColor: '#121212', borderRadius: 10, borderWidth: 1, borderColor: '#333', overflow: 'hidden', marginBottom: 10 },
  terminalHeader: { backgroundColor: '#2d2d2d', padding: 5, alignItems: 'center' },
  terminalTitle: { color: '#a0a0a0', fontFamily: 'monospace', fontSize: 12 },
  terminalBody: { padding: 10, flex: 1 },
  terminalText: { color: '#00ff00', fontFamily: 'monospace', fontSize: 11, marginBottom: 2 },
  workspaceContainer: { flex: 0.7, backgroundColor: '#1e1e1e', borderRadius: 10, borderWidth: 1, borderColor: '#333', overflow: 'hidden', padding: 10 },
  treeScroll: { flex: 1 },
  statusPanel: { padding: 15, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  statusLabel: { color: '#888', fontFamily: 'monospace' },
  statusBadge: { flexDirection: 'row', alignItems: 'center' },
  statusTextSuccess: { color: '#00ff00', fontFamily: 'monospace', fontWeight: 'bold' },
  statusTextError: { color: '#ff5f56', fontFamily: 'monospace', fontWeight: 'bold' },
  actionButton: { backgroundColor: '#00ff00', padding: 15, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  actionButtonText: { color: '#000', fontWeight: 'bold', fontFamily: 'monospace', marginLeft: 10 },
  
  // File Viewer
  fileViewerContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444',
    marginTop: 10,
    overflow: 'hidden',
    flex: 1,
    maxHeight: 350,
  },
  fullscreenViewer: {
    maxHeight: '100%',
    flex: 1,
    marginTop: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  fileViewerHeader: {
    backgroundColor: '#2d2d2d',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#444'
  },
  fileViewerTitle: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    flex: 1,
  },
  fileViewerActions: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 15,
  },
  fileViewerScroll: {
    flex: 1,
  },
  fileViewerContent: {
    color: '#d4d4d4',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  promptContainer: {
      flexDirection: 'row',
      padding: 10,
      backgroundColor: '#2d2d2d',
      borderTopWidth: 1,
      borderTopColor: '#444',
      alignItems: 'center'
  },
  promptInput: {
      flex: 1,
      backgroundColor: '#111',
      color: '#fff',
      borderRadius: 6,
      padding: 8,
      paddingTop: 8,
      fontFamily: 'monospace',
      maxHeight: 80,
      minHeight: 40,
  },
  promptSendBtn: {
      backgroundColor: '#00ff00',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10,
  }
});
