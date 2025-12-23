# Database Migration: SQLite to PostgreSQL

## Overview
This document outlines the migration plan from SQLite to PostgreSQL for the ContraLock platform. This is a critical change to improve scalability, concurrency, and reliability for production environments.

## Why PostgreSQL for Production?

### SQLite Limitations in Production:
- Limited concurrent write operations
- No user access control
- Less robust for financial transactions
- Difficulty with backup/replication
- Less enterprise-grade features

### PostgreSQL Advantages:
- Superior concurrency handling
- Advanced security features
- Better for financial applications
- Robust backup/recovery options
- More sophisticated query capabilities
- Better monitoring and admin tools

## Migration Strategy

### Phase 1: Preparation (Week 1)
1. Set up PostgreSQL development environment
2. Create PostgreSQL-specific database configuration
3. Update application code to support both databases
4. Create migration scripts
5. Test with a subset of existing data

### Phase 2: Implementation (Week 2)
1. Update connection configuration
2. Convert schema definitions
3. Migrate existing data
4. Update all database queries and relationships
5. Test all functionality with PostgreSQL

### Phase 3: Validation (Week 2)
1. Comprehensive testing of all features
2. Performance benchmarking
3. Security validation
4. Rollback procedures testing

## Technical Implementation Details

### 1. Database Configuration Updates

**New Environment Variables** (apps/api/.env):
```env
# Database Type
DB_TYPE=postgresql  # or sqlite for development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=contralock
DB_USER=contralock_user
DB_PASS=your_secure_password
DB_SSL=false

# SQLite Configuration (for development)
DB_PATH=./data/contralock.sqlite
```

**Updated Database Configuration File** (apps/api/src/config/database.js):
```javascript
const { Sequelize } = require('sequelize');

// Determine database configuration based on environment
const getDatabaseConfig = () => {
  if (process.env.DB_TYPE === 'postgresql') {
    return {
      dialect: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'contralock',
      username: process.env.DB_USER || 'contralock_user',
      password: process.env.DB_PASS || 'your_secure_password',
      ssl: process.env.DB_SSL === 'true',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 20,
        min: 5,
        acquire: 30000,
        idle: 10000
      }
    };
  } else {
    // Fallback to SQLite for development
    return {
      dialect: 'sqlite',
      storage: process.env.DB_PATH || './data/contralock.sqlite',
      logging: process.env.NODE_ENV === 'development' ? console.log : false
    };
  }
};

const sequelize = new Sequelize(getDatabaseConfig());

module.exports = sequelize;
```

### 2. Schema Conversion

**Updated User Model** (apps/api/src/models/User.js):
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('client', 'freelancer', 'admin'),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  phone: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isKYCVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    defaultValue: null
  },
  notificationPreferences: {
    type: DataTypes.JSONB,  // Use JSONB for PostgreSQL for better performance
    defaultValue: {
      email: true,
      push: true,
      projectUpdates: true,
      paymentNotifications: true
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  deletedAt: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'users',
  paranoid: true, // Enable soft deletes
  timestamps: true,
  underscored: true // Use snake_case for column names to follow PostgreSQL conventions
});

module.exports = User;
```

### 3. Migration Scripts

**Migration File** (apps/api/src/migrations/20240101-create-users-table.js):
```javascript
const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        },
        set(val) {
          // Always store emails in lowercase
          this.setDataValue('email', val.toLowerCase().trim());
        }
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM('client', 'freelancer', 'admin'),
        allowNull: false
      },
      avatar: {
        type: DataTypes.STRING,
        defaultValue: null
      },
      phone: {
        type: DataTypes.STRING,
        defaultValue: null
      },
      bio: {
        type: DataTypes.TEXT,
        defaultValue: null
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isKYCVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        defaultValue: null
      },
      notificationPreferences: {
        type: DataTypes.JSONB,
        defaultValue: {
          email: true,
          push: true,
          projectUpdates: true,
          paymentNotifications: true
        }
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      deleted_at: {
        type: DataTypes.DATE
      }
    });

    // Add indexes for common queries
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
```

### 4. Data Migration Process

**Data Migration Script** (apps/api/src/scripts/migrate-data.js):
```javascript
const fs = require('fs').promises;
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Configuration for SQLite (source)
const sqliteConfig = {
  dialect: 'sqlite',
  storage: './data/contralock.sqlite',
  logging: false
};

