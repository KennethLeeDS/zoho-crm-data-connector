#!/usr/bin/env node

/**
 * Simple test runner for the /connect endpoint
 * This script starts the connector server and runs the test suite
 */

const { spawn } = require('child_process');
const axios = require('axios');
const ConnectEndpointTest = require('./test-connect-endpoint');

const CONNECTOR_PORT = process.env.CONNECTOR_PORT || 8080;
const CONNECTOR_URL = `http://localhost:${CONNECTOR_PORT}`;

/**
 * Check if the connector server is running
 */
async function isServerRunning() {
  try {
    const response = await axios.get(`${CONNECTOR_URL}/health`, { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Start the connector server
 */
function startConnectorServer() {
  console.log('🚀 Starting connector server in test mode...');
  
  const server = spawn('node', ['src/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'test' }
  });
  
  server.stdout.on('data', (data) => {
    console.log(`[SERVER] ${data.toString().trim()}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`[SERVER ERROR] ${data.toString().trim()}`);
  });
  
  server.on('close', (code) => {
    console.log(`[SERVER] Process exited with code ${code}`);
  });
  
  return server;
}

/**
 * Wait for server to be ready
 */
async function waitForServer(timeout = 10000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await isServerRunning()) {
      console.log('✅ Connector server is ready');
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error('Timeout waiting for connector server to start');
}

/**
 * Main test execution
 */
async function runTest() {
  let server = null;
  
  try {
    console.log('🧪 Connect Endpoint Test Runner');
    console.log('='.repeat(40));
    console.log();
    
    // Check if server is already running
    const serverRunning = await isServerRunning();
    
    if (!serverRunning) {
      console.log('📋 Server not running, starting it...');
      server = startConnectorServer();
      await waitForServer();
    } else {
      console.log('📋 Server already running, using existing instance');
    }
    
    console.log();
    console.log('🧪 Running test suite...');
    console.log();
    
    // Run the test suite
    const test = new ConnectEndpointTest();
    const results = await test.runAllTests();
    
    // Return results
    return results;
    
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    return { success: false, error: error.message };
  } finally {
    // Cleanup - only kill server if we started it
    if (server) {
      console.log('\n🛑 Stopping connector server...');
      server.kill('SIGTERM');
      
      // Give it a moment to shut down gracefully
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Run if called directly
if (require.main === module) {
  runTest()
    .then((results) => {
      console.log('\n' + '='.repeat(40));
      console.log(`🏁 Test runner finished: ${results.success ? 'SUCCESS' : 'FAILURE'}`);
      
      if (results.error) {
        console.error('Error:', results.error);
      }
      
      process.exit(results.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runTest };