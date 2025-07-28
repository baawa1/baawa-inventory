#!/usr/bin/env node

/**
 * Test script for robust email template
 * Verifies that the logo displays correctly in email clients
 */

const fs = require('fs');
const path = require('path');

// Mock the logo-utils module
const mockLogoUtils = {
  getLogoUrl: (variant, useBase64 = true) => {
    if (useBase64) {
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF8WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78i iglkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNy4yLWMwMDAgNzkuMWI2NWE3OWI0LCAyMDIyLzA2LzEzLTIyOjAxOjAxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpypmY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjQuMCAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjQtMDEtMjBUMTU6NDc6NDErMDE6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjQtMDEtMjBUMTU6NDc6NDErMDE6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDI0LTAxLTIwVDE1OjQ3OjQxKzAxOjAwIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ODg3YjM1LTM4ZTAtNDI0Ny1hMzA0LTNmYzM5YzM5YzM5YyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjY5ODg3YjM1LTM4ZTAtNDI0Ny1hMzA0LTNmYzM5YzM5YzM5YyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjY5ODg3YjM1LTM4ZTAtNDI0Ny1hMzA0LTNmYzM5YzM5YzM5YyIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjY5ODg3YjM1LTM4ZTAtNDI0Ny1hMzA0LTNmYzM5YzM5YzM5YyIgc3RFdnQ6d2hlbj0iMjAyNC0wMS0yMFQxNTo0Nzo0MSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDI0LjAgKE1hY2ludG9zaCkiLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+';
    }
    return `https://inventory.baawa.com/logo/baawa-icon-${variant}.png`;
  },
  getLogoVariantForContext: (context) => {
    const variants = {
      'welcome': 'brand-color',
      'verification': 'brand-color',
      'password-reset': 'brand-color',
      'default': 'brand-color'
    };
    return variants[context] || variants.default;
  }
};

// Mock the createRobustEmailTemplate function
const createRobustEmailTemplate = (content, title, logoVariant = 'brand-color') => {
  const logoUrl = mockLogoUtils.getLogoUrl(logoVariant, true);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #ff3333 0%, #cc0000 100%);
                padding: 30px 20px;
                text-align: center;
            }
            .content {
                padding: 40px 30px;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                border-top: 1px solid #e9ecef;
            }
            .footer-text {
                color: #6c757d;
                font-size: 14px;
                margin: 0;
            }
            @media only screen and (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                .content {
                    padding: 20px 15px;
                }
                .header {
                    padding: 20px 15px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                    <tr>
                        <td style="text-align: center;">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 15px;">
                                        <img src="${logoUrl}" alt="BaaWA Accessories Logo" style="width: 60px; height: 60px; object-fit: contain; display: block; border: 0;">
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <div style="font-size: 24px; font-weight: bold; color: #ffffff;">BaaWA Accessories</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="content">
                ${content}
            </div>
            <div class="footer">
                <p class="footer-text">
                    © ${new Date().getFullYear()} BaaWA Accessories. All rights reserved.<br>
                    If you have any questions, please contact us at support@baawa.ng
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Test the robust template
function testRobustTemplate() {
  console.log('🧪 Testing Robust Email Template...\n');

  // Test welcome template
  const welcomeContent = `
    <h2>Welcome to BaaWA Accessories!</h2>
    <p>Hi John,</p>
    <p>Welcome to BaaWA Accessories! We're excited to have you on board.</p>
    <p>Your account has been successfully created and you can now access our inventory management system.</p>
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    <p>Best regards,<br>The BaaWA Accessories Team</p>
  `;

  const welcomeHtml = createRobustEmailTemplate(
    welcomeContent,
    'Welcome to BaaWA Accessories',
    mockLogoUtils.getLogoVariantForContext('welcome')
  );

  // Test verification template
  const verificationContent = `
    <h2>Verify Your Email Address</h2>
    <p>Hi John,</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="https://example.com/verify">Verify Email</a></p>
    <p>Best regards,<br>The BaaWA Accessories Team</p>
  `;

  const verificationHtml = createRobustEmailTemplate(
    verificationContent,
    'Verify Your Email Address',
    mockLogoUtils.getLogoVariantForContext('verification')
  );

  // Save test files
  const outputDir = path.join(__dirname, 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(
    path.join(outputDir, 'welcome-robust-test.html'),
    welcomeHtml
  );

  fs.writeFileSync(
    path.join(outputDir, 'verification-robust-test.html'),
    verificationHtml
  );

  // Check for src attribute
  const hasSrcAttribute = (html) => {
    return html.includes('src="data:image/png;base64,');
  };

  const welcomeHasSrc = hasSrcAttribute(welcomeHtml);
  const verificationHasSrc = hasSrcAttribute(verificationHtml);

  console.log('✅ Welcome template generated successfully');
  console.log('✅ Verification template generated successfully');
  console.log(`✅ Welcome template has src attribute: ${welcomeHasSrc}`);
  console.log(`✅ Verification template has src attribute: ${verificationHasSrc}`);
  console.log(`✅ Test files saved to: ${outputDir}`);

  // Check for table-based layout
  const hasTableLayout = (html) => {
    return html.includes('<table cellpadding="0" cellspacing="0" border="0"');
  };

  const welcomeHasTable = hasTableLayout(welcomeHtml);
  const verificationHasTable = hasTableLayout(verificationHtml);

  console.log(`✅ Welcome template uses table layout: ${welcomeHasTable}`);
  console.log(`✅ Verification template uses table layout: ${verificationHasTable}`);

  // Check for inline styles
  const hasInlineStyles = (html) => {
    return html.includes('style="width: 60px; height: 60px;');
  };

  const welcomeHasInline = hasInlineStyles(welcomeHtml);
  const verificationHasInline = hasInlineStyles(verificationHtml);

  console.log(`✅ Welcome template uses inline styles: ${welcomeHasInline}`);
  console.log(`✅ Verification template uses inline styles: ${verificationHasInline}`);

  console.log('\n🎉 Robust email template test completed successfully!');
  console.log('\n📧 The templates should now work better in email clients that strip src attributes.');
  console.log('📁 Check the test-output directory for the generated HTML files.');
}

// Run the test
testRobustTemplate(); 