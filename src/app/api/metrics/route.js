import { NextResponse } from "next/server";

let metrics = {
  hits: 0,
  startTime: Date.now(),
  requests: {
    total: 0,
    successful: 0,
    failed: 0
  }
};

/**
 * System metrics endpoint
 * GET /api/metrics
 */
export async function GET() {
  metrics.hits++;
  metrics.requests.total++;
  
  try {
    const uptimeSeconds = Math.round((Date.now() - metrics.startTime) / 1000);
    const memUsage = process.memoryUsage();
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        humanReadable: formatUptime(uptimeSeconds)
      },
      requests: {
        ...metrics.requests,
        successful: metrics.requests.successful + 1
      },
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        unit: "MB"
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    metrics.requests.successful++;
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    metrics.requests.failed++;
    console.error("Metrics error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to collect metrics",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${secs}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}
