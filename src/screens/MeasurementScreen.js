import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
    Modal,
    TextInput,
    Dimensions,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import Svg, { G, Path, Defs, LinearGradient, Stop, Text as SvgText, Circle, Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';
import { saveMeasurement } from '../utils/storage';

// Adaptif filtre parametreleri
const FILTER_ALPHA_MIN = 0.03;  // Duruyorken çok yumuşak
const FILTER_ALPHA_MAX = 0.35;  // Hareket edince hızlı tepki
const DEAD_ZONE = 2;            // ±2 derece altı değişimler yok sayılır
const VELOCITY_THRESHOLD = 5;   // Bu derecenin üstünde hızlı hareket sayılır
const MILESTONE_ANGLES = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];

export default function MeasurementScreen({ navigation, route }) {
    const { movement, jointName, jointId } = route.params;
    const maxAngle = movement.normalROM.max || 180;

    // State
    const [rawAngle, setRawAngle] = useState(0);           // Sensörden gelen ham açı (0-360)
    const [displayAngle, setDisplayAngle] = useState(0);   // Görüntülenen açı
    const [relativeAngle, setRelativeAngle] = useState(0); // Sıfırlamaya göre relatif açı
    const [isHeld, setIsHeld] = useState(false);
    const [tareOffset, setTareOffset] = useState(0);       // Sıfırlama offseti
    const [sensorAvailable, setSensorAvailable] = useState(true);
    const [showPlacementGuide, setShowPlacementGuide] = useState(true);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [note, setNote] = useState('');
    const [orientation, setOrientation] = useState('portrait');
    const [selectedSide, setSelectedSide] = useState('right'); // 'left' veya 'right' - Bilateral

    // Refs
    const filteredAngleRef = useRef(0);
    const lastMilestone = useRef(0);
    const subscriptionRef = useRef(null);
    const previousAngleRef = useRef(0);
    const totalRotationRef = useRef(0); // Wrap-around tracking
    const stableAngleRef = useRef(0);   // Kararlı (stable) açı değeri
    const velocityRef = useRef(0);      // Açısal hız takibi

    // Set header title
    useEffect(() => {
        navigation.setOptions({
            title: movement.name,
        });
    }, [navigation, movement]);

    // Adaptif Low-pass filter for smooth readings
    const applyAdaptiveFilter = useCallback((newValue, previousValue) => {
        // Handle wrap-around (360 -> 0 veya 0 -> 360)
        let diff = newValue - previousValue;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        const absDiff = Math.abs(diff);

        // Dead-zone: Çok küçük değişimleri yok say
        if (absDiff < DEAD_ZONE) {
            return previousValue;
        }

        // Adaptif alpha hesapla: Büyük değişim = yüksek alpha (hızlı tepki)
        let alpha;
        if (absDiff > VELOCITY_THRESHOLD) {
            alpha = FILTER_ALPHA_MAX; // Hızlı hareket
        } else {
            // Lineer interpolasyon
            const t = (absDiff - DEAD_ZONE) / (VELOCITY_THRESHOLD - DEAD_ZONE);
            alpha = FILTER_ALPHA_MIN + t * (FILTER_ALPHA_MAX - FILTER_ALPHA_MIN);
        }

        return (previousValue + alpha * diff + 360) % 360;
    }, []);

    // Math.atan2 tabanlı açı hesaplama
    const calculateAngle = useCallback((accelerometerData) => {
        if (!accelerometerData) return 0;

        const { x, y, z } = accelerometerData;

        // Math.atan2 kullanarak 360 derece açı hesapla
        // Telefon ekranı yukarı bakarken:
        // x: sağ/sol eğim (-1 to 1)
        // y: ileri/geri eğim (-1 to 1)
        // z: yerçekimi bileşeni (-1 to 1)

        // atan2(y, x) kullanarak tam 360 derece aralık
        let angle = Math.atan2(y, x) * (180 / Math.PI);

        // atan2: -180 to 180 döndürür, bunu 0-360'a çevir
        angle = (angle + 360) % 360;

        // Koordinat sistemini ayarla:
        // 0° = Sol (saat 9), 90° = Üst (saat 12), 180° = Sağ (saat 3), 270° = Alt (saat 6)
        angle = (360 - angle + 90) % 360;

        return angle;
    }, []);

    // Wrap-around engelleyici delta hesaplama
    const calculateDelta = useCallback((currentAngle, previousAngle) => {
        let delta = currentAngle - previousAngle;

        // 360 -> 0 veya 0 -> 360 geçişini algıla
        if (delta > 180) {
            delta -= 360;
        } else if (delta < -180) {
            delta += 360;
        }

        return delta;
    }, []);

    // Milestone haptic feedback
    const checkMilestone = useCallback((angle) => {
        const roundedAngle = Math.round(angle);
        for (const milestone of MILESTONE_ANGLES) {
            if (Math.abs(roundedAngle - milestone) <= 2 && lastMilestone.current !== milestone) {
                lastMilestone.current = milestone;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                break;
            }
        }
    }, []);

    // Sensor setup
    useEffect(() => {
        const setupSensor = async () => {
            const isAvailable = await Accelerometer.isAvailableAsync();
            setSensorAvailable(isAvailable);

            if (!isAvailable) return;

            Accelerometer.setUpdateInterval(30); // 33 FPS - daha hızlı güncelleme

            subscriptionRef.current = Accelerometer.addListener((data) => {
                if (!isHeld) {
                    const currentRawAngle = calculateAngle(data);

                    // Adaptif low-pass filter uygula
                    filteredAngleRef.current = applyAdaptiveFilter(currentRawAngle, filteredAngleRef.current);

                    // Wrap-around tracking
                    const delta = calculateDelta(filteredAngleRef.current, previousAngleRef.current);
                    totalRotationRef.current += delta;
                    previousAngleRef.current = filteredAngleRef.current;

                    setRawAngle(filteredAngleRef.current);

                    // Relatif açı hesapla (sıfırlamaya göre)
                    let relative = (filteredAngleRef.current - tareOffset + 360) % 360;

                    // Fizyoterapi için: 0-180 arası göster (veya tam 360)
                    // Eğer movement 180'den küçükse, 180 üstünü negatif olarak göster
                    let displayValue = relative;
                    if (maxAngle <= 180 && relative > 180) {
                        displayValue = relative - 360; // Negatif değer
                    }

                    setRelativeAngle(relative);
                    setDisplayAngle(Math.round(displayValue));
                    checkMilestone(relative);

                    // Orientation detection
                    if (Math.abs(data.z) > 0.8) {
                        setOrientation('flat');
                    } else if (Math.abs(data.x) > Math.abs(data.y)) {
                        setOrientation('landscape');
                    } else {
                        setOrientation('portrait');
                    }
                }
            });
        };

        setupSensor();

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
                subscriptionRef.current = null;
            }
        };
    }, [isHeld, tareOffset, calculateAngle, applyAdaptiveFilter, calculateDelta, checkMilestone, maxAngle]);

    // Akıllı Sıfırlama (Tare)
    const handleTare = useCallback(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Mevcut açıyı offset olarak kaydet
        setTareOffset(filteredAngleRef.current);

        // Sıfırla
        setRelativeAngle(0);
        setDisplayAngle(0);
        totalRotationRef.current = 0;
        lastMilestone.current = 0;
        setShowPlacementGuide(false);
    }, []);

    const handleHold = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsHeld((prev) => !prev);
    }, []);

    const handleSave = async () => {
        try {
            await saveMeasurement({
                movementId: movement.id,
                movementName: movement.name,
                jointName: jointName,
                jointId: jointId,
                angle: Math.abs(displayAngle),
                normalROM: movement.normalROM,
                note: note.trim(),
                side: selectedSide, // Bilateral: sol/sağ taraf
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setShowSaveModal(false);
            setNote('');
            Alert.alert('Başarılı', 'Ölçüm kaydedildi!', [
                { text: 'Tamam' },
                { text: 'Geçmişe Git', onPress: () => navigation.navigate('History') },
            ]);
        } catch (error) {
            Alert.alert('Hata', 'Ölçüm kaydedilemedi.');
        }
    };

    const getROMStatus = () => {
        const absAngle = Math.abs(displayAngle);
        if (maxAngle === 0) return { text: 'N/A', color: COLORS.textSecondary };
        const percentage = (absAngle / maxAngle) * 100;
        if (percentage >= 90) return { text: 'Normal', color: COLORS.success };
        if (percentage >= 70) return { text: 'Hafif Kısıtlı', color: COLORS.warning };
        return { text: 'Kısıtlı', color: COLORS.danger };
    };

    // 360° Tam Daire Gauge - Kompakt boyut
    const SVG_SIZE = 220;
    const CENTER = SVG_SIZE / 2;
    const RADIUS = SVG_SIZE / 2 - 30;
    const STROKE_WIDTH = 12;

    const renderFullCircleGauge = () => {
        const circumference = 2 * Math.PI * RADIUS;
        const progress = (relativeAngle / 360);

        // İğne pozisyonu (0° = sol, saat yönünde)
        const needleAngle = (relativeAngle - 90) * (Math.PI / 180);
        const needleLength = RADIUS - 10;
        const needleX = Math.cos(needleAngle) * needleLength;
        const needleY = Math.sin(needleAngle) * needleLength;

        return (
            <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
                <Defs>
                    <LinearGradient id="gaugeGradient360" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={COLORS.primary} />
                        <Stop offset="25%" stopColor={COLORS.secondary} />
                        <Stop offset="50%" stopColor={COLORS.accent} />
                        <Stop offset="75%" stopColor={COLORS.warning} />
                        <Stop offset="100%" stopColor={COLORS.primary} />
                    </LinearGradient>
                </Defs>

                <G transform={`translate(${CENTER}, ${CENTER})`}>
                    {/* Arka plan çemberi */}
                    <Circle
                        cx={0}
                        cy={0}
                        r={RADIUS}
                        fill="none"
                        stroke={COLORS.trackColor}
                        strokeWidth={STROKE_WIDTH}
                    />

                    {/* Aktif arc */}
                    <Circle
                        cx={0}
                        cy={0}
                        r={RADIUS}
                        fill="none"
                        stroke="url(#gaugeGradient360)"
                        strokeWidth={STROKE_WIDTH}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (circumference * progress)}
                        transform="rotate(-90)"
                    />

                    {/* Tick marks: 0, 45, 90, 135, 180, 225, 270, 315 */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((tick, index) => {
                        const tickAngle = (tick - 90) * (Math.PI / 180);
                        const innerRadius = RADIUS - STROKE_WIDTH / 2 - 3;
                        const outerRadius = RADIUS - STROKE_WIDTH / 2 - 10;
                        const x1 = Math.cos(tickAngle) * innerRadius;
                        const y1 = Math.sin(tickAngle) * innerRadius;
                        const x2 = Math.cos(tickAngle) * outerRadius;
                        const y2 = Math.sin(tickAngle) * outerRadius;
                        const labelRadius = outerRadius - 10;

                        return (
                            <G key={index}>
                                <Line
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    stroke={COLORS.textSecondary}
                                    strokeWidth={2}
                                />
                                <SvgText
                                    x={Math.cos(tickAngle) * labelRadius}
                                    y={Math.sin(tickAngle) * labelRadius}
                                    fill={COLORS.textSecondary}
                                    fontSize="9"
                                    fontWeight="600"
                                    textAnchor="middle"
                                    alignmentBaseline="middle"
                                >
                                    {tick}°
                                </SvgText>
                            </G>
                        );
                    })}

                    {/* İğne (Needle) */}
                    <G>
                        {/* Needle shadow */}
                        <Line
                            x1={0}
                            y1={0}
                            x2={needleX}
                            y2={needleY}
                            stroke="rgba(0,0,0,0.3)"
                            strokeWidth={6}
                            strokeLinecap="round"
                        />
                        {/* Needle main */}
                        <Line
                            x1={0}
                            y1={0}
                            x2={needleX}
                            y2={needleY}
                            stroke={isHeld ? COLORS.warning : COLORS.text}
                            strokeWidth={4}
                            strokeLinecap="round"
                        />
                        {/* Needle tip */}
                        <Circle
                            cx={needleX}
                            cy={needleY}
                            r={5}
                            fill={isHeld ? COLORS.warning : COLORS.primary}
                        />
                        {/* Center pivot */}
                        <Circle
                            cx={0}
                            cy={0}
                            r={8}
                            fill={COLORS.surface}
                            stroke={COLORS.primary}
                            strokeWidth={2}
                        />
                    </G>

                    {/* Merkez açı göstergesi */}
                    <SvgText
                        x={0}
                        y={-3}
                        fill={isHeld ? COLORS.warning : COLORS.text}
                        fontSize="28"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily={Platform.OS === 'ios' ? 'Menlo' : 'monospace'}
                    >
                        {displayAngle}°
                    </SvgText>

                    {/* Durum */}
                    <SvgText
                        x={0}
                        y={20}
                        fill={isHeld ? COLORS.warning : COLORS.primary}
                        fontSize="9"
                        fontWeight="600"
                        textAnchor="middle"
                    >
                        {isHeld ? '🔒 KİLİTLİ' : '🔓 AKTİF'}
                    </SvgText>
                </G>
            </Svg>
        );
    };

    const romStatus = getROMStatus();

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            {/* Placement Guide Modal */}
            <Modal
                visible={showPlacementGuide}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.placementModal}>
                        <Text style={styles.placementIcon}>📱</Text>
                        <Text style={styles.placementTitle}>Telefon Yerleştirme</Text>

                        {/* Gonyometre Referansları */}
                        <View style={styles.goniometerSection}>
                            <Text style={styles.goniometerTitle}>📐 Gonyometre Referansları</Text>

                            <View style={styles.refRow}>
                                <Text style={styles.refLabel}>📍 Pivot:</Text>
                                <Text style={styles.refText}>{movement.pivot || 'Belirtilmemiş'}</Text>
                            </View>

                            <View style={styles.refRow}>
                                <Text style={styles.refLabel}>📏 Sabit Kol:</Text>
                                <Text style={styles.refText}>{movement.stationaryArm || 'Belirtilmemiş'}</Text>
                            </View>

                            <View style={styles.refRow}>
                                <Text style={styles.refLabel}>📐 Hareketli Kol:</Text>
                                <Text style={styles.refText}>{movement.movingArm || 'Belirtilmemiş'}</Text>
                            </View>
                        </View>

                        <View style={styles.placementCard}>
                            <Text style={styles.placementLabel}>👤 Hasta Pozisyonu:</Text>
                            <Text style={styles.placementText}>{movement.position}</Text>
                        </View>

                        <View style={styles.placementCard}>
                            <Text style={styles.placementLabel}>📱 Telefon Yerleştirme:</Text>
                            <Text style={styles.placementText}>{movement.placement}</Text>
                        </View>

                        <View style={styles.placementCard}>
                            <Text style={styles.placementLabel}>🔄 Hareket:</Text>
                            <Text style={styles.placementText}>{movement.instruction}</Text>
                        </View>

                        <View style={styles.tipCard}>
                            <Text style={styles.tipText}>
                                ⚠️ ÖNEMLİ: Telefonun üst kenarını (kamera) pivot noktasına hizalayın, sonra "SIFIRLA" butonuna basın!
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={() => setShowPlacementGuide(false)}
                        >
                            <Text style={styles.startButtonText}>Anladım, Başla</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Save Modal */}
            <Modal
                visible={showSaveModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.saveModal}>
                        <Text style={styles.saveTitle}>Ölçümü Kaydet</Text>
                        <Text style={styles.saveAngle}>{Math.abs(displayAngle)}°</Text>
                        <Text style={styles.saveSubtitle}>{jointName} - {movement.name}</Text>

                        <TextInput
                            style={styles.noteInput}
                            placeholder="Not ekle (opsiyonel)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={note}
                            onChangeText={setNote}
                            multiline
                        />

                        <View style={styles.saveButtons}>
                            <TouchableOpacity
                                style={[styles.saveButton, styles.cancelButton]}
                                onPress={() => setShowSaveModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.saveButton, styles.confirmButton]}
                                onPress={handleSave}
                            >
                                <Text style={styles.confirmButtonText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Sensor Error */}
                {!sensorAvailable && (
                    <View style={styles.errorBanner}>
                        <Text style={styles.errorText}>⚠️ İvmeölçer sensörü bulunamadı</Text>
                    </View>
                )}

                {/* Joint Info Card */}
                <View style={styles.jointInfoCard}>
                    <View style={styles.jointInfoLeft}>
                        <Text style={styles.jointInfoName}>{jointName}</Text>
                        <Text style={styles.jointInfoMovement}>{movement.name}</Text>
                    </View>
                    <View style={styles.jointInfoRight}>
                        <Text style={styles.normalROMLabel}>Normal ROM</Text>
                        <Text style={styles.normalROMValue}>
                            {movement.normalROM.min}° - {movement.normalROM.max}°
                        </Text>
                    </View>
                </View>

                {/* Bilateral: Sol/Sağ Taraf Seçimi */}
                <View style={styles.sideSelector}>
                    <TouchableOpacity
                        style={[
                            styles.sideButton,
                            selectedSide === 'left' && styles.sideButtonActive
                        ]}
                        onPress={() => setSelectedSide('left')}
                    >
                        <Text style={styles.sideButtonIcon}>👈</Text>
                        <Text style={[
                            styles.sideButtonText,
                            selectedSide === 'left' && styles.sideButtonTextActive
                        ]}>SOL</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.sideButton,
                            selectedSide === 'right' && styles.sideButtonActive
                        ]}
                        onPress={() => setSelectedSide('right')}
                    >
                        <Text style={styles.sideButtonIcon}>👉</Text>
                        <Text style={[
                            styles.sideButtonText,
                            selectedSide === 'right' && styles.sideButtonTextActive
                        ]}>SAĞ</Text>
                    </TouchableOpacity>
                </View>

                {/* 360° Full Circle Gauge */}
                <View style={styles.gaugeContainer}>
                    {renderFullCircleGauge()}
                </View>

                {/* Status Panel */}
                <View style={styles.statusPanel}>
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Durum</Text>
                        <View style={[styles.statusBadge, { backgroundColor: romStatus.color + '20' }]}>
                            <Text style={[styles.statusValue, { color: romStatus.color }]}>
                                {romStatus.text}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.statusDivider} />
                    <View style={styles.statusItem}>
                        <Text style={styles.statusLabel}>Oran</Text>
                        <Text style={styles.statusValue}>
                            {maxAngle > 0 ? Math.round((Math.abs(displayAngle) / maxAngle) * 100) : 0}%
                        </Text>
                    </View>
                </View>

                {/* Control Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.resetButton]}
                        onPress={handleTare}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonIcon}>↺</Text>
                        <Text style={styles.buttonText}>SIFIRLA</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.holdButton,
                            isHeld && styles.holdButtonActive,
                        ]}
                        onPress={handleHold}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonIcon}>{isHeld ? '▶️' : '⏸️'}</Text>
                        <Text style={styles.buttonText}>{isHeld ? 'DEVAM' : 'DONDUR'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={styles.saveMainButton}
                    onPress={() => setShowSaveModal(true)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.saveMainIcon}>💾</Text>
                    <Text style={styles.saveMainText}>Ölçümü Kaydet</Text>
                </TouchableOpacity>
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
        padding: 12,
    },
    errorBanner: {
        backgroundColor: COLORS.danger + '20',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.danger + '50',
        marginBottom: 16,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 14,
        textAlign: 'center',
    },
    jointInfoCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: 8,
    },
    jointInfoLeft: {},
    jointInfoName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    jointInfoMovement: {
        fontSize: 12,
        color: COLORS.primary,
        marginTop: 2,
    },
    jointInfoRight: {
        alignItems: 'flex-end',
    },
    normalROMLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    normalROMValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.secondary,
        marginTop: 2,
    },
    sideSelector: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    sideButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    sideButtonActive: {
        backgroundColor: COLORS.primary + '20',
        borderColor: COLORS.primary,
    },
    sideButtonIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    sideButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary,
    },
    sideButtonTextActive: {
        color: COLORS.primary,
    },
    gaugeContainer: {
        alignItems: 'center',
        marginVertical: 4,
    },
    statusPanel: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: 16,
    },
    statusItem: {
        alignItems: 'center',
        flex: 1,
    },
    statusLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    statusValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.text,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusDivider: {
        width: 1,
        height: 35,
        backgroundColor: COLORS.cardBorder,
    },
    orientationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        padding: 10,
        borderRadius: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    orientationIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    orientationText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    placementReminder: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        marginBottom: 20,
    },
    placementReminderIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    placementReminderText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.primary,
    },
    placementReminderArrow: {
        fontSize: 16,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resetButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    holdButton: {
        backgroundColor: COLORS.surface,
        borderWidth: 2,
        borderColor: COLORS.secondary,
    },
    holdButtonActive: {
        backgroundColor: COLORS.warning + '20',
        borderColor: COLORS.warning,
    },
    buttonIcon: {
        fontSize: 18,
        marginBottom: 4,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.text,
        letterSpacing: 0.5,
    },
    saveMainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
    },
    saveMainIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    saveMainText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.background,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placementModal: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 350,
        alignItems: 'center',
    },
    placementIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    placementTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 20,
    },
    placementCard: {
        backgroundColor: COLORS.surfaceLight,
        padding: 14,
        borderRadius: 12,
        width: '100%',
        marginBottom: 12,
    },
    placementLabel: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    placementText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    goniometerSection: {
        backgroundColor: COLORS.secondary + '15',
        padding: 14,
        borderRadius: 12,
        width: '100%',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.secondary + '30',
    },
    goniometerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.secondary,
        marginBottom: 10,
        textAlign: 'center',
    },
    refRow: {
        flexDirection: 'row',
        marginBottom: 6,
        flexWrap: 'wrap',
    },
    refLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.secondary,
        marginRight: 6,
    },
    refText: {
        fontSize: 12,
        color: COLORS.text,
        flex: 1,
        lineHeight: 18,
    },
    tipCard: {
        backgroundColor: COLORS.primary + '20',
        padding: 12,
        borderRadius: 10,
        width: '100%',
        marginBottom: 16,
    },
    tipText: {
        fontSize: 13,
        color: COLORS.primary,
        textAlign: 'center',
    },
    startButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 10,
    },
    startButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.background,
    },
    saveModal: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
    },
    saveTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 10,
    },
    saveAngle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    saveSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 20,
    },
    noteInput: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        padding: 14,
        width: '100%',
        color: COLORS.text,
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: 20,
    },
    saveButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    saveButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
    },
    confirmButtonText: {
        color: COLORS.background,
        fontWeight: 'bold',
    },
});
