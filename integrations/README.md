# Gmail notifications

This integration sends a copy of a saved portfolio inquiry to the portfolio owner. Replies go to the address entered by the customer.

1. Sign in to Google Apps Script with the Gmail account that owns the portfolio. Create a project and paste gmail-apps-script.gs into Code.gs.
2. In Project Settings, set the script property PORTFOLIO_MAIL_SECRET to a random secret of at least 32 characters.
3. Select Deploy > New deployment > Web app. Execute as yourself, grant access to Anyone, and authorize MailApp. The script rejects requests without the matching secret.
4. Set the portfolio server's PORTFOLIO_MAIL_URL to the Google web app's /exec URL, and set PORTFOLIO_MAIL_SECRET to the same secret. Store both in runtime settings, never in source control.
5. Submit a test through the contact form and check Gmail. The website inbox continues to store inquiries before the email attempt.
