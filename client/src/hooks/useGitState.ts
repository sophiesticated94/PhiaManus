import { useState, useEffect } from 'react';
import { useSocketContext } from './SocketContext';

export interface GitStatus {
    not_added: string[];
    conflicted: string[];
    created: string[];
    deleted: string[];
    modified: string[];
    renamed: any[];
    files: { path: string; index: string; working_dir: string }[];
    staged: string[];
    ahead: number;
    behind: number;
    current: string;
    tracking: string;
}

export interface GitBranch {
    current: string;
    all: string[];
    branches: { [key: string]: any };
}

export interface GitLog {
    all: { hash: string; date: string; message: string; refs: string; body: string; author_name: string; author_email: string }[];
    total: number;
    latest: any;
}

export function useGitState() {
    const { sendMessage, lastMessage } = useSocketContext();
    const [status, setStatus] = useState<GitStatus | null>(null);
    const [branches, setBranches] = useState<GitBranch | null>(null);
    const [log, setLog] = useState<GitLog | null>(null);
    const [commitMessage, setCommitMessage] = useState<{title: string, description: string} | null>(null);

    useEffect(() => {
        if (!lastMessage) return;

        try {
            const data = JSON.parse(lastMessage);
            if (data.type === 'GIT_STATUS_RESPONSE') {
                setStatus(data.payload);
            } else if (data.type === 'GIT_BRANCHES_RESPONSE') {
                setBranches(data.payload);
            } else if (data.type === 'GIT_LOG_RESPONSE') {
                setLog(data.payload);
            } else if (data.type === 'COMMIT_MESSAGE_RESPONSE') {
                setCommitMessage(data.payload);
            }
        } catch (e) {
            console.error('Failed to parse git ws message', e);
        }
    }, [lastMessage]);

    const requestStatus = () => sendMessage(JSON.stringify({ type: 'REQUEST_GIT_STATUS' }));
    const requestBranches = () => sendMessage(JSON.stringify({ type: 'REQUEST_GIT_BRANCHES' }));
    const requestLog = () => sendMessage(JSON.stringify({ type: 'REQUEST_GIT_LOG' }));

    const stageFile = (file: string) => sendMessage(JSON.stringify({ type: 'EXECUTE_GIT_ACTION', action: 'stage', file }));
    const unstageFile = (file: string) => sendMessage(JSON.stringify({ type: 'EXECUTE_GIT_ACTION', action: 'unstage', file }));
    const commit = (message: string) => {
        sendMessage(JSON.stringify({ type: 'EXECUTE_GIT_ACTION', action: 'commit', message }));
        setCommitMessage(null);
    };
    const push = () => sendMessage(JSON.stringify({ type: 'EXECUTE_GIT_ACTION', action: 'push' }));
    const pull = () => sendMessage(JSON.stringify({ type: 'EXECUTE_GIT_ACTION', action: 'pull' }));
    const generateCommitMessage = () => sendMessage(JSON.stringify({ type: 'GENERATE_COMMIT_MESSAGE' }));

    return {
        status,
        branches,
        log,
        commitMessage,
        requestStatus,
        requestBranches,
        requestLog,
        stageFile,
        unstageFile,
        commit,
        push,
        pull,
        generateCommitMessage,
        setCommitMessage
    };
}
