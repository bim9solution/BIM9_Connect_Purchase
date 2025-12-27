# 🔧 BIM9 Pipes License Generator v2.3

Automatic license key generator with PayPal integration and Resend email delivery.

## ✨ Features

- ✅ **4 License Packages**: Monthly, 3-Month, 6-Month, Annual
- ✅ **PayPal Integration**: Webhooks v2 + IPN support
- ✅ **Resend Email**: Professional email delivery (recommended for production)
- ✅ **Gmail Support**: Alternative for testing/development
- ✅ **Automatic License Generation**: Keys generated and sent automatically
- ✅ **Email Priority System**: Uses customer-entered email from purchase form
- ✅ **Secure Key Encryption**: HMAC-SHA256 signature
- ✅ **Beautiful Email Templates**: Professional HTML emails

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- PayPal Developer Account
- Resend Account (recommended) OR Gmail Account

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Email Provider (choose one)
EMAIL_PROVIDER=resend

# Resend Configuration (RECOMMENDED)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OR Gmail Configuration (for testing)
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your-app-password

# PayPal Configuration
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your-client-id
```

### 3. Start the Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3000`

## 📧 Email Provider Setup

### Option 1: Resend (RECOMMENDED for Production)

**Why Resend?**
- ✅ Better deliverability than Gmail
- ✅ No daily sending limits
- ✅ Professional email infrastructure
- ✅ Simple API
- ✅ Free tier: 3,000 emails/month

**Setup Steps:**

