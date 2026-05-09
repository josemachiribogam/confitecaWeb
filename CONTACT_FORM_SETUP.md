# Contact Form Setup Guide
## Google Sheets + Email Integration

This guide will help you set up the contact form to:
1. Save submissions to a Google Sheet (as a database)
2. Send formatted email notifications to support@confiteca.com

---

## Step 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it: `Confiteca Contact Form Submissions`
4. In Row 1, add these headers (in order):

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Inquiry Type | First Name | Last Name | Email | Phone | Company | Country | Message | Language | Page URL |

5. Keep this sheet open - you'll need the Sheet ID from the URL

---

## Step 2: Create the Google Apps Script

1. Go to [Google Apps Script](https://script.google.com)
2. Click **New Project**
3. Name it: `Confiteca Contact Form Handler`
4. Delete any existing code and paste the following:

```javascript
// =====================================================
// CONFITECA CONTACT FORM HANDLER
// Saves to Google Sheet + Sends Email Notification
// =====================================================

// CONFIGURATION - Update these values
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Get from sheet URL
const SHEET_NAME = 'Sheet1'; // Or rename your sheet
const NOTIFICATION_EMAIL = 'support@confiteca.com';

// Handle POST requests from the contact form
function doPost(e) {
  try {
    // Get data from URL-encoded form submission
    const data = e.parameter;
    
    // Save to Google Sheet
    saveToSheet(data);
    
    // Send email notification
    sendEmailNotification(data);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Form submitted successfully' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Log error and return error response
    console.error('Error processing form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle GET requests (for testing)
function doGet(e) {
  return ContentService
    .createTextOutput('Confiteca Contact Form Handler is running!')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Save form data to Google Sheet
function saveToSheet(data) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  
  // Format timestamp
  const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
  const formattedTimestamp = Utilities.formatDate(timestamp, 'America/Guayaquil', 'yyyy-MM-dd HH:mm:ss');
  
  // Prepare row data (must match header order)
  const rowData = [
    formattedTimestamp,
    data.inquiry || '',
    data.firstName || '',
    data.lastName || '',
    data.email || '',
    data.phone || '',
    data.company || '',
    data.country || '',
    data.message || '',
    data.language || '',
    data.page_url || ''
  ];
  
  // Append row to sheet
  sheet.appendRow(rowData);
}

// Send formatted email notification
function sendEmailNotification(data) {
  const inquiryLabels = {
    'business': '💼 Business Inquiry',
    'distribution': '🚚 Distribution',
    'press': '📰 Press/Media',
    'careers': '⭐ Careers',
    'feedback': '💬 Feedback',
    'other': '✨ Other'
  };
  
  const countryNames = {
    'EC': 'Ecuador',
    'CO': 'Colombia',
    'PE': 'Peru',
    'MX': 'Mexico',
    'US': 'United States',
    'ES': 'Spain',
    'other': 'Other'
  };
  
  const inquiryType = inquiryLabels[data.inquiry] || data.inquiry || 'General Inquiry';
  const country = countryNames[data.country] || data.country || 'Not specified';
  const language = data.language === 'es' ? 'Spanish' : 'English';
  
  const subject = `🍬 New Contact Form: ${inquiryType} from ${data.firstName} ${data.lastName}`;
  
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #e63946, #ff006e); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">${inquiryType}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">
        
        <!-- Contact Info Card -->
        <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px; border-bottom: 2px solid #e63946; padding-bottom: 10px;">👤 Contact Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 120px;">Name:</td>
              <td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">${data.firstName || ''} ${data.lastName || ''}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Email:</td>
              <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #e63946; text-decoration: none;">${data.email || 'Not provided'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Phone:</td>
              <td style="padding: 8px 0; color: #1a1a1a;">${data.phone || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Company:</td>
              <td style="padding: 8px 0; color: #1a1a1a;">${data.company || 'Not provided'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Country:</td>
              <td style="padding: 8px 0; color: #1a1a1a;">${country}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Language:</td>
              <td style="padding: 8px 0; color: #1a1a1a;">${language}</td>
            </tr>
          </table>
        </div>
        
        <!-- Message Card -->
        <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px; border-bottom: 2px solid #e63946; padding-bottom: 10px;">💬 Message</h2>
          <p style="color: #1a1a1a; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message || 'No message provided'}</p>
        </div>
        
      </div>
      
      <!-- Footer -->
      <div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          Submitted on ${new Date(data.timestamp || Date.now()).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
        <p style="color: #666; margin: 10px 0 0; font-size: 11px;">
          This email was sent from the Confiteca website contact form
        </p>
      </div>
      
    </div>
  `;
  
  const plainBody = `
NEW CONTACT FORM SUBMISSION
============================

Type: ${inquiryType}

CONTACT INFORMATION
-------------------
Name: ${data.firstName || ''} ${data.lastName || ''}
Email: ${data.email || 'Not provided'}
Phone: ${data.phone || 'Not provided'}
Company: ${data.company || 'Not provided'}
Country: ${country}
Language: ${language}

MESSAGE
-------
${data.message || 'No message provided'}

---
Submitted: ${new Date(data.timestamp || Date.now()).toLocaleString()}
  `;
  
  // Send the email
  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    replyTo: data.email || NOTIFICATION_EMAIL
  });
}