// Configuration for PostgreSQL (destination)
const postgresConfig = {
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'contralock',
  username: process.env.DB_USER || 'contralock_user',
  password: process.env.DB_PASS || 'your_secure_password',
  logging: console.log
};

async function migrateData() {
  let sqliteDb, postgresDb;
  
  try {
    console.log('Starting data migration from SQLite to PostgreSQL...');
    
    // Initialize connections
    sqliteDb = new Sequelize(sqliteConfig);
    postgresDb = new Sequelize(postgresConfig);
    
    // Define models for both databases
    const User = sqliteDb.define('User', {
      id: { type: DataTypes.STRING, primaryKey: true }, // SQLite doesn't have UUID type
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      role: DataTypes.STRING,
      avatar: DataTypes.STRING,
      phone: DataTypes.STRING,
      bio: DataTypes.STRING,
      isEmailVerified: DataTypes.BOOLEAN,
      isKYCVerified: DataTypes.BOOLEAN,
      stripeCustomerId: DataTypes.STRING,
      notificationPreferences: DataTypes.STRING, // Will convert JSON string to object
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE
    }, { tableName: 'Users', underscored: true });
    
    // Define the same model for PostgreSQL
    const PostgresUser = postgresDb.define('User', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: DataTypes.STRING,
      password: DataTypes.STRING,
      firstName: DataTypes.STRING,
      lastName: DataTypes.STRING,
      role: DataTypes.STRING,
      avatar: DataTypes.STRING,
      phone: DataTypes.STRING,
      bio: DataTypes.STRING,
      isEmailVerified: DataTypes.BOOLEAN,
      isKYCVerified: DataTypes.BOOLEAN,
      stripeCustomerId: DataTypes.STRING,
      notificationPreferences: DataTypes.JSONB,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE
    }, { tableName: 'users', underscored: true });
    
    // Synchronize models
    await postgresDb.sync();
    
    // Fetch all users from SQLite
    const sqliteUsers = await User.findAll();
    console.log(`Found ${sqliteUsers.length} users to migrate`);
    
    // Migrate users to PostgreSQL
    for (const user of sqliteUsers) {
      // Convert notificationPreferences from JSON string to object if it's a string
      let notificationPrefs = user.notificationPreferences;
      if (typeof notificationPrefs === 'string') {
        try {
          notificationPrefs = JSON.parse(notificationPrefs);
        } catch (e) {
          console.warn(`Failed to parse notification preferences for user ${user.id}:`, e);
          notificationPrefs = {
            email: true,
            push: true,
            projectUpdates: true,
            paymentNotifications: true
          };
        }
      }
      
      await PostgresUser.create({
        id: user.id,
        email: user.email,
        password: user.password,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        isEmailVerified: user.isEmailVerified,
        isKYCVerified: user.isKYCVerified,
        stripeCustomerId: user.stripeCustomerId,
        notificationPreferences: notificationPrefs,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt
      });
    }
    
    console.log(`Successfully migrated ${sqliteUsers.length} users to PostgreSQL`);
    
    // Repeat for other models (Projects, Milestones, Payments, etc.)
    // This is a simplified example, in practice you'd need to migrate all models
    
  } catch (error) {
    console.error('Error during data migration:', error);
    throw error;
  } finally {
    if (sqliteDb) await sqliteDb.close();
    if (postgresDb) await postgresDb.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('Data migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Data migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateData;
```

### 5. Environment-Specific Configuration

**Database Factory** (apps/api/src/config/databaseFactory.js):
```javascript
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

class DatabaseFactory {
  static createDatabase() {
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    let sequelizeConfig;
    
    switch (dbType) {
      case 'postgresql':
        sequelizeConfig = {
          dialect: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'contralock',
          username: process.env.DB_USER || 'contralock_user',
          password: process.env.DB_PASS || 'your_secure_password',
          ssl: process.env.DB_SSL === 'true',
          logging: (query) => {
            if (process.env.LOG_QUERIES === 'true') {
              logger.info(query);
            }
          },
          pool: {
            max: parseInt(process.env.DB_POOL_MAX) || 20,
            min: parseInt(process.env.DB_POOL_MIN) || 5,
            acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
            idle: parseInt(process.env.DB_POOL_IDLE) || 10000
          },
          retry: {
            match: [
              /SQLITE_BUSY/,
              /SQLITE_LOCKED/,
              /Connection terminated unexpectedly/
            ],
            max: 3
          }
        };
        break;
        
      case 'sqlite':
      default:
        sequelizeConfig = {
          dialect: 'sqlite',
          storage: process.env.DB_PATH || './data/contralock.sqlite',
          logging: (query) => {
            if (process.env.LOG_QUERIES === 'true') {
              logger.info(query);
            }
          }
        };
        break;
    }
    
    return new Sequelize(sequelizeConfig);
  }
}

module.exports = DatabaseFactory;
```

### 6. Connection Health Checks

**Database Health Check** (apps/api/src/health/databaseHealth.js):
```javascript
const database = require('../config/database');

class DatabaseHealth {
  static async check() {
    try {
      await database.authenticate();
      return {
        status: 'healthy',
        details: { type: process.env.DB_TYPE, message: 'Database connection successful' }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { type: process.env.DB_TYPE, error: error.message }
      };
    }
  }
}

module.exports = DatabaseHealth;
```

## Testing Strategy

### Unit Tests
```javascript
// apps/api/tests/unit/database.test.js
const { Sequelize } = require('sequelize');
const DatabaseFactory = require('../../src/config/databaseFactory');

describe('Database Configuration', () => {
  let sequelize;

  beforeEach(() => {
    // Mock environment variables
    process.env.DB_TYPE = 'postgresql';
    process.env.DB_HOST = 'localhost';
    process.env.DB_NAME = 'test_db';
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('creates PostgreSQL connection with correct settings', () => {
    process.env.DB_TYPE = 'postgresql';
    sequelize = DatabaseFactory.createDatabase();
    
    expect(sequelize.config.dialect).toBe('postgres');
    expect(sequelize.config.host).toBe('localhost');
  });

  test('creates SQLite connection for development', () => {
    process.env.DB_TYPE = 'sqlite';
    sequelize = DatabaseFactory.createDatabase();
    
    expect(sequelize.config.dialect).toBe('sqlite');
  });
});
```

### Integration Tests
```javascript
// apps/api/tests/integration/database.test.js
const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Database Integration', () => {
  beforeAll(async () => {
    await User.sync({ force: true });
  });

  test('can create and retrieve user with PostgreSQL', async () => {
    // Test user creation and retrieval
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: 'client'
    };

    const user = await User.create(userData);
    expect(user.email).toBe(userData.email);
    
    const retrievedUser = await User.findOne({ where: { email: userData.email } });
    expect(retrievedUser).not.toBeNull();
  });
});
```

## Rollback Plan

### Scenario: Migration Fails
1. Stop all application services
2. Restore database from backup
3. Revert application configuration to SQLite
4. Restart services with SQLite
5. Investigate and fix issues
6. Retry migration

### Automated Rollback Script
```bash
#!/bin/bash
# rollback-database.sh

echo "Starting database rollback..."
docker-compose down
cp backup/contralock.sqlite data/contralock.sqlite
export DB_TYPE=sqlite
echo "Database rolled back to SQLite. Please restart application services."
```

## Deployment Considerations

### Production Deployment
1. Deploy with SQLite first to ensure stability
2. Run PostgreSQL migration during maintenance window
3. Switch database configuration
4. Monitor application performance
5. Verify data integrity

### Monitoring
- Database connection pool metrics
- Query performance
- Error rates
- Backup success rates

## Success Criteria

- All existing data successfully migrated
- Application continues to function normally
- Improved performance under load
- Better concurrency handling
- Successful backup and recovery procedures