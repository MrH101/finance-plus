import api from './api';

export interface AuditLog {
  id: number;
  user?: number;
  user_name?: string;
  action: string;
  action_display: string;
  model_name: string;
  object_id: string;
  object_repr: string;
  changes: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity: string;
  severity_display: string;
  business?: number;
  business_name?: string;
  timestamp: string;
  session_id?: string;
}

export interface SecurityEvent {
  id: number;
  user?: number;
  user_name?: string;
  event_type: string;
  event_type_display: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  business?: number;
  business_name?: string;
  timestamp: string;
}

export interface AuditLogFilters {
  user?: string | number;
  action?: string;
  model_name?: string;
  severity?: string;
  start_date?: string;
  end_date?: string;
  business?: number;
}

export interface SecurityEventFilters {
  user?: string | number;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  business?: number;
}

export class AuditService {
  // Get audit logs with filters
  static async getAuditLogs(params?: AuditLogFilters & {
    page?: number;
    page_size?: number;
  }): Promise<{ results: AuditLog[]; count: number }> {
    const response = await api.get('/audit-logs/', { params });
    return response.data;
  }

  // Get single audit log
  static async getAuditLog(id: number): Promise<AuditLog> {
    const response = await api.get(`/audit-logs/${id}/`);
    return response.data;
  }

  // Export audit logs to CSV
  static async exportAuditLogs(filters?: AuditLogFilters): Promise<Blob> {
    const response = await api.get('/audit-logs/export/', { 
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  }

  // Get security events with filters
  static async getSecurityEvents(params?: SecurityEventFilters & {
    page?: number;
    page_size?: number;
  }): Promise<{ results: SecurityEvent[]; count: number }> {
    const response = await api.get('/security-events/', { params });
    return response.data;
  }

  // Get single security event
  static async getSecurityEvent(id: number): Promise<SecurityEvent> {
    const response = await api.get(`/security-events/${id}/`);
    return response.data;
  }

  // Get recent failed login attempts
  static async getRecentFailures(): Promise<SecurityEvent[]> {
    const response = await api.get('/security-events/recent_failures/');
    return response.data;
  }

  // Get audit summary statistics
  static async getAuditSummary(): Promise<{
    total_logs: number;
    logs_today: number;
    logs_this_week: number;
    logs_this_month: number;
    high_severity_count: number;
    critical_severity_count: number;
    top_actions: Array<{ action: string; count: number }>;
    top_users: Array<{ user: string; count: number }>;
  }> {
    const logs = await this.getAuditLogs({ page_size: 1000 });
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const logsToday = logs.results.filter(log => 
      new Date(log.timestamp).toDateString() === today.toDateString()
    );
    const logsThisWeek = logs.results.filter(log => 
      new Date(log.timestamp) >= weekAgo
    );
    const logsThisMonth = logs.results.filter(log => 
      new Date(log.timestamp) >= monthAgo
    );

    const highSeverity = logs.results.filter(log => log.severity === 'HIGH').length;
    const criticalSeverity = logs.results.filter(log => log.severity === 'CRITICAL').length;

    // Count top actions
    const actionCounts: Record<string, number> = {};
    logs.results.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count top users
    const userCounts: Record<string, number> = {};
    logs.results.forEach(log => {
      if (log.user_name) {
        userCounts[log.user_name] = (userCounts[log.user_name] || 0) + 1;
      }
    });
    const topUsers = Object.entries(userCounts)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_logs: logs.count,
      logs_today: logsToday.length,
      logs_this_week: logsThisWeek.length,
      logs_this_month: logsThisMonth.length,
      high_severity_count: highSeverity,
      critical_severity_count: criticalSeverity,
      top_actions: topActions,
      top_users: topUsers,
    };
  }

  // Get security summary statistics
  static async getSecuritySummary(): Promise<{
    total_events: number;
    events_today: number;
    failed_logins: number;
    suspicious_activities: number;
    account_locks: number;
    top_event_types: Array<{ event_type: string; count: number }>;
    top_ips: Array<{ ip: string; count: number }>;
  }> {
    const events = await this.getSecurityEvents({ page_size: 1000 });
    const today = new Date();

    const eventsToday = events.results.filter(event => 
      new Date(event.timestamp).toDateString() === today.toDateString()
    );

    const failedLogins = events.results.filter(event => 
      event.event_type === 'LOGIN_FAILED'
    ).length;

    const suspiciousActivities = events.results.filter(event => 
      event.event_type === 'SUSPICIOUS_ACTIVITY'
    ).length;

    const accountLocks = events.results.filter(event => 
      event.event_type === 'ACCOUNT_LOCKED'
    ).length;

    // Count top event types
    const eventTypeCounts: Record<string, number> = {};
    events.results.forEach(event => {
      eventTypeCounts[event.event_type] = (eventTypeCounts[event.event_type] || 0) + 1;
    });
    const topEventTypes = Object.entries(eventTypeCounts)
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count top IPs
    const ipCounts: Record<string, number> = {};
    events.results.forEach(event => {
      if (event.ip_address) {
        ipCounts[event.ip_address] = (ipCounts[event.ip_address] || 0) + 1;
      }
    });
    const topIps = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_events: events.count,
      events_today: eventsToday.length,
      failed_logins: failedLogins,
      suspicious_activities: suspiciousActivities,
      account_locks: accountLocks,
      top_event_types: topEventTypes,
      top_ips: topIps,
    };
  }

