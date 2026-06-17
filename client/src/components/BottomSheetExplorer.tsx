import React, { useMemo, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { TreeView, FileNode } from './TreeView';

interface BottomSheetExplorerProps {
    fileTree: FileNode | null;
    onFilePress: (path: string) => void;
    onLazyLoad: (path: string) => Promise<void>;
}

export const BottomSheetExplorer: React.FC<BottomSheetExplorerProps> = ({ fileTree, onFilePress, onLazyLoad }) => {
    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);

    // variables
    const snapPoints = useMemo(() => ['10%', '50%', '100%'], []);

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={1} // Default to 50%
            snapPoints={snapPoints}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.handleIndicator}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Workspace Explorer</Text>
            </View>
            <BottomSheetScrollView style={styles.contentContainer}>
                {fileTree ? (
                    <TreeView 
                        data={fileTree} 
                        onFilePress={onFilePress} 
                        onLazyLoad={onLazyLoad} 
                    />
                ) : (
                    <Text style={styles.loadingText}>Loading workspace...</Text>
                )}
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    bottomSheetBackground: {
        backgroundColor: '#181818',
        borderTopWidth: 1,
        borderTopColor: '#333'
    },
    handleIndicator: {
        backgroundColor: '#666',
        width: 40
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#222'
    },
    headerTitle: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    contentContainer: {
        flex: 1,
        padding: 10,
    },
    loadingText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 20
    }
});
