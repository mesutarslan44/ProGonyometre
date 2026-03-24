import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';

export default function CalibrationScreen({ navigation }) {
    const [testPhase, setTestPhase] = useState('idle'); // idle, testing, success, error
    const [sensorData, setSensorData] = useState({ x: 0, y: 0, z: 0 });
    const [testResults, setTestResults] = useState({
        sensorAvailable: false,
        responseTime: 0,
        stability: 0,
    });
    const [progress, setProgress] = useState(0);

    const subscriptionRef = useRef(null);
    const testStartTime = useRef(0);
    const stabilityReadings = useRef([]);
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.remove();
            }
        };
    }, []);

    const startCalibration = async () => {
        setTestPhase('testing');
        setProgress(0);
        stabilityReadings.current = [];
        testStartTime.current = Date.now();

        // Check sensor availability
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) {
            setTestPhase('error');
            setTestResults(prev => ({ ...prev, sensorAvailable: false }));
            return;
        }

        setTestResults(prev => ({ ...prev, sensorAvailable: true }));

        // Start sensor for calibration test
        Accelerometer.setUpdateInterval(50);

        let readingCount = 0;
        const maxReadings = 60; // 3 seconds at 20fps

        subscriptionRef.current = Accelerometer.addListener((data) => {
            setSensorData(data);
            stabilityReadings.current.push(data);
            readingCount++;

            const newProgress = Math.min((readingCount / maxReadings) * 100, 100);
            setProgress(newProgress);

            if (readingCount >= maxReadings) {
                // Test complete
                subscriptionRef.current?.remove();
                evaluateResults();
            }
        });

        // Animate progress
        Animated.timing(progressAnim, {
            toValue: 100,
            duration: 3000,
            useNativeDriver: false,
        }).start();
    };

    const evaluateResults = () => {
        const responseTime = Date.now() - testStartTime.current;

        // Calculate stability (variance of readings)
        const readings = stabilityReadings.current;
        if (readings.length < 10) {
            setTestPhase('error');
            return;
        }

        // Calculate average
        const avgX = readings.reduce((sum, r) => sum + r.x, 0) / readings.length;
        const avgY = readings.reduce((sum, r) => sum + r.y, 0) / readings.length;
        const avgZ = readings.reduce((sum, r) => sum + r.z, 0) / readings.length;

        // Calculate variance
        const variance = readings.reduce((sum, r) => {
            return sum +
                Math.pow(r.x - avgX, 2) +
                Math.pow(r.y - avgY, 2) +
                Math.pow(r.z - avgZ, 2);
        }, 0) / readings.length;

        // Stability score (lower variance = higher score)
        const stabilityScore = Math.max(0, Math.min(100, 100 - (variance * 500)));

        setTestResults({
            sensorAvailable: true,
            responseTime: responseTime,
            stability: Math.round(stabilityScore),
        });

        if (stabilityScore >= 70) {
            setTestPhase('success');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            setTestPhase('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const getStatusColor = () => {
        switch (testPhase) {
            case 'success': return COLORS.success;
            case 'error': return COLORS.danger;
            case 'testing': return COLORS.warning;
            default: return COLORS.textSecondary;
        }
    };

    const getStatusText = () => {
        switch (testPhase) {
            case 'idle': return 'Telefonu düz bir yüzeye koyun';
            case 'testing': return 'Sensör test ediliyor...';
            case 'success': return 'Kalibrasyon Başarılı!';
            case 'error': return 'Kalibrasyon Başarısız';
            default: return '';
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <View style={styles.content}>
                {/* Status Icon */}
                <View style={[styles.statusIcon, { borderColor: getStatusColor() }]}>
                    <Text style={styles.statusEmoji}>
                        {testPhase === 'idle' ? '📱' :
                            testPhase === 'testing' ? '🔄' :
                                testPhase === 'success' ? '✅' : '❌'}
                    </Text>
                </View>

                {/* Status Text */}
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                    {getStatusText()}
                </Text>

                {/* Progress Bar */}
                {testPhase === 'testing' && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <Animated.View
                                style={[
                                    styles.progressFill,
                                    { width: `${progress}%` }
                                ]}
                            />
                        </View>
                        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                    </View>
                )}

                {/* Live Sensor Data */}
                {testPhase === 'testing' && (
                    <View style={styles.sensorDataCard}>
                        <Text style={styles.sensorTitle}>Sensör Verileri</Text>
                        <View style={styles.sensorRow}>
                            <Text style={styles.sensorLabel}>X:</Text>
                            <Text style={styles.sensorValue}>{sensorData.x.toFixed(3)}</Text>
                        </View>
                        <View style={styles.sensorRow}>
                            <Text style={styles.sensorLabel}>Y:</Text>
                            <Text style={styles.sensorValue}>{sensorData.y.toFixed(3)}</Text>
                        </View>
                        <View style={styles.sensorRow}>
                            <Text style={styles.sensorLabel}>Z:</Text>
                            <Text style={styles.sensorValue}>{sensorData.z.toFixed(3)}</Text>
                        </View>
                    </View>
                )}

                {/* Results */}
                {(testPhase === 'success' || testPhase === 'error') && (
                    <View style={styles.resultsCard}>
                        <Text style={styles.resultsTitle}>Test Sonuçları</Text>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Sensör Durumu</Text>
                            <Text style={[styles.resultValue, { color: testResults.sensorAvailable ? COLORS.success : COLORS.danger }]}>
                                {testResults.sensorAvailable ? 'Aktif ✓' : 'Bulunamadı ✗'}
                            </Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Yanıt Süresi</Text>
                            <Text style={styles.resultValue}>{testResults.responseTime}ms</Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Stabilite</Text>
                            <View style={styles.stabilityContainer}>
                                <View style={styles.stabilityBar}>
                                    <View
                                        style={[
                                            styles.stabilityFill,
                                            {
                                                width: `${testResults.stability}%`,
                                                backgroundColor: testResults.stability >= 70 ? COLORS.success : COLORS.danger
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.resultValue}>{testResults.stability}%</Text>
                            </View>
                        </View>

                        {testPhase === 'success' && (
                            <View style={styles.successMessage}>
                                <Text style={styles.successText}>
                                    Sensörler doğru çalışıyor. Ölçüme başlayabilirsiniz.
                                </Text>
                            </View>
                        )}

                        {testPhase === 'error' && (
                            <View style={styles.errorMessage}>
                                <Text style={styles.errorText}>
                                    Telefonu sabit tutun ve tekrar deneyin. Sensör stabilitesi düşük.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    {testPhase === 'idle' && (
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={startCalibration}
                        >
                            <Text style={styles.startButtonText}>Kalibrasyonu Başlat</Text>
                        </TouchableOpacity>
                    )}

                    {(testPhase === 'success' || testPhase === 'error') && (
                        <>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={startCalibration}
                            >
                                <Text style={styles.retryButtonText}>Tekrar Test Et</Text>
                            </TouchableOpacity>

                            {testPhase === 'success' && (
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Text style={styles.continueButtonText}>Devam Et</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        marginBottom: 24,
    },
    statusEmoji: {
        fontSize: 48,
    },
    statusText: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    progressContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    progressBar: {
        width: '100%',
        height: 12,
        backgroundColor: COLORS.trackColor,
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 6,
    },
    progressText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    sensorDataCard: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: 20,
    },
    sensorTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 12,
        textAlign: 'center',
    },
    sensorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    sensorLabel: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    sensorValue: {
        fontSize: 16,
        color: COLORS.text,
        fontFamily: 'monospace',
    },
    resultsCard: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        marginBottom: 24,
    },
    resultsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    resultLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    resultValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    stabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stabilityBar: {
        width: 80,
        height: 8,
        backgroundColor: COLORS.trackColor,
        borderRadius: 4,
        overflow: 'hidden',
    },
    stabilityFill: {
        height: '100%',
        borderRadius: 4,
    },
    successMessage: {
        backgroundColor: COLORS.success + '20',
        padding: 12,
        borderRadius: 10,
        marginTop: 16,
    },
    successText: {
        color: COLORS.success,
        fontSize: 13,
        textAlign: 'center',
    },
    errorMessage: {
        backgroundColor: COLORS.danger + '20',
        padding: 12,
        borderRadius: 10,
        marginTop: 16,
    },
    errorText: {
        color: COLORS.danger,
        fontSize: 13,
        textAlign: 'center',
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    startButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
    },
    startButtonText: {
        color: COLORS.background,
        fontSize: 18,
        fontWeight: 'bold',
    },
    retryButton: {
        backgroundColor: COLORS.surface,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.secondary,
    },
    retryButtonText: {
        color: COLORS.secondary,
        fontSize: 16,
        fontWeight: '600',
    },
    continueButton: {
        backgroundColor: COLORS.success,
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    continueButtonText: {
        color: COLORS.background,
        fontSize: 16,
        fontWeight: 'bold',
    },
});
