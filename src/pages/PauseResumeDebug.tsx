import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCampaigns } from '@/hooks/useCampaigns';
import { Loader2 } from 'lucide-react';

export default function PauseResumeDebug() {
  const [campaignId, setCampaignId] = useState('');
  const [batchId, setBatchId] = useState('');
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [output, setOutput] = useState('');

  const { pauseCampaign, resumeCampaign } = useCampaigns();

  const handlePause = async () => {
    setOutput('');
    try {
      const res = await pauseCampaign.mutateAsync(campaignId);
      setLastBatchId(res?.pauseBatchId || null);
      setOutput(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setOutput('Erro: ' + (e?.message || String(e)));
    }
  };

  const handleResume = async () => {
    setOutput('');
    try {
      const target = batchId || lastBatchId || undefined;
      const res = await resumeCampaign.mutateAsync({ id: campaignId, batchId: target });
      setOutput(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setOutput('Erro: ' + (e?.message || String(e)));
    }
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug: Pause / Resume Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <label className="text-sm font-medium">Campaign ID</label>
            <Input value={campaignId} onChange={(e) => setCampaignId((e.target as HTMLInputElement).value)} placeholder="ID da campanha" />

            <div className="flex gap-2">
              <Button disabled={!campaignId || pauseCampaign.isPending} onClick={handlePause}>
                {pauseCampaign.isPending ? <Loader2 className="animate-spin" /> : 'Pausar campanha'}
              </Button>
              <Button disabled={!campaignId || resumeCampaign.isPending} onClick={handleResume}>
                {resumeCampaign.isPending ? <Loader2 className="animate-spin" /> : 'Retomar campanha'}
              </Button>
            </div>

            <label className="text-sm font-medium">Batch ID (opcional)</label>
            <Input value={batchId} onChange={(e) => setBatchId((e.target as HTMLInputElement).value)} placeholder="Deixe vazio para usar último batch" />

            <div>
              <div className="text-sm">Último pause batch id: <span className="font-mono">{lastBatchId || '-'}</span></div>
            </div>

            <pre className="mt-4 p-2 bg-muted text-sm overflow-auto" style={{ maxHeight: 240 }}>{output || 'Nenhuma ação realizada ainda.'}</pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}