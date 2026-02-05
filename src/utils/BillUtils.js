
export const generateBillText = (sale, businessInfo = {}) => {
    const {
        bill_Id = 'N/A',
        items = [],
        totalAmount,
        total,
        timestamp,
        paymentMethod,
        itemName,
        quantity,
        unitPrice
    } = sale;

    // Handle single item vs grouped items
    const saleItems = (items && Array.isArray(items)) ? items : [{
        itemName: itemName,
        quantity: quantity,
        unitPrice: unitPrice,
        total: total
    }];

    const finalTotal = totalAmount || total || 0;

    // Format Date
    let dateStr = 'N/A';
    let timeStr = 'N/A';

    if (timestamp && timestamp.toDate) {
        const dateObj = timestamp.toDate();
        // DD-MM-YYYY
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        dateStr = `${day}-${month}-${year}`;

        // HH:MM
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        timeStr = `${hours}:${minutes}`;
    } else {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        dateStr = `${day}-${month}-${year}`;

        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeStr = `${hours}:${minutes}`;
    }

    // Business Info
    // Handle potential nesting from settings object
    const details = businessInfo.businessDetails || businessInfo;
    const businessName = details.businessName || 'Business Name';
    const contactNumber = details.phone || details.contactNumber || 'Business Number';

    // Buyer Info
    const buyerName = sale.buyerName || 'Buyer Name';
    const buyerNumber = sale.buyerNumber || 'Buyer Number: N/A';

    // Build the text
    let billText = `${businessName}\n`;
    billText += `${contactNumber}\n`;
    billText += `------------------------\n\n`;
    billText += `Bill_Id: ${bill_Id}\n`;
    billText += `Date: ${dateStr}\n`;
    billText += `Time: ${timeStr}\n`;
    billText += `------------------------\n\n`;
    billText += `${buyerName}\n`;
    billText += `${buyerNumber}\n`;
    billText += `------------------------\n\n`;

    // Items
    saleItems.forEach(item => {
        // Format: Rice    2 x 50  = 100
        const name = (item.itemName || item.name || 'Item').padEnd(15).substring(0, 15);
        const qty = String(item.quantity || item.qty || 0);
        const price = String(item.unitPrice || item.price || 0);
        const itemTotal = String(item.total || ((item.quantity || 0) * (item.unitPrice || 0)));

        billText += `${name} ${qty} x ${price} = ${itemTotal}\n`;
    });

    billText += `------------------------\n`;
    billText += `TOTAL: ₹${finalTotal}\n\n`;

    // Payment info
    let methodStr = 'CASH';
    if (typeof paymentMethod === 'string') {
        methodStr = paymentMethod.toUpperCase();
    } else if (typeof paymentMethod === 'object' && paymentMethod.paymentMethod) {
        methodStr = paymentMethod.paymentMethod.toUpperCase();
    }

    // Determine status
    let status = 'PAID';
    if (methodStr === 'PENDING' || methodStr === 'UNPAID') {
        status = 'UNPAID';
    }

    billText += `Payment: ${methodStr}\n`;
    billText += `Status: ${status}\n`;
    billText += `------------------------\n\n`;

    billText += `Thank you for shopping.`;

    return billText;
};
