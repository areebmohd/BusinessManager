
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
    // Use monospace block for WhatsApp
    let billText = '```\n'; 
    billText += `${businessName}\n`;
    billText += `${contactNumber}\n`;
    billText += `------------------------------\n\n`;
    billText += `Bill_Id: ${bill_Id}\n`;
    billText += `Date: ${dateStr}  Time: ${timeStr}\n`;
    billText += `------------------------------\n\n`;
    billText += `Buyer: ${buyerName}\n`;
    billText += `Mobile: ${buyerNumber}\n`;
    billText += `------------------------------\n\n`;
    
    // Configurable column widths
    const itemWidth = 10;
    const qtyWidth = 4;
    const priceWidth = 6;
    const totalWidth = 7;

    // Header
    // Use padEnd for Item to left align.
    // Use padStart for others to right align.
    // Add explicit spaces for separation.
    billText += `${"Item".padEnd(itemWidth)} ${"Qty".padStart(qtyWidth)} ${"Price".padStart(priceWidth)} ${"Total".padStart(totalWidth)}\n`;
    billText += `------------------------------\n`;

    // Items
    saleItems.forEach(item => {
        const name = (item.itemName || item.name || 'Item').substring(0, itemWidth).padEnd(itemWidth);
        const qty = String(item.quantity || item.qty || 0).padStart(qtyWidth);
        const price = String(item.unitPrice || item.price || 0).padStart(priceWidth);
        const itemTotal = String(item.total || ((item.quantity || 0) * (item.unitPrice || 0))).padStart(totalWidth);

        billText += `${name} ${qty} ${price} ${itemTotal}\n`;
    });

    billText += `------------------------------\n`;
    billText += `${"Grand Total:".padEnd(25)} ₹${finalTotal}\n\n`;

    // Payment info and status
    let methodDisplay = 'Cash';
    let statusDisplay = 'Paid';

    let pMethod = '';
    if (typeof paymentMethod === 'string') {
        pMethod = paymentMethod.toLowerCase();
    } else if (typeof paymentMethod === 'object' && paymentMethod.paymentMethod) {
        pMethod = paymentMethod.paymentMethod.toLowerCase();
    }

    if (pMethod === 'unpaid' || pMethod === 'pending') {
        methodDisplay = 'Not Paid';
        statusDisplay = 'Unpaid';
    } else if (pMethod === 'upi') {
        methodDisplay = 'UPI';
        statusDisplay = 'Paid';
    } else if (pMethod === 'paid' || pMethod === 'cash') {
        methodDisplay = 'Cash';
        statusDisplay = 'Paid';
    }

    billText += `Payment: ${methodDisplay}\n`;
    billText += `Status: ${statusDisplay}\n`;
    billText += `------------------------------\n\n`;
    billText += `Thank you for shopping.\n`;
    billText += '```'; // End monospace block

    return billText;
};
