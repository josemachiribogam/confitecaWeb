// =====================================================
// CONFITECA CONTACT FORM HANDLER
// Saves to Google Sheet + Sends Email Notification
// Routes emails based on inquiry type and country
// Saves CV uploads to Google Drive
// =====================================================

// CONFIGURATION
var SHEET_ID = '104007WI6KmxfWqrKHQth_OYbg0GPNSBNOfaKh7ZWO3I';
var SHEET_NAME = 'DB';

// =====================================================
// EMAIL ROUTING MAP
// =====================================================
function getRecipientEmail(inquiry, country) {
  if (inquiry === 'careers') {
    return 'careers@confiteca.com';
  }

  if (inquiry === 'distribution' || inquiry === 'business') {
    if (country === 'EC') return 'distribution@confiteca.com.ec';
    if (country === 'CO') return 'distribution@confiteca.com.co';
    if (country === 'PE') return 'distribution@confiteca.com.pe';
    return 'business@confiteca.com.ec';
  }

  return 'support@confiteca.com';
}

// =====================================================
// HANDLE POST REQUESTS
// =====================================================
function doPost(e) {
  try {
    var data = e.parameter;

    var cvUrl = null;
    if (data.cvData && data.cvFileName) {
      cvUrl = saveCVToDrive(data);
    }

    saveToSheet(data, cvUrl);
    sendEmailNotification(data, cvUrl);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Form submitted successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error processing form:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Confiteca Contact Form Handler is running!')
    .setMimeType(ContentService.MimeType.TEXT);
}

// =====================================================
// SAVE TO GOOGLE SHEET
// =====================================================
function saveToSheet(data, cvUrl) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

  var timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
  var formattedTimestamp = Utilities.formatDate(timestamp, 'America/Guayaquil', 'yyyy-MM-dd HH:mm:ss');

  var recipientEmail = getRecipientEmail(data.inquiry, data.country);

  var rowData = [
    formattedTimestamp,
    data.inquiry || '',
    data.firstName || '',
    data.lastName || '',
    data.email || '',
    data.phone || '',
    data.company || '',
    data.country || '',
    data.region || '',
    data.careerInterest || '',
    data.message || '',
    data.language || '',
    data.page_url || '',
    recipientEmail,
    cvUrl || ''
  ];

  sheet.appendRow(rowData);
}

