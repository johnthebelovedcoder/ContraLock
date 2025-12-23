/**
 * Migration script to add the project column to the milestones table
 */

const { sequelize } = require('./sequelizeDb');

async function migrateMilestones() {
  try {
    console.log('Starting milestone migration...');

    // Check if the 'project' column exists
    const [results] = await sequelize.query(`
      PRAGMA table_info(milestones);
    `);

    const hasProjectColumn = results.some(col => col.name === 'project');
    
    if (hasProjectColumn) {
      console.log('Project column already exists in milestones table');
      return;
    }

    // Add the project column to the milestones table
    await sequelize.query(`
      ALTER TABLE milestones 
      ADD COLUMN project VARCHAR(255) REFERENCES projects (_id);
    `);

    console.log('Added project column to milestones table');

    // Add an index on the project column for performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones (project);
    `);

    console.log('Milestone migration completed successfully!');
  } catch (error) {
    console.error('Error during milestone migration:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      await migrateMilestones();
      console.log('\nMigration process completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  migrateMilestones
};