const express = require('express');
const crypto = require('crypto');
const { Resend } = require('resend');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Encryption key
const ENCRYPTION_KEY = '3UYpfxVBCBptt3LL8iLhBzrOw3U0Nl7xtvNUm6eRAbE=';
const UNIQUE_IDENTIFIER = 'f935afbe-7b90-4006-a557-8fad4007ef63';

// License packages configuration
const LICENSE_PACKAGES = {
    '9.9': { days: 30, name: 'Monthly' },
    '27': { days: 90, name: '3-Month' },
    '51': { days: 180, name: '6-Month' },
    '90': { days: 360, name: 'Annual' }
};

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Verify Resend configuration on startup
console.log('📧 ========== EMAIL CONFIGURATION ==========');
if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    console.error('❌ Please set RESEND_API_KEY in Render.com Environment Variables');
} else {
    console.log('✅ Resend API Key detected');
    console.log(`✅ Key prefix: ${process.env.RESEND_API_KEY.substring(0, 8)}...`);
}

if (!process.env.RESEND_FROM_EMAIL) {
    console.error('❌ RESEND_FROM_EMAIL is not set in environment variables');
    console.error('❌ Please set RESEND_FROM_EMAIL (e.g., noreply@yourdomain.com)');
} else {
    console.log(`✅ From Email: ${process.env.RESEND_FROM_EMAIL}`);
}
console.log('==========================================');

// Generate license key function
function generateLicenseKey(validDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validDays);
    const expDateStr = expirationDate.toISOString().split('T')[0];
    
    const dataToSign = `${expDateStr}|${UNIQUE_IDENTIFIER}`;
    const signature = signData(dataToSign, ENCRYPTION_KEY);
    
    return `${dataToSign}|${signature}`;
}

function signData(data, key) {
    const hmac = crypto.createHmac('sha256', Buffer.from(key, 'base64'));
    hmac.update(data);
    return hmac.digest('base64');
}

