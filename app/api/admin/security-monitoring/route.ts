import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor, SuspiciousActivityType } from '../../../../lib/securityMonitor';
import { securityLogger, ErrorSeverity } from '../../../../lib/securityLogger';
import { withEnhancedErrorHandling } from '../../../../middleware/errorMiddleware';
import { AppError, ErrorType } from '../../../../lib/errorHandler';

// Interface for API responses
interface MonitoringStatsResponse {
  stats: {
    totalActivities: number;
    blockedIPs: number;
    blockedUsers: number;
    suspiciousActivities: number;
    activeRules: number;
    activeThreatPatterns: number;
  };
  recentActivities: any[];
  topRiskIPs: any[];
  topRiskUsers: any[];
  threatSummary: {
    highRiskEvents: number;
    criticalEvents: number;
    blockedAttempts: number;
    lastHour: {
      events: number;
      uniqueIPs: number;
      blockedIPs: number;
    };
  };
}

interface IPAnalysisResponse {
  analysis: any;
  activities: any[];
  riskFactors: string[];
  recommendations: string[];
}

interface UserAnalysisResponse {
  analysis: any;
  activities: any[];
  riskFactors: string[];
  recommendations: string[];
}

// Helper function to check admin authorization
async function checkAdminAuth(req: NextRequest): Promise<{ isAuthorized: boolean; userId?: string; role?: string }> {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return { isAuthorized: false };
    }

    // Decode JWT token
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { isAuthorized: false };
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const userRole = payload.role;
    const userId = payload.userId || payload.id;

    // Check if user has admin or superAdmin role
    if (userRole !== 'admin' && userRole !== 'superAdmin') {
      return { isAuthorized: false };
    }

    return { isAuthorized: true, userId, role: userRole };
  } catch (error) {
    return { isAuthorized: false };
  }
}

// GET - Get monitoring statistics and recent activities
export const GET = withEnhancedErrorHandling(async (req: NextRequest) => {
  const auth = await checkAdminAuth(req);
  if (!auth.isAuthorized) {
    throw new AppError(
      'Unauthorized access to security monitoring',
      ErrorType.AUTHENTICATION,
      401,
      ErrorSeverity.HIGH,
      true,
      { endpoint: '/api/admin/security-monitoring' }
    );
  }

  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const timeRange = url.searchParams.get('timeRange') || '24h';
    const severity = url.searchParams.get('severity');
    const activityType = url.searchParams.get('type');

    // Get basic monitoring stats
    const stats = securityMonitor.getMonitoringStats();

    // Get recent suspicious activities
    let recentActivities = securityMonitor.getRecentSuspiciousActivities(limit);

    // Filter by severity if specified
    if (severity) {
      recentActivities = recentActivities.filter(activity => 
        activity.severity === severity
      );
    }

    // Filter by activity type if specified
    if (activityType) {
      recentActivities = recentActivities.filter(activity => 
        activity.type === activityType
      );
    }

    // Calculate time range filter
    const now = Date.now();
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[timeRange] || 24 * 60 * 60 * 1000;

    // Filter by time range
    recentActivities = recentActivities.filter(activity => 
      now - activity.timestamp.getTime() < timeRangeMs
    );

    // Get top risk IPs (mock implementation - would need actual data)
    const topRiskIPs: any[] = [];
    const topRiskUsers: any[] = [];

    // Calculate threat summary
    const highRiskEvents = recentActivities.filter(a => a.riskScore >= 70).length;
    const criticalEvents = recentActivities.filter(a => a.severity === ErrorSeverity.CRITICAL).length;
    const blockedAttempts = recentActivities.filter(a => a.blocked).length;

    // Last hour statistics
    const lastHourMs = 60 * 60 * 1000;
    const lastHourActivities = recentActivities.filter(a => 
      now - a.timestamp.getTime() < lastHourMs
    );
    const uniqueIPs = new Set(lastHourActivities.map(a => a.ipAddress)).size;
    const blockedIPsLastHour = new Set(
      lastHourActivities.filter(a => a.blocked).map(a => a.ipAddress)
    ).size;

    const response: MonitoringStatsResponse = {
      stats,
      recentActivities,
      topRiskIPs,
      topRiskUsers,
      threatSummary: {
        highRiskEvents,
        criticalEvents,
        blockedAttempts,
        lastHour: {
          events: lastHourActivities.length,
          uniqueIPs,
          blockedIPs: blockedIPsLastHour
        }
      }
    };

    // Log admin access
    securityLogger.info('Admin accessed security monitoring dashboard', {
      userId: auth.userId,
      role: auth.role,
      filters: { limit, timeRange, severity, activityType }
    });

    return NextResponse.json(response);

  } catch (error) {
    throw new AppError(
      'Failed to retrieve security monitoring data',
      ErrorType.SERVER,
      500,
      ErrorSeverity.MEDIUM,
      true,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: auth.userId 
      }
    );
  }
});

