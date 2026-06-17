import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Check, X } from 'lucide-react-native';

export interface DiffLine {
    type: 'added' | 'removed' | 'context';
    value: string;
    oldLine?: number;
    newLine?: number;
}

interface DiffViewerProps {
    diff: DiffLine[];
    onApprove: () => void;
    onReject: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diff, onApprove, onReject }) => {
    const renderLine = (line: DiffLine, index: number) => {
        const isAdded = line.type === 'added';
        const isRemoved = line.type === 'removed';
        
        let bgColor = 'transparent';
        if (isAdded) bgColor = 'rgba(0, 255, 0, 0.15)';
        if (isRemoved) bgColor = 'rgba(255, 0, 0, 0.15)';
        
        return (
            <View key={index} style={[styles.lineRow, { backgroundColor: bgColor }]}>
                <View style={styles.lineNumberContainer}>
                    <Text style={styles.lineNumber}>{line.oldLine || ' '}</Text>
                </View>
                <View style={styles.lineNumberContainer}>
                    <Text style={styles.lineNumber}>{line.newLine || ' '}</Text>
                </View>
                <View style={styles.codeContainer}>
                    <Text style={styles.codeText} numberOfLines={1}>
                        {isAdded ? '+ ' : isRemoved ? '- ' : '  '}
                        {line.value}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Review Proposed Changes</Text>
            </View>
            <ScrollView style={styles.scrollView} horizontal showsHorizontalScrollIndicator={true}>
                <ScrollView style={styles.scrollViewVertical}>
                    <View style={styles.diffContainer}>
                        {diff.map(renderLine)}
                    </View>
                </ScrollView>
            </ScrollView>
            <View style={styles.actionContainer}>
                <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={onReject}>
                    <X color="#fff" size={20} />
                    <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.approveButton]} onPress={onApprove}>
                    <Check color="#000" size={20} />
                    <Text style={[styles.buttonText, { color: '#000' }]}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#444',
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 10,
    },
    header: {
        backgroundColor: '#2d2d2d',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    headerText: {
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewVertical: {
        flex: 1,
    },
    diffContainer: {
        minWidth: '100%',
    },
    lineRow: {
        flexDirection: 'row',
        paddingVertical: 2,
    },
    lineNumberContainer: {
        width: 35,
        alignItems: 'flex-end',
        paddingRight: 10,
        borderRightWidth: 1,
        borderRightColor: '#444',
    },
    lineNumber: {
        color: '#888',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    codeContainer: {
        flex: 1,
        paddingLeft: 10,
        paddingRight: 20,
    },
    codeText: {
        color: '#d4d4d4',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    actionContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#444',
        backgroundColor: '#2d2d2d',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        marginLeft: 10,
    },
    rejectButton: {
        backgroundColor: '#ff5f56',
    },
    approveButton: {
        backgroundColor: '#00ff00',
    },
    buttonText: {
        color: '#fff',
        fontFamily: 'monospace',
        fontWeight: 'bold',
        marginLeft: 6,
    }
});
