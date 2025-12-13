'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Scan, Image as ImageIcon } from 'lucide-react';

export default function ChildScanPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [scanType, setScanType] = useState<'text' | 'image'>('text');
  const [result, setResult] = useState<any>(null);
  
  const [textData, setTextData] = useState({
    content: '',
    source: '',
    platform: '',
  });

  const [imageData, setImageData] = useState({
    imageUrl: '',
    source: '',
    platform: '',
  });

  const handleTextScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await apiClient.scanText(textData);
      setResult(response.data);
    } catch (error: any) {
      console.error('Scan failed', error);
      setResult({ error: error.response?.data?.message || 'Scan failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const response = await apiClient.scanImage(imageData);
      setResult(response.data);
    } catch (error: any) {
      console.error('Scan failed', error);
      setResult({ error: error.response?.data?.message || 'Scan failed' });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-600 text-white';
      case 'high':
        return 'bg-orange-600 text-white';
      case 'medium':
        return 'bg-yellow-600 text-white';
      case 'low':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-neutral-600 text-white';
    }
  };

  if (!isAuthenticated || user?.role !== 'child') {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push('/child/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="w-6 h-6" />
                Content Scanner
              </CardTitle>
              <CardDescription>
                Scan text messages or images for potential cyberbullying or harmful content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button
                  variant={scanType === 'text' ? 'default' : 'outline'}
                  onClick={() => setScanType('text')}
                  className="flex-1"
                >
                  Text Scan
                </Button>
                <Button
                  variant={scanType === 'image' ? 'default' : 'outline'}
                  onClick={() => setScanType('image')}
                  className="flex-1"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image Scan
                </Button>
              </div>

              {scanType === 'text' ? (
                <form onSubmit={handleTextScan} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="content">Text Content *</Label>
                    <textarea
                      id="content"
                      className="flex min-h-[120px] w-full rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                      placeholder="Enter the text message or content to scan..."
                      value={textData.content}
                      onChange={(e) => setTextData({ ...textData, content: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="source">Source</Label>
                      <Input
                        id="source"
                        placeholder="e.g., WhatsApp, Instagram"
                        value={textData.source}
                        onChange={(e) => setTextData({ ...textData, source: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="platform">Platform</Label>
                      <Input
                        id="platform"
                        placeholder="e.g., Social Media, Chat"
                        value={textData.platform}
                        onChange={(e) => setTextData({ ...textData, platform: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Scanning...' : 'Scan Text'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleImageScan} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL *</Label>
                    <Input
                      id="imageUrl"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={imageData.imageUrl}
                      onChange={(e) => setImageData({ ...imageData, imageUrl: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageSource">Source</Label>
                      <Input
                        id="imageSource"
                        placeholder="e.g., Instagram, Snapchat"
                        value={imageData.source}
                        onChange={(e) => setImageData({ ...imageData, source: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imagePlatform">Platform</Label>
                      <Input
                        id="imagePlatform"
                        placeholder="e.g., Social Media"
                        value={imageData.platform}
                        onChange={(e) => setImageData({ ...imageData, platform: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? 'Scanning...' : 'Scan Image'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {result.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                    {result.error}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                      <div>
                        <div className="text-sm text-neutral-600 mb-1">Overall Status</div>
                        <Badge variant={result.isAbusive ? 'destructive' : 'secondary'} className="text-base">
                          {result.isAbusive ? 'Harmful Content Detected' : 'Content Safe'}
                        </Badge>
                      </div>
                      {result.severity && (
                        <div>
                          <div className="text-sm text-neutral-600 mb-1">Severity</div>
                          <Badge className={getSeverityColor(result.severity)}>
                            {result.severity}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {result.categories && result.categories.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Detected Categories</div>
                        <div className="flex flex-wrap gap-2">
                          {result.categories.map((category: string, idx: number) => (
                            <Badge key={idx} variant="outline">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.confidenceScore && (
                      <div>
                        <div className="text-sm font-medium mb-2">Confidence Score</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-neutral-900"
                              style={{ width: `${result.confidenceScore * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {(result.confidenceScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <div className="text-sm text-neutral-600 mb-2">
                        Your scan has been saved to your scan history.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
