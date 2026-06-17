import React from 'react';
import { render } from '@testing-library/react-native';
import { BottomSheetExplorer } from './BottomSheetExplorer';

jest.mock('@gorhom/bottom-sheet', () => {
    const React = require('react');
    const { View } = require('react-native');
    const BottomSheet = ({ children }: any) => <View>{children}</View>;
    BottomSheet.ScrollView = ({ children }: any) => <View>{children}</View>;
    return {
        __esModule: true,
        default: BottomSheet,
        BottomSheetScrollView: BottomSheet.ScrollView,
    };
});

describe('BottomSheetExplorer', () => {
    it('renders loading state when tree is null', () => {
        const { getByText } = render(
            <BottomSheetExplorer 
                fileTree={null} 
                onFilePress={() => {}} 
                onLazyLoad={async () => {}} 
            />
        );

        expect(getByText('Workspace Explorer')).toBeTruthy();
        expect(getByText('Loading workspace...')).toBeTruthy();
    });

    it('renders tree view when data is provided', () => {
        const mockTree = {
            name: 'src',
            type: 'directory' as const,
            path: '/src',
            children: [
                { name: 'index.ts', type: 'file' as const, path: '/src/index.ts' }
            ]
        };

        const { getByText, queryByText } = render(
            <BottomSheetExplorer 
                fileTree={mockTree} 
                onFilePress={() => {}} 
                onLazyLoad={async () => {}} 
            />
        );

        expect(getByText('src')).toBeTruthy();
        expect(queryByText('Loading workspace...')).toBeNull();
    });
});