// Send license email function using Resend SDK
async function sendLicenseEmail(recipientEmail, licenseKey, validDays, amount, packageName) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validDays);
    const expDateFormatted = expirationDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .license-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; word-break: break-all; }
        .license-key { font-family: 'Courier New', monospace; font-size: 14px; color: #d63384; font-weight: bold; background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea; }
        .info-table { width: 100%; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; }
        .info-table tr { border-bottom: 1px solid #eee; }
        .info-table td { padding: 12px; }
        .info-table td:first-child { font-weight: bold; color: #667eea; width: 40%; }
        .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 BIM9 Pipes License</h1>
        <p>Thank you for your purchase!</p>
    </div>
    <div class="content">
        <h2>Your License Key is Ready! 🎉</h2>
        <p>Your <strong>${packageName} License</strong> has been successfully generated.</p>
        <div class="license-box">
            <p style="margin-top: 0; color: #667eea; font-weight: bold;">📋 YOUR LICENSE KEY:</p>
            <div class="license-key">${licenseKey}</div>
            <p style="margin-bottom: 0; font-size: 12px; color: #666;">⚠️ Please save this key in a safe place.</p>
        </div>
        <table class="info-table">
            <tr><td>📦 Package</td><td><strong>${packageName} License</strong></td></tr>
            <tr><td>💰 Amount Paid</td><td><strong>$${amount.toFixed(2)} USD</strong></td></tr>
            <tr><td>⏱️ Valid For</td><td><strong>${validDays} days</strong></td></tr>
            <tr><td>📅 Expires On</td><td><strong>${expDateFormatted}</strong></td></tr>
            <tr><td>📧 Email</td><td>${recipientEmail}</td></tr>
        </table>
        <h3 style="color: #667eea;">🚀 Activation Instructions:</h3>
        <ol>
            <li><strong>Open Autodesk Revit</strong> on your computer</li>
            <li><strong>Launch BIM9 Pipes</strong> from the Add-ins tab</li>
            <li>When prompted, <strong>enter the license key</strong> above</li>
            <li>Click <strong>"Activate"</strong> to unlock all features</li>
        </ol>
        <h3 style="color: #667eea;">💡 Need Help?</h3>
        <p>Contact: <strong>support@bim9pipes.com</strong></p>
    </div>
    <div class="footer">
        <p><strong>BIM9 Pipes</strong> - Professional Piping Solutions for Revit</p>
        <p>© 2025 BIM9 Pipes. All rights reserved.</p>
    </div>
</body>
</html>
    `;
    
    try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        
        console.log(`📧 Sending email via Resend...`);
        console.log(`   From: ${fromEmail}`);
        console.log(`   To: ${recipientEmail}`);
        
        const data = await resend.emails.send({
            from: fromEmail,
            to: [recipientEmail],
            subject: '🎉 Your BIM9 Pipes License Key - Activation Instructions',
            html: htmlContent
        });
        
        console.log(`✅ Email sent successfully!`);
        console.log(`✅ Resend Email ID: ${data.id}`);
        console.log(`✅ Recipient: ${recipientEmail}`);
        
        return true;
    } catch (error) {
        console.error('❌ ========== EMAIL SENDING ERROR ==========');
        console.error('❌ Error:', error.message);
        console.error('❌ Error name:', error.name);
        
        if (error.message.includes('API key')) {
            console.error('❌ Invalid Resend API Key!');
            console.error('❌ Please check:');
            console.error('   1. RESEND_API_KEY is set correctly in Render.com');
            console.error('   2. API key starts with "re_"');
            console.error('   3. API key is active in Resend dashboard');
        } else if (error.message.includes('domain')) {
            console.error('❌ Domain verification issue!');
            console.error('❌ Please check:');
            console.error('   1. RESEND_FROM_EMAIL uses verified domain');
            console.error('   2. Domain is verified in Resend dashboard');
            console.error('   3. Or use: onboarding@resend.dev for testing');
        }
        
        console.error('==========================================');
        throw error;
    }
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'BIM9 Pipes License Generator API is running',
        version: '2.4-resend-pure',
        email_provider: 'Resend SDK (Pure)',
        resend_configured: !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
        packages: LICENSE_PACKAGES,
        endpoints: {
            purchase: '/purchase',
            generateKey: '/generate-key',
            webhook: '/webhook/paypal',
            testEmail: '/test-email',
            packages: '/packages'
        },
        features: [
            'Resend SDK (Pure - No Nodemailer)',
            'PayPal Webhooks v2 support',
            'PayPal IPN (legacy) support',
            'Email from custom_id (user-entered)',
            'Automatic format detection'
        ]
    });
});

// Serve purchase page
app.get('/purchase', (req, res) => {
    res.sendFile(path.join(__dirname, 'purchase.html'));
});

// Main PayPal webhook endpoint
app.post('/webhook/paypal', async (req, res) => {
    try {
        console.log('📨 ========== RECEIVED PAYPAL NOTIFICATION ==========');
        console.log('📨 Timestamp:', new Date().toISOString());
        
        let buyerEmail, amount, packageInfo;
        let customEmail = null;
        let paypalEmail = null;
        
        // Detect format: Webhooks v2 or IPN
        if (req.body.event_type) {
            // Webhooks v2 format
            console.log('🔵 Processing as PayPal Webhooks v2');
            
            const eventType = req.body.event_type;
            console.log(`🔵 Event Type: ${eventType}`);
            
            const validEvents = [
                'PAYMENT.CAPTURE.COMPLETED',
                'PAYMENT.SALE.COMPLETED',
                'CHECKOUT.ORDER.COMPLETED',
                'CHECKOUT.ORDER.APPROVED'
            ];
            
            if (!validEvents.includes(eventType)) {
                console.log(`⏸️ Event type ${eventType} not handled, returning 200 OK`);
                return res.status(200).json({ status: 'event_type_not_handled', event_type: eventType });
            }
            
            const resource = req.body.resource;
            
            // Extract email with priority
            customEmail = resource.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
                       || resource.purchase_units?.[0]?.custom_id
                       || resource.custom_id;
            
            paypalEmail = resource.payer?.email_address 
                       || resource.payer?.payer_info?.email
                       || resource.payer?.email;
            
            console.log('📧 Email from custom_id:', customEmail);
            console.log('📧 Email from PayPal account:', paypalEmail);
            
            buyerEmail = customEmail || paypalEmail;
            
            amount = parseFloat(
                resource.amount?.value 
                || resource.amount?.total
                || resource.purchase_units?.[0]?.amount?.value
                || resource.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
                || 0
            );
            
        } else if (req.body.payment_status || req.body.txn_type) {
            // IPN format
            console.log('🟢 Processing as PayPal IPN');
            
            const paymentStatus = req.body.payment_status;
            console.log(`🟢 Payment Status: ${paymentStatus}`);
            
            if (paymentStatus !== 'Completed') {
                console.log(`⏸️ Payment not completed, returning 200 OK`);
                return res.status(200).json({ status: 'payment_not_completed', payment_status: paymentStatus });
            }
            
            customEmail = req.body.custom || req.body.custom_id;
            paypalEmail = req.body.payer_email || req.body.receiver_email;
            
            buyerEmail = customEmail || paypalEmail;
            amount = parseFloat(req.body.mc_gross || 0);
            
        } else {
            console.error('❌ Unknown payload format');
            return res.status(400).json({ 
                error: 'Unknown payload format',
                received_keys: Object.keys(req.body)
            });
        }
        
        // Validate data
        if (!buyerEmail) {
            console.error('❌ Missing buyer email');
            return res.status(400).json({ error: 'Missing buyer email' });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(buyerEmail)) {
            console.error('❌ Invalid email format:', buyerEmail);
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        console.log(`💰 Processing payment: $${amount} to ${buyerEmail}`);
        
        // Determine package
        packageInfo = null;
        let closestPrice = null;
        let priceDiff = Infinity;
        
        for (const [price, info] of Object.entries(LICENSE_PACKAGES)) {
            const diff = Math.abs(amount - parseFloat(price));
            if (diff < 0.5 && diff < priceDiff) {
                packageInfo = info;
                closestPrice = price;
                priceDiff = diff;
            }
        }
        
        if (!packageInfo) {
            console.error(`❌ Unknown amount: $${amount}`);
            return res.status(400).json({ 
                error: 'Unknown amount',
                received: amount,
                valid_amounts: Object.keys(LICENSE_PACKAGES).map(p => parseFloat(p))
            });
        }
        
        console.log(`📦 Package: ${packageInfo.name} (${packageInfo.days} days) - $${closestPrice}`);
        
        // Generate license key
        const licenseKey = generateLicenseKey(packageInfo.days);
        console.log(`🔑 Generated license key: ${licenseKey}`);
        
        // Send email
        console.log(`📧 ========== SENDING EMAIL ==========`);
        
        try {
            await sendLicenseEmail(buyerEmail, licenseKey, packageInfo.days, amount, packageInfo.name);
            console.log(`✅ Email sent successfully!`);
        } catch (emailError) {
            console.error(`❌ Failed to send email:`, emailError.message);
            
            return res.status(500).json({ 
                error: 'Failed to send email',
                details: emailError.message,
                email_to: buyerEmail,
                hint: 'Check RESEND_API_KEY and RESEND_FROM_EMAIL environment variables'
            });
        }
        
        console.log(`✅ ========== NOTIFICATION PROCESSED SUCCESSFULLY ==========`);
        
        return res.status(200).json({ 
            status: 'success',
            email_sent: true,
            email_to: buyerEmail,
            email_source: customEmail ? 'custom_id' : 'paypal_account',
            package: packageInfo.name,
            license_key_generated: true
        });
        
    } catch (error) {
        console.error('❌ ========== ERROR PROCESSING NOTIFICATION ==========');
        console.error('❌ Error:', error);
        console.error('❌ Stack:', error.stack);
        
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Test email endpoint
app.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        console.log(`📧 ========== TEST EMAIL REQUEST ==========`);
        console.log(`📧 Test email to: ${email}`);
        
        const testKey = generateLicenseKey(30);
        await sendLicenseEmail(email, testKey, 30, 9.9, 'Test Monthly');
        
        res.json({ 
            success: true, 
            message: 'Test email sent successfully via Resend SDK',
            email: email,
            license_key: testKey,
            email_provider: 'Resend SDK (Pure)'
        });
    } catch (error) {
        console.error('❌ Error sending test email:', error);
        res.status(500).json({ 
            error: 'Failed to send test email',
            details: error.message,
            hint: 'Check RESEND_API_KEY and RESEND_FROM_EMAIL environment variables'
        });
    }
});

// Manual key generation endpoint
app.post('/generate-key', async (req, res) => {
    try {
        const { email, validDays, amount } = req.body;
        
        if (!email || !validDays || !amount) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['email', 'validDays', 'amount']
            });
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        let packageName = `${validDays}-Day`;
        for (const [price, info] of Object.entries(LICENSE_PACKAGES)) {
            if (info.days === validDays) {
                packageName = info.name;
                break;
            }
        }
        
        const licenseKey = generateLicenseKey(validDays);
        await sendLicenseEmail(email, licenseKey, validDays, amount, packageName);
        
        console.log(`✅ Manual key generation: ${email}, ${validDays} days`);
        
        res.json({ 
            success: true, 
            licenseKey,
            validDays,
            packageName,
            email,
            message: 'License key generated and sent successfully via Resend SDK'
        });
    } catch (error) {
        console.error('❌ Error generating key:', error);
        res.status(500).json({ 
            error: 'Failed to generate key',
            details: error.message 
        });
    }
});

// Packages endpoint
app.get('/packages', (req, res) => {
    const packages = Object.entries(LICENSE_PACKAGES).map(([price, info]) => ({
        price: parseFloat(price),
        ...info
    }));
    
    res.json({
        success: true,
        packages: packages,
        currency: 'USD'
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        path: req.path,
        available_endpoints: {
            root: 'GET /',
            purchase: 'GET /purchase',
            webhook: 'POST /webhook/paypal',
            generateKey: 'POST /generate-key',
            testEmail: 'POST /test-email',
            packages: 'GET /packages'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log(`🔧 BIM9 Pipes License Generator API v2.4`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.PAYPAL_MODE || 'sandbox'}`);
    console.log(`📧 Email Provider: Resend SDK (Pure - No Nodemailer)`);
    console.log(`📧 From Email: ${process.env.RESEND_FROM_EMAIL || 'NOT SET'}`);
    console.log(`📧 API Key Status: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Not Set'}`);
    console.log('📦 Available Packages:');
    Object.entries(LICENSE_PACKAGES).forEach(([price, info]) => {
        console.log(`   💰 $${price} → ${info.name} (${info.days} days)`);
    });
    console.log('✨ Features:');
    console.log('   ✅ Resend SDK (Pure - No Nodemailer)');
    console.log('   ✅ PayPal Webhooks v2 support');
    console.log('   ✅ PayPal IPN (legacy) support');
    console.log('   ✅ Email from custom_id (user-entered)');
    console.log('   ✅ Automatic format detection');
    console.log('   ✅ Detailed logging for debugging');
    console.log('✅ Ready to process payments!');
    console.log('========================================');
});
