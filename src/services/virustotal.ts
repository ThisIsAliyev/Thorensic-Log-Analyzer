import { getVTKey } from "@/lib/keys";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MS = 500; // 2 requests per second max

interface VTCacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, VTCacheEntry>();
let lastRequestTime = 0;

async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

export interface VTResult {
  ioc: string;
  malicious: number;
  suspicious: number;
  country?: string;
  lastAnalysis?: string;
}

export async function lookupIP(ip: string): Promise<VTResult | null> {
  const key = getVTKey();
  if (!key) return null;

  // Check cache
  const cached = cache.get(`ip:${ip}`);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await rateLimit();

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/ip_addresses/${ip}`, {
      headers: {
        "x-apikey": key,
      },
    });

    if (response.status === 401) {
      throw new Error("Invalid VirusTotal API key");
    }
    if (response.status === 429) {
      throw new Error("VirusTotal rate limit exceeded");
    }
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const attributes = data.data?.attributes || {};

    const result: VTResult = {
      ioc: ip,
      malicious: attributes.last_analysis_stats?.malicious || 0,
      suspicious: attributes.last_analysis_stats?.suspicious || 0,
      country: attributes.country,
      lastAnalysis: attributes.last_analysis_date,
    };

    cache.set(`ip:${ip}`, { data: result, timestamp: Date.now() });
    return result;
  } catch (error: any) {
    console.error("VirusTotal lookup error:", error);
    if (error.message.includes("rate limit")) {
      throw error;
    }
    return null;
  }
}

export async function lookupURL(url: string): Promise<VTResult | null> {
  const key = getVTKey();
  if (!key) return null;

  const cached = cache.get(`url:${url}`);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await rateLimit();

  try {
    // First submit URL for analysis
    const submitResponse = await fetch("https://www.virustotal.com/api/v3/urls", {
      method: "POST",
      headers: {
        "x-apikey": key,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `url=${encodeURIComponent(url)}`,
    });

    if (!submitResponse.ok) {
      return null;
    }

    const submitData = await submitResponse.json();
    const urlId = submitData.data?.id;

    if (!urlId) {
      return null;
    }

    // Get analysis results
    const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: {
        "x-apikey": key,
      },
    });

    if (!analysisResponse.ok) {
      return null;
    }

    const analysisData = await analysisResponse.json();
    const attributes = analysisData.data?.attributes || {};

    const result: VTResult = {
      ioc: url,
      malicious: attributes.last_analysis_stats?.malicious || 0,
      suspicious: attributes.last_analysis_stats?.suspicious || 0,
      lastAnalysis: attributes.last_analysis_date,
    };

    cache.set(`url:${url}`, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error("VirusTotal URL lookup error:", error);
    return null;
  }
}

export async function lookupHash(hash: string): Promise<VTResult | null> {
  const key = getVTKey();
  if (!key) return null;

  const cached = cache.get(`hash:${hash}`);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  await rateLimit();

  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      headers: {
        "x-apikey": key,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const attributes = data.data?.attributes || {};

    const result: VTResult = {
      ioc: hash,
      malicious: attributes.last_analysis_stats?.malicious || 0,
      suspicious: attributes.last_analysis_stats?.suspicious || 0,
      lastAnalysis: attributes.last_analysis_date,
    };

    cache.set(`hash:${hash}`, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.error("VirusTotal hash lookup error:", error);
    return null;
  }
}

export async function batchLookupIPs(ips: string[]): Promise<VTResult[]> {
  const results: VTResult[] = [];
  for (const ip of ips.slice(0, 10)) { // Limit to 10 per batch
    try {
      const result = await lookupIP(ip);
      if (result) {
        results.push(result);
      }
    } catch (error: any) {
      if (error.message.includes("rate limit")) {
        console.warn("VirusTotal rate limit reached");
        break;
      }
    }
  }
  return results;
}

