const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Encryption key (giữ nguyên key của bạn)
const ENCRYPTION_KEY = '3UYpfxVBCBptt3LL8iLhBzrOw3U0Nl7xtvNUm6eRAbE=';
const UNIQUE_IDENTIFIER = 'f935afbe-7b90-4006-a557-8fad4007ef63';

// Cấu hình các gói license
const LICENSE_PACKAGES = {
    '9.9': { days: 30, name: 'Monthly' },
    '27': { days: 90, name: '3-Month' },
    '51': { days: 180, name: '6-Month' },
    '90': { days: 360, name: 'Annual' }
};

// Cấu hình email - Support cả Gmail và SendGrid
let transporter;
const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

if (emailProvider === 'sendgrid') {
    // SendGrid configuration (Khuyến nghị cho production!)
    console.log('📧 Using SendGrid for email');
    const nodemailerSendgrid = require('nodemailer-sendgrid');
    
    transporter = nodemailer.createTransport(
        nodemailerSendgrid({
            apiKey: process.env.SENDGRID_API_KEY
        })
    );
} else {
    // Gmail configuration (Default)
    console.log('📧 Using Gmail for email');
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Add timeout settings
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000
    });
}

// Test email connection on startup
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Email configuration error:', error);
        console.error('❌ Provider:', emailProvider);
        if (emailProvider === 'gmail') {
            console.error('❌ Please check:');
            console.error('   1. EMAIL_USER is set correctly');
            console.error('   2. EMAIL_PASS is Gmail App Password (16 chars, no spaces)');
            console.error('   3. 2-Step Verification is enabled on Gmail');
            console.error('   4. Consider switching to SendGrid (set EMAIL_PROVIDER=sendgrid)');
        } else {
            console.error('❌ Please check SENDGRID_API_KEY is set correctly');
        }
    } else {
        console.log('✅ Email server is ready to send messages');
        console.log(`✅ Provider: ${emailProvider}`);
        if (emailProvider === 'gmail') {
            console.log(`✅ Sending from: ${process.env.EMAIL_USER}`);
        } else {
            console.log(`✅ SendGrid API Key configured`);
        }
    }
});

// Hàm tạo license key
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

