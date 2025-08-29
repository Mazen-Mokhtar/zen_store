import { SecurityEventType, ErrorSeverity, securityLogger } from './securityLogger';

// Enum for suspicious activity types
export enum SuspiciousActivityType {
  BRUTE_FORCE_ATTACK = 'brute_force_attack',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  ACCOUNT_ENUMERATION = 'account_enumeration',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  AUTOMATED_SCANNING = 'automated_scanning',
  SUSPICIOUS_USER_AGENT = 'suspicious_user_agent',
  RAPID_REQUESTS = 'rapid_requests',
  UNUSUAL_GEOGRAPHIC_ACCESS = 'unusual_geographic_access',
  SESSION_HIJACKING = 'session_hijacking',
  CSRF_ATTACK = 'csrf_attack',
  XSS_ATTACK = 'xss_attack',
  SQL_INJECTION = 'sql_injection',
  PATH_TRAVERSAL = 'path_traversal',
  MALICIOUS_FILE_UPLOAD = 'malicious_file_upload'
}

// Interfaces for monitoring
export interface SuspiciousActivity {
  id: string;
  type: SuspiciousActivityType;
  severity: ErrorSeverity;
  description: string;
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  riskScore: number;
  evidence: Record<string, any>;
  blocked: boolean;
  actionTaken?: string;
}

interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  indicators: string[];
  riskScore: number;
  autoBlock: boolean;
  enabled: boolean;
}

interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  condition: (activity: ActivityData) => boolean;
  severity: ErrorSeverity;
  riskScore: number;
  autoBlock: boolean;
  enabled: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
}

interface ActivityData {
  ipAddress: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  method?: string;
  timestamp: Date;
  headers?: Record<string, string>;
  body?: any;
  response?: {
    status: number;
    headers?: Record<string, string>;
  };
}

interface IPAnalysis {
  ipAddress: string;
  requestCount: number;
  failedAttempts: number;
  uniqueUserAgents: number;
  uniqueEndpoints: number;
  avgRequestInterval: number;
  suspiciousPatterns: string[];
  riskScore: number;
  isBlocked: boolean;
  firstSeen: Date;
  lastSeen: Date;
}

interface UserBehaviorAnalysis {
  userId: string;
  sessionCount: number;
  requestCount: number;
  failedLogins: number;
  privilegeEscalationAttempts: number;
  suspiciousActivities: string[];
  riskScore: number;
  isBlocked: boolean;
  firstSeen: Date;
  lastSeen: Date;
}

