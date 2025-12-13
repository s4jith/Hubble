import { scanRepository } from './scan.repository';
import { aiService, AIAnalysisResult } from '../ai';
import { alertService } from '../alerts/alert.service';
import { userRepository } from '../users/user.repository';
import { IScanResult } from './scan.model';
import { ScanType, AlertSeverity, UserRole } from '../../config/constants';
import { NotFoundError, AuthorizationError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { scoreToSeverity } from '../../utils/helpers';

/**
 * Scan Service
 * Business logic for content scanning operations
 * 
 * PRIVACY & COMPLIANCE:
 * - All scans are linked to parent for transparency
 * - Consent verification required
 * - Data is timestamped for audit
 */
export class ScanService {
  /**
   * Scan text content
   */
  async scanText(
    userId: string,
    content: string,
    sourceApp?: string
  ): Promise<{
    scanResult: IScanResult;
    aiAnalysis: AIAnalysisResult;
    alertCreated: boolean;
  }> {
    const startTime = Date.now();
    logger.info(`Starting text scan for user ${userId}`);

    // Get user and verify they are a child
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.role !== UserRole.CHILD) {
      throw new AuthorizationError('Only child accounts can submit scans');
    }

    if (!user.parentId) {
      throw new ValidationError('Child account not properly linked to parent');
    }

    // Perform AI analysis
    const aiAnalysis = await aiService.analyzeText(content);
    const processingTime = Date.now() - startTime;

    // Determine severity level
    const severity = scoreToSeverity(aiAnalysis.severityScore);

    // Create scan result
    const scanResult = await scanRepository.createScanResult({
      userId,
      parentId: user.parentId.toString(),
      scanType: ScanType.TEXT,
      content,
      sourceApp,
      analysis: {
        isAbusive: aiAnalysis.isAbusive,
        categories: aiAnalysis.categories,
        severityScore: aiAnalysis.severityScore,
        confidence: aiAnalysis.confidence,
        sentiment: aiAnalysis.sentiment,
        threatDetected: aiAnalysis.threatDetected,
        rawResponse: aiAnalysis.rawResponse,
      },
      severity,
      processedAt: new Date(),
      processingTimeMs: processingTime,
    });

    // Create alert if abusive content detected
    let alertCreated = false;
    if (aiAnalysis.isAbusive) {
      await alertService.createAlert({
        childId: userId,
        parentId: user.parentId.toString(),
        scanResultId: scanResult._id.toString(),
        severity,
        categories: aiAnalysis.categories,
        severityScore: aiAnalysis.severityScore,
      });
      alertCreated = true;
    }

    logger.info(`Scan completed for user ${userId}`, {
      isAbusive: aiAnalysis.isAbusive,
      severity,
      processingTime,
    });

    return { scanResult, aiAnalysis, alertCreated };
  }

  /**
   * Scan image content
   */
  async scanImage(
    userId: string,
    imageUrlOrData: string,
    sourceApp?: string
  ): Promise<{
    scanResult: IScanResult;
    aiAnalysis: AIAnalysisResult;
    alertCreated: boolean;
  }> {
    const startTime = Date.now();
    logger.info(`Starting image scan for user ${userId}`);

    // Get user and verify they are a child
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.role !== UserRole.CHILD) {
      throw new AuthorizationError('Only child accounts can submit scans');
    }

    if (!user.parentId) {
      throw new ValidationError('Child account not properly linked to parent');
    }

    // Perform AI analysis on image
    const aiAnalysis = await aiService.analyzeImage(imageUrlOrData);
    const processingTime = Date.now() - startTime;

    // Determine severity level
    const severity = scoreToSeverity(aiAnalysis.severityScore);

    // Create scan result - store image URL/data in content field
    const scanResult = await scanRepository.createScanResult({
      userId,
      parentId: user.parentId.toString(),
      scanType: ScanType.IMAGE,
      content: imageUrlOrData,
      sourceApp,
      analysis: {
        isAbusive: aiAnalysis.isAbusive,
        categories: aiAnalysis.categories,
        severityScore: aiAnalysis.severityScore,
        confidence: aiAnalysis.confidence,
        sentiment: aiAnalysis.sentiment,
        threatDetected: aiAnalysis.threatDetected,
        rawResponse: aiAnalysis.rawResponse,
      },
      severity,
      processedAt: new Date(),
      processingTimeMs: processingTime,
    });

    // Create alert if abusive content detected
    let alertCreated = false;
    if (aiAnalysis.isAbusive) {
      await alertService.createAlert({
        childId: userId,
        parentId: user.parentId.toString(),
        scanResultId: scanResult._id.toString(),
        severity,
        categories: aiAnalysis.categories,
        severityScore: aiAnalysis.severityScore,
      });
      alertCreated = true;
    }

    logger.info(`Image scan completed for user ${userId}`, {
      isAbusive: aiAnalysis.isAbusive,
      severity,
      processingTime,
    });

    return { scanResult, aiAnalysis, alertCreated };
  }

  /**
   * Scan screen metadata
   */
  async scanScreenMetadata(
    userId: string,
    metadata: string,
    sourceApp?: string
  ): Promise<{
    scanResult: IScanResult;
    aiAnalysis: AIAnalysisResult;
    alertCreated: boolean;
  }> {
    const startTime = Date.now();
    logger.info(`Starting screen metadata scan for user ${userId}`);

    // Get user and verify
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    if (user.role !== UserRole.CHILD) {
      throw new AuthorizationError('Only child accounts can submit scans');
    }

    if (!user.parentId) {
      throw new ValidationError('Child account not properly linked to parent');
    }

    // Perform AI analysis on metadata (treating as text)
    const aiAnalysis = await aiService.analyzeText(metadata);
    const processingTime = Date.now() - startTime;

    const severity = scoreToSeverity(aiAnalysis.severityScore);

    // Create scan result
    const scanResult = await scanRepository.createScanResult({
      userId,
      parentId: user.parentId.toString(),
      scanType: ScanType.SCREEN_METADATA,
      content: metadata,
      sourceApp,
      analysis: {
        isAbusive: aiAnalysis.isAbusive,
        categories: aiAnalysis.categories,
        severityScore: aiAnalysis.severityScore,
        confidence: aiAnalysis.confidence,
        sentiment: aiAnalysis.sentiment,
        threatDetected: aiAnalysis.threatDetected,
        rawResponse: aiAnalysis.rawResponse,
      },
      severity,
      processedAt: new Date(),
      processingTimeMs: processingTime,
    });

    // Create alert if needed
    let alertCreated = false;
    if (aiAnalysis.isAbusive) {
      await alertService.createAlert({
        childId: userId,
        parentId: user.parentId.toString(),
        scanResultId: scanResult._id.toString(),
        severity,
        categories: aiAnalysis.categories,
        severityScore: aiAnalysis.severityScore,
      });
      alertCreated = true;
    }

    return { scanResult, aiAnalysis, alertCreated };
  }

  /**
   * Get scan history for a user
   */
  async getScanHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ scans: IScanResult[]; total: number; page: number; limit: number }> {
    const result = await scanRepository.findByUserId(userId, page, limit);
    return { ...result, page, limit };
  }

  /**
   * Get scan by ID
   */
  async getScanById(scanId: string, requestingUserId: string): Promise<IScanResult> {
    const scan = await scanRepository.findById(scanId);

    if (!scan) {
      throw new NotFoundError('Scan');
    }

    // Verify access (user is the child or the parent)
    if (
      scan.userId.toString() !== requestingUserId &&
      scan.parentId.toString() !== requestingUserId
    ) {
      throw new AuthorizationError('Cannot access this scan');
    }

    return scan;
  }
}

export const scanService = new ScanService();
export default scanService;
