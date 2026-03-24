import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    Linking,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';

// Uygulama bilgileri - Bu değerleri güncelleyebilirsiniz
const APP_INFO = {
    name: 'ProGonyometre',
    version: '1.0.0',
    developer: 'Fzt. M.Arslan',
    email: '',
    website: '',
};

export default function AboutScreen() {
    const handleEmailPress = () => {
        if (APP_INFO.email) {
            Linking.openURL(`mailto:${APP_INFO.email}`);
        }
    };

    const handleWebsitePress = () => {
        if (APP_INFO.website) {
            Linking.openURL(APP_INFO.website);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* App Logo & Name */}
                <View style={styles.header}>
                    <Text style={styles.logo}>📐</Text>
                    <Text style={styles.appName}>{APP_INFO.name}</Text>
                    <Text style={styles.version}>Versiyon {APP_INFO.version}</Text>
                </View>

                {/* Developer Info */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👨‍⚕️ Geliştirici</Text>
                    <Text style={styles.developerName}>{APP_INFO.developer}</Text>

                    {APP_INFO.email && (
                        <TouchableOpacity onPress={handleEmailPress} style={styles.contactButton}>
                            <Text style={styles.contactIcon}>📧</Text>
                            <Text style={styles.contactText}>{APP_INFO.email}</Text>
                        </TouchableOpacity>
                    )}

                    {APP_INFO.website && (
                        <TouchableOpacity onPress={handleWebsitePress} style={styles.contactButton}>
                            <Text style={styles.contactIcon}>🌐</Text>
                            <Text style={styles.contactText}>{APP_INFO.website}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Reference Values Section */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>📚 Referans Değerlerimiz ve Bilimsel Dayanağımız</Text>

                    <Text style={styles.paragraph}>
                        {APP_INFO.name}, klinik ölçümlerde en yüksek doğruluk ve güvenilirliği sağlamak amacıyla tasarlanmıştır. Uygulamamızda kullanılan Eklem Hareket Açıklığı (ROM) referans değerleri, tüm dünyada ortopedi ve fizyoterapi camiasının <Text style={styles.highlight}>"Altın Standart"</Text> (Gold Standard) olarak kabul ettiği <Text style={styles.highlight}>American Academy of Orthopaedic Surgeons (AAOS)</Text> kriterlerine dayanmaktadır.
                    </Text>
                </View>

                {/* Why AAOS */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>❓ Neden AAOS Standartlarını Kullanıyoruz?</Text>

                    <View style={styles.bulletPoint}>
                        <Text style={styles.bulletIcon}>📐</Text>
                        <View style={styles.bulletContent}>
                            <Text style={styles.bulletTitle}>Nötral Sıfır Yöntemi (0-180°)</Text>
                            <Text style={styles.bulletText}>
                                AAOS, anatomik pozisyonu "0" kabul eden ve uluslararası literatürde en geçerli ölçüm sistemi olan Nötral Sıfır Yöntemini (Neutral Zero Method) kullanır. Dijital ölçüm algoritmamız bu sisteme tam uyumludur.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.bulletPoint}>
                        <Text style={styles.bulletIcon}>🏥</Text>
                        <View style={styles.bulletContent}>
                            <Text style={styles.bulletTitle}>Klinik Geçerlilik</Text>
                            <Text style={styles.bulletText}>
                                AAOS verileri, engellilik hesaplamalarından ziyade, fonksiyonel kapasiteyi ve rehabilitasyon hedeflerini belirlemeye odaklanır. Bu, fizyoterapi süreci için en doğru yaklaşımdır.
                            </Text>
                        </View>
                    </View>

                    <View style={styles.bulletPoint}>
                        <Image source={require('../../assets/icons/graduation.png')} style={styles.bulletIconImage} />
                        <View style={styles.bulletContent}>
                            <Text style={styles.bulletTitle}>Akademik Tutarlılık</Text>
                            <Text style={styles.bulletText}>
                                Türkiye'deki ve dünyadaki saygın Fizyoterapi ve Rehabilitasyon fakültelerinde temel kaynak olarak okutulan <Text style={styles.highlight}>Norkin & White: Measurement of Joint Motion</Text> eserindeki değerler ile tam uyumluluk sağlanmıştır.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Legal Disclaimer */}
                <View style={[styles.card, styles.warningCard]}>
                    <Text style={styles.warningTitle}>⚠️ Yasal Uyarı</Text>
                    <Text style={styles.warningText}>
                        Burada sunulan değerler sağlıklı yetişkin bireyler için kabul edilen ortalama sınırlardır. Yaş, cinsiyet ve bireysel anatomik farklılıklar normal değerlerde değişikliğe sebep olabilir. Kesin tanı ve tedavi için mutlaka uzman hekim veya fizyoterapist değerlendirmesi gereklidir.
                    </Text>
                </View>

                {/* Features */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>✨ Uygulama Özellikleri</Text>

                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/icons/muscle.png')} style={styles.featureIconImage} />
                        <Text style={styles.featureText}>Üst Ekstremite Ölçümleri</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/icons/leg.png')} style={styles.featureIconImage} />
                        <Text style={styles.featureText}>Alt Ekstremite Ölçümleri</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/icons/thoracolumbar.png')} style={styles.featureIconImage} />
                        <Text style={styles.featureText}>Omurga Ölçümleri</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/icons/phone.png')} style={styles.featureIconImage} />
                        <Text style={styles.featureText}>Telefon Yerleştirme Rehberi</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/icons/chart.png')} style={styles.featureIconImage} />
                        <Text style={styles.featureText}>Ölçüm Geçmişi</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/icons/vibrate.png')} style={styles.featureIconImage} />
                        <Text style={styles.featureText}>Haptik Geri Bildirim</Text>
                    </View>
                </View>

                {/* Copyright */}
                <Text style={styles.copyright}>
                    © 2025 {APP_INFO.developer}{'\n'}
                    Tüm hakları saklıdır.
                </Text>
            </ScrollView>
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
        padding: 16,
        paddingBottom: 30,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 20,
    },
    logo: {
        fontSize: 56,
        marginBottom: 12,
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 6,
    },
    version: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 14,
        lineHeight: 24,
    },
    developerName: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        padding: 12,
        borderRadius: 10,
        marginTop: 8,
    },
    contactIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    contactText: {
        fontSize: 14,
        color: COLORS.primary,
    },
    paragraph: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 22,
    },
    highlight: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    bulletIcon: {
        fontSize: 20,
        marginRight: 12,
        marginTop: 2,
    },
    bulletContent: {
        flex: 1,
    },
    bulletTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 4,
    },
    bulletText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    warningCard: {
        backgroundColor: COLORS.warning + '15',
        borderColor: COLORS.warning + '40',
    },
    warningTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: COLORS.warning,
        marginBottom: 10,
    },
    warningText: {
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 20,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    featureIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    featureIconImage: {
        width: 24,
        height: 24,
        marginRight: 12,
        resizeMode: 'contain',
    },
    bulletIconImage: {
        width: 24,
        height: 24,
        marginRight: 12,
        resizeMode: 'contain',
    },
    featureText: {
        fontSize: 14,
        color: COLORS.text,
    },
    copyright: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 10,
        lineHeight: 18,
    },
});
