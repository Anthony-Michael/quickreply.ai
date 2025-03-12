# PowerShell script for running performance tests on ReplyRocket.io
# This script is a Windows-compatible version of run-performance-tests.sh

# Configuration
$TestDuration = 300  # 5 minutes
$ResultsDir = ".\results"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$TestResultsDir = "$ResultsDir\$Timestamp"

# Create results directory
if (-not (Test-Path $TestResultsDir)) {
    New-Item -ItemType Directory -Path $TestResultsDir -Force | Out-Null
}

# Display banner
Write-Host "=================================================="
Write-Host "   ReplyRocket.io Performance Testing Suite"
Write-Host "=================================================="
Write-Host "Date: $(Get-Date)"
Write-Host "Results will be saved to: $TestResultsDir"
Write-Host ""

# Check if JMeter is installed
$UseDocker = $false
$JMeterPath = $null

# Try to find JMeter
$JMeterPaths = @(
    "apache-jmeter\bin\jmeter.bat",
    "C:\apache-jmeter\bin\jmeter.bat",
    "$env:USERPROFILE\apache-jmeter\bin\jmeter.bat",
    "$env:PROGRAMFILES\apache-jmeter\bin\jmeter.bat"
)

foreach ($Path in $JMeterPaths) {
    if (Test-Path $Path) {
        $JMeterPath = $Path
        break
    }
}

if ($JMeterPath -eq $null) {
    Write-Host "JMeter is not installed or not found in common locations."
    Write-Host "You can run the tests using Docker instead."
    Write-Host ""
    
    # Check if Docker is installed
    try {
        docker --version | Out-Null
        $UseDocker = $true
    } catch {
        Write-Host "Docker is also not installed. Please install either JMeter or Docker to continue."
        exit 1
    }
} else {
    Write-Host "Found JMeter at: $JMeterPath"
}

# Check if Node.js is installed for resource monitoring
$MonitorResources = $false
try {
    node --version | Out-Null
    $MonitorResources = $true
} catch {
    Write-Host "Node.js is not installed. System resource monitoring will be disabled."
}

# Function to run JMeter test
function Run-JMeterTest {
    param(
        [string]$TestFile
    )
    
    $FileName = [System.IO.Path]::GetFileNameWithoutExtension($TestFile)
    $ResultsFile = "$TestResultsDir\$FileName-results.jtl"
    $ReportDir = "$TestResultsDir\$FileName-report"
    
    Write-Host "Running test: $TestFile"
    Write-Host "This will take approximately $TestDuration seconds..."
    
    if ($UseDocker) {
        Write-Host "Using Docker to run JMeter..."
        docker run --rm `
            -v "${PWD}:/jmeter" `
            --name jmeter-test `
            jmeter:latest `
            -n -t "/jmeter/$TestFile" `
            -l "/jmeter/$ResultsFile" `
            -e -o "/jmeter/$ReportDir"
    } else {
        Write-Host "Using local JMeter installation..."
        & $JMeterPath -n -t $TestFile -l $ResultsFile -e -o $ReportDir
    }
    
    Write-Host "Test completed: $TestFile"
    Write-Host "Results saved to: $ResultsFile"
    Write-Host "Report generated at: $ReportDir"
    Write-Host ""
}

# Function to start resource monitoring
function Start-ResourceMonitoring {
    Write-Host "Starting system resource monitoring..."
    $script:NodeProcess = Start-Process -FilePath "node" -ArgumentList "monitor-resources.js" -PassThru
    Write-Host "Resource monitoring started with PID: $($script:NodeProcess.Id)"
}

# Function to stop resource monitoring
function Stop-ResourceMonitoring {
    if ($script:NodeProcess -ne $null) {
        Write-Host "Stopping resource monitoring..."
        Stop-Process -Id $script:NodeProcess.Id -Force -ErrorAction SilentlyContinue
        
        # Copy resource-usage.csv to results directory
        if (Test-Path "resource-usage.csv") {
            Copy-Item "resource-usage.csv" -Destination "$TestResultsDir\" -Force
            Write-Host "Resource usage data saved to: $TestResultsDir\resource-usage.csv"
        }
    }
}

# Start resource monitoring if enabled
if ($MonitorResources) {
    Start-ResourceMonitoring
}

