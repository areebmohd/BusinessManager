import firestore from '@react-native-firebase/firestore';

// Helper to get user's doc path
const getUserDoc = (uid) => firestore().collection('users').doc(uid);

// --- ITEMS (Inventory) ---

export const addItem = async (uid, itemData) => {
    try {
        const newItem = {
            ...itemData,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
        };
        await getUserDoc(uid).collection('items').add(newItem);
    } catch (error) {
        console.error("Error adding item: ", error);
        throw error;
    }
};

export const updateItem = async (uid, itemId, data) => {
    try {
        await getUserDoc(uid).collection('items').doc(itemId).update({
            ...data,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
        console.error("Error updating item: ", error);
        throw error;
    }
};

export const deleteItem = async (uid, itemId) => {
    try {
        await getUserDoc(uid).collection('items').doc(itemId).delete();
    } catch (error) {
        console.error("Error deleting item: ", error);
        throw error;
    }
};

// Real-time listener for items
export const subscribeToItems = (uid, onResult, onError) => {
    return getUserDoc(uid)
        .collection('items')
        .orderBy('updatedAt', 'desc')
        .onSnapshot(
            (snapshot) => {
                const items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                onResult(items);
            },
            (error) => {
                console.error("Items listener error: ", error);
                if (onError) onError(error);
            }
        );
};

// --- SALES ---

export const addSale = async (uid, saleData) => {
    // Logic needed:
    // 1. Create Sale Document
    // 2. Decrement Stock of the Item
    const db = firestore();
    const batch = db.batch();

    const saleRef = getUserDoc(uid).collection('sales').doc();
    const itemRef = getUserDoc(uid).collection('items').doc(saleData.itemId);

    // Add Sale
    batch.set(saleRef, {
        ...saleData,
        timestamp: firestore.FieldValue.serverTimestamp(),
    });

    // Decrement Stock
    batch.update(itemRef, {
        stock: firestore.FieldValue.increment(-saleData.quantity)
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error processing sale: ", error);
        throw error;
    }
};

export const addBulkSales = async (uid, cartItems, paymentMethod) => {
    const db = firestore();
    const batch = db.batch();
    const userRef = getUserDoc(uid);

    // 1. Create ONE Sale Document for the entire transaction
    const saleRef = userRef.collection('sales').doc();

    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

    // Prepare items array for the document
    const saleItems = cartItems.map(item => ({
        itemId: item.id,
        itemName: item.name,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        total: item.quantity * item.sellingPrice
    }));

    batch.set(saleRef, {
        items: saleItems,
        totalAmount: totalAmount,
        paymentMethod: paymentMethod, // 'paid', 'unpaid', 'upi'
        buyerRef: '', // Future use
        timestamp: firestore.FieldValue.serverTimestamp(),
    });

    // 2. Decrement Stock for EACH item
    cartItems.forEach(item => {
        const itemRef = userRef.collection('items').doc(item.id);
        batch.update(itemRef, {
            stock: firestore.FieldValue.increment(-item.quantity)
        });
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error processing bulk sales: ", error);
        throw error;
    }
};

export const subscribeToSales = (uid, onResult, onError) => {
    return getUserDoc(uid)
        .collection('sales')
        .orderBy('timestamp', 'desc')
        .onSnapshot(
            (snapshot) => {
                const sales = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                onResult(sales);
            },
            onError
        );
};

// --- SETTINGS ---

export const saveSettings = async (uid, settings) => {
    try {
        await getUserDoc(uid).set({
            appSettings: settings
        }, { merge: true });
    } catch (error) {
        console.error("Error saving settings: ", error);
        throw error;
    }
};

export const subscribeToSettings = (uid, onResult, onError) => {
    return getUserDoc(uid).onSnapshot(
        (doc) => {
            const data = doc.data();
            onResult(data?.appSettings || {});
        },
        onError
    );
};
