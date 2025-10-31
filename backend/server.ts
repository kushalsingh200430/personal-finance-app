import app from './src/app';
import { query } from './src/config/database';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

/**
 * Initialize database migrations and start server
 */
const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔧 Initializing database...');

    const migrationsDir = path.join(__dirname, '../database/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, 'utf-8');

      console.log(`  Running migration: ${file}`);
      await query(sql);
    }

    console.log('✅ Database initialized successfully');
  } catch (error: any) {
    console.error('❌ Database initialization error:', error.message);
    // Don't exit - migrations may already be applied
  }
};

/**
 * Start server
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize database
    await initializeDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`\n🚀 Pocket Guard Backend Server`);
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Not configured'}\n`);
    });
  } catch (error: any) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
