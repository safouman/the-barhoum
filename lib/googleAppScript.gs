// Secret key for authentication - KEEP THIS PRIVATE
const SECRET_KEY =
    "c2a5af16dcae5d04adef54ebf1c8c70e8134acb9a16fd2c723a958ac7b0927d3";

// Column layout helpers (1-based index)
const COL_TIMESTAMP = 1;
const COL_LEAD_ID = 2;
const COL_PAYMENT_LINK = 18;
const HEADER_ROWS = 1; // adjust if your sheet uses more headers

function jsonResponse(payload) {
    return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
        ContentService.MimeType.JSON
    );
}

function findLeadRow(sheet, leadId) {
    if (!leadId) {
        return -1;
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= HEADER_ROWS) {
        return -1;
    }

    const range = sheet.getRange(
        HEADER_ROWS + 1,
        COL_LEAD_ID,
        lastRow - HEADER_ROWS,
        1
    );
    const values = range.getValues();
    for (let i = 0; i < values.length; i++) {
        const cellValue = values[i][0];
        if (cellValue && String(cellValue).trim() === leadId) {
            return HEADER_ROWS + 1 + i;
        }
    }

    return -1;
}

function handleCreateLead(sheet, requestData) {
    const leadId = (requestData.leadId || "").trim();
    if (!leadId) {
        return jsonResponse({
            success: false,
            error: "Missing leadId for createLead operation",
        });
    }

    const existingRow = findLeadRow(sheet, leadId);
    if (existingRow !== -1) {
        return jsonResponse({
            success: true,
            message: "Lead already exists",
            duplicate: true,
            row: existingRow,
        });
    }

    const newRow = [
        new Date(), // Timestamp
        leadId,
        requestData.fullName || "",
        requestData.email || "",
        requestData.country || "",
        requestData.phone || "",
        requestData.age || "",
        requestData.bestContactTime || "",
        requestData.psychologistBefore || "",
        requestData.medicationNow || "",
        requestData.whyCoaching || "",
        requestData.followingDuration || "",
        requestData.maritalStatus || "",
        requestData.occupation || "",
        requestData.passphrase || "",
        requestData.category || "",
        requestData.package || "",
        requestData.payment_link || "",
    ];

    sheet.appendRow(newRow);

    const insertedRow = sheet.getLastRow();

    return jsonResponse({
        success: true,
        message: "Lead created successfully",
        duplicate: false,
        row: insertedRow,
    });
}

function handleAttachPaymentLink(sheet, requestData) {
    const leadId = (requestData.leadId || "").trim();
    if (!leadId) {
        return jsonResponse({
            success: false,
            error: "Missing leadId for attachPaymentLink operation",
        });
    }

    const paymentLink = requestData.payment_link || "";
    const row = findLeadRow(sheet, leadId);

    if (row === -1) {
        return jsonResponse({
            success: false,
            error: "Lead not found for payment link update",
        });
    }

    sheet.getRange(row, COL_PAYMENT_LINK).setValue(paymentLink);
    sheet.getRange(row, COL_TIMESTAMP).setValue(new Date());

    return jsonResponse({
        success: true,
        message: "Payment link updated successfully",
        row,
    });
}

function doPost(e) {
    try {
        const requestData = JSON.parse(e.postData.contents || "{}");

        if (requestData.secret !== SECRET_KEY) {
            return jsonResponse({ success: false, error: "Unauthorized" });
        }

        const operation = (requestData.operation || "createLead").trim();
        const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

        switch (operation) {
            case "createLead":
                return handleCreateLead(sheet, requestData);
            case "attachPaymentLink":
                return handleAttachPaymentLink(sheet, requestData);
            default:
                return jsonResponse({
                    success: false,
                    error: "Unsupported operation",
                });
        }
    } catch (error) {
        Logger.log("Error in doPost: " + error.toString());
        Logger.log("Error stack: " + error.stack);

        return jsonResponse({
            success: false,
            error: error.toString(),
        });
    }
}

function testCreateLead() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const response = handleCreateLead(sheet, {
        leadId: "test-lead-123",
        fullName: "Test User",
        email: "test@example.com",
        country: "USA",
        phone: "+1234567890",
        age: "25",
        bestContactTime: "Evenings",
        psychologistBefore: "No",
        medicationNow: "No",
        whyCoaching: "Personal growth",
        followingDuration: "6 months",
        maritalStatus: "Single",
        occupation: "Engineer",
        passphrase: "Test passphrase",
        category: "individuals",
        package: "program_growth",
        payment_link: "",
    });
    Logger.log(response.getContent());
}

function testAttachPaymentLink() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const response = handleAttachPaymentLink(sheet, {
        leadId: "test-lead-123",
        payment_link: "https://buy.stripe.com/test_123456789",
    });
    Logger.log(response.getContent());
}

function buildTestEvent(payload) {
    return {
        postData: {
            contents: JSON.stringify(payload),
        },
    };
}

function testDoPostCreateLead() {
    const event = buildTestEvent({
        secret: SECRET_KEY,
        operation: "createLead",
        leadId: "req-" + new Date().getTime(),
        fullName: "API Test User",
        email: "api-test@example.com",
        country: "France",
        phone: "+33123456789",
        age: "30",
        bestContactTime: "Morning",
        psychologistBefore: "Yes",
        medicationNow: "No",
        whyCoaching: "Career transition",
        followingDuration: "3 months",
        maritalStatus: "Married",
        occupation: "Designer",
        passphrase: "Sample passphrase",
        category: "individuals",
        package: "program_transform",
        payment_link: "",
    });

    const response = doPost(event);
    Logger.log("testDoPostCreateLead -> " + response.getContent());
}

function testDoPostAttachPaymentLink() {
    const leadId = "test-lead-123";
    // Ensure the lead exists before running the attach test
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const existingRow = findLeadRow(sheet, leadId);
    if (existingRow === -1) {
        handleCreateLead(sheet, {
            leadId,
            fullName: "Stripe Update User",
            email: "stripe-update@example.com",
            country: "Germany",
            phone: "+491234567890",
            age: "28",
            bestContactTime: "Afternoon",
            psychologistBefore: "No",
            medicationNow: "No",
            whyCoaching: "Well-being",
            followingDuration: "1 year",
            maritalStatus: "Single",
            occupation: "Engineer",
            passphrase: "",
            category: "individuals",
            package: "program_growth",
            payment_link: "",
        });
    }

    const event = buildTestEvent({
        secret: SECRET_KEY,
        operation: "attachPaymentLink",
        leadId,
        payment_link: "https://buy.stripe.com/test_attach_link",
    });

    const response = doPost(event);
    Logger.log("testDoPostAttachPaymentLink -> " + response.getContent());
}
