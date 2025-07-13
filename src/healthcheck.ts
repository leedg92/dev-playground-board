/**
 * Health check script for Docker container
 * Performs HTTP request to health endpoint
 */

import { request } from 'http'

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 8000,
  path: '/health',
  method: 'GET',
  timeout: 3000
}

const healthCheck = request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('Health check passed')
    process.exit(0)
  } else {
    console.log(`Health check failed with status: ${res.statusCode}`)
    process.exit(1)
  }
})

healthCheck.on('error', (err) => {
  console.log('Health check failed:', err.message)
  process.exit(1)
})

healthCheck.on('timeout', () => {
  console.log('Health check timed out')
  healthCheck.destroy()
  process.exit(1)
})

healthCheck.end() 