// Test function - run this to test the sheet connection
function testSheetConnection() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    console.log('✅ Successfully connected to sheet: ' + sheet.getName());
    console.log('📊 Current rows: ' + sheet.getLastRow());
  } catch (error) {
    console.error('❌ Error connecting to sheet: ' + error);
  }
}

// Test function - run this to test email sending
function testEmailNotification() {
  const testData = {
    inquiry: 'business',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+1 555 123 4567',
    company: 'Test Company',
    country: 'EC',
    message: 'This is a test message from the contact form setup.',
    language: 'en',
    timestamp: new Date().toISOString(),
    page_url: 'https://confiteca.com/en/contact.html'
  };
  
  sendEmailNotification(testData);
  console.log('✅ Test email sent to: ' + NOTIFICATION_EMAIL);
}
```

---

## Step 3: Configure the Script

1. In the script, update these values at the top:

```javascript
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
```

**To get your Sheet ID:**
- Open your Google Sheet
- Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_IS_HERE/edit`
- Copy the long string between `/d/` and `/edit`

2. Update the notification email if needed:
```javascript
const NOTIFICATION_EMAIL = 'support@confiteca.com';
```

---

## Step 4: Deploy the Script

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" → Choose **Web app**
3. Configure:
   - **Description**: `Confiteca Contact Form v1`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone`
4. Click **Deploy**
5. Click **Authorize access** and follow the prompts
   - You may see "Google hasn't verified this app" - click **Advanced** → **Go to [project name] (unsafe)**
   - This is normal for personal scripts
6. **Copy the Web app URL** - it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## Step 5: Update the Contact Forms

1. Open `en/contact.html`
2. Find this line near the bottom:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
   ```
3. Replace with your actual Web app URL:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```

4. Do the same for `es/contact.html`

---

## Step 6: Test Everything

1. **Test the Sheet connection:**
   - In Apps Script, run `testSheetConnection()` from the dropdown
   - Check the Execution log for success

2. **Test email sending:**
   - Run `testEmailNotification()`
   - Check your email for the test message

3. **Test the form:**
   - Open the contact page
   - Submit a test entry
   - Verify it appears in the Google Sheet
   - Verify the email arrives

---

## Troubleshooting

### Form submits but no data in sheet
- Check the Sheet ID is correct
- Make sure the sheet tab is named "Sheet1" (or update SHEET_NAME)
- Check Apps Script execution logs for errors

### No email received
- Check spam folder
- Verify NOTIFICATION_EMAIL is correct
- Check Apps Script quota (free tier: 100 emails/day)

### CORS errors in browser
- This is normal with `mode: 'no-cors'`
- The submission should still work

### "Authorization required" error
- Re-deploy the script
- Make sure "Anyone" has access

---

## Daily Limits (Free Google Account)

- **Email**: 100 emails/day
- **Script runtime**: 6 minutes per execution
- **Sheet operations**: 20,000/day

For higher volumes, consider Google Workspace or a dedicated form service.

---

## Security Notes

- The script URL is public but only accepts POST data
- Consider adding validation for required fields
- The Sheet should be private (only you and authorized users)
- Form data is transmitted over HTTPS

---

Need help? Contact your web developer or email support@confiteca.com
