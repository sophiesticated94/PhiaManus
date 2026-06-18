import React, { useRef } from 'react';
import { View, StyleSheet, Text, PanResponder, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { getThemeHue } from '../../utils/color';

const ITEM_HEIGHT = 44;

interface ThemeSliderProps {
    categoryTitle: string;
    themes: any[];
    value: number;
    isActive: boolean;
    onValueChange: (val: number) => void;
}

export const ThemeSlider: React.FC<ThemeSliderProps> = ({
    categoryTitle,
    themes,
    value,
    isActive,
    onValueChange,
}) => {
    const { theme } = useTheme();
    const sortedThemes = [...themes].sort((a, b) => getThemeHue(a) - getThemeHue(b));
    
    const maxVal = sortedThemes.length - 1;
    if (maxVal < 0) return null;

    // Height = length * 1.5 * ITEM_HEIGHT
    const trackHeight = Math.max(100, sortedThemes.length * 1.5 * ITEM_HEIGHT);

    const gradientColors = sortedThemes.map(t => t.colors.accent);
    // LinearGradient requires at least 2 colors
    if (gradientColors.length === 1) gradientColors.push(gradientColors[0]);

    const calculateValueFromY = (y: number) => {
        // Clamp Y between 0 and trackHeight
        const clampedY = Math.max(0, Math.min(trackHeight, y));
        const rawValue = (clampedY / trackHeight) * maxVal;
        // Snap to nearest 0.25
        return Math.round(rawValue * 4) / 4;
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                onValueChange(calculateValueFromY(evt.nativeEvent.locationY));
            },
            onPanResponderMove: (evt) => {
                onValueChange(calculateValueFromY(evt.nativeEvent.locationY));
            },
        })
    ).current;

    // Calculate thumb position based on value
    const clampedValue = Math.max(0, Math.min(maxVal, value));
    const thumbY = maxVal === 0 ? 0 : (clampedValue / maxVal) * trackHeight;

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.textMuted }]}>{categoryTitle}</Text>
            
            <View style={styles.sliderContainer}>
                <View 
                    style={[styles.trackWrapper, { height: trackHeight }]}
                    {...panResponder.panHandlers}
                >
                    <LinearGradient
                        colors={gradientColors}
                        style={StyleSheet.absoluteFill}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                    />
                    {isActive && (
                        <View 
                            style={[
                                styles.thumb, 
                                { 
                                    top: thumbY - 12, 
                                    backgroundColor: theme.textPrimary,
                                    borderColor: theme.bg,
                                }
                            ]} 
                            pointerEvents="none"
                        />
                    )}
                </View>

                {/* Optional: Add tick marks or labels on the side */}
                <View style={styles.labelsContainer}>
                    {sortedThemes.map((t, i) => (
                        <View 
                            key={t.id} 
                            style={[
                                styles.labelWrapper, 
                                { top: (i / maxVal) * trackHeight - 10 }
                            ]}
                            pointerEvents="none"
                        >
                            <View style={[styles.tick, { backgroundColor: theme.border }]} />
                            <Text style={[styles.labelText, { color: theme.textSecondary }]}>
                                {t.name}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        paddingBottom: 12,
        textTransform: 'uppercase',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    trackWrapper: {
        width: 32,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    thumb: {
        position: 'absolute',
        left: -4,
        right: -4,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    labelsContainer: {
        flex: 1,
        position: 'relative',
        marginLeft: 16,
    },
    labelWrapper: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        height: 20,
    },
    tick: {
        width: 12,
        height: 2,
        marginRight: 8,
    },
    labelText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
