import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@progonyometre_measurements';

// Save a new measurement
export const saveMeasurement = async (measurement) => {
    try {
        const existingData = await getMeasurements();
        const newMeasurement = {
            ...measurement,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
        };
        existingData.unshift(newMeasurement); // Add to beginning
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
        return newMeasurement;
    } catch (error) {
        console.error('Error saving measurement:', error);
        throw error;
    }
};

// Get all measurements
export const getMeasurements = async () => {
    try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error getting measurements:', error);
        return [];
    }
};

// Delete a measurement by ID
export const deleteMeasurement = async (id) => {
    try {
        const existingData = await getMeasurements();
        const filteredData = existingData.filter(m => m.id !== id);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredData));
        return true;
    } catch (error) {
        console.error('Error deleting measurement:', error);
        throw error;
    }
};

// Clear all measurements
export const clearAllMeasurements = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing measurements:', error);
        throw error;
    }
};

// Format date for display (Turkish locale)
export const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