class SecurityMonitor {
  private activities: Map<string, ActivityData[]> = new Map(); // IP -> activities
  private userActivities: Map<string, ActivityData[]> = new Map(); // UserID -> activities
  private blockedIPs: Set<string> = new Set();
  private blockedUsers: Set<string> = new Set();
  private suspiciousActivities: SuspiciousActivity[] = [];
  private monitoringRules: MonitoringRule[] = [];
  private threatPatterns: ThreatPattern[] = [];
  private readonly maxActivitiesPerIP = 1000;
  private readonly maxActivitiesPerUser = 1000;
  private readonly cleanupIntervalMs = 60 * 60 * 1000; // 1 hour
  private readonly activityRetentionMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.initializeDefaultRules();
    this.initializeThreatPatterns();
    this.startCleanupTimer();
  }

  // Initialize default monitoring rules
  private initializeDefaultRules(): void {
    this.monitoringRules = [
      {
        id: 'rapid_requests',
        name: 'Rapid Request Detection',
        description: 'Detects unusually high request rates from a single IP',
        condition: (activity) => {
          const ipActivities = this.activities.get(activity.ipAddress) || [];
          const recentActivities = ipActivities.filter(
            a => Date.now() - a.timestamp.getTime() < 60000 // Last minute
          );
          return recentActivities.length > 100; // More than 100 requests per minute
        },
        severity: ErrorSeverity.HIGH,
        riskScore: 80,
        autoBlock: true,
        enabled: true,
        cooldownMs: 5 * 60 * 1000 // 5 minutes
      },
      {
        id: 'failed_auth_attempts',
        name: 'Failed Authentication Detection',
        description: 'Detects multiple failed authentication attempts',
        condition: (activity) => {
          const ipActivities = this.activities.get(activity.ipAddress) || [];
          const failedAttempts = ipActivities.filter(
            a => Date.now() - a.timestamp.getTime() < 300000 && // Last 5 minutes
                 a.response?.status === 401
          );
          return failedAttempts.length >= 5; // 5 failed attempts in 5 minutes
        },
        severity: ErrorSeverity.HIGH,
        riskScore: 75,
        autoBlock: true,
        enabled: true,
        cooldownMs: 10 * 60 * 1000 // 10 minutes
      },
      {
        id: 'suspicious_user_agent',
        name: 'Suspicious User Agent Detection',
        description: 'Detects known malicious or suspicious user agents',
        condition: (activity) => {
          const suspiciousAgents = [
            'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
            'python-requests', 'curl', 'wget', 'bot', 'crawler',
            'scanner', 'exploit', 'hack'
          ];
          const userAgent = activity.userAgent?.toLowerCase() || '';
          return suspiciousAgents.some(agent => userAgent.includes(agent));
        },
        severity: ErrorSeverity.MEDIUM,
        riskScore: 60,
        autoBlock: false,
        enabled: true,
        cooldownMs: 60 * 1000 // 1 minute
      },
      {
        id: 'admin_access_attempts',
        name: 'Admin Access Monitoring',
        description: 'Monitors unauthorized admin access attempts',
        condition: (activity) => {
          const adminPaths = ['/admin', '/administrator', '/wp-admin', '/phpmyadmin'];
          const isAdminPath = adminPaths.some(path => activity.url?.includes(path));
          return isAdminPath && activity.response?.status === 403;
        },
        severity: ErrorSeverity.HIGH,
        riskScore: 70,
        autoBlock: false,
        enabled: true,
        cooldownMs: 2 * 60 * 1000 // 2 minutes
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Detection',
        description: 'Detects attempts to escalate privileges',
        condition: (activity) => {
          if (!activity.userId) return false;
          const userActivities = this.userActivities.get(activity.userId) || [];
          const recentPrivilegeAttempts = userActivities.filter(
            a => Date.now() - a.timestamp.getTime() < 600000 && // Last 10 minutes
                 (a.response?.status === 403 || a.response?.status === 401)
          );
          return recentPrivilegeAttempts.length >= 3;
        },
        severity: ErrorSeverity.CRITICAL,
        riskScore: 90,
        autoBlock: true,
        enabled: true,
        cooldownMs: 15 * 60 * 1000 // 15 minutes
      }
    ];
  }

  // Initialize threat patterns
  private initializeThreatPatterns(): void {
    this.threatPatterns = [
      {
        id: 'sql_injection_pattern',
        name: 'SQL Injection Pattern',
        description: 'Common SQL injection attack patterns',
        indicators: [
          "' OR '1'='1", "' OR 1=1--", "'; DROP TABLE", "UNION SELECT",
          "' AND 1=1--", "' HAVING 1=1--", "' ORDER BY", "' GROUP BY"
        ],
        riskScore: 85,
        autoBlock: true,
        enabled: true
      },
      {
        id: 'xss_pattern',
        name: 'XSS Attack Pattern',
        description: 'Cross-site scripting attack patterns',
        indicators: [
          '<script>', '</script>', 'javascript:', 'onload=', 'onerror=',
          'onclick=', 'onmouseover=', 'alert(', 'document.cookie'
        ],
        riskScore: 75,
        autoBlock: true,
        enabled: true
      },
      {
        id: 'path_traversal_pattern',
        name: 'Path Traversal Pattern',
        description: 'Directory traversal attack patterns',
        indicators: [
          '../', '..\\', '%2e%2e%2f', '%2e%2e%5c', '....///',
          '/etc/passwd', '/etc/shadow', 'C:\\Windows\\System32'
        ],
        riskScore: 70,
        autoBlock: true,
        enabled: true
      },
      {
        id: 'command_injection_pattern',
        name: 'Command Injection Pattern',
        description: 'OS command injection patterns',
        indicators: [
          '; cat ', '; ls ', '; dir ', '| cat ', '| ls ', '| dir ',
          '&& cat ', '&& ls ', '&& dir ', '`cat ', '`ls ', '`dir '
        ],
        riskScore: 80,
        autoBlock: true,
        enabled: true
      }
    ];
  }

  // Record activity for monitoring
  public recordActivity(activity: ActivityData): void {
    try {
      // Store activity by IP
      if (!this.activities.has(activity.ipAddress)) {
        this.activities.set(activity.ipAddress, []);
      }
      const ipActivities = this.activities.get(activity.ipAddress)!;
      ipActivities.push(activity);
      
      // Limit activities per IP
      if (ipActivities.length > this.maxActivitiesPerIP) {
        ipActivities.shift();
      }

      // Store activity by user if available
      if (activity.userId) {
        if (!this.userActivities.has(activity.userId)) {
          this.userActivities.set(activity.userId, []);
        }
        const userActivities = this.userActivities.get(activity.userId)!;
        userActivities.push(activity);
        
        // Limit activities per user
        if (userActivities.length > this.maxActivitiesPerUser) {
          userActivities.shift();
        }
      }

      // Check for suspicious patterns
      this.analyzeActivity(activity);
      
    } catch (error) {
      securityLogger.error('Failed to record activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: activity.ipAddress
      });
    }
  }

  // Analyze activity for suspicious patterns
  private analyzeActivity(activity: ActivityData): void {
    try {
      // Check monitoring rules
      for (const rule of this.monitoringRules) {
        if (!rule.enabled) continue;
        
        // Check cooldown
        if (rule.lastTriggered && 
            Date.now() - rule.lastTriggered.getTime() < rule.cooldownMs) {
          continue;
        }

        if (rule.condition(activity)) {
          this.triggerSuspiciousActivity({
            type: this.mapRuleToActivityType(rule.id),
            severity: rule.severity,
            description: `${rule.name}: ${rule.description}`,
            ipAddress: activity.ipAddress,
            userAgent: activity.userAgent,
            userId: activity.userId,
            sessionId: activity.sessionId,
            riskScore: rule.riskScore,
            evidence: {
              rule: rule.name,
              activity: {
                url: activity.url,
                method: activity.method,
                timestamp: activity.timestamp
              }
            },
            blocked: rule.autoBlock
          });

          rule.lastTriggered = new Date();
          
          if (rule.autoBlock) {
            this.blockIP(activity.ipAddress, `Blocked by rule: ${rule.name}`);
          }
        }
      }

      // Check threat patterns
      this.checkThreatPatterns(activity);
      
    } catch (error) {
      securityLogger.error('Failed to analyze activity', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: activity.ipAddress
      });
    }
  }

  // Check for threat patterns in request data
  private checkThreatPatterns(activity: ActivityData): void {
    const searchableContent = [
      activity.url || '',
      JSON.stringify(activity.body || {}),
      JSON.stringify(activity.headers || {})
    ].join(' ').toLowerCase();

    for (const pattern of this.threatPatterns) {
      if (!pattern.enabled) continue;

      const matchedIndicators = pattern.indicators.filter(indicator => 
        searchableContent.includes(indicator.toLowerCase())
      );

      if (matchedIndicators.length > 0) {
        this.triggerSuspiciousActivity({
          type: this.mapPatternToActivityType(pattern.id),
          severity: pattern.riskScore >= 80 ? ErrorSeverity.CRITICAL :
                   pattern.riskScore >= 60 ? ErrorSeverity.HIGH :
                   pattern.riskScore >= 40 ? ErrorSeverity.MEDIUM : ErrorSeverity.LOW,
          description: `${pattern.name} detected: ${matchedIndicators.join(', ')}`,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
          userId: activity.userId,
          sessionId: activity.sessionId,
          riskScore: pattern.riskScore,
          evidence: {
            pattern: pattern.name,
            indicators: matchedIndicators,
            activity: {
              url: activity.url,
              method: activity.method,
              timestamp: activity.timestamp
            }
          },
          blocked: pattern.autoBlock
        });

        if (pattern.autoBlock) {
          this.blockIP(activity.ipAddress, `Blocked by threat pattern: ${pattern.name}`);
        }
      }
    }
  }

  // Trigger suspicious activity alert
  private triggerSuspiciousActivity(params: Omit<SuspiciousActivity, 'id' | 'timestamp' | 'actionTaken'>): void {
    const suspiciousActivity: SuspiciousActivity = {
      id: this.generateId(),
      timestamp: new Date(),
      actionTaken: params.blocked ? 'IP Blocked' : 'Logged',
      ...params
    };

    this.suspiciousActivities.push(suspiciousActivity);

    // Log security event
    securityLogger.logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      params.description,
      {
        userId: params.userId,
        sessionId: params.sessionId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        blocked: params.blocked,
        additionalContext: params.evidence
      }
    );

    // Keep only recent suspicious activities
    if (this.suspiciousActivities.length > 1000) {
      this.suspiciousActivities = this.suspiciousActivities.slice(-500);
    }
  }

  // Block IP address
  public blockIP(ipAddress: string, reason: string): void {
    this.blockedIPs.add(ipAddress);
    
    securityLogger.logSecurityEvent(
      SecurityEventType.ACCESS_VIOLATION,
      `IP address blocked: ${reason}`,
      {
        ipAddress,
        blocked: true,
        additionalContext: { reason, timestamp: new Date().toISOString() }
      }
    );
  }

  // Block user
  public blockUser(userId: string, reason: string): void {
    this.blockedUsers.add(userId);
    
    securityLogger.logSecurityEvent(
      SecurityEventType.ACCOUNT_LOCKOUT,
      `User blocked: ${reason}`,
      {
        userId,
        blocked: true,
        additionalContext: { reason, timestamp: new Date().toISOString() }
      }
    );
  }

  // Check if IP is blocked
  public isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  // Check if user is blocked
  public isUserBlocked(userId: string): boolean {
    return this.blockedUsers.has(userId);
  }

  // Unblock IP address
  public unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress);
    
    securityLogger.info(`IP address unblocked: ${ipAddress}`);
  }

  // Unblock user
  public unblockUser(userId: string): void {
    this.blockedUsers.delete(userId);
    
    securityLogger.info(`User unblocked: ${userId}`);
  }

  // Get IP analysis
  public getIPAnalysis(ipAddress: string): IPAnalysis | null {
    const activities = this.activities.get(ipAddress);
    if (!activities || activities.length === 0) return null;

    const now = Date.now();
    const recentActivities = activities.filter(
      a => now - a.timestamp.getTime() < this.activityRetentionMs
    );

    if (recentActivities.length === 0) return null;

    const failedAttempts = recentActivities.filter(
      a => a.response?.status && a.response.status >= 400
    ).length;

    const uniqueUserAgents = new Set(
      recentActivities.map(a => a.userAgent).filter(Boolean)
    ).size;

    const uniqueEndpoints = new Set(
      recentActivities.map(a => a.url).filter(Boolean)
    ).size;

    const intervals = [];
    for (let i = 1; i < recentActivities.length; i++) {
      intervals.push(
        recentActivities[i].timestamp.getTime() - recentActivities[i-1].timestamp.getTime()
      );
    }
    const avgRequestInterval = intervals.length > 0 
      ? intervals.reduce((a, b) => a + b, 0) / intervals.length 
      : 0;

    // Calculate risk score
    let riskScore = 0;
    if (recentActivities.length > 100) riskScore += 30;
    if (failedAttempts > 10) riskScore += 25;
    if (uniqueUserAgents > 5) riskScore += 15;
    if (avgRequestInterval < 1000) riskScore += 20; // Less than 1 second between requests
    if (uniqueEndpoints > 50) riskScore += 10;

    return {
      ipAddress,
      requestCount: recentActivities.length,
      failedAttempts,
      uniqueUserAgents,
      uniqueEndpoints,
      avgRequestInterval,
      suspiciousPatterns: [], // Would be populated with detected patterns
      riskScore: Math.min(riskScore, 100),
      isBlocked: this.isIPBlocked(ipAddress),
      firstSeen: new Date(Math.min(...recentActivities.map(a => a.timestamp.getTime()))),
      lastSeen: new Date(Math.max(...recentActivities.map(a => a.timestamp.getTime())))
    };
  }

  // Get user behavior analysis
  public getUserBehaviorAnalysis(userId: string): UserBehaviorAnalysis | null {
    const activities = this.userActivities.get(userId);
    if (!activities || activities.length === 0) return null;

    const now = Date.now();
    const recentActivities = activities.filter(
      a => now - a.timestamp.getTime() < this.activityRetentionMs
    );

    if (recentActivities.length === 0) return null;

    const sessionIds = new Set(recentActivities.map(a => a.sessionId).filter(Boolean));
    const failedLogins = recentActivities.filter(
      a => a.url?.includes('/auth/') && a.response?.status === 401
    ).length;
    const privilegeEscalationAttempts = recentActivities.filter(
      a => a.response?.status === 403
    ).length;

    // Calculate risk score
    let riskScore = 0;
    if (failedLogins > 5) riskScore += 30;
    if (privilegeEscalationAttempts > 3) riskScore += 40;
    if (sessionIds.size > 5) riskScore += 20; // Multiple concurrent sessions
    if (recentActivities.length > 500) riskScore += 10; // High activity

    return {
      userId,
      sessionCount: sessionIds.size,
      requestCount: recentActivities.length,
      failedLogins,
      privilegeEscalationAttempts,
      suspiciousActivities: [], // Would be populated with detected activities
      riskScore: Math.min(riskScore, 100),
      isBlocked: this.isUserBlocked(userId),
      firstSeen: new Date(Math.min(...recentActivities.map(a => a.timestamp.getTime()))),
      lastSeen: new Date(Math.max(...recentActivities.map(a => a.timestamp.getTime())))
    };
  }

  // Get recent suspicious activities
  public getRecentSuspiciousActivities(limit: number = 50): SuspiciousActivity[] {
    return this.suspiciousActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get monitoring statistics
  public getMonitoringStats(): {
    totalActivities: number;
    blockedIPs: number;
    blockedUsers: number;
    suspiciousActivities: number;
    activeRules: number;
    activeThreatPatterns: number;
  } {
    const totalActivities = Array.from(this.activities.values())
      .reduce((sum, activities) => sum + activities.length, 0);

    return {
      totalActivities,
      blockedIPs: this.blockedIPs.size,
      blockedUsers: this.blockedUsers.size,
      suspiciousActivities: this.suspiciousActivities.length,
      activeRules: this.monitoringRules.filter(r => r.enabled).length,
      activeThreatPatterns: this.threatPatterns.filter(p => p.enabled).length
    };
  }

  // Helper methods
  private mapRuleToActivityType(ruleId: string): SuspiciousActivityType {
    const mapping: Record<string, SuspiciousActivityType> = {
      'rapid_requests': SuspiciousActivityType.RAPID_REQUESTS,
      'failed_auth_attempts': SuspiciousActivityType.BRUTE_FORCE_ATTACK,
      'suspicious_user_agent': SuspiciousActivityType.SUSPICIOUS_USER_AGENT,
      'admin_access_attempts': SuspiciousActivityType.PRIVILEGE_ESCALATION,
      'privilege_escalation': SuspiciousActivityType.PRIVILEGE_ESCALATION
    };
    return mapping[ruleId] || SuspiciousActivityType.SUSPICIOUS_USER_AGENT;
  }

  private mapPatternToActivityType(patternId: string): SuspiciousActivityType {
    const mapping: Record<string, SuspiciousActivityType> = {
      'sql_injection_pattern': SuspiciousActivityType.SQL_INJECTION,
      'xss_pattern': SuspiciousActivityType.XSS_ATTACK,
      'path_traversal_pattern': SuspiciousActivityType.PATH_TRAVERSAL,
      'command_injection_pattern': SuspiciousActivityType.AUTOMATED_SCANNING
    };
    return mapping[patternId] || SuspiciousActivityType.SUSPICIOUS_USER_AGENT;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup old activities
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupOldActivities();
    }, this.cleanupIntervalMs);
  }

  private cleanupOldActivities(): void {
    const cutoffTime = Date.now() - this.activityRetentionMs;

    // Clean IP activities
    Array.from(this.activities.entries()).forEach(([ip, activities]) => {
      const recentActivities = activities.filter(
        (a: ActivityData) => a.timestamp.getTime() > cutoffTime
      );
      if (recentActivities.length === 0) {
        this.activities.delete(ip);
      } else {
        this.activities.set(ip, recentActivities);
      }
    });

    // Clean user activities
    Array.from(this.userActivities.entries()).forEach(([userId, activities]) => {
      const recentActivities = activities.filter(
        (a: ActivityData) => a.timestamp.getTime() > cutoffTime
      );
      if (recentActivities.length === 0) {
        this.userActivities.delete(userId);
      } else {
        this.userActivities.set(userId, recentActivities);
      }
    });

    // Clean suspicious activities
    this.suspiciousActivities = this.suspiciousActivities.filter(
      a => a.timestamp.getTime() > cutoffTime
    );

    securityLogger.debug('Cleaned up old security monitoring data');
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();
export { SecurityMonitor, type ActivityData, type IPAnalysis, type UserBehaviorAnalysis };