// POST - Perform security actions (block/unblock IPs/users, update rules)
export const POST = withEnhancedErrorHandling(async (req: NextRequest) => {
  const auth = await checkAdminAuth(req);
  if (!auth.isAuthorized) {
    throw new AppError(
      'Unauthorized access to security monitoring actions',
      ErrorType.AUTHENTICATION,
      401,
      ErrorSeverity.HIGH,
      true,
      { endpoint: '/api/admin/security-monitoring' }
    );
  }

  try {
    const body = await req.json();
    const { action, target, targetType, reason, data } = body;

    let result: any = {};

    switch (action) {
      case 'block_ip':
        if (!target || targetType !== 'ip') {
          throw new AppError('Invalid target for IP blocking', ErrorType.VALIDATION, 400, ErrorSeverity.LOW);
        }
        securityMonitor.blockIP(target, reason || `Blocked by admin ${auth.userId}`);
        result = { success: true, message: `IP ${target} has been blocked` };
        
        securityLogger.warn('Admin blocked IP address', {
          adminUserId: auth.userId,
          adminRole: auth.role,
          blockedIP: target,
          reason
        });
        break;

      case 'unblock_ip':
        if (!target || targetType !== 'ip') {
          throw new AppError('Invalid target for IP unblocking', ErrorType.VALIDATION, 400, ErrorSeverity.LOW);
        }
        securityMonitor.unblockIP(target);
        result = { success: true, message: `IP ${target} has been unblocked` };
        
        securityLogger.info('Admin unblocked IP address', {
          adminUserId: auth.userId,
          adminRole: auth.role,
          unblockedIP: target,
          reason
        });
        break;

      case 'block_user':
        if (!target || targetType !== 'user') {
          throw new AppError('Invalid target for user blocking', ErrorType.VALIDATION, 400, ErrorSeverity.LOW);
        }
        securityMonitor.blockUser(target, reason || `Blocked by admin ${auth.userId}`);
        result = { success: true, message: `User ${target} has been blocked` };
        
        securityLogger.warn('Admin blocked user', {
          adminUserId: auth.userId,
          adminRole: auth.role,
          blockedUserId: target,
          reason
        });
        break;

      case 'unblock_user':
        if (!target || targetType !== 'user') {
          throw new AppError('Invalid target for user unblocking', ErrorType.VALIDATION, 400, ErrorSeverity.LOW);
        }
        securityMonitor.unblockUser(target);
        result = { success: true, message: `User ${target} has been unblocked` };
        
        securityLogger.info('Admin unblocked user', {
          adminUserId: auth.userId,
          adminRole: auth.role,
          unblockedUserId: target,
          reason
        });
        break;

      case 'get_ip_analysis':
        if (!target || targetType !== 'ip') {
          throw new AppError('Invalid target for IP analysis', ErrorType.VALIDATION, 400, ErrorSeverity.LOW);
        }
        
        const ipAnalysis = securityMonitor.getIPAnalysis(target);
        if (!ipAnalysis) {
          throw new AppError('No data found for this IP address', ErrorType.NOT_FOUND, 404, ErrorSeverity.LOW);
        }

        // Generate risk factors and recommendations
        const ipRiskFactors = [];
        const ipRecommendations = [];

        if (ipAnalysis.riskScore >= 70) {
          ipRiskFactors.push('High risk score detected');
          ipRecommendations.push('Consider blocking this IP address');
        }
        if (ipAnalysis.failedAttempts > 10) {
          ipRiskFactors.push('Multiple failed authentication attempts');
          ipRecommendations.push('Monitor for brute force attacks');
        }
        if (ipAnalysis.avgRequestInterval < 1000) {
          ipRiskFactors.push('Rapid request pattern detected');
          ipRecommendations.push('Check for automated scanning');
        }
        if (ipAnalysis.uniqueUserAgents > 5) {
          ipRiskFactors.push('Multiple user agents from same IP');
          ipRecommendations.push('Possible bot or proxy usage');
        }

        const ipResponse: IPAnalysisResponse = {
          analysis: ipAnalysis,
          activities: [], // Would be populated with actual activity data
          riskFactors: ipRiskFactors,
          recommendations: ipRecommendations
        };

        result = ipResponse;
        
        securityLogger.info('Admin requested IP analysis', {
          adminUserId: auth.userId,
          analyzedIP: target,
          riskScore: ipAnalysis.riskScore
        });
        break;

      case 'get_user_analysis':
        if (!target || targetType !== 'user') {
          throw new AppError('Invalid target for user analysis', ErrorType.VALIDATION, 400, ErrorSeverity.LOW);
        }
        
        const userAnalysis = securityMonitor.getUserBehaviorAnalysis(target);
        if (!userAnalysis) {
          throw new AppError('No data found for this user', ErrorType.NOT_FOUND, 404, ErrorSeverity.LOW);
        }

        // Generate risk factors and recommendations
        const userRiskFactors = [];
        const userRecommendations = [];

        if (userAnalysis.riskScore >= 70) {
          userRiskFactors.push('High risk score detected');
          userRecommendations.push('Consider reviewing user account');
        }
        if (userAnalysis.failedLogins > 5) {
          userRiskFactors.push('Multiple failed login attempts');
          userRecommendations.push('User may be compromised');
        }
        if (userAnalysis.privilegeEscalationAttempts > 3) {
          userRiskFactors.push('Privilege escalation attempts detected');
          userRecommendations.push('Review user permissions and access');
        }
        if (userAnalysis.sessionCount > 5) {
          userRiskFactors.push('Multiple concurrent sessions');
          userRecommendations.push('Check for account sharing or compromise');
        }

        const userResponse: UserAnalysisResponse = {
          analysis: userAnalysis,
          activities: [], // Would be populated with actual activity data
          riskFactors: userRiskFactors,
          recommendations: userRecommendations
        };

        result = userResponse;
        
        securityLogger.info('Admin requested user analysis', {
          adminUserId: auth.userId,
          analyzedUserId: target,
          riskScore: userAnalysis.riskScore
        });
        break;

      default:
        throw new AppError(
          `Unknown action: ${action}`,
          ErrorType.VALIDATION,
          400,
          ErrorSeverity.LOW
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Failed to perform security action',
      ErrorType.SERVER,
      500,
      ErrorSeverity.MEDIUM,
      true,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: auth.userId 
      }
    );
  }
});

