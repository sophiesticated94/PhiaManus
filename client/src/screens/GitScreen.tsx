import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { GitCommit, GitBranch, Files, CheckSquare, Square, UploadCloud, DownloadCloud, Sparkles } from 'lucide-react-native';
import { useGitState } from '../hooks/useGitState';

type GitTab = 'staging' | 'commits' | 'branches';

export const GitScreen = () => {
    const [activeTab, setActiveTab] = useState<GitTab>('staging');
    const { status, branches, log, commitMessage, requestStatus, requestBranches, requestLog, stageFile, unstageFile, commit, push, pull, generateCommitMessage, setCommitMessage } = useGitState();
    const [msgTitle, setMsgTitle] = useState('');
    const [msgDesc, setMsgDesc] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        requestStatus();
        requestBranches();
        requestLog();
    }, []);

    useEffect(() => {
        if (commitMessage) {
            setMsgTitle(commitMessage.title);
            setMsgDesc(commitMessage.description);
            setIsGenerating(false);
        }
    }, [commitMessage]);

    const handleGenerateMsg = () => {
        setIsGenerating(true);
        generateCommitMessage();
    };

    const handleCommit = () => {
        if (!msgTitle) return;
        commit(`${msgTitle}\n\n${msgDesc}`);
        setMsgTitle('');
        setMsgDesc('');
    };

    const renderStaging = () => {
        if (!status) return <ActivityIndicator color="#007acc" style={{ marginTop: 20 }} />;

        return (
            <View style={styles.tabContent}>
                <View style={styles.commitBox}>
                    <View style={styles.commitHeader}>
                        <Text style={styles.commitTitle}>Commit Changes</Text>
                        <View style={styles.commitActions}>
                            <TouchableOpacity style={styles.magicButton} onPress={handleGenerateMsg} disabled={isGenerating}>
                                {isGenerating ? <ActivityIndicator size="small" color="#a855f7" /> : <Sparkles color="#a855f7" size={16} />}
                                <Text style={styles.magicButtonText}>Generate</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.commitButton} onPress={handleCommit}>
                                <Text style={styles.commitButtonText}>Commit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TextInput 
                        style={styles.inputTitle} 
                        placeholder="Commit Title (max 50 chars)" 
                        placeholderTextColor="#666"
                        value={msgTitle}
                        onChangeText={setMsgTitle}
                    />
                    <TextInput 
                        style={styles.inputDesc} 
                        placeholder="Description..." 
                        placeholderTextColor="#666"
                        multiline
                        value={msgDesc}
                        onChangeText={setMsgDesc}
                    />
                </View>

                <View style={styles.syncBox}>
                    <TouchableOpacity style={styles.syncButton} onPress={pull}><DownloadCloud color="#fff" size={16} /><Text style={styles.syncText}>Pull</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.syncButton} onPress={push}><UploadCloud color="#fff" size={16} /><Text style={styles.syncText}>Push</Text></TouchableOpacity>
                </View>

                <ScrollView style={styles.fileList}>
                    <Text style={styles.sectionTitle}>Staged Changes ({status.staged.length})</Text>
                    {status.staged.map((f, i) => (
                        <TouchableOpacity key={`staged-${i}`} style={styles.fileRow} onPress={() => unstageFile(f)}>
                            <CheckSquare color="#00ff00" size={16} />
                            <Text style={styles.fileName}>{f}</Text>
                        </TouchableOpacity>
                    ))}

                    <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Unstaged Changes ({status.modified.length + status.not_added.length + status.deleted.length})</Text>
                    {[...status.modified, ...status.not_added, ...status.deleted].map((f, i) => (
                        <TouchableOpacity key={`unstaged-${i}`} style={styles.fileRow} onPress={() => stageFile(f)}>
                            <Square color="#fff" size={16} />
                            <Text style={styles.fileName}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderCommits = () => {
        if (!log) return <ActivityIndicator color="#007acc" style={{ marginTop: 20 }} />;
        return (
            <ScrollView style={styles.tabContent}>
                {log.all.map((c, i) => (
                    <View key={i} style={styles.commitRow}>
                        <View style={styles.commitDot} />
                        <View style={styles.commitInfo}>
                            <Text style={styles.commitMsg}>{c.message}</Text>
                            <Text style={styles.commitAuthor}>{c.author_name} • {c.date.substring(0, 10)}</Text>
                        </View>
                        <Text style={styles.commitHash}>{c.hash.substring(0, 7)}</Text>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderBranches = () => {
        if (!branches) return <ActivityIndicator color="#007acc" style={{ marginTop: 20 }} />;
        return (
            <ScrollView style={styles.tabContent}>
                {branches.all.map((b, i) => (
                    <View key={i} style={[styles.branchRow, b === branches.current && styles.branchRowActive]}>
                        <GitBranch color={b === branches.current ? "#007acc" : "#888"} size={16} />
                        <Text style={[styles.branchName, b === branches.current && styles.branchNameActive]}>{b}</Text>
                        {b === branches.current && <Text style={styles.currentBadge}>Current</Text>}
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.sidebar}>
                <TouchableOpacity style={[styles.tabIcon, activeTab === 'staging' && styles.tabIconActive]} onPress={() => setActiveTab('staging')}>
                    <Files color={activeTab === 'staging' ? '#007acc' : '#888'} size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabIcon, activeTab === 'commits' && styles.tabIconActive]} onPress={() => setActiveTab('commits')}>
                    <GitCommit color={activeTab === 'commits' ? '#007acc' : '#888'} size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabIcon, activeTab === 'branches' && styles.tabIconActive]} onPress={() => setActiveTab('branches')}>
                    <GitBranch color={activeTab === 'branches' ? '#007acc' : '#888'} size={24} />
                </TouchableOpacity>
            </View>
            <View style={styles.contentArea}>
                {activeTab === 'staging' && renderStaging()}
                {activeTab === 'commits' && renderCommits()}
                {activeTab === 'branches' && renderBranches()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, flexDirection: 'row', backgroundColor: '#1e1e1e' },
    sidebar: { width: 60, backgroundColor: '#181818', borderRightWidth: 1, borderRightColor: '#333', alignItems: 'center', paddingTop: 20 },
    tabIcon: { padding: 12, marginBottom: 10, borderRadius: 8 },
    tabIconActive: { backgroundColor: 'rgba(0, 122, 204, 0.2)' },
    contentArea: { flex: 1 },
    tabContent: { flex: 1, padding: 16 },
    commitBox: { backgroundColor: '#252526', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
    commitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    commitTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    commitActions: { flexDirection: 'row', gap: 8 },
    magicButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168, 85, 247, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(168, 85, 247, 0.5)', gap: 6 },
    magicButtonText: { color: '#a855f7', fontSize: 12, fontWeight: 'bold' },
    commitButton: { backgroundColor: '#007acc', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
    commitButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    inputTitle: { color: '#fff', fontSize: 14, backgroundColor: '#1e1e1e', padding: 10, borderRadius: 4, marginBottom: 8, borderWidth: 1, borderColor: '#3c3c3c' },
    inputDesc: { color: '#fff', fontSize: 14, backgroundColor: '#1e1e1e', padding: 10, borderRadius: 4, height: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#3c3c3c' },
    syncBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    syncButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', paddingVertical: 10, borderRadius: 6, gap: 8 },
    syncText: { color: '#fff', fontWeight: 'bold' },
    fileList: { flex: 1 },
    sectionTitle: { color: '#ccc', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
    fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
    fileName: { color: '#d4d4d4', fontSize: 14 },
    commitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
    commitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#007acc', marginRight: 12 },
    commitInfo: { flex: 1 },
    commitMsg: { color: '#fff', fontSize: 14, marginBottom: 4 },
    commitAuthor: { color: '#888', fontSize: 12 },
    commitHash: { color: '#666', fontSize: 12, fontFamily: 'monospace' },
    branchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333', gap: 12 },
    branchRowActive: { backgroundColor: 'rgba(0, 122, 204, 0.1)' },
    branchName: { color: '#d4d4d4', fontSize: 14, flex: 1 },
    branchNameActive: { color: '#007acc', fontWeight: 'bold' },
    currentBadge: { backgroundColor: '#007acc', color: '#fff', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' }
});
