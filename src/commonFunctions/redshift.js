const { Client } = require('pg');
const { errorResponse } = require('./helpers');

const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT, 
  });

async function connectToRedshift() {
  try {
    await client.connect();
    console.log('Connected to Redshift');
  } catch (error) {
    console.error('Error connecting to Redshift:', error);
    throw errorResponse(500, 'Error connecting to Redshift.');
  }
}

async function disconnectFromRedshift() {
  try {
    await client.end();
    console.log('Disconnected from Redshift');
  } catch (error) {
    console.error('Error disconnecting from Redshift:', error);
    throw errorResponse(500, 'Error disconnecting from Redshift.');
  }
}

async function executeQueryOnRedshift(query, values = []) {
  try {
    const result = await client.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Query Execution Error:', error);
    throw errorResponse(500, 'Error executing query.');
  }
}

module.exports = {
    connectToRedshift,
    disconnectFromRedshift,
    executeQueryOnRedshift
};
