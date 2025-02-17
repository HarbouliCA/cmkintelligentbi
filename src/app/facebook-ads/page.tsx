'use client';

import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function FacebookAdsPage() {
  const [accountId, setAccountId] = useState('');
  const [dateStart, setDateStart] = useState<Date | undefined>(new Date());
  const [dateStop, setDateStop] = useState<Date | undefined>(new Date());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    if (!accountId || !dateStart || !dateStop) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/facebook-ads/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId,
          dateStart: dateStart.toISOString().split('T')[0],
          dateStop: dateStop.toISOString().split('T')[0],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync data');
      }

      toast({
        title: 'Success',
        description: `Synced ${data.insightsCount} insights to Azure Blob Storage`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync Facebook Ads data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold mb-6">Facebook Ads Sync</h1>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Account ID
                </label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="Enter your ad account ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <DatePicker
                    selected={dateStart}
                    onSelect={setDateStart}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <DatePicker
                    selected={dateStop}
                    onSelect={setDateStop}
                  />
                </div>
              </div>

              <Button
                onClick={handleSync}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Syncing...' : 'Sync Facebook Ads Data'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </AppLayout>
  );
}
