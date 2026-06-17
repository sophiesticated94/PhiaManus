import React from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    StyleProp,
    ViewStyle,
} from 'react-native';
import { Wand2 } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

interface MagicWandInputProps {
    value: string;
    onChangeText: (text: string) => void;
    onMagicWand: () => void;
    isEnhancing: boolean;
    isConnected: boolean;
    placeholder?: string;
    minHeight?: number;
    style?: StyleProp<ViewStyle>;
}

export const MagicWandInput: React.FC<MagicWandInputProps> = ({
    value,
    onChangeText,
    onMagicWand,
    isEnhancing,
    isConnected,
    placeholder = 'Write your prompt...',
    minHeight = 100,
    style,
}) => {
    const { theme } = useTheme();

    const handleWandPress = () => {
        if (!isConnected) {
            Alert.alert(
                'Not Connected',
                'You need to connect to a VS Code session to use AI features. Scan the pairing QR code to get started.',
                [{ text: 'OK' }]
            );
            return;
        }
        onMagicWand();
    };

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    minHeight,
                },
                style,
            ]}
        >
            <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={theme.textMuted}
                multiline
                textAlignVertical="top"
            />
            <TouchableOpacity
                style={[
                    styles.wandButton,
                    {
                        backgroundColor: isConnected ? theme.accentSoft : theme.surfaceHighlight,
                        borderColor: isConnected ? theme.accent : theme.border,
                    },
                ]}
                onPress={handleWandPress}
                disabled={isEnhancing}
            >
                {isEnhancing ? (
                    <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                    <Wand2
                        color={isConnected ? theme.accent : theme.textMuted}
                        size={18}
                    />
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        paddingBottom: 48,
        position: 'relative',
    },
    input: {
        fontSize: 14,
        lineHeight: 20,
        flex: 1,
    },
    wandButton: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
