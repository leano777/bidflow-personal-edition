import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Settings, Check, X, RefreshCw, Download, Upload, Users, Building } from 'lucide-react';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface CRMConfig {
  id: string;
  name: string;
  type: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'custom';
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
  lastSync?: string;
  clientCount?: number;
}

interface CRMClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  source: string;
}

const CRM_PROVIDERS = [
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and deals from HubSpot CRM',
    icon: '🔶',
    setupUrl: 'https://developers.hubspot.com/docs/api/overview'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Connect with Salesforce contacts and opportunities',
    icon: '☁️',
    setupUrl: 'https://developer.salesforce.com/docs/apis'
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Import contacts and deals from Pipedrive',
    icon: '🟢',
    setupUrl: 'https://developers.pipedrive.com/docs/api/v1'
  },
  {
    id: 'zoho',
    name: 'Zoho CRM',
    description: 'Sync with Zoho CRM contacts and accounts',
    icon: '🔴',
    setupUrl: 'https://www.zoho.com/crm/developer/docs/'
  },
  {
    id: 'custom',
    name: 'Custom API',
    description: 'Connect to any custom CRM via REST API',
    icon: '⚙️',
    setupUrl: '#'
  }
];

export function CRMIntegrations({ onClientSelect }: { onClientSelect?: (client: CRMClient) => void }) {
  const [integrations, setIntegrations] = useState<CRMConfig[]>([]);
  const [clients, setClients] = useState<CRMClient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<CRMConfig | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showClientBrowser, setShowClientBrowser] = useState(false);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/crm-integrations`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setIntegrations(result.integrations || []);
      }
    } catch (error) {
      console.error('Failed to load CRM integrations:', error);
    }
  };

  const saveIntegration = async (config: CRMConfig) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/crm-integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('CRM integration saved successfully!');
        loadIntegrations();
        setShowSetup(false);
      } else {
        toast.error(`Failed to save integration: ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save CRM integration');
    } finally {
      setIsLoading(false);
    }
  };

  const syncClients = async (integrationId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/crm-sync/${integrationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setClients(result.clients || []);
        toast.success(`Synced ${result.clients?.length || 0} clients from CRM`);
        
        // Update last sync time
        setIntegrations(prev => prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, lastSync: new Date().toISOString(), clientCount: result.clients?.length || 0 }
            : integration
        ));
      } else {
        toast.error(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync with CRM');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIntegration = async (integrationId: string, enabled: boolean) => {
    const integration = integrations.find(i => i.id === integrationId);
    if (integration) {
      await saveIntegration({ ...integration, enabled });
    }
  };

  const SetupDialog = () => (
    <Dialog open={showSetup} onOpenChange={setShowSetup}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Setup CRM Integration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>CRM Provider</Label>
            <Select onValueChange={(value) => {
              const provider = CRM_PROVIDERS.find(p => p.id === value);
              if (provider) {
                setSelectedIntegration({
                  id: Date.now().toString(),
                  name: provider.name,
                  type: provider.id as any,
                  enabled: false
                });
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select a CRM provider" />
              </SelectTrigger>
              <SelectContent>
                {CRM_PROVIDERS.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    <div className="flex items-center gap-2">
                      <span>{provider.icon}</span>
                      <span>{provider.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedIntegration && (
            <>
              <div>
                <Label>Integration Name</Label>
                <Input
                  value={selectedIntegration.name}
                  onChange={(e) => setSelectedIntegration(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="e.g., Main HubSpot Account"
                />
              </div>

              <div>
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={selectedIntegration.apiKey || ''}
                  onChange={(e) => setSelectedIntegration(prev => prev ? { ...prev, apiKey: e.target.value } : null)}
                  placeholder="Enter your API key"
                />
              </div>

              {selectedIntegration.type === 'custom' && (
                <div>
                  <Label>API URL</Label>
                  <Input
                    value={selectedIntegration.apiUrl || ''}
                    onChange={(e) => setSelectedIntegration(prev => prev ? { ...prev, apiUrl: e.target.value } : null)}
                    placeholder="https://api.yourcrm.com/v1"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={selectedIntegration.enabled}
                  onCheckedChange={(checked) => setSelectedIntegration(prev => prev ? { ...prev, enabled: checked } : null)}
                />
                <Label>Enable this integration</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => selectedIntegration && saveIntegration(selectedIntegration)}
                  disabled={isLoading || !selectedIntegration.apiKey}
                  className="flex-1"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Integration
                </Button>
                <Button variant="outline" onClick={() => setShowSetup(false)}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  const ClientBrowser = () => (
    <Dialog open={showClientBrowser} onOpenChange={setShowClientBrowser}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Client from CRM</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {clients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No clients found. Sync with your CRM to import clients.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {clients.map(client => (
                <Card key={client.id} className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{client.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {client.source}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {client.company && <div className="flex items-center gap-1"><Building className="w-3 h-3" />{client.company}</div>}
                          <div>{client.email}</div>
                          <div>{client.phone}</div>
                          <div>{client.address}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (onClientSelect) {
                            onClientSelect(client);
                          }
                          setShowClientBrowser(false);
                          toast.success(`Selected client: ${client.name}`);
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              CRM Integrations
            </div>
            <div className="flex gap-2">
              {integrations.some(i => i.enabled) && (
                <Button variant="outline" size="sm" onClick={() => setShowClientBrowser(true)}>
                  <Users className="w-4 h-4 mr-2" />
                  Browse Clients
                </Button>
              )}
              <Button size="sm" onClick={() => setShowSetup(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Add Integration
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No CRM integrations configured.</p>
              <p className="text-sm">Connect your CRM to auto-import client information.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map(integration => (
                <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-2xl">
                        {CRM_PROVIDERS.find(p => p.id === integration.type)?.icon || '⚙️'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{integration.name}</h4>
                        <Badge variant={integration.enabled ? "default" : "secondary"}>
                          {integration.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {integration.lastSync ? (
                          <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                        ) : (
                          <span>Never synced</span>
                        )}
                        {integration.clientCount !== undefined && (
                          <span className="ml-2">• {integration.clientCount} clients</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked) => toggleIntegration(integration.id, checked)}
                    />
                    {integration.enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => syncClients(integration.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SetupDialog />
      <ClientBrowser />
    </>
  );
}