import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import COLORS from '../theme/colors';
import { JOINT_CATEGORIES, JOINTS } from '../data/joints';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function JointSelectionScreen({ navigation }) {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [expandedJoint, setExpandedJoint] = useState(null);

    const toggleCategory = (categoryId) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
        setExpandedJoint(null);
    };

    const toggleJoint = (jointId) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedJoint(expandedJoint === jointId ? null : jointId);
    };

    const selectMovement = (movement, joint) => {
        navigation.navigate('Measurement', {
            movement,
            jointName: joint.name,
            jointId: joint.id,
        });
    };

    const renderMovement = (movement, joint) => (
        <TouchableOpacity
            key={movement.id}
            style={styles.movementItem}
            onPress={() => selectMovement(movement, joint)}
            activeOpacity={0.7}
        >
            <View style={styles.movementInfo}>
                <Text style={styles.movementName}>{movement.name}</Text>
                <Text style={styles.movementDescription}>{movement.description}</Text>
            </View>
            <View style={styles.movementROM}>
                <Text style={styles.romValue}>
                    {movement.normalROM.min}°-{movement.normalROM.max}°
                </Text>
                <Text style={styles.romLabel}>Normal ROM</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
    );

    const renderJoint = (joint) => {
        const isExpanded = expandedJoint === joint.id;

        return (
            <View key={joint.id} style={styles.jointContainer}>
                <TouchableOpacity
                    style={[styles.jointHeader, isExpanded && styles.jointHeaderExpanded]}
                    onPress={() => toggleJoint(joint.id)}
                    activeOpacity={0.7}
                >
                    {typeof joint.icon === 'string' ? (
                        <Text style={styles.jointIcon}>{joint.icon}</Text>
                    ) : (
                        <Image source={joint.icon} style={styles.jointIconImage} />
                    )}
                    <View style={styles.jointInfo}>
                        <Text style={styles.jointName}>{joint.name}</Text>
                        <Text style={styles.jointAnatomical}>{joint.anatomicalName}</Text>
                    </View>
                    <View style={styles.jointMeta}>
                        <Text style={styles.movementCount}>
                            {joint.movements.length} hareket
                        </Text>
                        <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
                            ▼
                        </Text>
                    </View>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.movementsContainer}>
                        {joint.movements.map(movement => renderMovement(movement, joint))}
                    </View>
                )}
            </View>
        );
    };

    const renderCategory = (category) => {
        const isExpanded = expandedCategory === category.id;
        const joints = JOINTS[category.id];

        return (
            <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                    style={[styles.categoryHeader, isExpanded && styles.categoryHeaderExpanded]}
                    onPress={() => toggleCategory(category.id)}
                    activeOpacity={0.8}
                >
                    {typeof category.icon === 'string' ? (
                        <Text style={styles.categoryIcon}>{category.icon}</Text>
                    ) : (
                        <Image source={category.icon} style={styles.categoryIconImage} />
                    )}
                    <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                    <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
                        ▼
                    </Text>
                </TouchableOpacity>

                {isExpanded && (
                    <View style={styles.jointsContainer}>
                        {joints.map(joint => renderJoint(joint))}
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Instructions */}
                <View style={styles.instructionsCard}>
                    <Image source={require('../../assets/icons/clipboard.png')} style={styles.instructionsIconImage} />
                    <Text style={styles.instructions}>
                        Ölçüm yapmak istediğiniz eklem kategorisini,{'\n'}
                        ardından eklemi ve hareket tipini seçin.
                    </Text>
                </View>

                {/* Categories */}
                {JOINT_CATEGORIES.map(category => renderCategory(category))}

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Image source={require('../../assets/icons/info.png')} style={styles.infoIconImage} />
                    <Text style={styles.infoText}>
                        Her ölçümde telefonu nereye yerleştireceğiniz gösterilecektir.
                    </Text>
                </View>
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
    instructionsCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    instructionsIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    instructions: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    categoryContainer: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
    },
    categoryHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    categoryIcon: {
        fontSize: 36,
        marginRight: 14,
    },
    categoryIconImage: {
        width: 40,
        height: 40,
        marginRight: 14,
        resizeMode: 'contain',
    },
    categoryInfo: {
        flex: 1,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    categoryDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    expandIcon: {
        fontSize: 12,
        color: COLORS.primary,
        marginLeft: 10,
    },
    expandIconRotated: {
        transform: [{ rotate: '180deg' }],
    },
    jointsContainer: {
        padding: 10,
    },
    jointContainer: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: 12,
        marginBottom: 8,
        overflow: 'hidden',
    },
    jointHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    jointHeaderExpanded: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.cardBorder,
    },
    jointIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    jointIconImage: {
        width: 32,
        height: 32,
        marginRight: 12,
        resizeMode: 'contain',
    },
    jointInfo: {
        flex: 1,
    },
    jointName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    jointAnatomical: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
    },
    jointMeta: {
        alignItems: 'flex-end',
    },
    movementCount: {
        fontSize: 11,
        color: COLORS.primary,
        marginBottom: 4,
    },
    movementsContainer: {
        padding: 8,
    },
    movementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 10,
        padding: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
    },
    movementInfo: {
        flex: 1,
    },
    movementName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    movementDescription: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    movementROM: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    romValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    romLabel: {
        fontSize: 9,
        color: COLORS.textSecondary,
    },
    chevron: {
        fontSize: 20,
        color: COLORS.textSecondary,
    },
    infoCard: {
        backgroundColor: COLORS.primary + '15',
        borderRadius: 12,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    infoIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    infoIconImage: {
        width: 20,
        height: 20,
        marginRight: 10,
        resizeMode: 'contain',
    },
    instructionsIconImage: {
        width: 24,
        height: 24,
        marginRight: 12,
        resizeMode: 'contain',
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.primary,
        lineHeight: 18,
    },
});
