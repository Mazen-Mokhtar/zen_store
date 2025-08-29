import { NextRequest, NextResponse } from 'next/server';
import { securityLogger, SecurityEventType, LogLevel } from '../../../../lib/securityLogger';
import { withEnhancedErrorHandling } from '../../../../middleware/errorMiddleware';
import { AppError, ErrorType, ErrorSeverity } from '../../../../lib/errorHandler';

// GET /api/admin/security-logs - Get security logs and events
async function GET(request: NextRequest) {
  // Check if user is admin (this should be handled by middleware)
  const userRole = request.headers.get('x-user-role');
  if (userRole !== 'admin' && userRole !== 'superAdmin') {
    throw new AppError(
      'Access denied. Admin privileges required.',
      ErrorType.AUTHORIZATION,
      403,
      ErrorSeverity.MEDIUM
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all'; // 'logs', 'security', 'all'
  const limit = parseInt(searchParams.get('limit') || '50');
  const severity = searchParams.get('severity') as ErrorSeverity | null;
  const eventType = searchParams.get('eventType') as SecurityEventType | null;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const userId = searchParams.get('userId');
  const ipAddress = searchParams.get('ipAddress');

  try {
    let logs: any[] = [];
    let securityEvents: any[] = [];
    let stats = {
      totalLogs: 0,
      totalSecurityEvents: 0,
      highRiskEvents: 0,
      criticalErrors: 0,
      recentActivity: 0
    };

    // Get logs if requested
    if (type === 'logs' || type === 'all') {
      const allLogs = securityLogger.getLogs(1000); // Get more for filtering
      
      // Filter logs
      logs = allLogs.filter(log => {
        let matches = true;
        
        if (severity && log.level !== severity.toLowerCase()) matches = false;
        if (startDate && new Date(log.timestamp) < new Date(startDate)) matches = false;
        if (endDate && new Date(log.timestamp) > new Date(endDate)) matches = false;
        if (userId && log.userId !== userId) matches = false;
        
        return matches;
      }).slice(-limit);
      
      stats.totalLogs = logs.length;
      stats.criticalErrors = logs.filter(log => log.level === 'critical' || log.level === 'error').length;
    }

    // Get security events if requested
    if (type === 'security' || type === 'all') {
      const allEvents = securityLogger.getSecurityEvents(1000); // Get more for filtering
      
      // Filter security events
      securityEvents = allEvents.filter(event => {
        let matches = true;
        
        if (eventType && event.type !== eventType) matches = false;
        if (severity && event.severity !== severity) matches = false;
        if (startDate && new Date(event.timestamp) < new Date(startDate)) matches = false;
        if (endDate && new Date(event.timestamp) > new Date(endDate)) matches = false;
        if (userId && event.userId !== userId) matches = false;
        if (ipAddress && event.ipAddress !== ipAddress) matches = false;
        
        return matches;
      }).slice(-limit);
      
      stats.totalSecurityEvents = securityEvents.length;
      stats.highRiskEvents = securityEvents.filter(event => event.riskScore >= 70).length;
    }

    // Calculate recent activity (last 24 hours)
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    stats.recentActivity = [
      ...logs.filter(log => new Date(log.timestamp) > last24Hours),
      ...securityEvents.filter(event => new Date(event.timestamp) > last24Hours)
    ].length;

    // Log admin access
    securityLogger.info('Security logs accessed by admin', {
      userId: request.headers.get('x-user-id'),
      sessionId: request.headers.get('x-session-id'),
      component: 'SecurityLogsAPI',
      action: 'view_logs',
      additionalContext: {
        type,
        limit,
        filters: {
          severity,
          eventType,
          startDate,
          endDate,
          userId: userId || undefined,
          ipAddress: ipAddress || undefined
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        logs: type === 'security' ? [] : logs,
        securityEvents: type === 'logs' ? [] : securityEvents,
        stats,
        filters: {
          type,
          limit,
          severity,
          eventType,
          startDate,
          endDate,
          userId,
          ipAddress
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    throw new AppError(
      'Failed to retrieve security logs',
      ErrorType.SERVER,
      500,
      ErrorSeverity.MEDIUM,
      true,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// POST /api/admin/security-logs/export - Export security logs
async function POST(request: NextRequest) {
  // Check if user is admin
  const userRole = request.headers.get('x-user-role');
  if (userRole !== 'admin' && userRole !== 'superAdmin') {
    throw new AppError(
      'Access denied. Admin privileges required.',
      ErrorType.AUTHORIZATION,
      403,
      ErrorSeverity.MEDIUM
    );
  }

  try {
    const body = await request.json();
    const { format = 'json', includeContext = false } = body;

    // Get all logs and events
    const exportData = securityLogger.exportLogs();
    
    // Sanitize data if context is not included
    if (!includeContext) {
      exportData.logs = exportData.logs.map(log => ({
        id: log.id,
        level: log.level,
        timestamp: log.timestamp,
        message: log.message,
        userId: log.userId,
        sessionId: log.sessionId,
        component: log.component,
        action: log.action,
        duration: log.duration
      }));
      
      exportData.securityEvents = exportData.securityEvents.map(event => ({
        id: event.id,
        type: event.type,
        severity: event.severity,
        timestamp: event.timestamp,
        userId: event.userId,
        sessionId: event.sessionId,
        ipAddress: event.ipAddress,
        url: event.url,
        method: event.method,
        message: event.message,
        blocked: event.blocked,
        riskScore: event.riskScore
      }));
    }

    // Log export action
    securityLogger.info('Security logs exported by admin', {
      userId: request.headers.get('x-user-id'),
      sessionId: request.headers.get('x-session-id'),
      component: 'SecurityLogsAPI',
      action: 'export_logs',
      additionalContext: {
        format,
        includeContext,
        logsCount: exportData.logs.length,
        eventsCount: exportData.securityEvents.length
      }
    });

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="security-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return NextResponse.json({
      success: true,
      data: exportData,
      exportInfo: {
        format,
        includeContext,
        exportedAt: new Date().toISOString(),
        logsCount: exportData.logs.length,
        eventsCount: exportData.securityEvents.length
      }
    });
  } catch (error) {
    throw new AppError(
      'Failed to export security logs',
      ErrorType.SERVER,
      500,
      ErrorSeverity.MEDIUM,
      true,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// DELETE /api/admin/security-logs - Clear old logs
async function DELETE(request: NextRequest) {
  // Check if user is superAdmin (only superAdmin can delete logs)
  const userRole = request.headers.get('x-user-role');
  if (userRole !== 'superAdmin') {
    throw new AppError(
      'Access denied. Super admin privileges required.',
      ErrorType.AUTHORIZATION,
      403,
      ErrorSeverity.HIGH
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan'); // ISO date string
    const confirm = searchParams.get('confirm') === 'true';

    if (!confirm) {
      throw new AppError(
        'Confirmation required to delete logs',
        ErrorType.VALIDATION,
        400,
        ErrorSeverity.MEDIUM
      );
    }

    // Log the deletion attempt
    securityLogger.critical('Security logs deletion requested', {
      userId: request.headers.get('x-user-id'),
      sessionId: request.headers.get('x-session-id'),
      component: 'SecurityLogsAPI',
      action: 'delete_logs',
      additionalContext: {
        olderThan,
        requestedBy: request.headers.get('x-user-id')
      }
    });

    if (olderThan) {
      // In a real implementation, you would filter and delete old logs
      // For now, we'll just clear all logs as this is a demo
      securityLogger.clearLogs();
    } else {
      securityLogger.clearLogs();
    }

    return NextResponse.json({
      success: true,
      message: 'Security logs cleared successfully',
      clearedAt: new Date().toISOString()
    });
  } catch (error) {
    throw new AppError(
      'Failed to clear security logs',
      ErrorType.SERVER,
      500,
      ErrorSeverity.HIGH,
      true,
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

// Helper function to convert data to CSV
function convertToCSV(data: { logs: any[]; securityEvents: any[] }): string {
  const csvRows: string[] = [];
  
  // Add logs section
  if (data.logs.length > 0) {
    csvRows.push('=== APPLICATION LOGS ===');
    csvRows.push('ID,Level,Timestamp,Message,User ID,Session ID,Component,Action,Duration');
    
    data.logs.forEach(log => {
      const row = [
        log.id,
        log.level,
        log.timestamp,
        `"${log.message.replace(/"/g, '""')}"`,
        log.userId || '',
        log.sessionId || '',
        log.component || '',
        log.action || '',
        log.duration || ''
      ].join(',');
      csvRows.push(row);
    });
    
    csvRows.push(''); // Empty line
  }
  
  // Add security events section
  if (data.securityEvents.length > 0) {
    csvRows.push('=== SECURITY EVENTS ===');
    csvRows.push('ID,Type,Severity,Timestamp,User ID,IP Address,URL,Method,Message,Blocked,Risk Score');
    
    data.securityEvents.forEach(event => {
      const row = [
        event.id,
        event.type,
        event.severity,
        event.timestamp,
        event.userId || '',
        event.ipAddress || '',
        event.url || '',
        event.method || '',
        `"${event.message.replace(/"/g, '""')}"`,
        event.blocked,
        event.riskScore
      ].join(',');
      csvRows.push(row);
    });
  }
  
  return csvRows.join('\n');
}

// Export handlers with error handling
export const GET_HANDLER = withEnhancedErrorHandling(GET);
export const POST_HANDLER = withEnhancedErrorHandling(POST);
export const DELETE_HANDLER = withEnhancedErrorHandling(DELETE);

export { GET_HANDLER as GET, POST_HANDLER as POST, DELETE_HANDLER as DELETE };