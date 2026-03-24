import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';
import { getMeasurements, deleteMeasurement, formatDate, clearAllMeasurements } from '../utils/storage';
import { getMovementById } from '../data/joints';

export default function HistoryScreen({ navigation }) {
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMeasurements();

        // Reload when screen gets focus
        const unsubscribe = navigation.addListener('focus', () => {
            loadMeasurements();
        });

        return unsubscribe;
    }, [navigation]);

    const loadMeasurements = async () => {
        setLoading(true);
        const data = await getMeasurements();
        setMeasurements(data);
        setLoading(false);
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Ölçümü Sil',
            'Bu ölçümü silmek istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteMeasurement(id);
                        loadMeasurements();
                    },
                },
            ]
        );
    };

    const handleClearAll = () => {
        Alert.alert(
            'Tümünü Sil',
            'Tüm ölçüm geçmişini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Tümünü Sil',
                    style: 'destructive',
                    onPress: async () => {
                        await clearAllMeasurements();
                        loadMeasurements();
                    },
                },
            ]
        );
    };

    const getROMStatus = (angle, normalROM) => {
        const percentage = (angle / normalROM.max) * 100;
        if (percentage >= 90) return { status: 'Normal', color: COLORS.success };
        if (percentage >= 70) return { status: 'Hafif Kısıtlı', color: COLORS.warning };
        return { status: 'Kısıtlı', color: COLORS.danger };
    };

    const renderMeasurement = ({ item }) => {
        const movement = getMovementById(item.movementId);
        const romStatus = getROMStatus(item.angle, item.normalROM);

        return (
            <TouchableOpacity
                style={styles.measurementCard}
                onLongPress={() => handleDelete(item.id)}
                activeOpacity={0.8}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.jointInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.jointName}>{item.jointName}</Text>
                            {item.side && (
                                <View style={[styles.sideBadge, { backgroundColor: item.side === 'left' ? '#4A90D9' : '#D94A4A' }]}>
                                    <Text style={styles.sideBadgeText}>{item.side === 'left' ? 'SOL' : 'SAĞ'}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.movementName}>{item.movementName}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: romStatus.color + '20' }]}>
                        <Text style={[styles.statusText, { color: romStatus.color }]}>
                            {romStatus.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.angleContainer}>
                        <Text style={styles.angleValue}>{item.angle}°</Text>
                        <Text style={styles.angleLabel}>Ölçülen</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.romContainer}>
                        <Text style={styles.romValue}>
                            {item.normalROM && item.normalROM.max > 0
                                ? `${item.normalROM.min || 0}°-${item.normalROM.max}°`
                                : 'N/A'}
                        </Text>
                        <Text style={styles.romLabel}>Referans</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.percentContainer}>
                        <Text style={[
                            styles.percentValue,
                            {
                                color: item.normalROM && item.normalROM.max > 0
                                    ? (item.angle / item.normalROM.max >= 0.9 ? COLORS.success
                                        : item.angle / item.normalROM.max >= 0.7 ? COLORS.warning
                                            : COLORS.danger)
                                    : COLORS.textSecondary
                            }
                        ]}>
                            {item.normalROM && item.normalROM.max > 0
                                ? `${Math.round((item.angle / item.normalROM.max) * 100)}%`
                                : 'N/A'}
                        </Text>
                        <Text style={styles.percentLabel}>
                            {item.normalROM && item.normalROM.max > 0
                                ? (item.angle / item.normalROM.max >= 0.9 ? 'Normal'
                                    : item.angle / item.normalROM.max >= 0.7 ? 'Hafif Kısıtlı'
                                        : 'Kısıtlı')
                                : 'Durum'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
                    {item.note && <Text style={styles.note}>{item.note}</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    if (measurements.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Image source={require('../../assets/icons/chart.png')} style={styles.emptyIconImage} />
                <Text style={styles.emptyTitle}>Henüz Ölçüm Yok</Text>
                <Text style={styles.emptyDescription}>
                    Yeni bir ölçüm yaparak geçmişinizi oluşturmaya başlayın.
                </Text>
                <TouchableOpacity
                    style={styles.newMeasurementButton}
                    onPress={() => navigation.navigate('JointSelection')}
                >
                    <Text style={styles.newMeasurementText}>Yeni Ölçüm Yap</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Header Stats */}
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{measurements.length}</Text>
                    <Text style={styles.statLabel}>Toplam</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>
                        {new Set(measurements.map(m => m.jointId)).size}
                    </Text>
                    <Text style={styles.statLabel}>Farklı Eklem</Text>
                </View>
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={handleClearAll}
                >
                    <Text style={styles.clearButtonText}>Tümünü Sil</Text>
                </TouchableOpacity>
            </View>

            {/* Measurements List */}
            <FlatList
                data={measurements}
                renderItem={renderMeasurement}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />

            <Text style={styles.hint}>Silmek için ölçüme uzun basın</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
    },
    emptyDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    newMeasurementButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 12,
    },
    newMeasurementText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: COLORS.cardBorder,
    },
    clearButton: {
        backgroundColor: COLORS.danger + '20',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.danger + '50',
    },
    clearButtonText: {
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    measurementCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    jointInfo: {},
    jointName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 2,
        marginRight: 8,
    },
    sideBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    sideBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    movementName: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    cardBody: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 14,
    },
    angleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    angleValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    angleLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: COLORS.cardBorder,
    },
    romContainer: {
        flex: 1,
        alignItems: 'center',
    },
    romValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
    },
    romLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    percentContainer: {
        flex: 1,
        alignItems: 'center',
    },
    percentValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
    percentLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    cardFooter: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.cardBorder,
    },
    timestamp: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    note: {
        fontSize: 12,
        color: COLORS.text,
        marginTop: 6,
        fontStyle: 'italic',
    },
    emptyIconImage: {
        width: 64,
        height: 64,
        marginBottom: 16,
        opacity: 0.3,
        resizeMode: 'contain',
    },
    hint: {
        textAlign: 'center',
        fontSize: 11,
        color: COLORS.textSecondary,
        padding: 10,
    },
});
