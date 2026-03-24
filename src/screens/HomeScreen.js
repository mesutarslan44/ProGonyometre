import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';

// Goniometer icon
const GoniometerIcon = require('../../assets/goniometer.png');

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Image source={GoniometerIcon} style={styles.logoImage} />
                    <Text style={styles.title}>ProGonyometre</Text>
                    <Text style={styles.subtitle}>Dijital Eklem Açıölçer</Text>
                </View>

                {/* Tagline */}
                <View style={styles.taglineContainer}>
                    <Text style={styles.tagline}>
                        Fizyoterapistler için profesyonel{'\n'}ROM ölçüm aracı
                    </Text>
                </View>

                {/* Main Actions */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={() => navigation.navigate('JointSelection')}
                        activeOpacity={0.8}
                    >
                        <Image source={require('../../assets/icons/new_measurement.png')} style={styles.actionIconImage} />
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Yeni Ölçüm</Text>
                            <Text style={styles.actionDescription}>
                                Eklem seçerek ölçüm başlat
                            </Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => navigation.navigate('History')}
                        activeOpacity={0.8}
                    >
                        <Image source={require('../../assets/icons/chart.png')} style={styles.actionIconImage} />
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Geçmiş Ölçümler</Text>
                            <Text style={styles.actionDescription}>
                                Kayıtlı ölçümleri görüntüle
                            </Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => navigation.navigate('Calibration')}
                        activeOpacity={0.8}
                    >
                        <Image source={require('../../assets/icons/settings.png')} style={styles.actionIconImage} />
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Kalibrasyon</Text>
                            <Text style={styles.actionDescription}>
                                Sensör kontrolü ve kalibrasyon
                            </Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton]}
                        onPress={() => navigation.navigate('About')}
                        activeOpacity={0.8}
                    >
                        <Image source={require('../../assets/icons/info.png')} style={styles.actionIconImage} />
                        <View style={styles.actionTextContainer}>
                            <Text style={styles.actionTitle}>Hakkında</Text>
                            <Text style={styles.actionDescription}>
                                Uygulama ve geliştirici bilgileri
                            </Text>
                        </View>
                        <Text style={styles.actionArrow}>→</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Footer - Now safely below content */}
            <View style={styles.footerContainer}>
                <Text style={styles.footer}>
                    v1.0.0 • ProGonyometre
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        fontSize: 48,
        marginBottom: 10,
    },
    logoImage: {
        width: 80,
        height: 80,
        marginBottom: 12,
        resizeMode: 'contain',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 5,
    },
    taglineContainer: {
        alignItems: 'center',
        marginBottom: 25,
    },
    tagline: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    actionsContainer: {
        gap: 12,
        marginBottom: 25,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
    },
    primaryButton: {
        backgroundColor: COLORS.primary + '15',
        borderColor: COLORS.primary,
    },
    secondaryButton: {
        backgroundColor: COLORS.surface,
        borderColor: COLORS.cardBorder,
    },
    actionIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    actionIconImage: {
        width: 32,
        height: 32,
        marginRight: 14,
        resizeMode: 'contain',
    },
    actionTextContainer: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 3,
    },
    actionDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    actionArrow: {
        fontSize: 22,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    featuresContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    footerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.cardBorder,
    },
    footer: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        fontSize: 12,
    },
});
