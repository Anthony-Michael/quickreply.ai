# Performance Testing for ReplyRocket.io

This directory contains a comprehensive performance testing framework for the ReplyRocket.io application. It's designed to evaluate how the application performs under high traffic conditions and identify potential bottlenecks.

## Overview

The framework consists of:

1. **JMeter Test Plans** - Scripts to simulate user behavior under load
2. **Resource Monitoring** - Tools to track system resource usage during tests
3. **Analysis Tools** - Scripts to analyze test results and generate reports
4. **Optimization Guide** - Recommendations for improving performance based on test results

## Prerequisites

- [Apache JMeter](https://jmeter.apache.org/download_jmeter.cgi) (version 5.5 or higher)
- Java Runtime Environment (JRE) 8 or higher
- Node.js 14+ (for resource monitoring)
- Docker (optional, for containerized testing)

## Quick Start

### Installation

1. Run the setup script to install required tools:

```bash
chmod +x setup.sh
./setup.sh
```

2. Follow the prompts to install JMeter or build the Docker image

### Running Tests

1. Execute the test suite:

```bash
./run-performance-tests.sh
```

2. View the results in the `results/{timestamp}` directory

## Test Plans

### Email Composer Load Test

The `email-composer-load-test.jmx` test plan simulates users:
- Logging in
- Navigating to the email composer
- Generating AI responses

It measures:
- Response times for API calls
- Error rates
- Throughput

### Authentication Load Test

The `authentication-load-test.jmx` test plan focuses on:
- Login attempts
- Session management
- Token refresh operations

### API Endpoint Load Test

The `api-endpoint-load-test.jmx` test plan tests:
- OpenAI API integration
- Rate limiting behavior
- Error handling

## Configuration

### Test Parameters

Edit the JMX files or set the following environment variables:

- `BASE_URL` - The application URL (default: https://app.replyrocket.io)
- `USERS` - Number of concurrent users (default: 100)
- `RAMP_UP` - Time in seconds to reach full user load (default: 60)
- `LOOPS` - Number of iterations per user (default: 10)

### Data Files

- `test-users.csv` - Test user credentials for authentication
- `email-content.csv` - Sample email content for response generation

## Resource Monitoring

The `monitor-resources.js` script tracks:
- CPU usage
- Memory consumption
- Network I/O

It runs concurrently with the JMeter tests and writes results to `resource-usage.csv`.

## Docker Support

For consistent testing environments, you can use Docker:

```bash
# Build the image
docker build -t jmeter:latest .

# Run a test
docker run --rm -v "$(pwd):/jmeter" jmeter:latest -n -t /jmeter/email-composer-load-test.jmx -l /jmeter/results.jtl -e -o /jmeter/results
```

## Analysis and Reporting

After running tests, a comprehensive HTML report is generated with:
- Response time statistics
- Error rates by request type
- Throughput graphs
- Resource usage charts

## Performance Benchmarks

Target performance metrics:

- Response time: < 2 seconds for 90% of requests
- Throughput: > 50 requests per second
- Error rate: < 1%
- CPU utilization: < 70%
- Memory usage: < 80% of available memory

## Optimization Strategy

See `OPTIMIZATION_GUIDE.md` for detailed recommendations on:
- Front-end optimizations
- Back-end improvements
- Infrastructure scaling
- Database tuning
- Caching strategies

## Continuous Performance Testing

For best results, we recommend integrating performance testing into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
performance-test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Set up JDK
      uses: actions/setup-java@v2
      with:
        java-version: '11'
    - name: Run Performance Tests
      run: |
        cd performance-testing
        ./run-performance-tests.sh
    - name: Archive Results
      uses: actions/upload-artifact@v2
      with:
        name: performance-results
        path: performance-testing/results
```

## Troubleshooting

### Common Issues

1. **JMeter Connection Errors**
   - Check if the application is accessible from the test environment
   - Verify there are no firewall issues

2. **Resource Monitoring Failures**
   - Ensure Node.js is installed
   - Check file permissions

3. **Performance Degradation**
   - Analyze resource usage charts for bottlenecks
   - Examine database query performance
   - Check for memory leaks

## Contributing

To extend this framework:

1. Add new test plans in the JMX format
2. Update data files with relevant test data
3. Enhance the analysis scripts as needed

## License

This performance testing framework is licensed under the same license as the ReplyRocket.io application. 