// src/db/jsonDb.js - Simple JSON-based database for development
const fs = require('fs').promises;
const path = require('path');

// Database directory
const DB_DIR = path.join(__dirname, '../data');
const USERS_FILE = path.join(DB_DIR, 'users.json');

// Initialize database directory and files
async function initDb() {
  try {
    // Create data directory if it doesn't exist
    await fs.mkdir(DB_DIR, { recursive: true });
    
    // Initialize users file if it doesn't exist
    try {
      await fs.access(USERS_FILE);
    } catch {
      await fs.writeFile(USERS_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Read data from JSON file
async function readData(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

// Write data to JSON file
async function writeData(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
  }
}

// User operations
const userOperations = {
  // Find user by email
  async findByEmail(email) {
    const users = await readData(USERS_FILE);
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },
  
  // Find user by ID
  async findById(id) {
    const users = await readData(USERS_FILE);
    return users.find(user => user._id === id);
  },
  
  // Create new user
  async create(userData) {
    const users = await readData(USERS_FILE);
    
    // Generate simple ID (in production, use a proper ID generator)
    const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const user = {
      _id: newId,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(user);
    await writeData(USERS_FILE, users);
    return user;
  },
  
  // Update user
  async update(id, updateData) {
    const users = await readData(USERS_FILE);
    const index = users.findIndex(user => user._id === id);
    
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      await writeData(USERS_FILE, users);
      return users[index];
    }
    
    return null;
  },
  
  // Get all users
  async findAll() {
    return await readData(USERS_FILE);
  }
};

module.exports = {
  initDb,
  userOperations
};