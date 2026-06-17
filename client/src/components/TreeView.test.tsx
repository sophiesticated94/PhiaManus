import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { TreeView, FileNode } from './TreeView';

describe('TreeView', () => {
    const mockData: FileNode = {
        name: 'root',
        type: 'directory',
        path: '/',
        children: [
            {
                name: 'src',
                type: 'directory',
                path: '/src',
                children: [
                    { name: 'index.ts', type: 'file', path: '/src/index.ts' }
                ]
            },
            {
                name: 'large_folder',
                type: 'directory',
                path: '/large_folder',
                isLarge: true,
                children: []
            },
            {
                name: 'package.json',
                type: 'file',
                path: '/package.json'
            }
        ]
    };

    it('renders root children', () => {
        render(<TreeView data={mockData} onFilePress={jest.fn()} />);
        
        expect(screen.getByText('root')).toBeTruthy();
        
        fireEvent.press(screen.getByText('root'));
        expect(screen.getByText('src')).toBeTruthy();
        expect(screen.getByText('package.json')).toBeTruthy();
    });

    it('triggers onFilePress when a file is clicked', () => {
        const onFilePressMock = jest.fn();
        render(<TreeView data={mockData} onFilePress={onFilePressMock} />);
        
        fireEvent.press(screen.getByText('root')); // expand root
        fireEvent.press(screen.getByText('package.json')); // click file

        expect(onFilePressMock).toHaveBeenCalledWith('/package.json');
    });

    it('triggers onLazyLoad when a large directory is expanded for the first time', async () => {
        const onLazyLoadMock = jest.fn().mockResolvedValue(undefined);
        render(<TreeView data={mockData} onFilePress={jest.fn()} onLazyLoad={onLazyLoadMock} />);
        
        fireEvent.press(screen.getByText('root')); // expand root
        
        const largeFolderText = screen.getByText('large_folder (Large - Tap to load)');
        expect(largeFolderText).toBeTruthy();

        fireEvent.press(largeFolderText); // expand large folder
        
        expect(onLazyLoadMock).toHaveBeenCalledWith('/large_folder');
    });
});