  // Format audit log for display
  static formatAuditLog(log: AuditLog): {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    icon: string;
  } {
    const severityMap = {
      'LOW': 'low',
      'MEDIUM': 'medium', 
      'HIGH': 'high',
      'CRITICAL': 'critical'
    } as const;

    const actionIcons = {
      'CREATE': '➕',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'LOGIN': '🔑',
      'LOGOUT': '🚪',
      'VIEW': '👁️',
      'EXPORT': '📤',
      'IMPORT': '📥',
      'APPROVE': '✅',
      'REJECT': '❌',
      'REVALUE': '💰',
      'DISPOSE': '🏷️',
      'PAYROLL': '💵',
      'INVOICE': '🧾',
      'PAYMENT': '💳',
      'PERMISSION': '🔐',
    };

    const title = `${log.action_display} - ${log.model_name}`;
    const description = `${log.user_name || 'System'} ${log.action.toLowerCase()}d ${log.object_repr}`;
    const severity = severityMap[log.severity as keyof typeof severityMap] || 'low';
    const icon = actionIcons[log.action as keyof typeof actionIcons] || '📋';

    return { title, description, severity, icon };
  }

  // Format security event for display
  static formatSecurityEvent(event: SecurityEvent): {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    icon: string;
  } {
    const severityMap = {
      'LOGIN_FAILED': 'high',
      'LOGIN_SUCCESS': 'low',
      'LOGOUT': 'low',
      'PASSWORD_CHANGE': 'medium',
      'PASSWORD_RESET': 'medium',
      'PERMISSION_DENIED': 'high',
      'SUSPICIOUS_ACTIVITY': 'critical',
      'SESSION_EXPIRED': 'medium',
      'ACCOUNT_LOCKED': 'high',
      'ACCOUNT_UNLOCKED': 'medium',
    } as const;

    const eventIcons = {
      'LOGIN_FAILED': '❌',
      'LOGIN_SUCCESS': '✅',
      'LOGOUT': '🚪',
      'PASSWORD_CHANGE': '🔐',
      'PASSWORD_RESET': '🔑',
      'PERMISSION_DENIED': '🚫',
      'SUSPICIOUS_ACTIVITY': '⚠️',
      'SESSION_EXPIRED': '⏰',
      'ACCOUNT_LOCKED': '🔒',
      'ACCOUNT_UNLOCKED': '🔓',
    };

    const title = event.event_type_display;
    const description = `${event.user_name || 'Unknown user'} from ${event.ip_address || 'unknown IP'}`;
    const severity = severityMap[event.event_type as keyof typeof severityMap] || 'low';
    const icon = eventIcons[event.event_type as keyof typeof eventIcons] || '📋';

    return { title, description, severity, icon };
  }
}

export default AuditService; 