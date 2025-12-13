import { childRepository } from './child.repository';
import { userRepository } from '../users/user.repository';
import { IScanResult } from '../scan/scan.model';
import { IAlert } from '../alerts/alert.model';
import { IMentalHealthResource } from './mentalHealthResource.model';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { calculateAge } from '../../utils/helpers';

/**
 * Child Service
 * Business logic for child-specific operations
 * 
 * PRIVACY & COMPLIANCE:
 * - Children cannot access parent data
 * - Children cannot modify their own credentials
 * - All access is logged
 */
export class ChildService {
  /**
   * Get scan history for child
   */
  async getScanHistory(
    childId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ scans: IScanResult[]; total: number; page: number; limit: number }> {
    logger.info(`Child ${childId} fetching scan history`);
    const result = await childRepository.getScanHistory(childId, page, limit);
    return { ...result, page, limit };
  }

  /**
   * Get alerts for child
   */
  async getAlerts(
    childId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ alerts: IAlert[]; total: number; page: number; limit: number }> {
    logger.info(`Child ${childId} fetching alerts`);
    const result = await childRepository.getAlerts(childId, page, limit);
    return { ...result, page, limit };
  }

  /**
   * Get context-aware mental health resources
   */
  async getResources(
    childId: string,
    severityScore?: number,
    categories?: string[]
  ): Promise<IMentalHealthResource[]> {
    logger.info(`Child ${childId} accessing mental health resources`);

    // Get child's age for age-appropriate resources
    const child = await userRepository.findById(childId);
    let age: number | undefined;

    if (child?.dateOfBirth) {
      age = calculateAge(child.dateOfBirth);
    }

    // If severity/categories provided, get targeted resources
    if (severityScore !== undefined && categories && categories.length > 0) {
      return childRepository.getResources(severityScore, categories, age);
    }

    // Otherwise, get general resources
    const { resources } = await childRepository.getAllResources(1, 50);
    return resources;
  }

  /**
   * Get emergency resources (always accessible)
   */
  async getEmergencyResources(): Promise<IMentalHealthResource[]> {
    logger.info('Accessing emergency resources');
    return childRepository.getEmergencyResources();
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(childId: string, alertId: string): Promise<IAlert> {
    logger.info(`Child ${childId} acknowledging alert ${alertId}`);

    const alert = await childRepository.acknowledgeAlert(alertId, childId);

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    return alert;
  }

  /**
   * Submit a manual abuse report
   */
  async submitManualReport(
    childId: string,
    data: {
      content: string;
      description: string;
      sourceApp?: string;
    }
  ): Promise<IScanResult> {
    logger.info(`Child ${childId} submitting manual report`);

    // Get child's parent
    const child = await userRepository.findById(childId);
    if (!child || !child.parentId) {
      throw new NotFoundError('Child');
    }

    const scanResult = await childRepository.createManualReport({
      childId,
      parentId: child.parentId.toString(),
      content: data.content,
      description: data.description,
      sourceApp: data.sourceApp,
    });

    return scanResult;
  }

  /**
   * Get child profile
   */
  async getProfile(childId: string) {
    const user = await userRepository.findById(childId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    return {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update child profile (non-credential fields only)
   */
  async updateProfile(childId: string, updates: any) {
    const user = await userRepository.findById(childId);
    
    if (!user) {
      throw new NotFoundError('User');
    }

    // Only allow updating specific fields
    const allowedFields = ['firstName', 'lastName'];
    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        (user as any)[key] = updates[key];
      }
    });

    await user.save();

    return {
      id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      role: user.role,
    };
  }

  /**
   * Verify child cannot update credentials
   * SECURITY: This is called whenever credential update is attempted
   */
  blockCredentialUpdate(): never {
    throw new AuthorizationError('Child accounts cannot modify credentials');
  }
}

export const childService = new ChildService();
export default childService;
