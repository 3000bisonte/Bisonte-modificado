// 📊 Security logging and monitoring system
import prisma from '../libs/prisma';

/**
 * 🔍 Security event types
 */
export const SecurityEvents = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGIN_BLOCKED: 'login_blocked',
  OAUTH_SUCCESS: 'oauth_success',
  OAUTH_FAILED: 'oauth_failed',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PASSWORD_RESET_SUCCESS: 'password_reset_success',
  ACCOUNT_LOCKED: 'account_locked',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
};

/**
 * 📊 Log security event
 * @param {string} event - Event type
 * @param {object} data - Event data
 */
export async function logSecurityEvent(event, data) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    userId: data.userId || null,
    email: data.email || null,
    ip: data.ip || 'unknown',
    userAgent: data.userAgent ? data.userAgent.substring(0, 500) : 'unknown',
    success: data.success || false,
    riskScore: await calculateRiskScore(data),
    metadata: {
      country: data.country || null,
      isNewDevice: data.isNewDevice || false,
      sessionId: data.sessionId || null,
      attempts: data.attempts || 0,
      ...data.metadata
    }
  };

  // 📝 Console logging (structured for production log aggregation)
  console.log(`[SECURITY] ${JSON.stringify(logEntry)}`);

  // 💾 Store in database for analysis
  try {
    await prisma.securityLog.create({
      data: {
        event: logEntry.event,
        userId: logEntry.userId,
        email: logEntry.email,
        ip: logEntry.ip,
        userAgent: logEntry.userAgent,
        success: logEntry.success,
        riskScore: logEntry.riskScore,
        metadata: logEntry.metadata,
        timestamp: new Date(logEntry.timestamp)
      }
    });
  } catch (dbError) {
    console.error('[SECURITY] Failed to store security log:', dbError);
    // Don't throw - logging shouldn't break the application
  }

  // 🚨 Real-time alerts for high-risk events
  if (logEntry.riskScore > 0.8 || event === SecurityEvents.SUSPICIOUS_ACTIVITY) {
    await sendSecurityAlert(logEntry);
  }

  return logEntry;
}

/**
 * 🎯 Calculate risk score for security event
 * @param {object} data - Event data
 * @returns {number} Risk score (0-1)
 */
async function calculateRiskScore(data) {
  let risk = 0;

  try {
    // 🌍 Geographic anomaly
    if (data.email && data.country) {
      const lastLogin = await getLastSuccessfulLogin(data.email);
      if (lastLogin && lastLogin.country && lastLogin.country !== data.country) {
        risk += 0.4; // Different country
      }
    }

    // ⏰ Time anomaly (unusual hours)
    const hour = new Date().getHours();
    if (hour < 6 || hour > 23) {
      risk += 0.2;
    }

    // 📱 Device anomaly
    if (data.isNewDevice) {
      risk += 0.3;
    }

    // 🔄 Recent failures
    if (data.email) {
      const recentFailures = await getRecentFailedAttempts(data.email);
      if (recentFailures >= 3) {
        risk += 0.4;
      }
    }

    // 🕒 Time between attempts (too fast = bot)
    if (data.timeBetweenAttempts && data.timeBetweenAttempts < 2000) { // < 2 seconds
      risk += 0.5;
    }

    // 🔍 IP reputation (if available)
    if (data.isKnownMaliciousIP) {
      risk += 0.8;
    }

  } catch (error) {
    console.error('[SECURITY] Error calculating risk score:', error);
    return 0.5; // Default medium risk if calculation fails
  }

  return Math.min(risk, 1.0);
}

/**
 * 📧 Send security alert for high-risk events
 * @param {object} logEntry - Security log entry
 */