1. **Sign up** at [resend.com](https://resend.com)

2. **Verify your domain:**
   - Go to Domains → Add Domain
   - Add the provided DNS records to your domain
   - Wait for verification (usually 5-10 minutes)

3. **Create API Key:**
   - Go to API Keys → Create API Key
   - Copy the key (starts with `re_`)

4. **Configure `.env`:**
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

5. **Test:**
   ```bash
   curl -X POST http://localhost:3000/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@example.com"}'
   ```

### Option 2: Gmail (for Testing/Development)

**Setup Steps:**

1. **Enable 2-Step Verification:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Copy the 16-character password (no spaces!)

3. **Configure `.env`:**
   ```env
   EMAIL_PROVIDER=gmail
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   ```

4. **Test:**
   ```bash
   curl -X POST http://localhost:3000/test-email \
     -H "Content-Type: application/json" \
     -d '{"email":"your-test-email@example.com"}'
   ```

**Gmail Limitations:**
- ⚠️ 500 emails/day limit
- ⚠️ May be marked as spam
- ⚠️ Not recommended for production

## 💳 PayPal Setup

### 1. Create PayPal App

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Create an app:
   - **Sandbox** for testing
   - **Live** for production
3. Copy **Client ID** and **Secret**

### 2. Configure Purchase Page

Edit `purchase.html` and update the PayPal SDK script:

```html
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>
```

### 3. Set Up Webhooks

1. Go to [Webhooks](https://developer.paypal.com/dashboard/webhooks)
2. Create Webhook:
   - **URL**: `https://yourdomain.com/webhook/paypal`
   - **Events**: Select all payment-related events:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.SALE.COMPLETED`
     - `CHECKOUT.ORDER.COMPLETED`
     - `CHECKOUT.ORDER.APPROVED`

### 4. Configure `.env`

```env
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_SECRET=your-secret
```

## 🏗️ Project Structure

```
bim9-pipes-license-generator/
├── server.js              # Main server file
├── purchase.html          # Purchase page with PayPal buttons
├── package.json           # Dependencies
├── .env                   # Environment variables (create this)
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🔌 API Endpoints

### GET /
Health check and API information

```bash
curl http://localhost:3000
```

### GET /purchase
Serve the purchase page

```bash
curl http://localhost:3000/purchase
```

### POST /webhook/paypal
PayPal webhook handler (automatically called by PayPal)

Handles:
- PayPal Webhooks v2
- PayPal IPN (legacy)
- Extracts email from `custom_id` (user-entered email)
- Generates license key
- Sends email automatically

### POST /test-email
Test email sending

```bash
curl -X POST http://localhost:3000/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### POST /generate-key
Manually generate a license key

```bash
curl -X POST http://localhost:3000/generate-key \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "validDays": 30,
    "amount": 9.9
  }'
```

### GET /packages
Get available license packages

```bash
curl http://localhost:3000/packages
```

## 📦 License Packages

| Package | Price | Duration | Savings |
|---------|-------|----------|---------|
| Monthly | $9.90 | 30 days | - |
| 3-Month | $27.00 | 90 days | $2.70 |
| 6-Month | $51.00 | 180 days | $8.40 |
| Annual | $90.00 | 360 days | $28.80 |

## 🔐 Security Features

- **HMAC-SHA256 Signature**: License keys are cryptographically signed
- **Expiration Date**: Built into license key
- **Email Validation**: Validates email format before processing
- **PayPal IPN Verification**: Verifies webhooks from PayPal
- **Environment Variables**: Sensitive data stored securely

## 🧪 Testing

### Test Email Delivery

```bash
# Test Resend
curl -X POST http://localhost:3000/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

### Test License Generation

```bash
# Generate a 30-day license
curl -X POST http://localhost:3000/generate-key \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","validDays":30,"amount":9.9}'
```

### Test PayPal Integration

1. Use PayPal Sandbox credentials
2. Make a test purchase on `/purchase`
3. Check server logs for webhook processing
4. Verify email delivery

## 📝 How It Works

### Purchase Flow

1. **Customer visits** `/purchase` page
2. **Enters email** in the form
3. **Clicks PayPal button** for desired package
4. **Completes payment** on PayPal
5. **PayPal sends webhook** to `/webhook/paypal` with `custom_id` (customer email)
6. **Server receives webhook**:
   - Extracts email from `custom_id` (priority) or PayPal account
   - Validates payment amount
   - Determines license package
   - Generates license key with expiration date
   - Sends email via Resend/Gmail
7. **Customer receives email** with license key within 2-5 minutes

### Email Priority System

The system uses a smart email extraction priority:

1. **Priority 1**: `custom_id` from purchase form (most reliable!)
   - This is the email the customer entered
   - Set in PayPal button's `custom_id` field
2. **Priority 2**: PayPal account email
   - Fallback if `custom_id` not available

This ensures customers receive emails at their preferred address.

## 🚀 Deployment

### Deploy to Railway

1. **Create Railway account**: [railway.app](https://railway.app)

2. **Create new project** from GitHub repo

3. **Add environment variables**:
   ```
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   PAYPAL_MODE=live
   PAYPAL_CLIENT_ID=xxx
   PORT=3000
   ```

4. **Deploy** and get your URL

5. **Update PayPal webhook URL** to your Railway URL

### Deploy to Heroku

```bash
# Install Heroku CLI
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set EMAIL_PROVIDER=resend
heroku config:set RESEND_API_KEY=re_xxx
heroku config:set RESEND_FROM_EMAIL=noreply@yourdomain.com
heroku config:set PAYPAL_MODE=live
heroku config:set PAYPAL_CLIENT_ID=xxx

# Deploy
git push heroku main

# View logs
heroku logs --tail
```

## 🔧 Troubleshooting

### Email Not Sending

**Resend:**
- ✅ Check API key is correct
- ✅ Verify domain in Resend dashboard
- ✅ Check `RESEND_FROM_EMAIL` uses verified domain
- ✅ Check Resend dashboard for error logs

**Gmail:**
- ✅ Enable 2-Step Verification
- ✅ Use App Password (not regular password)
- ✅ Check for typos in credentials
- ✅ Try different Gmail account

### PayPal Webhook Not Working

- ✅ Check webhook URL is publicly accessible
- ✅ Verify webhook events are subscribed
- ✅ Check server logs for incoming requests
- ✅ Ensure `custom_id` is set in PayPal button
- ✅ Test with PayPal Sandbox first

### License Key Not Received

- ✅ Check spam folder
- ✅ Verify email address is correct
- ✅ Check server logs for errors
- ✅ Test with `/test-email` endpoint
- ✅ Verify PayPal webhook was received

### Server Logs

Check logs for detailed debugging:

```bash
# Development
npm run dev

# Production
npm start

# View last 100 lines
tail -f -n 100 logs.txt
```

## 📊 Monitoring

The server provides detailed logging:

- ✅ **Email sent successfully**: Confirms email delivery
- ⚠️ **Email configuration error**: Check credentials
- 📨 **Received PayPal notification**: Webhook received
- 💰 **Processing payment**: Payment being processed
- 🔑 **Generated license key**: Key created
- ❌ **Error messages**: Debug information

## 🆘 Support

For issues or questions:

- **Email**: support@bim9pipes.com
- **Documentation**: Check this README
- **Logs**: Enable detailed logging in server

## 📜 License

ISC License - See LICENSE file for details

## 🎉 Credits

- **BIM9 Pipes Team**
- **PayPal API**
- **Resend Email Service**
- **Node.js & Express**

---

**Version**: 2.3.0  
**Last Updated**: December 2025  
**Powered by**: Resend + PayPal + Node.js
