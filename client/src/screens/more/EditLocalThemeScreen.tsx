import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text, TextInput,   Switch } from 'react-native';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../theme/ThemeContext';
import { useThemes } from '../../hooks/useThemes';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { ThemeDef, pinkTheme } from '../../theme/themes';

interface EditLocalThemeScreenProps {
    navigation: any;
    route?: any;
    onClose: () => void;
}

// Helper to convert hex to RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } {
    let cleaned = hex.replace('#', '');
    if (cleaned.startsWith('rgba')) {
        // basic parser for rgba(r,g,b,a)
        const match = cleaned.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
            return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
        }
        return { r: 255, g: 255, b: 255 };
    }
    
    if (cleaned.length === 3) {
        cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
    }
    const num = parseInt(cleaned, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

const THEME_KEYS = [
    'accent', 'accentSoft', 'accentDark', 'bg', 'surface', 'surfaceElevated', 
    'surfaceHighlight', 'border', 'borderSubtle', 'textPrimary', 'textSecondary', 
    'textMuted', 'success', 'danger', 'warning', 'info'
] as const;

export const EditLocalThemeScreen: React.FC<EditLocalThemeScreenProps> = ({ navigation, route, onClose }) => {
    const { theme } = useTheme();
    const { categories, addLocalTheme } = useThemes();

    const [name, setName] = useState('');
    
    // Flatten all available themes to choose a base from
    const availableBases = useMemo(() => {
        const bases: ThemeDef[] = [];
        for (const cat of categories) {
            bases.push(...cat.themes);
        }
        return bases;
    }, [categories]);

    const [selectedBaseId, setSelectedBaseId] = useState(availableBases[0]?.id || 'pink');
    const [draftColors, setDraftColors] = useState(availableBases[0]?.colors || pinkTheme);
    const [selectedKey, setSelectedKey] = useState<keyof typeof draftColors>('bg');
    const [isHexMode, setIsHexMode] = useState(false);

    const handleBaseSelect = (id: string) => {
        setSelectedBaseId(id);
        const base = availableBases.find(t => t.id === id);
        if (base) {
            setDraftColors(base.colors);
        }
    };

    const handleSave = () => {
        if (!name.trim()) return;
        addLocalTheme({
            name: name.trim(),
            colors: draftColors,
        });
        navigation.goBack();
    };

    const currentColorHex = draftColors[selectedKey];
    const { r, g, b } = useMemo(() => hexToRgb(currentColorHex), [currentColorHex]);

    const updateColor = (newR: number, newG: number, newB: number) => {
        const hex = rgbToHex(newR, newG, newB);
        setDraftColors(prev => ({ ...prev, [selectedKey]: hex }));
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader
                title="Custom Theme"
                onBack={() => navigation.goBack()}
                onClose={onClose}
            />
            
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Theme Name</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                    placeholder="My Awesome Theme"
                    placeholderTextColor={theme.textMuted}
                    value={name}
                    onChangeText={setName}
                />

                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 24 }]}>Clone From Base</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {availableBases.map(base => (
                        <TouchableOpacity
                            key={base.id}
                            style={[
                                styles.chip,
                                { 
                                    backgroundColor: selectedBaseId === base.id ? theme.accent : theme.surface,
                                    borderColor: selectedBaseId === base.id ? theme.accent : theme.border,
                                }
                            ]}
                            onPress={() => handleBaseSelect(base.id)}
                        >
                            <Text style={{ color: selectedBaseId === base.id ? '#fff' : theme.textPrimary }}>
                                {base.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 24 }]}>Select Color Property</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                    {THEME_KEYS.map(key => (
                        <TouchableOpacity
                            key={key}
                            style={[
                                styles.chip,
                                { 
                                    backgroundColor: selectedKey === key ? theme.accent : theme.surface,
                                    borderColor: selectedKey === key ? theme.accent : theme.border,
                                }
                            ]}
                            onPress={() => setSelectedKey(key as any)}
                        >
                            <View style={[styles.colorDot, { backgroundColor: draftColors[key as keyof typeof draftColors] }]} />
                            <Text style={{ color: selectedKey === key ? '#fff' : theme.textPrimary }}>
                                {key}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={[styles.editorCard, { backgroundColor: theme.surfaceElevated }]}>
                    <View style={styles.editorHeader}>
                        <Text style={[styles.editorTitle, { color: theme.textPrimary }]}>
                            {isHexMode ? 'Hex Input' : 'RGB Sliders'}
                        </Text>
                        <Switch
                            value={isHexMode}
                            onValueChange={setIsHexMode}
                            trackColor={{ false: theme.surface, true: theme.accent }}
                            thumbColor="#fff"
                        />
                    </View>

                    {isHexMode ? (
                        <View style={styles.hexInputRow}>
                            <View style={styles.whiteBackgroundBox}>
                                <View style={[styles.colorPreviewBoxSmall, { backgroundColor: currentColorHex }]} />
                            </View>
                            <TextInput
                                style={[styles.hexInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.bg }]}
                                value={currentColorHex}
                                onChangeText={(val) => {
                                    setDraftColors(prev => ({ ...prev, [selectedKey]: val }));
                                }}
                                autoCapitalize="characters"
                                placeholder="#000000"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>
                    ) : (
                        <>
                            <View style={styles.colorPreviewHeader}>
                                <View style={[styles.colorPreviewBox, { backgroundColor: draftColors[selectedKey] }]} />
                                <Text style={[styles.colorHexText, { color: theme.textPrimary }]}>{draftColors[selectedKey]}</Text>
                            </View>
                            
                            <View style={styles.sliderRow}>
                                <Text style={[styles.sliderLabel, { color: '#ef4444' }]}>R</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={255}
                                    step={1}
                                    value={r}
                                    onValueChange={val => updateColor(val, g, b)}
                                    minimumTrackTintColor="#ef4444"
                                    maximumTrackTintColor={theme.border}
                                    thumbTintColor="#ef4444"
                                />
                                <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{r}</Text>
                            </View>

                            <View style={styles.sliderRow}>
                                <Text style={[styles.sliderLabel, { color: '#10b981' }]}>G</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={255}
                                    step={1}
                                    value={g}
                                    onValueChange={val => updateColor(r, val, b)}
                                    minimumTrackTintColor="#10b981"
                                    maximumTrackTintColor={theme.border}
                                    thumbTintColor="#10b981"
                                />
                                <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{g}</Text>
                            </View>

                            <View style={styles.sliderRow}>
                                <Text style={[styles.sliderLabel, { color: '#3b82f6' }]}>B</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={0}
                                    maximumValue={255}
                                    step={1}
                                    value={b}
                                    onValueChange={val => updateColor(r, g, val)}
                                    minimumTrackTintColor="#3b82f6"
                                    maximumTrackTintColor={theme.border}
                                    thumbTintColor="#3b82f6"
                                />
                                <Text style={[styles.sliderValue, { color: theme.textSecondary }]}>{b}</Text>
                            </View>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.accent, opacity: !name ? 0.5 : 1 }]}
                    onPress={handleSave}
                    disabled={!name}
                >
                    <Text style={styles.saveText}>Save Theme</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
    },
    horizontalScroll: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginRight: 12,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    editorCard: {
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
    },
    editorHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    editorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    hexInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    whiteBackgroundBox: {
        width: 48,
        height: 48,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    colorPreviewBoxSmall: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    hexInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        fontFamily: 'monospace',
    },
    colorPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    colorPreviewBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    colorHexText: {
        fontSize: 18,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sliderLabel: {
        width: 20,
        fontWeight: 'bold',
        fontSize: 16,
    },
    slider: {
        flex: 1,
        height: 40,
    },
    sliderValue: {
        width: 32,
        textAlign: 'right',
        fontVariant: ['tabular-nums'],
    },
    saveBtn: {
        marginTop: 32,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
