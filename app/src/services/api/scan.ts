import { apiClient } from './client';

/**
 * Scan Types
 */
export type ScanType = 'text' | 'screen_metadata' | 'image';

export interface ScanResult {
  id: string;
  type: ScanType;
  isAbusive: boolean;
  severityScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'safe';
  categories: string[];
  analysisDetails: {
    summary: string;
    confidence: number;
    flaggedContent?: string[];
  };
  guidance?: string;
  createdAt: string;
}

export interface ScanHistoryResponse {
  scans: ScanResult[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Scan API Service
 */
export const scanApi = {
  /**
   * Scan text for cyberbullying
   */
  async scanText(text: string): Promise<ScanResult> {
    return apiClient.post<ScanResult>('/scan/text', { text });
  },

  /**
   * Scan image for harmful content
   */
  async scanImage(imageData: {
    base64?: string;
    url?: string;
  }): Promise<ScanResult> {
    return apiClient.post<ScanResult>('/scan/image', imageData);
  },

  /**
   * Scan screen metadata
   */
  async scanScreenMetadata(metadata: {
    appName: string;
    screenText?: string;
    timestamp: string;
  }): Promise<ScanResult> {
    return apiClient.post<ScanResult>('/scan/screen', metadata);
  },

  /**
   * Get scan history
   */
  async getScanHistory(params?: {
    page?: number;
    limit?: number;
    type?: ScanType;
    flaggedOnly?: boolean;
  }): Promise<ScanHistoryResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.type) query.append('type', params.type);
    if (params?.flaggedOnly) query.append('flaggedOnly', 'true');

    return apiClient.get<ScanHistoryResponse>(`/scan/history?${query.toString()}`);
  },

  /**
   * Get specific scan result
   */
  async getScanResult(scanId: string): Promise<ScanResult> {
    return apiClient.get<ScanResult>(`/scan/${scanId}`);
  },
};
