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

// Cấu hình email (sử dụng Gmail hoặc SMTP khác)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Hàm tạo license key (chuyển từ C#)
function generateLicenseKey(validDays) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validDays);
    const expDateStr = expirationDate.toISOString().split('T')[0]; // yyyy-MM-dd
    
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
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border: 1px solid #ddd;
        }
        .license-box {
            background: white;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            word-break: break-all;
        }
        .license-key {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #d63384;
            font-weight: bold;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
        .info-table {
            width: 100%;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        .info-table tr {
            border-bottom: 1px solid #eee;
        }
        .info-table td {
            padding: 12px;
        }
        .info-table td:first-child {
            font-weight: bold;
            color: #667eea;
            width: 40%;
        }
        .steps {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .steps h3 {
            color: #667eea;
            margin-top: 0;
        }
        .steps ol {
            padding-left: 20px;
        }
        .steps li {
            margin: 10px 0;
            line-height: 1.8;
        }
        .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            background: #333;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 10px 10px;
            font-size: 12px;
        }
        .footer a {
            color: #667eea;
            text-decoration: none;
        }
        .button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔧 BIM9 Pipes License</h1>
        <p>Thank you for your purchase!</p>
    </div>
    
    <div class="content">
        <h2>Your License Key is Ready! 🎉</h2>
        <p>Your <strong>${packageName} License</strong> has been successfully generated and is ready to use.</p>
        
        <div class="license-box">
            <p style="margin-top: 0; color: #667eea; font-weight: bold;">📋 YOUR LICENSE KEY:</p>
            <div class="license-key">${licenseKey}</div>
            <p style="margin-bottom: 0; font-size: 12px; color: #666;">
                ⚠️ Please save this key in a safe place. You will need it to activate BIM9 Pipes.
            </p>
        </div>
        
        <table class="info-table">
            <tr>
                <td>📦 Package</td>
                <td><strong>${packageName} License</strong></td>
            </tr>
            <tr>
                <td>💰 Amount Paid</td>
                <td><strong>$${amount.toFixed(2)} USD</strong></td>
            </tr>
            <tr>
                <td>⏱️ Valid For</td>
                <td><strong>${validDays} days</strong></td>
            </tr>
            <tr>
                <td>📅 Expires On</td>
                <td><strong>${expDateFormatted}</strong></td>
            </tr>
            <tr>
                <td>📧 Email</td>
                <td>${recipientEmail}</td>
            </tr>
        </table>
        
        <div class="steps">
            <h3>🚀 Activation Instructions:</h3>
            <ol>
                <li><strong>Open Autodesk Revit</strong> on your computer</li>
                <li><strong>Launch BIM9 Pipes</strong> from the Add-ins tab</li>
                <li>When prompted for a license key, <strong>click "Enter License Key"</strong></li>
                <li><strong>Copy and paste</strong> the license key from above</li>
                <li>Click <strong>"Activate"</strong> to unlock all features</li>
                <li>Start using BIM9 Pipes! 🎊</li>
            </ol>
        </div>
        
        <div class="warning">
            <strong>⚠️ Important Notes:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Keep this email for your records</li>
                <li>The license key is case-sensitive</li>
                <li>Copy the entire key including all characters</li>
                <li>License is valid starting from today</li>
                <li>No refunds after key delivery</li>
            </ul>
        </div>
        
        <h3 style="color: #667eea;">Need Help?</h3>
        <p>If you have any questions or encounter issues:</p>
        <ul>
            <li>📧 Email: <strong>support@bim9pipes.com</strong></li>
            <li>🌐 Website: <strong>https://bim9pipes.com</strong></li>
            <li>⏰ Support hours: Monday-Friday, 9 AM - 5 PM (GMT+7)</li>
        </ul>
        
        <p style="text-align: center; margin-top: 30px;">
            <strong>Thank you for choosing BIM9 Pipes!</strong><br>
            We hope you enjoy using our software.
        </p>
    </div>
    
    <div class="footer">
        <p><strong>BIM9 Pipes</strong> - Professional Piping Solutions for Revit</p>
        <p>This is an automated email. Please do not reply to this message.</p>
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
        version: '2.0',
        packages: LICENSE_PACKAGES,
        endpoints: {
            purchase: '/purchase',
            generateKey: '/generate-key',
            webhookIPN: '/webhook/paypal',
            webhookV2: '/webhook/paypal-v2'  // ← THÊM DÒNG NÀY
        }
    });
});

// Serve trang purchase
app.get('/purchase', (req, res) => {
    res.sendFile(path.join(__dirname, 'purchase.html'));
});

