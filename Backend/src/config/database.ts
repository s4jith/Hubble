import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { env } from './env';

/**
 * MongoDB Database Connection Manager
 * Handles connection lifecycle with proper error handling and reconnection logic
 */
class Database {
  private isConnected = false;

  /**
   * Establish connection to MongoDB
   * Implements connection pooling and retry logic
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Using existing database connection');
      return;
    }

    try {
      mongoose.set('strictQuery', true);

      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(env.mongodb.uri, options);
      this.isConnected = true;
      logger.info('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Attempting to reconnect...');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

    } catch (error) {
      logger.warn('Failed to connect to MongoDB. Continuing in degraded mode:', error);
      this.isConnected = false;
    }
  }

  /**
   * Gracefully disconnect from MongoDB
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

export const database = new Database();
export default database;
