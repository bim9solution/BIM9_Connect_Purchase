// ============================================================
// BIM9 Pipes – License Server
// PayPal Webhook + Resend Email
// ============================================================

// -*- coding: utf-8 -*-

const express = require('express');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const { Resend } = require('resend');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ENV
// ============================================================

const PORT = process.env.PORT || 3000;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const RESEND_API_KEY = process.env.RESEND_API_KEY;

// ❗ KHÔNG CẦN EMAIL_FROM ENV
// fallback mặc định – domain đã verify sẵn của Resend
const EMAIL_FROM = 'BIM9 Pipes <onboarding@resend.dev>';

if (!RESEND_API_KEY) {
    console.error('❌ Missing RESEND_API_KEY');
    process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

// ============================================================
// LICENSE CONFIG
// ============================================================

const ENCRYPTION_KEY = '3UYpfxVBCBptt3LL8iLhBzrOw3U0Nl7xtvNUm6eRAbE=';
const UNIQUE_IDENTIFIER = 'f935afbe-7b90-4006-a557-8fad4007ef63';

const LICENSE_PACKAGES = {
    '9.9': { days: 30, name: 'Monthly' },
    '27': { days: 90, name: '3-Month' },
    '51': { days: 180, name: '6-Month' },
    '90': { days: 360, name: 'Annual' }
};

// ============================================================
// LICENSE FUNCTIONS
// ============================================================

function signData(data, key) {
    const hmac = crypto.createHmac('sha256', Buffer.from(key, 'base64'));
    hmac.update(data);
    return hmac.digest('base64');
}

function generateLicenseKey(validDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validDays);

    const expDateStr = expirationDate.toISOString().split('T')[0];
    const dataToSign = expDateStr + '|' + UNIQUE_IDENTIFIER;
    const signature = signData(dataToSign, ENCRYPTION_KEY);

    return dataToSign + '|' + signature;
}

// ============================================================
// EMAIL (RESEND – NO ENV DEPENDENCY)
// ============================================================

async function sendLicenseEmail(recipientEmail, licenseKey, validDays, amount, packageName) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validDays);

    const expDateFormatted = expirationDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const html = `
        <h2>🎉 BIM9 Pipes License</h2>
        <p>Thank you for your purchase!</p>

        <hr/>

        <p><strong>📦 Package:</strong> ${packageName}</p>
        <p><strong>💰 Amount:</strong> $${amount.toFixed(2)} USD</p>
        <p><strong>⏱ Valid:</strong> ${validDays} days</p>
        <p><strong>📅 Expires:</strong> ${expDateFormatted}</p>

        <hr/>

        <p><strong>🔑 YOUR LICENSE KEY:</strong></p>
        <pre style="background:#f4f4f4;padding:12px;border-radius:6px;word-break:break-all;">
${licenseKey}
        </pre>

        <p><strong>Activation:</strong></p>
        <ol>
            <li>Open Autodesk Revit</li>
            <li>Launch BIM9 Pipes</li>
            <li>Paste license key</li>
            <li>Click Activate</li>
        </ol>

        <p>Support: support@bim9pipes.com</p>
        <p>© 2025 BIM9 Pipes</p>
    `;

    const { data, error } = await resend.emails.send({
        from: EMAIL_FROM,
        to: [recipientEmail],
        subject: '🎉 Your BIM9 Pipes License Key',
        html: html
    });

    if (error) {
        console.error('❌ Resend error:', error);
        throw error;
    }

    console.log('✅ Email sent via Resend:', data.id);
    return true;
}

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'BIM9 Pipes License API',
        paypal_mode: PAYPAL_MODE,
        packages: LICENSE_PACKAGES
    });
});

// Serve purchase page
app.get('/purchase', (req, res) => {
    res.sendFile(path.join(__dirname, 'purchase.html'));
});

// ============================================================
// PAYPAL WEBHOOK / IPN
// ============================================================

app.post('/webhook/paypal', async (req, res) => {
    try {
        let buyerEmail = null;
        let amount = 0;

        // Webhook v2
        if (req.body.event_type) {
            const resource = req.body.resource || {};

            buyerEmail =
                resource.payer?.email_address ||
                resource.payer?.payer_info?.email;

            amount = parseFloat(
                resource.amount?.value ||
                resource.purchase_units?.[0]?.amount?.value ||
                0
            );
        }
        // IPN
        else if (req.body.payment_status === 'Completed') {
            buyerEmail = req.body.payer_email;
            amount = parseFloat(req.body.mc_gross || 0);
        }

        if (!buyerEmail || amount <= 0) {
            return res.status(400).json({ error: 'Invalid payment data' });
        }

        let packageInfo = null;
        for (const price in LICENSE_PACKAGES) {
            if (Math.abs(amount - parseFloat(price)) < 0.01) {
                packageInfo = LICENSE_PACKAGES[price];
                break;
            }
        }

        if (!packageInfo) {
            return res.status(400).json({
                error: 'Unknown amount',
                amount: amount
            });
        }

        const licenseKey = generateLicenseKey(packageInfo.days);

        await sendLicenseEmail(
            buyerEmail,
            licenseKey,
            packageInfo.days,
            amount,
            packageInfo.name
        );

        res.json({
            success: true,
            email: buyerEmail,
            package: packageInfo.name
        });

    } catch (err) {
        console.error('❌ Webhook error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// TEST EMAIL
// ============================================================

app.post('/test-email', async (req, res) => {
    try {
        const email = req.body.email;
        if (!email) {
            return res.status(400).json({ error: 'Email required' });
        }

        const testKey = generateLicenseKey(30);

        await sendLicenseEmail(email, testKey, 30, 9.9, 'Test Monthly');

        res.json({ success: true, email: email });
    } catch (err) {
        console.error('❌ Test email error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
    console.log('======================================');
    console.log('🚀 BIM9 Pipes License Server');
    console.log('📡 Port:', PORT);
    console.log('📧 Email provider: Resend (default domain)');
    console.log('======================================');
});