// =====================================================
// CV / RESUME FILE HANDLING
// =====================================================
function saveCVToDrive(data) {
  if (!data.cvData || !data.cvFileName) return null;

  try {
    var fileBlob = Utilities.newBlob(
      Utilities.base64Decode(data.cvData),
      getMimeType(data.cvFileName),
      data.cvFileName
    );

    var folders = DriveApp.getFoldersByName('Confiteca Contact Form CVs');
    var folder = folders.hasNext()
      ? folders.next()
      : DriveApp.createFolder('Confiteca Contact Form CVs');

    var dateStr = Utilities.formatDate(new Date(), 'America/Guayaquil', 'yyyy-MM-dd');
    var fileName = dateStr + '_' + (data.firstName || '') + '_' + (data.lastName || '') + '_' + data.cvFileName;
    var file = folder.createFile(fileBlob.setName(fileName));

    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (error) {
    console.error('Error saving CV to Drive:', error);
    return null;
  }
}

function getMimeType(filename) {
  var ext = filename.split('.').pop().toLowerCase();
  var mimeTypes = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// =====================================================
// COUNTRY NAME LOOKUP
// =====================================================
function getCountryName(code) {
  var names = {
    'AF': 'Afghanistan',
    'AL': 'Albania',
    'DZ': 'Algeria',
    'AR': 'Argentina',
    'AM': 'Armenia',
    'AU': 'Australia',
    'AT': 'Austria',
    'AZ': 'Azerbaijan',
    'BS': 'Bahamas',
    'BH': 'Bahrain',
    'BD': 'Bangladesh',
    'BB': 'Barbados',
    'BY': 'Belarus',
    'BE': 'Belgium',
    'BZ': 'Belize',
    'BO': 'Bolivia',
    'BA': 'Bosnia and Herzegovina',
    'BR': 'Brazil',
    'BG': 'Bulgaria',
    'KH': 'Cambodia',
    'CM': 'Cameroon',
    'CA': 'Canada',
    'CL': 'Chile',
    'CN': 'China',
    'CO': 'Colombia',
    'CR': 'Costa Rica',
    'HR': 'Croatia',
    'CU': 'Cuba',
    'CY': 'Cyprus',
    'CZ': 'Czech Republic',
    'DK': 'Denmark',
    'DO': 'Dominican Republic',
    'EC': 'Ecuador',
    'EG': 'Egypt',
    'SV': 'El Salvador',
    'EE': 'Estonia',
    'ET': 'Ethiopia',
    'FI': 'Finland',
    'FR': 'France',
    'GE': 'Georgia',
    'DE': 'Germany',
    'GH': 'Ghana',
    'GR': 'Greece',
    'GT': 'Guatemala',
    'HT': 'Haiti',
    'HN': 'Honduras',
    'HK': 'Hong Kong',
    'HU': 'Hungary',
    'IS': 'Iceland',
    'IN': 'India',
    'ID': 'Indonesia',
    'IR': 'Iran',
    'IQ': 'Iraq',
    'IE': 'Ireland',
    'IL': 'Israel',
    'IT': 'Italy',
    'JM': 'Jamaica',
    'JP': 'Japan',
    'JO': 'Jordan',
    'KZ': 'Kazakhstan',
    'KE': 'Kenya',
    'KW': 'Kuwait',
    'LV': 'Latvia',
    'LB': 'Lebanon',
    'LT': 'Lithuania',
    'LU': 'Luxembourg',
    'MY': 'Malaysia',
    'MV': 'Maldives',
    'MT': 'Malta',
    'MX': 'Mexico',
    'MD': 'Moldova',
    'MA': 'Morocco',
    'NP': 'Nepal',
    'NL': 'Netherlands',
    'NZ': 'New Zealand',
    'NI': 'Nicaragua',
    'NG': 'Nigeria',
    'NO': 'Norway',
    'OM': 'Oman',
    'PK': 'Pakistan',
    'PA': 'Panama',
    'PY': 'Paraguay',
    'PE': 'Peru',
    'PH': 'Philippines',
    'PL': 'Poland',
    'PT': 'Portugal',
    'PR': 'Puerto Rico',
    'QA': 'Qatar',
    'RO': 'Romania',
    'RU': 'Russia',
    'SA': 'Saudi Arabia',
    'SN': 'Senegal',
    'RS': 'Serbia',
    'SG': 'Singapore',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'ZA': 'South Africa',
    'KR': 'South Korea',
    'ES': 'Spain',
    'LK': 'Sri Lanka',
    'SE': 'Sweden',
    'CH': 'Switzerland',
    'TW': 'Taiwan',
    'TH': 'Thailand',
    'TT': 'Trinidad and Tobago',
    'TN': 'Tunisia',
    'TR': 'Turkey',
    'UA': 'Ukraine',
    'AE': 'United Arab Emirates',
    'GB': 'United Kingdom',
    'US': 'United States',
    'UY': 'Uruguay',
    'UZ': 'Uzbekistan',
    'VE': 'Venezuela',
    'VN': 'Vietnam',
    'YE': 'Yemen',
    'ZW': 'Zimbabwe',
    'other': 'Other'
  };
  return names[code] || code || 'Not specified';
}

// =====================================================
// SEND EMAIL NOTIFICATION
// =====================================================
function sendEmailNotification(data, cvUrl) {
  var inquiryLabels = {
    'business': 'Business Inquiry',
    'distribution': 'Distribution',
    'press': 'Press/Media',
    'careers': 'Careers',
    'feedback': 'Feedback',
    'other': 'Other'
  };

  var inquiryType = inquiryLabels[data.inquiry] || data.inquiry || 'General Inquiry';
  var country = getCountryName(data.country);
  var language = data.language === 'es' ? 'Spanish' : 'English';
  var recipientEmail = getRecipientEmail(data.inquiry, data.country);
  var firstName = data.firstName || '';
  var lastName = data.lastName || '';
  var email = data.email || 'Not provided';
  var phone = data.phone || 'Not provided';
  var company = data.company || 'Not provided';
  var message = data.message || 'No message provided';

  var subject = 'New Contact Form: ' + inquiryType + ' from ' + firstName + ' ' + lastName;

  var submittedDate = Utilities.formatDate(
    new Date(data.timestamp || Date.now()),
    'America/Guayaquil',
    'EEEE, MMMM d, yyyy h:mm a'
  );

  // Build conditional table rows
  var regionRow = '';
  if (data.region) {
    regionRow = '<tr>'
      + '<td style="padding: 8px 0; color: #666;">Region/Province:</td>'
      + '<td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">' + data.region + '</td>'
      + '</tr>';
  }

  var careerRow = '';
  if (data.careerInterest) {
    careerRow = '<tr>'
      + '<td style="padding: 8px 0; color: #666;">Area of Interest:</td>'
      + '<td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">' + data.careerInterest + '</td>'
      + '</tr>';
  }

  var cvRow = '';
  if (cvUrl) {
    cvRow = '<tr>'
      + '<td style="padding: 8px 0; color: #666;">CV/Resume:</td>'
      + '<td style="padding: 8px 0;"><a href="' + cvUrl + '" style="color: #e63946; text-decoration: none; font-weight: 600;">View CV in Google Drive</a></td>'
      + '</tr>';
  }

  var htmlBody = '<div style="font-family: Segoe UI, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">'
    + '<div style="background: linear-gradient(135deg, #e63946, #ff006e); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">'
    + '<h1 style="color: white; margin: 0; font-size: 24px;">New Contact Form Submission</h1>'
    + '<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">' + inquiryType + '</p>'
    + '</div>'
    + '<div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none;">'
    + '<div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">'
    + '<h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px; border-bottom: 2px solid #e63946; padding-bottom: 10px;">Contact Information</h2>'
    + '<table style="width: 100%; border-collapse: collapse;">'
    + '<tr><td style="padding: 8px 0; color: #666; width: 140px;">Name:</td><td style="padding: 8px 0; color: #1a1a1a; font-weight: 600;">' + firstName + ' ' + lastName + '</td></tr>'
    + '<tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:' + email + '" style="color: #e63946; text-decoration: none;">' + email + '</a></td></tr>'
    + '<tr><td style="padding: 8px 0; color: #666;">Phone:</td><td style="padding: 8px 0; color: #1a1a1a;">' + phone + '</td></tr>'
    + '<tr><td style="padding: 8px 0; color: #666;">Company:</td><td style="padding: 8px 0; color: #1a1a1a;">' + company + '</td></tr>'
    + '<tr><td style="padding: 8px 0; color: #666;">Country:</td><td style="padding: 8px 0; color: #1a1a1a;">' + country + '</td></tr>'
    + regionRow
    + careerRow
    + '<tr><td style="padding: 8px 0; color: #666;">Language:</td><td style="padding: 8px 0; color: #1a1a1a;">' + language + '</td></tr>'
    + cvRow
    + '</table>'
    + '</div>'
    + '<div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">'
    + '<h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 15px; border-bottom: 2px solid #e63946; padding-bottom: 10px;">Message</h2>'
    + '<p style="color: #1a1a1a; line-height: 1.6; margin: 0; white-space: pre-wrap;">' + message + '</p>'
    + '</div>'
    + '</div>'
    + '<div style="background: #1a1a1a; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">'
    + '<p style="color: #999; margin: 0; font-size: 12px;">Submitted on ' + submittedDate + '</p>'
    + '<p style="color: #666; margin: 10px 0 0; font-size: 11px;">This email was sent from the Confiteca website contact form</p>'
    + '</div>'
    + '</div>';

  var plainBody = 'NEW CONTACT FORM SUBMISSION\n'
    + '============================\n\n'
    + 'Type: ' + inquiryType + '\n\n'
    + 'CONTACT INFORMATION\n'
    + '-------------------\n'
    + 'Name: ' + firstName + ' ' + lastName + '\n'
    + 'Email: ' + email + '\n'
    + 'Phone: ' + phone + '\n'
    + 'Company: ' + company + '\n'
    + 'Country: ' + country + '\n'
    + (data.region ? 'Region/Province: ' + data.region + '\n' : '')
    + (data.careerInterest ? 'Area of Interest: ' + data.careerInterest + '\n' : '')
    + 'Language: ' + language + '\n'
    + (cvUrl ? 'CV/Resume: ' + cvUrl + '\n' : '')
    + '\nMESSAGE\n'
    + '-------\n'
    + message + '\n\n'
    + '---\n'
    + 'Submitted: ' + submittedDate + '\n';

  MailApp.sendEmail({
    to: recipientEmail,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody,
    replyTo: data.email || 'support@confiteca.com'
  });
}

// =====================================================
// TEST FUNCTIONS
// =====================================================
function testSheetConnection() {
  try {
    var sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    console.log('Successfully connected to sheet: ' + sheet.getName());
    console.log('Current rows: ' + sheet.getLastRow());
  } catch (error) {
    console.error('Error connecting to sheet: ' + error);
  }
}

function testEmailRouting() {
  var tests = [
    { inquiry: 'business', country: 'US', expected: 'business@confiteca.com.ec' },
    { inquiry: 'distribution', country: 'EC', expected: 'distribution@confiteca.com.ec' },
    { inquiry: 'distribution', country: 'CO', expected: 'distribution@confiteca.com.co' },
    { inquiry: 'business', country: 'PE', expected: 'distribution@confiteca.com.pe' },
    { inquiry: 'careers', country: 'MX', expected: 'careers@confiteca.com' },
    { inquiry: 'feedback', country: 'EC', expected: 'support@confiteca.com' },
    { inquiry: 'other', country: 'BR', expected: 'support@confiteca.com' }
  ];

  for (var i = 0; i < tests.length; i++) {
    var t = tests[i];
    var result = getRecipientEmail(t.inquiry, t.country);
    var pass = result === t.expected ? 'PASS' : 'FAIL';
    console.log(pass + ': ' + t.inquiry + ' + ' + t.country + ' -> ' + result + ' (expected: ' + t.expected + ')');
  }
}

function testEmailNotification() {
  var testData = {
    inquiry: 'careers',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+593 99 123 4567',
    company: 'Test Company',
    country: 'EC',
    careerInterest: 'Marketing',
    message: 'This is a test message from the contact form setup.',
    language: 'en',
    timestamp: new Date().toISOString(),
    page_url: 'https://confiteca.com/en/contact.html'
  };

  sendEmailNotification(testData, null);
  console.log('Test email sent to: ' + getRecipientEmail(testData.inquiry, testData.country));
}