// Endpoint nhận webhook từ PayPal (hỗ trợ cả IPN và Webhooks mới)
app.post('/webhook/paypal', async (req, res) => {
    try {
        console.log('📨 Received PayPal notification:', JSON.stringify(req.body, null, 2));
        
        let buyerEmail, amount, packageInfo;
        
        // Kiểm tra xem là IPN hay Webhook mới
        if (req.body.event_type) {
            // ========== WEBHOOKS FORMAT (MỚI) ==========
            console.log('📡 Processing as PayPal Webhook v2');
            
            const eventType = req.body.event_type;
            
            // Chỉ xử lý các event liên quan đến payment completed
            const validEvents = [
                'PAYMENT.CAPTURE.COMPLETED',
                'PAYMENT.SALE.COMPLETED',
                'CHECKOUT.ORDER.COMPLETED'
            ];
            
            if (!validEvents.includes(eventType)) {
                console.log(`⏸️ Event type ${eventType} not handled`);
                return res.status(200).send('Event type not handled');
            }
            
            // Lấy thông tin từ webhook payload
            if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
                const resource = req.body.resource;
                buyerEmail = resource.payer?.email_address || resource.payer?.payer_info?.email;
                amount = parseFloat(resource.amount?.value || 0);
            }
            else if (eventType === 'PAYMENT.SALE.COMPLETED') {
                const resource = req.body.resource;
                buyerEmail = resource.payer?.payer_info?.email;
                amount = parseFloat(resource.amount?.total || 0);
            }
            else if (eventType === 'CHECKOUT.ORDER.COMPLETED') {
                const resource = req.body.resource;
                buyerEmail = resource.payer?.email_address;
                amount = parseFloat(resource.purchase_units?.[0]?.amount?.value || 0);
            }
            
            console.log(`💳 Webhook Info: Event=${eventType}, Amount=$${amount}, Email=${buyerEmail}`);
            
        } else if (req.body.payment_status) {
            // ========== IPN FORMAT (CŨ) ==========
            console.log('📡 Processing as PayPal IPN');
            
            // Xác thực PayPal IPN
            const isValid = await verifyPayPalIPN(req.body);
            if (!isValid) {
                console.error('❌ Invalid PayPal IPN');
                return res.status(400).send('Invalid IPN');
            }
            
            const paymentStatus = req.body.payment_status;
            
            if (paymentStatus !== 'Completed') {
                console.log(`⏸️ Payment status is ${paymentStatus}, not processing`);
                return res.status(200).send('Payment not completed');
            }
            
            amount = parseFloat(req.body.mc_gross);
            buyerEmail = req.body.payer_email;
            
            console.log(`💳 IPN Info: Status=${paymentStatus}, Amount=$${amount}, Email=${buyerEmail}`);
            
        } else {
            console.error('❌ Unknown payload format');
            return res.status(400).send('Unknown payload format');
        }
        
        // ========== XỬ LÝ CHUNG CHO CẢ IPN VÀ WEBHOOKS ==========
        
        if (!buyerEmail || !amount) {
            console.error('❌ Missing email or amount');
            return res.status(400).send('Missing required data');
        }
        
        // Xác định gói license dựa trên số tiền
        packageInfo = null;
        for (const [price, info] of Object.entries(LICENSE_PACKAGES)) {
            if (Math.abs(amount - parseFloat(price)) < 0.01) {
                packageInfo = info;
                break;
            }
        }
        
        if (!packageInfo) {
            console.error(`❌ Unknown amount: $${amount}`);
            return res.status(400).send('Unknown amount');
        }
        
        console.log(`📦 Package: ${packageInfo.name} (${packageInfo.days} days)`);
        
        // Tạo license key
        const licenseKey = generateLicenseKey(packageInfo.days);
        console.log(`🔑 Generated license key: ${licenseKey}`);
        
        // Gửi email
        await sendLicenseEmail(buyerEmail, licenseKey, packageInfo.days, amount, packageInfo.name);
        console.log(`✅ Notification processed successfully`);
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Error processing notification:', error);
        res.status(500).send('Internal server error');
    }
});
// Endpoint nhận PayPal Webhooks (mới - hiện đại hơn IPN)
app.post('/webhook/paypal-v2', async (req, res) => {
    try {
        console.log('📨 Received PayPal Webhook v2:', JSON.stringify(req.body, null, 2));
        
        // Lấy event type
        const eventType = req.body.event_type;
        
        // Chỉ xử lý các event liên quan đến payment completed
        const validEvents = [
            'PAYMENT.CAPTURE.COMPLETED',
            'PAYMENT.SALE.COMPLETED',
            'CHECKOUT.ORDER.COMPLETED'
        ];
        
        if (!validEvents.includes(eventType)) {
            console.log(`⏸️ Event type ${eventType} not handled`);
            return res.status(200).send('Event type not handled');
        }
        
        // Lấy thông tin từ webhook payload
        let buyerEmail, amount;
        
        // PAYMENT.CAPTURE.COMPLETED format
        if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            const resource = req.body.resource;
            buyerEmail = resource.payer?.email_address || resource.payer?.payer_info?.email;
            amount = parseFloat(resource.amount?.value || 0);
        }
        // PAYMENT.SALE.COMPLETED format
        else if (eventType === 'PAYMENT.SALE.COMPLETED') {
            const resource = req.body.resource;
            buyerEmail = resource.payer?.payer_info?.email;
            amount = parseFloat(resource.amount?.total || 0);
        }
        // CHECKOUT.ORDER.COMPLETED format
        else if (eventType === 'CHECKOUT.ORDER.COMPLETED') {
            const resource = req.body.resource;
            buyerEmail = resource.payer?.email_address;
            amount = parseFloat(resource.purchase_units?.[0]?.amount?.value || 0);
        }
        
        console.log(`💳 Webhook Info: Event=${eventType}, Amount=$${amount}, Email=${buyerEmail}`);
        
        if (!buyerEmail || !amount) {
            console.error('❌ Missing email or amount in webhook');
            return res.status(400).send('Missing required data');
        }
        
        // Xác định gói license dựa trên số tiền
        let packageInfo = null;
        for (const [price, info] of Object.entries(LICENSE_PACKAGES)) {
            if (Math.abs(amount - parseFloat(price)) < 0.01) {
                packageInfo = info;
                break;
            }
        }
        
        if (!packageInfo) {
            console.error(`❌ Unknown amount: $${amount}`);
            return res.status(400).send('Unknown amount');
        }
        
        console.log(`📦 Package: ${packageInfo.name} (${packageInfo.days} days)`);
        
        // Tạo license key
        const licenseKey = generateLicenseKey(packageInfo.days);
        console.log(`🔑 Generated license key: ${licenseKey}`);
        
        // Gửi email
        await sendLicenseEmail(buyerEmail, licenseKey, packageInfo.days, amount, packageInfo.name);
        console.log(`✅ Webhook processed successfully`);
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        res.status(500).send('Internal server error');
    }
});

