import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DiffViewer } from './DiffViewer';

describe('DiffViewer', () => {
    const mockDiff = [
        { type: 'context', value: 'const x = 1;', oldLine: 1, newLine: 1 },
        { type: 'removed', value: 'const y = 2;', oldLine: 2 },
        { type: 'added', value: 'const y = 3;', newLine: 2 }
    ] as any;

    it('renders correctly', () => {
        const { getByText } = render(
            <DiffViewer diff={mockDiff} onApprove={() => {}} onReject={() => {}} />
        );

        expect(getByText('const x = 1;')).toBeTruthy();
        expect(getByText('- const y = 2;')).toBeTruthy();
        expect(getByText('+ const y = 3;')).toBeTruthy();
    });

    it('handles approve and reject', () => {
        const onApprove = jest.fn();
        const onReject = jest.fn();

        const { getByText } = render(
            <DiffViewer diff={mockDiff} onApprove={onApprove} onReject={onReject} />
        );

        fireEvent.press(getByText('Approve'));
        expect(onApprove).toHaveBeenCalled();

        fireEvent.press(getByText('Reject'));
        expect(onReject).toHaveBeenCalled();
    });
});
