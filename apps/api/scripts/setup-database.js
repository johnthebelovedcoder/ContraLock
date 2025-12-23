const { execSync } = require('child_process');
const path = require('path');

// Set the working directory to the API app
const apiDir = path.join(__dirname, '..');

console.log('Setting up ContraLock database...');

try {
  console.log('Running database migrations...');
  execSync('npx sequelize-cli db:migrate', { cwd: apiDir, stdio: 'inherit' });
  
  console.log('Seeding database with default users...');
  execSync('npx sequelize-cli db:seed:all', { cwd: apiDir, stdio: 'inherit' });
  
  console.log('Database setup completed successfully!');
  console.log('\nDefault login credentials:');
  console.log('- Admin: admin@example.com / password123');
  console.log('- Client: client@example.com / password123');
  console.log('- Freelancer: freelancer@example.com / password123');
  console.log('- Freelancer: freelancer1@test.com / password123');
} catch (error) {
  console.error('Database setup failed:', error.message);
  process.exit(1);
}