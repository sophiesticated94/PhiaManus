import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight, ChevronDown, File as FileIcon, Folder } from 'lucide-react-native';

export interface FileNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    children?: FileNode[];
    isLarge?: boolean;
}

interface TreeViewProps {
    data: FileNode;
    onFilePress: (path: string) => void;
    onLazyLoad?: (path: string) => Promise<void>;
    highlightedFiles?: string[];
}

const TreeNode: React.FC<{ node: FileNode; level: number; onFilePress: (path: string) => void; onLazyLoad?: (path: string) => Promise<void>; highlightedFiles?: string[] }> = ({ node, level, onFilePress, onLazyLoad, highlightedFiles }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const isDir = node.type === 'directory';
    const isHighlighted = highlightedFiles?.includes(node.path);

    const handlePress = async () => {
        if (isDir) {
            if (!isExpanded && node.isLarge && (!node.children || node.children.length === 0)) {
                setIsLoading(true);
                if (onLazyLoad) {
                    await onLazyLoad(node.path);
                }
                setIsLoading(false);
            }
            setIsExpanded(!isExpanded);
        } else {
            onFilePress(node.path);
        }
    };

    return (
        <View>
            <TouchableOpacity 
                style={[styles.nodeContainer, { paddingLeft: level * 16 }, isHighlighted && { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]} 
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    {isDir ? (
                        isExpanded ? <ChevronDown color="#a0a0a0" size={16} /> : <ChevronRight color="#a0a0a0" size={16} />
                    ) : (
                        <View style={{ width: 16 }} />
                    )}
                    {isDir ? (
                        <Folder color="#ffd700" size={16} style={styles.typeIcon} />
                    ) : (
                        <FileIcon color="#4fc3f7" size={16} style={styles.typeIcon} />
                    )}
                </View>
                <Text style={[styles.nodeText, isHighlighted && { color: '#ffd700', fontWeight: 'bold' }]} numberOfLines={1}>
                    {node.name || 'root'}
                    {node.isLarge && !isExpanded && ' (Large - Tap to load)'}
                </Text>
                {isLoading && (
                    <ActivityIndicator size="small" color="#ffd700" style={styles.loader} />
                )}
            </TouchableOpacity>

            {isExpanded && node.children && (
                <View>
                    {node.children.map((child, index) => (
                        <TreeNode 
                            key={`${child.path}-${index}`} 
                            node={child} 
                            level={level + 1} 
                            onFilePress={onFilePress} 
                            onLazyLoad={onLazyLoad}
                            highlightedFiles={highlightedFiles}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

export const TreeView: React.FC<TreeViewProps> = ({ data, onFilePress, onLazyLoad, highlightedFiles }) => {
    return (
        <View style={styles.container}>
            <TreeNode 
                node={data} 
                level={0} 
                onFilePress={onFilePress} 
                onLazyLoad={onLazyLoad}
                highlightedFiles={highlightedFiles}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1e1e1e',
    },
    nodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingRight: 10,
    },
    iconContainer: {
        width: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 8
    },
    typeIcon: {
        marginLeft: 4
    },
    nodeText: {
        color: '#d4d4d4',
        fontSize: 14,
        fontFamily: 'monospace',
        flex: 1
    },
    loader: {
        marginLeft: 8
    }
});
