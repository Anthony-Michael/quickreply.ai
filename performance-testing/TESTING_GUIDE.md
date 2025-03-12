# ReplyRocket.io Performance Testing Guide

This guide provides instructions for running performance tests on the ReplyRocket.io application and interpreting the results to identify optimization opportunities.

## Contents

1. [Prerequisites](#prerequisites)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Interpreting Results](#interpreting-results)
5. [Common Performance Issues](#common-performance-issues)
6. [Performance Metrics](#performance-metrics)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

- Windows PowerShell or Windows Terminal
- Node.js 14+ (for resource monitoring)
- [JMeter 5.5+](https://jmeter.apache.org/download_jmeter.cgi) (or Docker)

## Setup

1. Navigate to the performance testing directory:
   ```powershell
   cd performance-testing
   ```

2. Create the results directory:
   ```powershell
   mkdir -p results
   ```

3. If using JMeter directly, ensure it's installed and available in your PATH. If using Docker, ensure Docker is installed and running.

## Running Tests

### Using PowerShell Script (Recommended)

The easiest way to run performance tests is using the included PowerShell script:

```powershell
.\run-tests.ps1
```

This script will:
- Automatically detect JMeter or use Docker as a fallback
- Enable resource monitoring if Node.js is installed
- Run all JMeter test plans (*.jmx files)
- Generate HTML reports for each test
- Create a combined summary report

### Using JMeter Directly

If you prefer to run JMeter manually:

```powershell
jmeter -n -t email-composer-load-test.jmx -l ./results/results.jtl -e -o ./results/report
```

### Using Docker

```powershell
docker build -t jmeter:latest .
docker run --rm -v "${PWD}:/jmeter" jmeter:latest -n -t "/jmeter/email-composer-load-test.jmx" -l "/jmeter/results/results.jtl" -e -o "/jmeter/results/report"
```

### Test Configuration Options

You can customize test parameters when running the PowerShell script by editing the script directly or modifying the JMX files in JMeter GUI.

The main configurable parameters are:
- `users`: Number of concurrent users (default: 50)
- `rampUp`: Time to reach full user load in seconds (default: 60)
- `loopCount`: Number of iterations per user (default: 10)
- `testDuration`: Total test duration in seconds (default: 300)
- `baseUrl`: Application URL (default: http://localhost:3000)

## Interpreting Results

After running the tests, open the HTML report in your browser:

```
.\results\<timestamp>\index.html
```

### Key Metrics to Analyze

1. **Response Times**
   - Average: Should be < 1000ms for API calls
   - 90th Percentile: Should be < 2000ms
   - 95th Percentile: Should be < 3000ms

2. **Throughput**
   - Look for a consistent throughput rate during peak load
   - Drops in throughput may indicate performance bottlenecks

3. **Error Rate**
   - Should be < 1% under normal load
   - Investigate any errors, especially those occurring at lower load levels

4. **System Resource Usage**
   - CPU Usage: Should remain < 80% during tests
   - Memory Usage: Look for stable patterns without continuous growth
   - Network I/O: Check for network bottlenecks

### Report Sections

- **Summary**: Overall test results
- **Graphs**: Visual representation of test metrics
- **Top 5 Errors**: Most common errors encountered
- **Response Time Overview**: Detailed timing analysis
- **Server Resource Usage**: If resource monitoring was enabled

## Common Performance Issues

Based on previous testing, here are common issues to watch for:

### Front-End Issues

- **Slow Initial Load**: Large JavaScript bundles or too many network requests
- **Memory Leaks**: Inspect for growing memory usage over time
- **DOM Operations**: Complex rendering can cause performance issues
- **API Response Handling**: Check for inefficient data processing

### Back-End Issues

- **Long API Response Times**: Look for endpoints with consistently high response times
- **Database Bottlenecks**: Slow queries or insufficient indexing
- **Memory Pressure**: Check for rising memory usage on the server
- **OpenAI API Latency**: Verify if delays are from internal processing or external API calls

## Performance Metrics

Here are the target performance metrics for ReplyRocket.io:

| Metric | Target Value | Warning Threshold | Critical Threshold |
|--------|--------------|-------------------|-------------------|
| Page Load Time | < 2 sec | 2-4 sec | > 4 sec |
| Response Time (API) | < 1 sec | 1-3 sec | > 3 sec |
| OpenAI Generate Time | < 5 sec | 5-10 sec | > 10 sec |
| Throughput | > 20 req/sec | 10-20 req/sec | < 10 req/sec |
| Error Rate | < 1% | 1-5% | > 5% |
| CPU Usage | < 70% | 70-85% | > 85% |
| Memory Usage | < 75% | 75-90% | > 90% |

## Troubleshooting

### Common Issues

1. **JMeter Not Found**
   - Ensure JMeter is installed and added to your PATH
   - Alternatively, use Docker to run the tests

2. **Connection Errors**
   - Verify the application is running at the specified URL
   - Check firewall settings that might block network traffic

3. **High Error Rates**
   - Check application logs for exceptions or errors
   - Verify that mock users have proper authentication credentials

4. **Resource Monitoring Not Working**
   - Ensure Node.js is installed
   - Check that monitor-resources.js exists in the performance-testing directory

### Logs and Debugging

- JMeter log files are saved in the `results` directory
- For more detailed logging, add the `-L DEBUG` flag to JMeter command
- Application logs should be checked alongside performance test results

---

For more detailed optimization recommendations based on test results, refer to the [OPTIMIZATION_GUIDE.md](./OPTIMIZATION_GUIDE.md) document. 