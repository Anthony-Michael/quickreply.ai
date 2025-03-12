#!/bin/bash

# Run performance tests for QuickReply.ai
# This script runs JMeter tests and collects system metrics

# Exit on error
set -e

# Configuration
TEST_DURATION=300  # 5 minutes
RESULTS_DIR="./results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_RESULTS_DIR="${RESULTS_DIR}/${TIMESTAMP}"

# Create results directory
mkdir -p ${TEST_RESULTS_DIR}

# Display banner
echo "=================================================="
echo "   QuickReply.ai Performance Testing Suite"
echo "=================================================="
echo "Date: $(date)"
echo "Results will be saved to: ${TEST_RESULTS_DIR}"
echo ""

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo "JMeter is not installed or not in PATH."
    echo "You can run the tests using Docker instead."
    echo ""
    if ! command -v docker &> /dev/null; then
        echo "Docker is also not installed. Please install either JMeter or Docker to continue."
        exit 1
    fi
    USE_DOCKER=true
else
    USE_DOCKER=false
fi

# Check if Node.js is installed for resource monitoring
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. System resource monitoring will be disabled."
    MONITOR_RESOURCES=false
else
    MONITOR_RESOURCES=true
fi

# Function to run JMeter test
run_jmeter_test() {
    local test_file=$1
    local results_file="${TEST_RESULTS_DIR}/$(basename ${test_file%.jmx})-results.jtl"
    local report_dir="${TEST_RESULTS_DIR}/$(basename ${test_file%.jmx})-report"
    
    echo "Running test: ${test_file}"
    echo "This will take approximately ${TEST_DURATION} seconds..."
    
    if [ "$USE_DOCKER" = true ]; then
        echo "Using Docker to run JMeter..."
        docker run --rm \
            -v "$(pwd):/jmeter" \
            --name jmeter-test \
            jmeter:latest \
            -n -t "/jmeter/${test_file}" \
            -l "/jmeter/${results_file}" \
            -e -o "/jmeter/${report_dir}"
    else
        echo "Using local JMeter installation..."
        jmeter -n -t "${test_file}" -l "${results_file}" -e -o "${report_dir}"
    fi
    
    echo "Test completed: ${test_file}"
    echo "Results saved to: ${results_file}"
    echo "Report generated at: ${report_dir}"
    echo ""
}

# Function to run resource monitoring
start_resource_monitoring() {
    echo "Starting system resource monitoring..."
    node monitor-resources.js &
    MONITOR_PID=$!
    echo "Resource monitoring started with PID: ${MONITOR_PID}"
}

# Function to stop resource monitoring
stop_resource_monitoring() {
    if [ -n "${MONITOR_PID}" ]; then
        echo "Stopping resource monitoring..."
        kill ${MONITOR_PID} 2>/dev/null || true
        
        # Copy resource-usage.csv to results directory
        if [ -f "resource-usage.csv" ]; then
            cp resource-usage.csv "${TEST_RESULTS_DIR}/"
            echo "Resource usage data saved to: ${TEST_RESULTS_DIR}/resource-usage.csv"
        fi
    fi
}

# Start resource monitoring if enabled
if [ "$MONITOR_RESOURCES" = true ]; then
    start_resource_monitoring
fi

# Build Docker image if needed
if [ "$USE_DOCKER" = true ]; then
    echo "Building JMeter Docker image..."
    docker build -t jmeter:latest .
    echo "Docker image built successfully."
    echo ""
fi

# Run all JMeter tests
echo "Starting tests..."
for test_file in *.jmx; do
    if [ -f "$test_file" ]; then
        run_jmeter_test "$test_file"
    fi
done

# Stop resource monitoring
if [ "$MONITOR_RESOURCES" = true ]; then
    stop_resource_monitoring
fi

# Generate combined report
echo "Generating combined performance report..."
cat > "${TEST_RESULTS_DIR}/index.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>QuickReply.ai Performance Test Results</title>
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
    <h1>QuickReply.ai Performance Test Results</h1>
    <p>Date: $(date)</p>
    
    <div id="summary" class="test-section">
        <h2>Summary</h2>
        <p>This report contains the results of performance tests run on $(date).</p>
    </div>
    
EOF

# Add links to individual test reports
echo "    <div id=\"tests\" class=\"test-section\">" >> "${TEST_RESULTS_DIR}/index.html"
echo "        <h2>Test Reports</h2>" >> "${TEST_RESULTS_DIR}/index.html"
for test_file in *.jmx; do
    if [ -f "$test_file" ]; then
        test_name=$(basename ${test_file%.jmx})
        report_dir="${test_name}-report"
        echo "        <p><a href=\"${report_dir}/index.html\" class=\"report-link\">${test_name} Report</a></p>" >> "${TEST_RESULTS_DIR}/index.html"
    fi
done
echo "    </div>" >> "${TEST_RESULTS_DIR}/index.html"

# Add resource usage section if available
if [ -f "${TEST_RESULTS_DIR}/resource-usage.csv" ]; then
    echo "    <div id=\"resources\" class=\"test-section\">" >> "${TEST_RESULTS_DIR}/index.html"
    echo "        <h2>System Resource Usage</h2>" >> "${TEST_RESULTS_DIR}/index.html"
    echo "        <p>The following chart shows CPU and memory usage during the tests:</p>" >> "${TEST_RESULTS_DIR}/index.html"
    echo "        <iframe width=\"100%\" height=\"400\" src=\"resource-chart.html\"></iframe>" >> "${TEST_RESULTS_DIR}/index.html"
    echo "    </div>" >> "${TEST_RESULTS_DIR}/index.html"
    
    # Create resource chart HTML
    cat > "${TEST_RESULTS_DIR}/resource-chart.html" << EOF
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
                const lines = csvText.split('\\n');
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
EOF
fi

# Finish HTML
echo "</body></html>" >> "${TEST_RESULTS_DIR}/index.html"

echo ""
echo "All tests completed successfully!"
echo "Combined report is available at: ${TEST_RESULTS_DIR}/index.html"
echo ""
echo "To analyze the results, open the HTML report in your browser."
echo "To compare with previous test runs, check the ${RESULTS_DIR} directory."
echo ""
echo "Based on test results, refer to OPTIMIZATION_GUIDE.md for performance optimization recommendations."
echo "==================================================" 