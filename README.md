# 🔧 BIM9 Pipes License Generator

Automatic license key generator with PayPal integration for BIM9 Pipes Revit add-in.

## 📦 Features

- ✅ **4 License Packages**: Monthly, 3-Month, 6-Month, and Annual
- ✅ **Automatic Key Generation**: HMAC-SHA256 signed license keys
- ✅ **Email Delivery**: Beautiful HTML emails with activation instructions
- ✅ **PayPal Integration**: Secure payment processing with IPN
- ✅ **Real-time Validation**: Email and payment verification
- ✅ **Professional UI**: Responsive purchase page

## 💰 License Packages

| Package | Duration | Price | Price/Day | Savings |
|---------|----------|-------|-----------|---------|
| Monthly | 30 days | $9.90 | $0.33 | - |
| 3-Month | 90 days | $27.00 | $0.30 | $2.70 |
| 6-Month | 180 days | $51.00 | $0.28 | $8.40 |
| Annual | 360 days | $90.00 | $0.25 | $28.80 |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Gmail account with App Password
- PayPal Business account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/bim9-pipes-license-generator.git
cd bim9-pipes-license-generator
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. **Start the server**
```bash
npm start
```

5. **Access the application**
- API: http://localhost:3000
- Purchase Page: http://localhost:3000/purchase

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
PAYPAL_MODE=sandbox
```

### Gmail App Password

1. Go to https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Go to https://myaccount.google.com/apppasswords
4. Create an App Password for "Mail"
5. Copy the 16-character password to `EMAIL_PASS`

### PayPal Configuration

1. Log in to PayPal Developer: https://developer.paypal.com
2. Create a REST API app
3. Get Client ID and Secret
4. Update `purchase.html` with your Client ID:
   ```html
   <script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
   ```

## 📡 API Endpoints

### GET /
Health check and API information
```bash
curl http://localhost:3000/
```

### GET /purchase
Purchase page with all license packages

### GET /packages
List all available packages
```bash
curl http://localhost:3000/packages
```

### POST /generate-key
Manual license key generation (for testing)
```bash
curl -X POST http://localhost:3000/generate-key \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "validDays": 30,
    "amount": 9.9
  }'
```

### POST /webhook/paypal
PayPal IPN webhook handler (automatically called by PayPal)

### POST /test-email
Send a test email (development only)
```bash
curl -X POST http://localhost:3000/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## 🌐 Deploy to Render.com

### Step 1: Prepare Repository

1. Create a new GitHub repository
2. Upload these files:
   - `server.js`
   - `package.json`
   - `purchase.html`
   - `.env.example`
   - `.gitignore`
   - `README.md`

### Step 2: Create Web Service on Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `bim9-pipes-license-generator`
   - **Region**: Singapore (or closest to you)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Add Environment Variables

In Render Dashboard, add:
- `EMAIL_USER` = your-email@gmail.com
- `EMAIL_PASS` = your-app-password
- `PAYPAL_MODE` = sandbox (or live)

### Step 4: Deploy

- Click "Create Web Service"
- Wait 2-5 minutes for deployment
- Your URL: `https://bim9-pipes-license-generator.onrender.com`

### Step 5: Configure PayPal IPN

1. Go to PayPal Business Account
2. Settings → Notifications → IPN
3. Set IPN URL:
   ```
   https://bim9-pipes-license-generator.onrender.com/webhook/paypal
   ```

## 🧪 Testing

### Test with Postman

1. **Generate Key Manually**
   - Method: POST
   - URL: `http://localhost:3000/generate-key`
   - Body (JSON):
   ```json
   {
     "email": "test@example.com",
     "validDays": 30,
     "amount": 9.9
   }
   ```

2. **Test Email**
   - Method: POST
   - URL: `http://localhost:3000/test-email`
   - Body (JSON):
   ```json
   {
     "email": "your-email@example.com"
   }
   ```

### Test with PayPal Sandbox

1. Create sandbox accounts at https://developer.paypal.com
2. Use IPN Simulator to test webhook
3. Or complete a test transaction on `/purchase` page

## 📧 Email Template

The system sends beautiful HTML emails with:
- ✅ Professional design
- ✅ Clear license key display
- ✅ Activation instructions
- ✅ Package information
- ✅ Expiration date
- ✅ Support contact

## 🔐 Security Features

- ✅ HMAC-SHA256 signature for license keys
- ✅ PayPal IPN verification
- ✅ Email validation
- ✅ Environment variable protection
- ✅ Error handling and logging

## 📝 License Key Format

```
YYYY-MM-DD|UUID|SIGNATURE
Example: 2025-02-25|f935afbe-7b90-4006-a557-8fad4007ef63|AbC123...
```

## 🐛 Troubleshooting

### Email not sending
- Check Gmail App Password is correct (16 characters, no spaces)
- Verify 2-Step Verification is enabled
- Check spam folder

### PayPal webhook not working
- Verify IPN URL is correct (no trailing slash)
- Check Render logs for errors
- Test with IPN Simulator first

### Server "sleeping" on Render Free plan
- Free tier sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Upgrade to Starter plan ($7/month) for 24/7 uptime

## 📊 Monitoring

### View Logs on Render
1. Go to Render Dashboard
2. Click on your service
3. Click "Logs" tab
4. View real-time logs

### Check Email Delivery
- Monitor console logs for email confirmations
- Check for error messages in logs

## 🆘 Support

For questions or issues:
- 📧 Email: support@bim9pipes.com
- 🐛 Issues: GitHub Issues page
- 📚 Docs: This README

## 📄 License

ISC License - See LICENSE file for details

## 🙏 Acknowledgments

- Node.js and Express.js
- Nodemailer for email delivery
- PayPal for payment processing
- Render.com for hosting

---

**Made with ❤️ for BIM9 Pipes users**
