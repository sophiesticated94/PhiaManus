import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { GitCommitHorizontal as GitCommit, GitBranch, Files, CheckSquare, Square, UploadCloud, DownloadCloud, Sparkles } from 'lucide-react-native';
import { useGitState } from '../hooks/useGitState';
import { useTheme } from '../theme/ThemeContext';

type GitTab = 'staging' | 'commits' | 'branches';

export const GitScreen = () => {
    const { theme } = useTheme();
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
        if (!status) return <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />;

        return (
            <View style={styles.tabContent}>
                <View style={[styles.commitBox, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                    <View style={styles.commitHeader}>
                        <Text style={[styles.commitTitle, { color: theme.textPrimary }]}>Commit Changes</Text>
                        <View style={styles.commitActions}>
                            <TouchableOpacity style={[styles.magicButton, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]} onPress={handleGenerateMsg} disabled={isGenerating}>
                                {isGenerating ? <ActivityIndicator size="small" color={theme.accent} /> : <Sparkles color={theme.accent} size={16} />}
                                <Text style={[styles.magicButtonText, { color: theme.accent }]}>Generate</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.commitButton, { backgroundColor: theme.accent }]} onPress={handleCommit}>
                                <Text style={styles.commitButtonText}>Commit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <TextInput 
                        style={[styles.inputTitle, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.borderSubtle }]} 
                        placeholder="Commit Title (max 50 chars)" 
                        placeholderTextColor={theme.textMuted}
                        value={msgTitle}
                        onChangeText={setMsgTitle}
                    />
                    <TextInput 
                        style={[styles.inputDesc, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.borderSubtle }]} 
                        placeholder="Description..." 
                        placeholderTextColor={theme.textMuted}
                        multiline
                        value={msgDesc}
                        onChangeText={setMsgDesc}
                    />
                </View>

                <View style={styles.syncBox}>
                    <TouchableOpacity style={[styles.syncButton, { backgroundColor: theme.surfaceHighlight }]} onPress={pull}><DownloadCloud color={theme.textPrimary} size={16} /><Text style={[styles.syncText, { color: theme.textPrimary }]}>Pull</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.syncButton, { backgroundColor: theme.surfaceHighlight }]} onPress={push}><UploadCloud color={theme.textPrimary} size={16} /><Text style={[styles.syncText, { color: theme.textPrimary }]}>Push</Text></TouchableOpacity>
                </View>

                <ScrollView style={styles.fileList}>
                    <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Staged Changes ({status.staged.length})</Text>
                    {status.staged.map((f, i) => (
                        <TouchableOpacity key={`staged-${i}`} style={styles.fileRow} onPress={() => unstageFile(f)}>
                            <CheckSquare color={theme.success} size={16} />
                            <Text style={[styles.fileName, { color: theme.textPrimary }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}

                    <Text style={[styles.sectionTitle, { color: theme.textMuted, marginTop: 20 }]}>Unstaged Changes ({status.modified.length + status.not_added.length + status.deleted.length})</Text>
                    {[...status.modified, ...status.not_added, ...status.deleted].map((f, i) => (
                        <TouchableOpacity key={`unstaged-${i}`} style={styles.fileRow} onPress={() => stageFile(f)}>
                            <Square color={theme.textSecondary} size={16} />
                            <Text style={[styles.fileName, { color: theme.textPrimary }]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderCommits = () => {
        if (!log) return <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />;
        return (
            <ScrollView style={styles.tabContent}>
                {log.all.map((c, i) => (
                    <View key={i} style={[styles.commitRow, { borderBottomColor: theme.border }]}>
                        <View style={[styles.commitDot, { backgroundColor: theme.accent }]} />
                        <View style={styles.commitInfo}>
                            <Text style={[styles.commitMsg, { color: theme.textPrimary }]}>{c.message}</Text>
                            <Text style={[styles.commitAuthor, { color: theme.textSecondary }]}>{c.author_name} • {c.date.substring(0, 10)}</Text>
                        </View>
                        <Text style={[styles.commitHash, { color: theme.textMuted }]}>{c.hash.substring(0, 7)}</Text>
                    </View>
                ))}
            </ScrollView>
        );
    };

    const renderBranches = () => {
        if (!branches) return <ActivityIndicator color={theme.accent} style={{ marginTop: 20 }} />;
        return (
            <ScrollView style={styles.tabContent}>
                {branches.all.map((b, i) => (
                    <View key={i} style={[styles.branchRow, { borderBottomColor: theme.border }, b === branches.current && { backgroundColor: theme.surfaceElevated }]}>
                        <GitBranch color={b === branches.current ? theme.accent : theme.textSecondary} size={16} />
                        <Text style={[styles.branchName, { color: theme.textPrimary }, b === branches.current && { color: theme.accent, fontWeight: 'bold' }]}>{b}</Text>
                        {b === branches.current && <Text style={[styles.currentBadge, { backgroundColor: theme.accent }]}>Current</Text>}
                    </View>
                ))}
            </ScrollView>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <View style={[styles.sidebar, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
                <TouchableOpacity style={[styles.tabIcon, activeTab === 'staging' && { backgroundColor: theme.surfaceHighlight }]} onPress={() => setActiveTab('staging')}>
                    <Files color={activeTab === 'staging' ? theme.accent : theme.textSecondary} size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabIcon, activeTab === 'commits' && { backgroundColor: theme.surfaceHighlight }]} onPress={() => setActiveTab('commits')}>
                    <GitCommit color={activeTab === 'commits' ? theme.accent : theme.textSecondary} size={24} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabIcon, activeTab === 'branches' && { backgroundColor: theme.surfaceHighlight }]} onPress={() => setActiveTab('branches')}>
                    <GitBranch color={activeTab === 'branches' ? theme.accent : theme.textSecondary} size={24} />
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
    container: { flex: 1, flexDirection: 'row' },
    sidebar: { width: 60, borderRightWidth: 1, alignItems: 'center', paddingTop: 20 },
    tabIcon: { padding: 12, marginBottom: 10, borderRadius: 8 },
    contentArea: { flex: 1 },
    tabContent: { flex: 1, padding: 16 },
    commitBox: { padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1 },
    commitHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    commitTitle: { fontSize: 16, fontWeight: 'bold' },
    commitActions: { flexDirection: 'row', gap: 8 },
    magicButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, gap: 6 },
    magicButtonText: { fontSize: 12, fontWeight: 'bold' },
    commitButton: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
    commitButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    inputTitle: { fontSize: 14, padding: 10, borderRadius: 4, marginBottom: 8, borderWidth: 1 },
    inputDesc: { fontSize: 14, padding: 10, borderRadius: 4, height: 80, textAlignVertical: 'top', borderWidth: 1 },
    syncBox: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    syncButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 6, gap: 8 },
    syncText: { fontWeight: 'bold' },
    fileList: { flex: 1 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
    fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
    fileName: { fontSize: 14 },
    commitRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    commitDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    commitInfo: { flex: 1 },
    commitMsg: { fontSize: 14, marginBottom: 4 },
    commitAuthor: { fontSize: 12 },
    commitHash: { fontSize: 12, fontFamily: 'monospace' },
    branchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
    branchName: { fontSize: 14, flex: 1 },
    currentBadge: { color: '#fff', fontSize: 10, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontWeight: 'bold' }
});
