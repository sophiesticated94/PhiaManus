import React from 'react';
import { View, StyleSheet, ScrollView, Linking, Text } from 'react-native';
import { MessageSquare, Lightbulb, Puzzle, Star, Mail, Palette } from 'lucide-react-native';
import Constants from 'expo-constants';
import { useTheme } from '../../theme/ThemeContext';
import { ScreenHeader } from '../../components/more/ScreenHeader';
import { SectionCard } from '../../components/more/SectionCard';
import { MenuRow } from '../../components/more/MenuRow';

interface MoreScreenProps {
    navigation: any;
    onClose: () => void;
}

export const MoreScreen: React.FC<MoreScreenProps> = ({ navigation, onClose }) => {
    const { theme } = useTheme();
    const version = Constants.expoConfig?.version ?? '1.0.0';

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <ScreenHeader title="More" onClose={onClose} />
            <ScrollView contentContainerStyle={styles.scroll}>
                
                <SectionCard label="Resources">
                    <MenuRow
                        icon={<MessageSquare color="#fff" size={18} />}
                        iconBg={theme.accent}
                        title="Prompts"
                        subtitle="Curated prompts for devs"
                        onPress={() => navigation.navigate('PromptsScreen')}
                    />
                    <MenuRow
                        icon={<Lightbulb color="#fff" size={18} />}
                        iconBg="#f97316"
                        title="Tips & Tricks"
                        subtitle="Learn how to use PhiaManus"
                        onPress={() => navigation.navigate('TipsScreen')}
                    />
                    <MenuRow
                        icon={<Puzzle color="#fff" size={18} />}
                        iconBg="#06b6d4"
                        title="Extensions"
                        subtitle="Gemini CLI extension catalog"
                        onPress={() => navigation.navigate('ExtensionsScreen')}
                    />
                </SectionCard>

                <SectionCard label="Support">
                    <MenuRow
                        icon={<Star color="#fff" size={18} />}
                        iconBg="#8b5cf6"
                        title="Rate Us"
                        onPress={() => Linking.openURL('https://apps.apple.com')}
                    />
                    <MenuRow
                        icon={<Mail color="#fff" size={18} />}
                        iconBg="#3b82f6"
                        title="Contact Us"
                        onPress={() => Linking.openURL('mailto:zosiatront@gmail.com')}
                    />
                </SectionCard>

                <SectionCard label="Information">
                    <MenuRow
                        title="Terms of Use"
                        onPress={() => navigation.navigate('WebViewScreen', { title: 'Terms of Use' })}
                    />
                    <MenuRow
                        title="Privacy Policy"
                        onPress={() => navigation.navigate('WebViewScreen', { title: 'Privacy Policy' })}
                    />
                    <MenuRow
                        title="Version"
                        rightValue={version}
                    />
                    <MenuRow
                        icon={<Palette color="#fff" size={18} />}
                        iconBg="#ec4899"
                        title="Appearance"
                        subtitle="Switch themes"
                        onPress={() => navigation.navigate('AppearanceScreen')}
                    />
                </SectionCard>

                <Text style={[styles.version, { color: theme.textMuted }]}>
                    PhiaManus v{version}
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 40 },
    version: { textAlign: 'center', marginTop: 20, fontSize: 12 },
});
