/**
 * Railway metrics collection script
 * Collects and reports application metrics to Railway dashboard
 */

const https = require('https');
const { createClient } = require('../src/lib/supabase/server');

// Metrics collection function
async function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    database: {
      status: 'unknown',
      latency: 0
    },
    performance: {
      requests: 0,
      errors: 0,
      avgResponseTime: 0
    }
  };

  try {
    // Test database connection
    const startTime = Date.now();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    metrics.database.latency = Date.now() - startTime;
    metrics.database.status = error ? 'down' : 'up';

    if (error) {
      console.error('Database check failed:', error.message);
    }
  } catch (error) {
    console.error('Metrics collection error:', error.message);
    metrics.database.status = 'down';
  }

  return metrics;
}

// Export metrics collection function
module.exports = { collectMetrics };

// If run directly, print metrics
if (require.main === module) {
  collectMetrics().then(metrics => {
    console.log('Application Metrics:', JSON.stringify(metrics, null, 2));
  }).catch(error => {
    console.error('Failed to collect metrics:', error);
    process.exit(1);
  });
}