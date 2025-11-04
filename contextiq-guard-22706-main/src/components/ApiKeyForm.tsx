import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Save, Shield, Check, X, Loader2, AlertTriangle } from 'lucide-react';
import { saveApiKeys, loadApiKeys, type ApiKeys } from '@/lib/api-keys';
import { toast } from 'sonner';

export const ApiKeyForm = () => {
  const [keys, setKeys] = useState<ApiKeys>(() => {
    return loadApiKeys() || {
      whoisxml: '',
      virustotal: '',
      abuseipdb: '',
      shodan: '',
      hibp: '',
      supabase_url: '',
      supabase_anon_key: '',
    };
  });

  const [showKeys, setShowKeys] = useState<Record<keyof ApiKeys, boolean>>({
    whoisxml: false,
    virustotal: false,
    abuseipdb: false,
    shodan: false,
    hibp: false,
    supabase_url: false,
    supabase_anon_key: false,
  });

  const [testStatus, setTestStatus] = useState<Record<keyof ApiKeys, 'idle' | 'testing' | 'valid' | 'invalid'>>({
    whoisxml: 'idle',
    virustotal: 'idle',
    abuseipdb: 'idle',
    shodan: 'idle',
    hibp: 'idle',
    supabase_url: 'idle',
    supabase_anon_key: 'idle',
  });

  useEffect(() => {
    const loaded = loadApiKeys();
    if (loaded) {
      setKeys(loaded);
    }
  }, []);

  const handleSave = () => {
    try {
      saveApiKeys(keys);
      toast.success('API keys saved successfully');
    } catch (error) {
      toast.error('Failed to save API keys');
    }
  };

  const handleTestKey = async (service: keyof ApiKeys) => {
    const keyMap: Record<keyof ApiKeys, string> = {
      whoisxml: 'whoisxml',
      virustotal: 'virustotal',
      abuseipdb: 'abuseipdb',
      shodan: 'shodan',
      hibp: 'hibp',
      supabase_url: 'supabase_url',
      supabase_anon_key: 'supabase_anon_key',
    };

    const apiKey = keys[service];
    if (!apiKey) {
      toast.error('Please enter an API key first');
      return;
    }

    setTestStatus(prev => ({ ...prev, [service]: 'testing' }));

    try {
      const baseUrl = keys.supabase_url || import.meta.env.VITE_SUPABASE_URL;
      const anonKey = keys.supabase_anon_key || import.meta.env.VITE_SUPABASE_ANON_KEY;

      const canUseSupabase = Boolean(baseUrl && anonKey && /^https?:\/\//i.test(baseUrl));

      if (canUseSupabase) {
        const response = await fetch(`${baseUrl}/functions/v1/test-key`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            service: keyMap[service],
            api_key: apiKey,
          }),
        });

        let data: any = {};
        try {
          data = await response.json();
        } catch (_) {}

        if (response.ok && data?.success) {
          setTestStatus(prev => ({ ...prev, [service]: 'valid' }));
          toast.success(`${service} API key is valid`);
        } else {
          setTestStatus(prev => ({ ...prev, [service]: 'invalid' }));
          const reason = data?.error || `${response.status} ${response.statusText}`;
          toast.error(`${service} API key is invalid`, { description: reason });
        }
        return;
      }

      // Fallback: test via Vite dev proxy to avoid CORS when Supabase isn't configured
      const svc = keyMap[service];
      let ok = false;
      let errorText = '';
      let bodySnippet = '';

      try {
        switch (svc) {
          case 'whoisxml': {
            const r = await fetch(`/proxy/whoisxml/whoisserver/WhoisService?apiKey=${apiKey}&domainName=google.com&outputFormat=JSON`);
            ok = r.ok;
            if (!ok) {
              errorText = `${r.status} ${r.statusText}`;
              try { bodySnippet = (await r.text()).slice(0, 180); } catch {}
            }
            break;
          }
          case 'virustotal': {
            const r = await fetch('/proxy/vt/api/v3/domains/google.com', {
              headers: { 'x-apikey': String(apiKey) },
            });
            ok = r.ok;
            if (!ok) {
              errorText = `${r.status} ${r.statusText}`;
              try { bodySnippet = (await r.text()).slice(0, 180); } catch {}
            }
            break;
          }
          case 'abuseipdb': {
            const r = await fetch('/proxy/abuse/api/v2/check?ipAddress=8.8.8.8', {
              headers: { Key: String(apiKey), Accept: 'application/json' },
            });
            ok = r.ok;
            if (!ok) {
              errorText = `${r.status} ${r.statusText}`;
              try { bodySnippet = (await r.text()).slice(0, 180); } catch {}
            }
            break;
          }
          case 'shodan': {
            const r = await fetch(`/proxy/shodan/api-info?key=${apiKey}`);
            ok = r.ok;
            if (!ok) {
              errorText = `${r.status} ${r.statusText}`;
              try { bodySnippet = (await r.text()).slice(0, 180); } catch {}
            }
            break;
          }
          case 'hibp': {
            const r = await fetch('/proxy/hibp/api/v3/breachedaccount/test@example.com', {
              headers: { 'hibp-api-key': String(apiKey), 'user-agent': 'ContextIQ' },
            });
            ok = r.ok || r.status === 404; // 404 means no breach and still valid key
            if (!ok) {
              errorText = `${r.status} ${r.statusText}`;
              try { bodySnippet = (await r.text()).slice(0, 180); } catch {}
            }
            break;
          }
          default:
            throw new Error('Unknown service');
        }
      } catch (e) {
        errorText = e instanceof Error ? e.message : 'Network error';
      }

      if (ok) {
        setTestStatus(prev => ({ ...prev, [service]: 'valid' }));
        toast.success(`${service} API key is valid`);
      } else {
        setTestStatus(prev => ({ ...prev, [service]: 'invalid' }));
        const hint = errorText.includes('CORS') || errorText.includes('Failed to fetch') ? ' (possible CORS or network block)' : '';
        const detail = [errorText, bodySnippet].filter(Boolean).join(' · ');
        toast.error(`${service} API key is invalid`, { description: `${detail}${hint}` });
      }
    } catch (error) {
      setTestStatus(prev => ({ ...prev, [service]: 'invalid' }));
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to test ${service} key`, { description: message });
    }
  };

  const apiKeyFields: Array<{
    key: keyof ApiKeys;
    label: string;
    description: string;
    link: string;
  }> = [
    {
      key: 'whoisxml',
      label: 'WHOISXML API Key',
      description: 'For domain age & registrar analysis',
      link: 'https://whoisxmlapi.com/',
    },
    {
      key: 'virustotal',
      label: 'VirusTotal API Key',
      description: 'For malware/threat analysis',
      link: 'https://www.virustotal.com/gui/my-apikey',
    },
    {
      key: 'abuseipdb',
      label: 'AbuseIPDB API Key',
      description: 'For IP reputation checks',
      link: 'https://www.abuseipdb.com/account/api',
    },
    {
      key: 'shodan',
      label: 'Shodan API Key',
      description: 'For external exposure scanning',
      link: 'https://account.shodan.io/',
    },
    {
      key: 'hibp',
      label: 'Have I Been Pwned API Key',
      description: 'For email breach discovery',
      link: 'https://haveibeenpwned.com/API/Key',
    },
    {
      key: 'supabase_url',
      label: 'Supabase Project URL',
      description: 'Your Supabase project URL (e.g., https://[project-id].supabase.co)',
      link: 'https://supabase.com/dashboard',
    },
    {
      key: 'supabase_anon_key',
      label: 'Supabase Anon Key',
      description: 'Your Supabase anonymous/public key for AI summarization',
      link: 'https://supabase.com/dashboard',
    },
  ];

  return (
    <div className="space-y-6">
      <Alert variant="default" className="border-primary/50 bg-primary/5">
        <Shield className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <strong>Privacy Notice:</strong> Your API keys are stored only in your browser's
          localStorage and are never sent to our servers for storage. They are transmitted
          securely with each enrichment request and immediately discarded after use.
        </AlertDescription>
      </Alert>

      <Alert variant="destructive" className="border-destructive/50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <strong>Security Warning:</strong> Do not use this application on public or shared
          computers. Anyone with access to your browser can read your stored API keys.
        </AlertDescription>
      </Alert>

      {apiKeyFields.map(({ key, label, description, link }) => (
        <Card key={key}>
          <CardHeader>
            <CardTitle className="text-lg">{label}</CardTitle>
            <CardDescription>
              {description} •{' '}
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Get API Key
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Label htmlFor={key} className="sr-only">
                {label}
              </Label>
              <Input
                id={key}
                type={showKeys[key] ? 'text' : 'password'}
                value={keys[key]}
                onChange={(e) => setKeys(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={`Enter your ${label.toLowerCase()}`}
                className="font-mono pr-20"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {testStatus[key] === 'valid' && <Check className="h-4 w-4 text-risk-safe" />}
                {testStatus[key] === 'invalid' && <X className="h-4 w-4 text-risk-critical" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))}
                >
                  {showKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTestKey(key)}
              disabled={testStatus[key] === 'testing'}
            >
              {testStatus[key] === 'testing' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Key'
              )}
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button onClick={handleSave} className="w-full" size="lg">
        <Save className="mr-2 h-4 w-4" />
        Save API Keys to Browser
      </Button>
    </div>
  );
};