# Build Docker image if needed
if ($UseDocker) {
    Write-Host "Building JMeter Docker image..."
    docker build -t jmeter:latest .
    Write-Host "Docker image built successfully."
    Write-Host ""
}

# Run all JMeter tests
Write-Host "Starting tests..."
Get-ChildItem -Path "." -Filter "*.jmx" | ForEach-Object {
    Run-JMeterTest $_.Name
}

# Stop resource monitoring
if ($MonitorResources) {
    Stop-ResourceMonitoring
}

# Generate combined report
Write-Host "Generating combined performance report..."
$HtmlReportPath = "$TestResultsDir\index.html"

# Create HTML content for the report
$HtmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>ReplyRocket.io Performance Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        h1 { color: #0066cc; }
        .test-section { margin-bottom: 30px; }
        .test-section h2 { color: #0099cc; }
        .metrics-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        .metrics-table th, .metrics-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        .metrics-table th { background-color: #f2f2f2; }
        .report-link { display: inline-block; margin-top: 10px; padding: 5px 10px; background-color: #0099cc; color: white; text-decoration: none; border-radius: 3px; }
        .report-link:hover { background-color: #007799; }
    </style>
</head>
<body>
    <h1>ReplyRocket.io Performance Test Results</h1>
    <p>Date: $(Get-Date)</p>
    
    <div id="summary" class="test-section">
        <h2>Summary</h2>
        <p>This report contains the results of performance tests run on $(Get-Date).</p>
    </div>
    
    <div id="tests" class="test-section">
        <h2>Test Reports</h2>
"@

# Add links to individual test reports
Get-ChildItem -Path "." -Filter "*.jmx" | ForEach-Object {
    $TestName = [System.IO.Path]::GetFileNameWithoutExtension($_.Name)
    $ReportDir = "$TestName-report"
    $HtmlContent += "        <p><a href=`"$ReportDir/index.html`" class=`"report-link`">$TestName Report</a></p>`n"
}

$HtmlContent += "    </div>`n"

# Add resource usage section if available
if (Test-Path "$TestResultsDir\resource-usage.csv") {
    $HtmlContent += @"
    <div id="resources" class="test-section">
        <h2>System Resource Usage</h2>
        <p>The following chart shows CPU and memory usage during the tests:</p>
        <iframe width="100%" height="400" src="resource-chart.html"></iframe>
    </div>
"@

    # Create resource chart HTML
    $ResourceChartHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>Resource Usage</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <canvas id="resourceChart"></canvas>
    <script>
        fetch('resource-usage.csv')
            .then(response => response.text())
            .then(csvText => {
                const lines = csvText.split('\n');
                const headers = lines[0].split(',');
                const data = lines.slice(1).filter(line => line.trim()).map(line => {
                    const values = line.split(',');
                    return {
                        timestamp: values[0],
                        cpu: parseFloat(values[1]),
                        memory: parseFloat(values[4])
                    };
                });
                
                const timestamps = data.map(row => new Date(row.timestamp).toLocaleTimeString());
                const cpuValues = data.map(row => row.cpu);
                const memoryValues = data.map(row => row.memory);
                
                const ctx = document.getElementById('resourceChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: timestamps,
                        datasets: [
                            {
                                label: 'CPU Usage (%)',
                                data: cpuValues,
                                borderColor: 'rgb(255, 99, 132)',
                                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                                yAxisID: 'y'
                            },
                            {
                                label: 'Memory Usage (%)',
                                data: memoryValues,
                                borderColor: 'rgb(54, 162, 235)',
                                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                                yAxisID: 'y'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100,
                                title: {
                                    display: true,
                                    text: 'Percentage (%)'
                                }
                            }
                        }
                    }
                });
            });
    </script>
</body>
</html>
"@
    
    Set-Content -Path "$TestResultsDir\resource-chart.html" -Value $ResourceChartHtml
}

# Finish HTML
$HtmlContent += "</body></html>"

# Save HTML report
Set-Content -Path $HtmlReportPath -Value $HtmlContent

Write-Host ""
Write-Host "All tests completed successfully!"
Write-Host "Combined report is available at: $HtmlReportPath"
Write-Host ""
Write-Host "To analyze the results, open the HTML report in your browser."
Write-Host "To compare with previous test runs, check the $ResultsDir directory."
Write-Host ""
Write-Host "Based on test results, refer to OPTIMIZATION_GUIDE.md for performance optimization recommendations."
Write-Host "==================================================" 