async function sendSecurityAlert(logEntry) {
  try {
    // 🔔 In production, integrate with:
    // - Slack notifications
    // - Email alerts to security team
    // - SMS for critical events
    // - PagerDuty for incidents
    
    console.warn(`[SECURITY ALERT] High-risk event detected:`, {
      event: logEntry.event,
      email: logEntry.email,
      ip: logEntry.ip,
      riskScore: logEntry.riskScore,
      timestamp: logEntry.timestamp
    });

    // Example Slack webhook (implement in production)
    if (process.env.SLACK_SECURITY_WEBHOOK) {
      await fetch(process.env.SLACK_SECURITY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Security Alert: ${logEntry.event}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Event', value: logEntry.event, short: true },
              { title: 'Email', value: logEntry.email || 'N/A', short: true },
              { title: 'IP', value: logEntry.ip, short: true },
              { title: 'Risk Score', value: logEntry.riskScore.toFixed(2), short: true }
            ]
          }]
        })
      });
    }

  } catch (error) {
    console.error('[SECURITY] Failed to send alert:', error);
  }
}

/**
 * 📊 Get recent failed login attempts for email
 * @param {string} email - User email
 * @returns {number} Number of recent failed attempts
 */
async function getRecentFailedAttempts(email) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const count = await prisma.securityLog.count({
      where: {
        email: email.toLowerCase(),
        event: SecurityEvents.LOGIN_FAILED,
        timestamp: { gte: oneHourAgo }
      }
    });

    return count;
  } catch (error) {
    console.error('[SECURITY] Error getting recent failed attempts:', error);
    return 0;
  }
}

/**
 * 📍 Get last successful login location
 * @param {string} email - User email
 * @returns {object|null} Last login data
 */
async function getLastSuccessfulLogin(email) {
  try {
    const lastLogin = await prisma.securityLog.findFirst({
      where: {
        email: email.toLowerCase(),
        event: SecurityEvents.LOGIN_SUCCESS,
        success: true
      },
      orderBy: { timestamp: 'desc' },
      select: {
        ip: true,
        timestamp: true,
        metadata: true
      }
    });

    return lastLogin ? {
      ip: lastLogin.ip,
      timestamp: lastLogin.timestamp,
      country: lastLogin.metadata?.country || null
    } : null;

  } catch (error) {
    console.error('[SECURITY] Error getting last successful login:', error);
    return null;
  }
}

/**
 * 📈 Get security analytics for dashboard
 * @param {object} filters - Analytics filters
 * @returns {object} Security analytics data
 */
export async function getSecurityAnalytics(filters = {}) {
  try {
    const { 
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate = new Date(),
      event = null 
    } = filters;

    const whereClause = {
      timestamp: { gte: startDate, lte: endDate },
      ...(event ? { event } : {})
    };

    // 📊 Event counts by type
    const eventCounts = await prisma.securityLog.groupBy({
      by: ['event'],
      where: whereClause,
      _count: { event: true }
    });

    // 📈 Events over time (daily)
    const dailyEvents = await prisma.securityLog.groupBy({
      by: ['timestamp'],
      where: whereClause,
      _count: { event: true }
    });

    // 🔝 Top IPs
    const topIPs = await prisma.securityLog.groupBy({
      by: ['ip'],
      where: whereClause,
      _count: { ip: true },
      orderBy: { _count: { ip: 'desc' } },
      take: 10
    });

    // 🚨 High-risk events
    const highRiskEvents = await prisma.securityLog.findMany({
      where: {
        ...whereClause,
        riskScore: { gte: 0.8 }
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    });

    return {
      eventCounts: eventCounts.map(e => ({ event: e.event, count: e._count.event })),
      dailyEvents,
      topIPs: topIPs.map(ip => ({ ip: ip.ip, count: ip._count.ip })),
      highRiskEvents,
      totalEvents: eventCounts.reduce((sum, e) => sum + e._count.event, 0)
    };

  } catch (error) {
    console.error('[SECURITY] Error getting analytics:', error);
    return {
      eventCounts: [],
      dailyEvents: [],
      topIPs: [],
      highRiskEvents: [],
      totalEvents: 0
    };
  }
}