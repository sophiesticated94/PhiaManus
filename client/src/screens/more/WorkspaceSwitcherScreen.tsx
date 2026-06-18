import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Folder, Search } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { useSocketContext } from '../../hooks/SocketContext';

export const WorkspaceSwitcherScreen: React.FC<{ navigation: any, onClose: () => void }> = ({ navigation, onClose }) => {
    const { theme } = useTheme();
    const { sendMessage, lastMessage, isConnected } = useSocketContext();
    const [recent, setRecent] = useState<string[]>([]);
    const [manualPath, setManualPath] = useState('');

    useEffect(() => {
        if (isConnected) {
            sendMessage({ type: 'REQUEST_RECENT_WORKSPACES' });
        }
    }, [isConnected, sendMessage]);

    useEffect(() => {
        if (lastMessage?.type === 'RECENT_WORKSPACES_RESPONSE') {
            setRecent(lastMessage.payload);
        }
    }, [lastMessage]);

    const handleSwitch = (path: string) => {
        if (!path) return;
        sendMessage({ type: 'SWITCH_WORKSPACE', payload: path });
        onClose();
        // The phone will briefly disconnect and auto-reconnect to the new workspace.
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader title="Switch Workspace" onClose={onClose} />
            <View style={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Open Manual Path</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary }]}
                        placeholder="C:\Users\Zosia\Projects"
                        placeholderTextColor={theme.textSecondary}
                        value={manualPath}
                        onChangeText={setManualPath}
                    />
                    <TouchableOpacity 
                        style={[styles.openBtn, { backgroundColor: theme.accent }]}
                        onPress={() => handleSwitch(manualPath)}
                    >
                        <Text style={styles.openBtnText}>Open</Text>
                    </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>Recent Workspaces</Text>
                {recent.length === 0 ? (
                    <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={recent}
                        keyExtractor={(item) => item}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={[styles.recentItem, { borderBottomColor: theme.border }]}
                                onPress={() => handleSwitch(item)}
                            >
                                <Folder color={theme.accent} size={20} />
                                <Text style={[styles.recentText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="middle">
                                    {item}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, flex: 1 },
    sectionTitle: { fontSize: 13, textTransform: 'uppercase', fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 },
    inputContainer: { flexDirection: 'row', gap: 12 },
    input: { flex: 1, height: 44, borderRadius: 8, paddingHorizontal: 12, fontFamily: 'monospace' },
    openBtn: { justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
    openBtnText: { color: '#fff', fontWeight: 'bold' },
    recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12 },
    recentText: { fontSize: 16, flex: 1 }
});