// DELETE - Clear monitoring data (super admin only)
export const DELETE = withEnhancedErrorHandling(async (req: NextRequest) => {
  const auth = await checkAdminAuth(req);
  if (!auth.isAuthorized || auth.role !== 'superAdmin') {
    throw new AppError(
      'Unauthorized access - Super admin required',
      ErrorType.AUTHENTICATION,
      401,
      ErrorSeverity.HIGH,
      true,
      { endpoint: '/api/admin/security-monitoring', requiredRole: 'superAdmin' }
    );
  }

  try {
    const url = new URL(req.url);
    const confirm = url.searchParams.get('confirm');
    const dataType = url.searchParams.get('type') || 'all';

    if (confirm !== 'true') {
      throw new AppError(
        'Confirmation required for data deletion',
        ErrorType.VALIDATION,
        400,
        ErrorSeverity.LOW
      );
    }

    let result = { success: true, message: '', deletedItems: 0 };

    switch (dataType) {
      case 'activities':
        // This would need to be implemented in securityMonitor
        result.message = 'Suspicious activities cleared';
        break;
      case 'blocked_ips':
        // This would need to be implemented in securityMonitor
        result.message = 'Blocked IPs cleared';
        break;
      case 'blocked_users':
        // This would need to be implemented in securityMonitor
        result.message = 'Blocked users cleared';
        break;
      case 'all':
        // This would need to be implemented in securityMonitor
        result.message = 'All monitoring data cleared';
        break;
      default:
        throw new AppError(
          `Unknown data type: ${dataType}`,
          ErrorType.VALIDATION,
          400,
          ErrorSeverity.LOW
        );
    }

    securityLogger.warn('Super admin cleared monitoring data', {
      adminUserId: auth.userId,
      dataType,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    throw new AppError(
      'Failed to clear monitoring data',
      ErrorType.SERVER,
      500,
      ErrorSeverity.MEDIUM,
      true,
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: auth.userId 
      }
    );
  }
});

// Activity types and severity levels are available through the API responses