// Hàm xác thực PayPal IPN
async function verifyPayPalIPN(ipnData) {
    const https = require('https');
    
    // Thêm cmd=_notify-validate
    const verifyData = { cmd: '_notify-validate', ...ipnData };
    const postData = new URLSearchParams(verifyData).toString();
    
    // Sử dụng sandbox hoặc production URL
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

// Endpoint để test tạo key thủ công
app.post('/generate-key', async (req, res) => {
    try {
        const { email, validDays, amount } = req.body;
        
        if (!email || !validDays || !amount) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                required: ['email', 'validDays', 'amount']
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        
        // Xác định package name
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

// Endpoint nhận thông báo từ frontend khi payment success
app.post('/payment-success', async (req, res) => {
    try {
        const { orderID, email, plan, amount } = req.body;
        console.log(`💳 Payment success notification: Order=${orderID}, Email=${email}, Plan=${plan}`);
        
        // PayPal IPN sẽ tự động xử lý việc tạo và gửi key
        // Endpoint này chỉ để log
        
        res.json({ 
            success: true, 
            message: 'Payment notification received. License key will be sent via email shortly.' 
        });
    } catch (error) {
        console.error('❌ Error processing payment notification:', error);
        res.status(500).json({ error: 'Failed to process notification' });
    }
});

// Endpoint để kiểm tra package info
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

// Endpoint test email (chỉ dùng cho development)
app.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
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

// Error handling middleware
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
        availableEndpoints: {
            root: '/',
            purchase: '/purchase',
            generateKey: '/generate-key',
            webhook: '/webhook/paypal',
            packages: '/packages'
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log(`🔧 BIM9 Pipes License Generator API`);
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log('📦 Available Packages:');
    Object.entries(LICENSE_PACKAGES).forEach(([price, info]) => {
        console.log(`   💰 $${price} → ${info.name} (${info.days} days)`);
    });
    console.log('🎯 Endpoints:');
    console.log(`   GET  / - API status`);
    console.log(`   GET  /purchase - Purchase page`);
    console.log(`   GET  /packages - List packages`);
    console.log(`   POST /generate-key - Manual key generation`);
    console.log(`   POST /webhook/paypal - PayPal IPN handler`);
    console.log('========================================');
});
