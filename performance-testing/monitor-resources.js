/**
 * ReplyRocket.io Performance Testing - Resource Monitor
 * 
 * This script monitors system resources (CPU, memory, network) during 
 * performance testing and outputs data to a CSV file for analysis.
 */

const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

// Configuration
const SAMPLE_INTERVAL_MS = 1000; // 1 second
const TEST_DURATION_SEC = 300;   // 5 minutes by default
const CSV_FILE = 'resource-usage.csv';
const MAX_SAMPLES = TEST_DURATION_SEC * (1000 / SAMPLE_INTERVAL_MS);

// Initialize CSV file with headers
fs.writeFileSync(
  CSV_FILE,
  'timestamp,cpu_percent,memory_used_mb,memory_total_mb,memory_percent,network_rx_bytes,network_tx_bytes,network_rx_delta,network_tx_delta\n'
);

// Network stats tracking
let lastNetworkStats = null;
let sampleCount = 0;

/**
 * Get network statistics (received/transmitted bytes)
 * @returns {Promise<Object>} Network stats object with rx_bytes and tx_bytes
 */
async function getNetworkStats() {
  return new Promise((resolve, reject) => {
    // Windows-specific network stats command
    const cmd = 'powershell "Get-NetAdapterStatistics | Where-Object {$_.ReceivedBytes -gt 0} | Select-Object ReceivedBytes, SentBytes"';
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(`Warning: Network stats collection failed: ${error.message}`);
        // Return dummy data if command fails
        resolve({ rx_bytes: 0, tx_bytes: 0, rx_delta: 0, tx_delta: 0 });
        return;
      }
      
      try {
        // Parse the output
        const lines = stdout.trim().split('\n');
        if (lines.length < 3) {
          resolve({ rx_bytes: 0, tx_bytes: 0, rx_delta: 0, tx_delta: 0 });
          return;
        }
        
        // Find the line with numeric values (skipping headers)
        const dataLine = lines.find(line => /^\s*\d+/.test(line));
        if (!dataLine) {
          resolve({ rx_bytes: 0, tx_bytes: 0, rx_delta: 0, tx_delta: 0 });
          return;
        }
        
        // Extract the values
        const values = dataLine.trim().split(/\s+/);
        const rx_bytes = parseInt(values[0], 10) || 0;
        const tx_bytes = parseInt(values[1], 10) || 0;
        
        // Calculate deltas from previous sample
        let rx_delta = 0;
        let tx_delta = 0;
        
        if (lastNetworkStats) {
          rx_delta = rx_bytes - lastNetworkStats.rx_bytes;
          tx_delta = tx_bytes - lastNetworkStats.tx_bytes;
          
          // Handle counter reset or negative values
          if (rx_delta < 0) rx_delta = 0;
          if (tx_delta < 0) tx_delta = 0;
        }
        
        const stats = { rx_bytes, tx_bytes, rx_delta, tx_delta };
        lastNetworkStats = { rx_bytes, tx_bytes };
        resolve(stats);
      } catch (err) {
        console.warn(`Warning: Network stats parsing failed: ${err.message}`);
        resolve({ rx_bytes: 0, tx_bytes: 0, rx_delta: 0, tx_delta: 0 });
      }
    });
  });
}

/**
 * Calculate CPU usage percentage
 * @returns {Promise<number>} CPU usage percentage
 */
async function getCpuUsage() {
  return new Promise((resolve) => {
    // Get initial CPU measurements
    const startMeasure = os.cpus();
    
    // Wait for a short interval to measure CPU usage
    setTimeout(() => {
      const endMeasure = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;
      
      // Calculate the difference in CPU times
      for (let i = 0; i < endMeasure.length; i++) {
        // CPU core
        const startCore = startMeasure[i];
        const endCore = endMeasure[i];
        
        for (const type in endCore.times) {
          totalTick += (endCore.times[type] - startCore.times[type]);
          if (type === 'idle') {
            totalIdle += (endCore.times[type] - startCore.times[type]);
          }
        }
      }
      
      // Calculate CPU usage percentage
      const totalUsage = 100 - ~~(100 * totalIdle / totalTick);
      resolve(totalUsage);
    }, 100);
  });
}

/**
 * Get memory usage statistics
 * @returns {Object} Memory statistics object
 */
function getMemoryUsage() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    total_mb: Math.round(totalMem / (1024 * 1024)),
    used_mb: Math.round(usedMem / (1024 * 1024)),
    percent: Math.round((usedMem / totalMem) * 100)
  };
}

/**
 * Main monitoring function
 */
async function monitor() {
  console.log('Starting resource monitoring...');
  console.log(`Samples will be taken every ${SAMPLE_INTERVAL_MS}ms for ${TEST_DURATION_SEC} seconds`);
  console.log(`Results will be saved to ${CSV_FILE}`);
  
  const intervalId = setInterval(async () => {
    try {
      // Get current timestamp
      const timestamp = new Date().toISOString();
      
      // Get CPU usage
      const cpuPercent = await getCpuUsage();
      
      // Get memory usage
      const memory = getMemoryUsage();
      
      // Get network stats
      const network = await getNetworkStats();
      
      // Create CSV line
      const line = `${timestamp},${cpuPercent},${memory.used_mb},${memory.total_mb},${memory.percent},${network.rx_bytes},${network.tx_bytes},${network.rx_delta},${network.tx_delta}\n`;
      
      // Append to CSV file
      fs.appendFileSync(CSV_FILE, line);
      
      // Increment sample count and show progress
      sampleCount++;
      if (sampleCount % 10 === 0) {
        const progressPercent = Math.min(100, Math.round((sampleCount / MAX_SAMPLES) * 100));
        console.log(`Monitoring progress: ${progressPercent}% (CPU: ${cpuPercent}%, Memory: ${memory.percent}%)`);
      }
      
      // Stop after max samples
      if (sampleCount >= MAX_SAMPLES) {
        clearInterval(intervalId);
        console.log('Resource monitoring completed.');
        console.log(`Results saved to ${CSV_FILE}`);
        process.exit(0);
      }
    } catch (error) {
      console.error('Error during resource monitoring:', error);
    }
  }, SAMPLE_INTERVAL_MS);
  
  // Handle process termination
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log('Resource monitoring stopped by user.');
    console.log(`Results saved to ${CSV_FILE}`);
    process.exit(0);
  });
}

// Start monitoring
monitor().catch(error => {
  console.error('Failed to start monitoring:', error);
  process.exit(1);
}); 