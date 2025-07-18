#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("Generating test report...");

// Read coverage reports
const coverageDir = path.join(__dirname, "../coverage");
const reportDir = path.join(__dirname, "../reports");

// Create reports directory if it doesn't exist
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true });
}

// Generate summary report
const generateSummaryReport = () => {
  const summary = {
    timestamp: new Date().toISOString(),
    testSuites: {
      products: {
        unit: { status: "pending", coverage: 0 },
        integration: { status: "pending", coverage: 0 },
        components: { status: "pending", coverage: 0 },
        e2e: { status: "pending", coverage: 0 },
      },
      brands: {
        unit: { status: "pending", coverage: 0 },
        integration: { status: "pending", coverage: 0 },
        components: { status: "pending", coverage: 0 },
        e2e: { status: "pending", coverage: 0 },
      },
      categories: {
        unit: { status: "pending", coverage: 0 },
        integration: { status: "pending", coverage: 0 },
        components: { status: "pending", coverage: 0 },
        e2e: { status: "pending", coverage: 0 },
      },
    },
    overall: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      totalCoverage: 0,
    },
  };

  // Try to read coverage data from Jest
  try {
    const coverageFile = path.join(coverageDir, "coverage-summary.json");
    if (fs.existsSync(coverageFile)) {
      const coverageData = JSON.parse(fs.readFileSync(coverageFile, "utf8"));
      summary.overall.totalCoverage = coverageData.total.lines.pct;
    }
  } catch (error) {
    console.log("No coverage data found:", error.message);
  }

  return summary;
};

// Generate detailed report
const generateDetailedReport = () => {
  const detailed = {
    timestamp: new Date().toISOString(),
    testResults: [],
    coverageDetails: {},
    performance: {
      totalTime: 0,
      averageTime: 0,
      slowestTest: "",
      fastestTest: "",
    },
    issues: {
      errors: [],
      warnings: [],
      suggestions: [],
    },
  };

  return detailed;
};

// Generate HTML report
const generateHTMLReport = (summary, detailed) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - Inventory POS</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #667eea;
        }
        .summary-card h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            font-weight: 500;
            color: #666;
        }
        .metric-value {
            font-weight: 600;
            color: #333;
        }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-pending { color: #ffc107; }
        .coverage-bar {
            background: #e9ecef;
            border-radius: 4px;
            height: 8px;
            margin-top: 5px;
            overflow: hidden;
        }
        .coverage-fill {
            background: linear-gradient(90deg, #28a745, #20c997);
            height: 100%;
            transition: width 0.3s ease;
        }
        .details-section {
            margin-top: 30px;
        }
        .details-section h2 {
            color: #333;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .test-suite {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
        }
        .test-suite h3 {
            margin: 0 0 15px 0;
            color: #333;
        }
        .test-categories {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .test-category {
            background: white;
            border-radius: 6px;
            padding: 15px;
            border: 1px solid #dee2e6;
        }
        .test-category h4 {
            margin: 0 0 10px 0;
            color: #495057;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Report</h1>
            <p>Inventory POS System - ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Overall Summary</h3>
                    <div class="metric">
                        <span class="metric-label">Total Tests:</span>
                        <span class="metric-value">${summary.overall.totalTests}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Passed:</span>
                        <span class="metric-value status-passed">${summary.overall.passedTests}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Failed:</span>
                        <span class="metric-value status-failed">${summary.overall.failedTests}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Skipped:</span>
                        <span class="metric-value status-pending">${summary.overall.skippedTests}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Coverage:</span>
                        <span class="metric-value">${summary.overall.totalCoverage}%</span>
                    </div>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${summary.overall.totalCoverage}%"></div>
                    </div>
                </div>
                
                <div class="summary-card">
                    <h3>Test Suites</h3>
                    <div class="metric">
                        <span class="metric-label">Products:</span>
                        <span class="metric-value status-pending">Pending</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Brands:</span>
                        <span class="metric-value status-pending">Pending</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Categories:</span>
                        <span class="metric-value status-pending">Pending</span>
                    </div>
                </div>
            </div>
            
            <div class="details-section">
                <h2>Test Suite Details</h2>
                
                <div class="test-suite">
                    <h3>Products</h3>
                    <div class="test-categories">
                        <div class="test-category">
                            <h4>Unit Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>Integration Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>Component Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>E2E Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="test-suite">
                    <h3>Brands</h3>
                    <div class="test-categories">
                        <div class="test-category">
                            <h4>Unit Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>Integration Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>Component Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>E2E Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="test-suite">
                    <h3>Categories</h3>
                    <div class="test-categories">
                        <div class="test-category">
                            <h4>Unit Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>Integration Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>Component Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                        <div class="test-category">
                            <h4>E2E Tests</h4>
                            <div class="metric">
                                <span class="metric-label">Status:</span>
                                <span class="metric-value status-pending">Pending</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Coverage:</span>
                                <span class="metric-value">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Inventory POS Test Suite</p>
        </div>
    </div>
</body>
</html>
  `;

  return html;
};

// Generate reports
const summary = generateSummaryReport();
const detailed = generateDetailedReport();
const html = generateHTMLReport(summary, detailed);

// Write reports to files
fs.writeFileSync(
  path.join(reportDir, "summary.json"),
  JSON.stringify(summary, null, 2)
);
fs.writeFileSync(
  path.join(reportDir, "detailed.json"),
  JSON.stringify(detailed, null, 2)
);
fs.writeFileSync(path.join(reportDir, "report.html"), html);

console.log("Test report generated successfully!");
console.log(`- Summary: ${path.join(reportDir, "summary.json")}`);
console.log(`- Detailed: ${path.join(reportDir, "detailed.json")}`);
console.log(`- HTML: ${path.join(reportDir, "report.html")}`);
