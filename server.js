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

// Cấu hình email với port 587 và STARTTLS
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // false cho port 587, sẽ upgrade sang TLS bằng STARTTLS
    requireTLS: true, // Buộc phải dùng TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 60000, // 60 giây
    greetingTimeout: 30000,
    socketTimeout: 60000,
    logger: true, // Bật logger để debug
    debug: true   // Bật debug để xem chi tiết kết nối
});

// Test email connection on startup
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
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
        version: '2.1',
        packages: LICENSE_PACKAGES,
        endpoints: {
            purchase: '/purchase',
            generateKey: '/generate-key',
            webhook: '/webhook/paypal',
            testEmail: '/test-email'
        }
    });
});

// Serve trang purchase
app.get('/purchase', (req, res) => {
    res.sendFile(path.join(__dirname, 'purchase.html'));
});

// ============================================================
// ENDPOINT CHÍNH: Xử lý cả IPN và Webhooks v2
// ============================================================
app.post('/webhook/paypal', async (req, res) => {
    try {
        console.log('📨 ========== RECEIVED PAYPAL NOTIFICATION ==========');
        console.log('📨 Full payload:', JSON.stringify(req.body, null, 2));
        console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
        
        let buyerEmail, amount, packageInfo, eventDescription;
        
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
                return res.status(200).json({ status: 'event_type_not_handled' });
            }
            
            const resource = req.body.resource;
            console.log('🔵 Resource:', JSON.stringify(resource, null, 2));
            
            // Extract email - try multiple paths
            buyerEmail = resource.payer?.email_address 
                      || resource.payer?.payer_info?.email
                      || resource.payer?.email
                      || resource.payee?.email_address;
            
            // Extract amount - try multiple paths
            amount = parseFloat(
                resource.amount?.value 
                || resource.amount?.total
                || resource.purchase_units?.[0]?.amount?.value
                || 0
            );
            
            eventDescription = `Webhook v2: ${eventType}`;
            
            console.log(`🔵 Extracted - Email: ${buyerEmail}, Amount: $${amount}`);
            
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
                console.error('❌ IPN verification error:', verifyError);
                // Continue anyway for testing (comment out in production)
            }
            
            const paymentStatus = req.body.payment_status;
            console.log(`🟢 Payment Status: ${paymentStatus}`);
            
            if (paymentStatus !== 'Completed') {
                console.log(`⏸️ Payment not completed (status: ${paymentStatus}), returning 200 OK`);
                return res.status(200).json({ status: 'payment_not_completed' });
            }
            
            amount = parseFloat(req.body.mc_gross || 0);
            buyerEmail = req.body.payer_email || req.body.receiver_email;
            
            eventDescription = `IPN: ${paymentStatus}`;
            
            console.log(`🟢 Extracted - Email: ${buyerEmail}, Amount: $${amount}`);
            
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
            return res.status(400).json({ error: 'Missing buyer email' });
        }
        
        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        console.log(`💰 Processing payment: $${amount} to ${buyerEmail}`);
        
        // ========== DETERMINE LICENSE PACKAGE ==========
        
        packageInfo = null;
        for (const [price, info] of Object.entries(LICENSE_PACKAGES)) {
            if (Math.abs(amount - parseFloat(price)) < 0.01) {
                packageInfo = info;
                break;
            }
        }
        
        if (!packageInfo) {
            console.error(`❌ Unknown amount: $${amount}`);
            console.error(`❌ Valid amounts: ${Object.keys(LICENSE_PACKAGES).join(', ')}`);
            return res.status(400).json({ 
                error: 'Unknown amount',
                received: amount,
                valid_amounts: Object.keys(LICENSE_PACKAGES)
            });
        }
        
        console.log(`📦 Package: ${packageInfo.name} (${packageInfo.days} days)`);
        
        // ========== GENERATE LICENSE KEY ==========
        
        const licenseKey = generateLicenseKey(packageInfo.days);
        console.log(`🔑 Generated license key: ${licenseKey}`);
        
        // ========== SEND EMAIL ==========
        
        console.log(`📧 Sending email to: ${buyerEmail}`);
        
        try {
            await sendLicenseEmail(buyerEmail, licenseKey, packageInfo.days, amount, packageInfo.name);
            console.log(`✅ Email sent successfully!`);
        } catch (emailError) {
            console.error(`❌ Failed to send email:`, emailError);
            // Return 500 so PayPal will retry
            return res.status(500).json({ 
                error: 'Failed to send email',
                details: emailError.message 
            });
        }
        
        console.log(`✅ ========== NOTIFICATION PROCESSED SUCCESSFULLY ==========`);
        
        // Return 200 OK to PayPal
        return res.status(200).json({ 
            status: 'success',
            email_sent: true,
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
            email: email
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
        path: req.path
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log(`🔧 BIM9 Pipes License Generator API v2.1`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.PAYPAL_MODE || 'sandbox'}`);
    console.log('📦 Available Packages:');
    Object.entries(LICENSE_PACKAGES).forEach(([price, info]) => {
        console.log(`   💰 $${price} → ${info.name} (${info.days} days)`);
    });
    console.log('✅ Ready to process payments!');
    console.log('========================================');
});
