// Secret key for authentication - KEEP THIS PRIVATE
const SECRET_KEY =
    "c2a5af16dcae5d04adef54ebf1c8c70e8134acb9a16fd2c723a958ac7b0927d3";

// Column layout helpers (1-based index)
const COL_TIMESTAMP = 1;
const COL_LEAD_ID = 2;
const COL_PAYMENT_LINK = 17;
const COL_PAYMENT_STATUS = 18;
const COL_PAID_AT = 19;
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
        requestData.gender || "",
        requestData.ageGroup || "",
        requestData.country || "",
        requestData.specialization || "",
        requestData.socialFamiliarity || "",
        requestData.previousTraining || "",
        requestData.awarenessLevel || "",
        requestData.phone || "",
        requestData.email || "",
        requestData.bestContactTime || "",
        requestData.passphrase || "",
        requestData.category || "",
        requestData.package || "",
        requestData.payment_link || "",
        requestData.payment_status || "",
        requestData.paid_at || "",
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

function handleMarkPaid(sheet, requestData) {
    const leadId = (requestData.leadId || "").trim();
    if (!leadId) {
        return jsonResponse({
            success: false,
            error: "Missing leadId for markPaid operation",
        });
    }

    const row = findLeadRow(sheet, leadId);

    if (row === -1) {
        return jsonResponse({
            success: false,
            error: "Lead not found for markPaid operation",
        });
    }

    const statusRaw = (requestData.payment_status || "Paid").toString().trim();
    const status = statusRaw || "Paid";
    const paidAtRaw = requestData.paid_at;
    let paidAtValue = new Date();
    if (paidAtRaw) {
        const parsedDate = new Date(paidAtRaw);
        if (!isNaN(parsedDate.getTime())) {
            paidAtValue = parsedDate;
        }
    }

    sheet.getRange(row, COL_PAYMENT_STATUS).setValue(status);
    sheet.getRange(row, COL_PAID_AT).setValue(paidAtValue);
    sheet.getRange(row, COL_TIMESTAMP).setValue(new Date());

    return jsonResponse({
        success: true,
        message: "Lead marked as paid successfully",
        row,
        status,
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
            case "markPaid":
                return handleMarkPaid(sheet, requestData);
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
        gender: "Male",
        ageGroup: "26-35",
        country: "USA",
        specialization: "Product Design",
        socialFamiliarity: "I've heard of you",
        previousTraining: "Participated in leadership cohorts",
        awarenessLevel: "Beginner",
        phone: "+1234567890",
        bestContactTime: "Evenings",
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

function testMarkPaid() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const response = handleMarkPaid(sheet, {
        leadId: "test-lead-123",
        payment_status: "Paid",
        paid_at: new Date().toISOString(),
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
        gender: "Female",
        ageGroup: "36-45",
        country: "France",
        specialization: "Executive Coaching",
        socialFamiliarity: "Following you closely",
        previousTraining: "Executive MBA coaching module",
        awarenessLevel: "Deep in it and unravelling patterns",
        phone: "+33123456789",
        bestContactTime: "Morning",
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
            gender: "Other",
            ageGroup: "Under 18",
            country: "Germany",
            specialization: "Creative Direction",
            socialFamiliarity: "Haven't met you yet",
            previousTraining: "Mindfulness workshops",
            awarenessLevel: "Holding steady",
            phone: "+491234567890",
            bestContactTime: "Afternoon",
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