// Hàm gửi email
async function sendLicenseEmail(recipientEmail, licenseKey, validDays, amount, packageName) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validDays);
    const expDateFormatted = expirationDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: '🎉 Your BIM9_Pipes License Key - Activation Instructions',
        html: `
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
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ License email sent successfully to ${recipientEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        throw error;
    }
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'BIM9 Pipes License Generator API is running',
        version: '2.2-custom-id',
        packages: LICENSE_PACKAGES,
        endpoints: {
            purchase: '/purchase',
            generateKey: '/generate-key',
            webhook: '/webhook/paypal',
            testEmail: '/test-email'
        },
        features: [
            'Supports PayPal Webhooks v2',
            'Supports PayPal IPN (legacy)',
            'Email from custom_id (user-entered)',
            'Automatic format detection'
        ]
    });
});

// Serve trang purchase
app.get('/purchase', (req, res) => {
    res.sendFile(path.join(__dirname, 'purchase.html'));
});

// ============================================================
// ENDPOINT CHÍNH: Xử lý cả IPN và Webhooks v2 với custom_id
// ============================================================
app.post('/webhook/paypal', async (req, res) => {
    try {
        console.log('📨 ========== RECEIVED PAYPAL NOTIFICATION ==========');
        console.log('📨 Timestamp:', new Date().toISOString());
        console.log('📨 Full payload:', JSON.stringify(req.body, null, 2));
        
        let buyerEmail, amount, packageInfo, eventDescription;
        let customEmail = null;
        let paypalEmail = null;
        
        // ========== DETECT FORMAT: Webhooks v2 hay IPN ==========
        
        if (req.body.event_type) {
            // ========== WEBHOOKS V2 FORMAT (MỚI) ==========
            console.log('🔵 Processing as PayPal Webhooks v2');
            
            const eventType = req.body.event_type;
            console.log(`🔵 Event Type: ${eventType}`);
            
            // Chỉ xử lý payment completed events
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
            console.log('🔵 Resource:', JSON.stringify(resource, null, 2));
            
            // ========== EXTRACT EMAIL WITH PRIORITY ==========
            
            // Priority 1: custom_id (Email from purchase form - MOST RELIABLE!)
            customEmail = resource.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
                       || resource.purchase_units?.[0]?.custom_id
                       || resource.custom_id;
            
            // Priority 2: PayPal account email
            paypalEmail = resource.payer?.email_address 
                       || resource.payer?.payer_info?.email
                       || resource.payer?.email;
            
            console.log('📧 ========== EMAIL EXTRACTION ==========');
            console.log('📧 Email from custom_id (user form):', customEmail);
            console.log('📧 Email from PayPal account:', paypalEmail);
            
            // Use custom_id if available, otherwise use PayPal email
            buyerEmail = customEmail || paypalEmail;
            
            console.log('📧 Final email to use:', buyerEmail);
            console.log('📧 Email source:', customEmail ? 'custom_id (user-entered) ✅' : 'PayPal account');
            
            // Extract amount - try multiple paths
            amount = parseFloat(
                resource.amount?.value 
                || resource.amount?.total
                || resource.purchase_units?.[0]?.amount?.value
                || resource.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
                || 0
            );
            
            eventDescription = `Webhook v2: ${eventType}`;
            
            console.log(`🔵 Extracted - Amount: $${amount}`);
            
        } else if (req.body.payment_status || req.body.txn_type) {
            // ========== IPN FORMAT (CŨ) ==========
            console.log('🟢 Processing as PayPal IPN');
            
            // Verify IPN với PayPal
            try {
                const isValid = await verifyPayPalIPN(req.body);
                if (!isValid) {
                    console.error('❌ Invalid PayPal IPN signature');
                    return res.status(400).json({ error: 'Invalid IPN' });
                }
                console.log('✅ IPN verified successfully');
            } catch (verifyError) {
                console.error('⚠️ IPN verification error:', verifyError);
                console.log('⚠️ Continuing anyway (remove this in production)');
            }
            
            const paymentStatus = req.body.payment_status;
            console.log(`🟢 Payment Status: ${paymentStatus}`);
            
            if (paymentStatus !== 'Completed') {
                console.log(`⏸️ Payment not completed (status: ${paymentStatus}), returning 200 OK`);
                return res.status(200).json({ status: 'payment_not_completed', payment_status: paymentStatus });
            }
            
            // ========== EXTRACT EMAIL WITH PRIORITY ==========
            
            // Priority 1: custom field (Email from purchase form)
            customEmail = req.body.custom || req.body.custom_id;
            
            // Priority 2: PayPal IPN email
            paypalEmail = req.body.payer_email || req.body.receiver_email;
            
            console.log('📧 ========== EMAIL EXTRACTION ==========');
            console.log('📧 Email from custom field (user form):', customEmail);
            console.log('📧 Email from IPN payer_email:', paypalEmail);
            
            // Use custom if available, otherwise use payer_email
            buyerEmail = customEmail || paypalEmail;
            
            console.log('📧 Final email to use:', buyerEmail);
            console.log('📧 Email source:', customEmail ? 'custom field (user-entered) ✅' : 'IPN payer_email');
            
            amount = parseFloat(req.body.mc_gross || 0);
            
            eventDescription = `IPN: ${paymentStatus}`;
            
            console.log(`🟢 Extracted - Amount: $${amount}`);
            
        } else {
            // ========== UNKNOWN FORMAT ==========
            console.error('❌ Unknown payload format - neither Webhook nor IPN');
            console.error('❌ Available keys:', Object.keys(req.body));
            return res.status(400).json({ 
                error: 'Unknown payload format',
                received_keys: Object.keys(req.body)
            });
        }
        
        // ========== VALIDATE DATA ==========
        
        if (!buyerEmail) {
            console.error('❌ Missing buyer email in payload');
            console.error('❌ Checked paths:');
            console.error('   - custom_id / custom field');
            console.error('   - payer.email_address');
            console.error('   - payer_email');
            return res.status(400).json({ 
                error: 'Missing buyer email',
                hint: 'Make sure custom_id is set in PayPal order'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(buyerEmail)) {
            console.error('❌ Invalid email format:', buyerEmail);
            return res.status(400).json({ 
                error: 'Invalid email format',
                email: buyerEmail
            });
        }
        
        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return res.status(400).json({ 
                error: 'Invalid amount',
                amount: amount
            });
        }
        
        console.log(`💰 Processing payment: $${amount} to ${buyerEmail}`);
        
        // ========== DETERMINE LICENSE PACKAGE ==========
        
        packageInfo = null;
        let closestPrice = null;
        let priceDiff = Infinity;
        
        for (const [price, info] of Object.entries(LICENSE_PACKAGES)) {
            const diff = Math.abs(amount - parseFloat(price));
            if (diff < 0.5 && diff < priceDiff) {  // Allow 50 cent tolerance
                packageInfo = info;
                closestPrice = price;
                priceDiff = diff;
            }
        }
        
        if (!packageInfo) {
            console.error(`❌ Unknown amount: $${amount}`);
            console.error(`❌ Valid amounts: ${Object.keys(LICENSE_PACKAGES).join(', ')}`);
            return res.status(400).json({ 
                error: 'Unknown amount',
                received: amount,
                valid_amounts: Object.keys(LICENSE_PACKAGES).map(p => parseFloat(p))
            });
        }
        
        console.log(`📦 Package matched: ${packageInfo.name} (${packageInfo.days} days) - Price: $${closestPrice}`);
        
        // ========== GENERATE LICENSE KEY ==========
        
        const licenseKey = generateLicenseKey(packageInfo.days);
        console.log(`🔑 Generated license key: ${licenseKey}`);
        
        // ========== SEND EMAIL ==========
        
        console.log(`📧 ========== SENDING EMAIL ==========`);
        console.log(`📧 To: ${buyerEmail}`);
        console.log(`📧 Package: ${packageInfo.name}`);
        console.log(`📧 License Key: ${licenseKey}`);
        
        try {
            await sendLicenseEmail(buyerEmail, licenseKey, packageInfo.days, amount, packageInfo.name);
            console.log(`✅ Email sent successfully!`);
        } catch (emailError) {
            console.error(`❌ Failed to send email:`, emailError);
            console.error(`❌ Error details:`, emailError.message);
            
            // Return 500 so PayPal will retry
            return res.status(500).json({ 
                error: 'Failed to send email',
                details: emailError.message,
                email_to: buyerEmail,
                hint: 'Check EMAIL_USER and EMAIL_PASS environment variables'
            });
        }
        
        console.log(`✅ ========== NOTIFICATION PROCESSED SUCCESSFULLY ==========`);
        console.log(`✅ Summary:`);
        console.log(`   - Email: ${buyerEmail} (from ${customEmail ? 'custom_id' : 'PayPal account'})`);
        console.log(`   - Amount: $${amount}`);
        console.log(`   - Package: ${packageInfo.name} (${packageInfo.days} days)`);
        console.log(`   - License Key: ${licenseKey}`);
        console.log(`   - Email Status: Sent ✅`);
        
        // Return 200 OK to PayPal
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
        
        // Return 500 so PayPal will retry
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Hàm xác thực PayPal IPN
async function verifyPayPalIPN(ipnData) {
    const https = require('https');
    
    const verifyData = { cmd: '_notify-validate', ...ipnData };
    const postData = new URLSearchParams(verifyData).toString();
    
    const paypalUrl = process.env.PAYPAL_MODE === 'live' 
        ? 'www.paypal.com' 
        : 'www.sandbox.paypal.com';
    
    console.log(`🔍 Verifying IPN with ${paypalUrl}...`);
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: paypalUrl,
            port: 443,
            path: '/cgi-bin/webscr',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (body === 'VERIFIED') {
                    console.log('✅ PayPal IPN verified');
                    resolve(true);
                } else {
                    console.error('❌ PayPal verification failed:', body);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Error verifying PayPal IPN:', error);
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// Endpoint test email
app.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        console.log(`📧 Sending test email to: ${email}`);
        
        const testKey = generateLicenseKey(30);
        await sendLicenseEmail(email, testKey, 30, 9.9, 'Test Monthly');
        
        res.json({ 
            success: true, 
            message: 'Test email sent successfully',
            email: email,
            license_key: testKey
        });
    } catch (error) {
        console.error('❌ Error sending test email:', error);
        res.status(500).json({ 
            error: 'Failed to send test email',
            details: error.message 
        });
    }
});

// Endpoint tạo key thủ công
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
            message: 'License key generated and sent successfully'
        });
    } catch (error) {
        console.error('❌ Error generating key:', error);
        res.status(500).json({ 
            error: 'Failed to generate key',
            details: error.message 
        });
    }
});

// Endpoint packages
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
    console.log(`🔧 BIM9 Pipes License Generator API v2.2`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.PAYPAL_MODE || 'sandbox'}`);
    console.log(`📧 Email from: ${process.env.EMAIL_USER || 'NOT CONFIGURED'}`);
    console.log('📦 Available Packages:');
    Object.entries(LICENSE_PACKAGES).forEach(([price, info]) => {
        console.log(`   💰 $${price} → ${info.name} (${info.days} days)`);
    });
    console.log('✨ Features:');
    console.log('   ✅ PayPal Webhooks v2 support');
    console.log('   ✅ PayPal IPN (legacy) support');
    console.log('   ✅ Email from custom_id (user-entered) - PRIORITY!');
    console.log('   ✅ Automatic format detection');
    console.log('   ✅ Detailed logging for debugging');
    console.log('✅ Ready to process payments!');
    console.log('========================================');
});
