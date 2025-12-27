const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Encryption key (giữ nguyên)
const ENCRYPTION_KEY = '3UYpfxVBCBptt3LL8iLhBzrOw3U0Nl7xtvNUm6eRAbE=';
const UNIQUE_IDENTIFIER = 'f935afbe-7b90-4006-a557-8fad4007ef63';

// Cấu hình các gói license
const LICENSE_PACKAGES = {
    '9.9': { days: 30, name: 'Monthly' },
    '27': { days: 90, name: '3-Month' },
    '51': { days: 180, name: '6-Month' },
    '90': { days: 360, name: 'Annual' }
};

// === RESEND TRANSFORTER – HOẠT ĐỘNG NGAY TRÊN RENDER ===
const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 587,
    secure: false,
    auth: {
        user: 'resend', // cố định
        pass: process.env.RESEND_API_KEY // API key từ Resend
    }
});

// Test connection on startup
transporter.verify(function(error, success) {
    if (error) {
        console.error('❌ Resend configuration error:', error);
    } else {
        console.log('✅ Resend email server is ready!');
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

// Hàm gửi email – dùng email từ form (custom_id) làm ưu tiên
async function sendLicenseEmail(customerEmail, licenseKey, validDays, amount, packageName) {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + validDays);
    const expDateFormatted = expirationDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    const mailOptions = {
        from: 'BIM9 Pipes <license@bim9pipes.com>', // Có thể thay bằng verified domain trên Resend
        to: customerEmail,
        subject: '🎉 Your BIM9 Pipes License Key - Ready to Activate!',
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
            <tr><td>📧 Delivery Email</td><td>${customerEmail}</td></tr>
        </table>
        <h3 style="color: #667eea;">🚀 Activation Instructions:</h3>
        <ol>
            <li>Open Autodesk Revit</li>
            <li>Launch BIM9 Pipes from the Add-ins tab</li>
            <li>Paste the license key above and click "Activate"</li>
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
        console.log(`✅ License email sent successfully to: ${customerEmail}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email via Resend:', error);
        throw error;
    }
}

// Health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'BIM9 Pipes License API v3 - Using Resend',
        email_provider: 'Resend.com',
        packages: LICENSE_PACKAGES
    });
});

app.get('/purchase', (req, res) => {
    res.sendFile(path.join(__dirname, 'purchase.html'));
});

// Webhook PayPal – Cải thiện mạnh mẽ việc lấy email
app.post('/webhook/paypal', async (req, res) => {
    try {
        console.log('📨 ========== PAYPAL WEBHOOK RECEIVED ==========');
        console.log('Full payload:', JSON.stringify(req.body, null, 2));

        let customerEmail = null;
        let amount = 0;
        let packageInfo = null;

        if (!req.body.event_type) {
            console.error('❌ Not a webhook v2 format');
            return res.status(400).json({ error: 'Invalid webhook format' });
        }

        const eventType = req.body.event_type;
        const validEvents = [
            'PAYMENT.CAPTURE.COMPLETED',
            'PAYMENT.CAPTURE.PENDING',
            'CHECKOUT.ORDER.COMPLETED',
            'CHECKOUT.ORDER.APPROVED'
        ];

        if (!validEvents.includes(eventType)) {
            console.log(`⏸️ Ignored event: ${eventType}`);
            return res.status(200).json({ status: 'ignored_event' });
        }

        const resource = req.body.resource;

        // ====== BƯỚC 1: Ưu tiên lấy email từ FORM (custom_id) – Đây là email khách nhập trên trang purchase.html ======
        if (resource.purchase_units && resource.purchase_units[0] && resource.purchase_units[0].custom_id) {
            const customId = resource.purchase_units[0].custom_id.trim();
            if (customId && customId.includes('@') && customId.length > 5) {
                customerEmail = customId;
                console.log(`✅ Email taken from form (custom_id): ${customerEmail}`);
            }
        }

        // ====== BƯỚC 2: Nếu không có → lấy từ PayPal account (có nhiều vị trí khác nhau) ======
        if (!customerEmail) {
            const possibleEmails = [
                resource.payer?.email_address,
                resource.payer?.payer_info?.email,
                resource.payer?.email,
                resource.payee?.email_address,
                // Một số trường hợp sandbox cũ
                resource.payer?.email_address,
                // Trong trường hợp checkout order
                resource.purchase_units?.[0]?.payee?.email_address
            ];

            for (const email of possibleEmails) {
                if (typeof email === 'string' && email.trim().includes('@') && email.trim().length > 5) {
                    customerEmail = email.trim();
                    console.log(`✅ Email taken from PayPal account: ${customerEmail}`);
                    break;
                }
            }
        }

        // ====== BƯỚC 3: Nếu vẫn không có → báo lỗi rõ ràng ======
        if (!customerEmail) {
            console.error('❌ No valid email found in any field');
            console.error('Available fields:', JSON.stringify(resource, null, 2));
            return res.status(400).json({ 
                error: 'No valid customer email found',
                tip: 'Check if email was entered in purchase form or PayPal account has email'
            });
        }

        // ====== Lấy amount ======
        amount = parseFloat(
            resource.purchase_units?.[0]?.amount?.value ||
            resource.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ||
            resource.amount?.value ||
            0
        );

        if (!amount || amount <= 0) {
            console.error('❌ Invalid amount:', amount);
            return res.status(400).json({ error: 'Invalid payment amount' });
        }

        // ====== Xác định gói license ======
        packageInfo = Object.entries(LICENSE_PACKAGES).find(([price]) => 
            Math.abs(amount - parseFloat(price)) < 0.1 // cho phép sai lệch nhỏ do phí PayPal
        )?.[1];

        if (!packageInfo) {
            console.error(`❌ Unknown amount: $${amount}`);
            return res.status(400).json({ error: 'Unknown license package' });
        }

        // ====== Tạo và gửi license key ======
        const licenseKey = generateLicenseKey(packageInfo.days);
        console.log(`🔑 License key generated for ${customerEmail} - ${packageInfo.name}`);

        await sendLicenseEmail(customerEmail, licenseKey, packageInfo.days, amount, packageInfo.name);

        console.log(`✅ SUCCESS: License sent to ${customerEmail}`);

        return res.status(200).json({
            success: true,
            email_sent_to: customerEmail,
            package: packageInfo.name,
            amount: amount
        });

    } catch (error) {
        console.error('❌ Webhook processing error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

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
    console.log('🚀 BIM9 Pipes License API v3 (Resend)');
    console.log(`📡 Running on port ${PORT}`);
    console.log('✅ Email delivery via Resend – Works on Render.com!');
});
