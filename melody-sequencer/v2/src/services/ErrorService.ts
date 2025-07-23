/**
 * ErrorService - Gestion centralisée et robuste des erreurs
 * Logging, recovery et feedback utilisateur
 */

import { EventBus } from '../core/EventBus';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUDIO = 'audio',
  PATTERN = 'pattern',
  UI = 'ui',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SYSTEM = 'system'
}

export interface ErrorEntry {
  id: string;
  timestamp: number;
  message: string;
  details?: any;
  severity: ErrorSeverity;
  category: ErrorCategory;
  source: string;
  stack?: string;
  resolved: boolean;
  userNotified: boolean;
}

export interface ErrorStats {
  total: number;
  byCategory: Record<ErrorCategory, number>;
  bySeverity: Record<ErrorSeverity, number>;
  recent: number; // dernières 5 minutes
}

export class ErrorService {
  private static instance: ErrorService;
  private eventBus: EventBus;
  private errors: Map<string, ErrorEntry> = new Map();
  private maxErrors: number = 1000;
  private notificationCallback?: (error: ErrorEntry) => void;

  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupEventListeners();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Configuration des listeners
   */
  private setupEventListeners(): void {
    this.eventBus.on('engine:error', this.handleEngineError.bind(this), 'ErrorService');
  }

  /**
   * Configuration des gestionnaires d'erreurs globaux
   */
  private setupGlobalErrorHandlers(): void {
    // Erreurs JavaScript non capturées
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.logError({
          message: event.message,
          details: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
          },
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.SYSTEM,
          source: 'window.error'
        });
      });

      // Promesses rejetées
      window.addEventListener('unhandledrejection', (event) => {
        this.logError({
          message: 'Unhandled Promise Rejection',
          details: {
            reason: event.reason,
            promise: event.promise
          },
          severity: ErrorSeverity.HIGH,
          category: ErrorCategory.SYSTEM,
          source: 'unhandledrejection'
        });
      });
    }
  }

  /**
   * Logger une erreur
   */
  public logError(errorData: {
    message: string;
    details?: any;
    severity: ErrorSeverity;
    category: ErrorCategory;
    source: string;
    stack?: string;
  }): string {
    try {
      const errorId = this.generateErrorId();
      const timestamp = Date.now();

      const errorEntry: ErrorEntry = {
        id: errorId,
        timestamp,
        message: errorData.message,
        details: errorData.details,
        severity: errorData.severity,
        category: errorData.category,
        source: errorData.source,
        stack: errorData.stack || new Error().stack,
        resolved: false,
        userNotified: false
      };

      // Stocker l'erreur
      this.errors.set(errorId, errorEntry);

      // Limiter le nombre d'erreurs stockées
      this.cleanupOldErrors();

      // Logger dans la console selon la sévérité
      this.consoleLog(errorEntry);

      // Notifier l'utilisateur si nécessaire
      this.handleUserNotification(errorEntry);

      // Tentatives de récupération automatique
      this.attemptRecovery(errorEntry);

      return errorId;

    } catch (logError) {
      // Fallback en cas d'erreur dans le logging
      console.error('[ErrorService] Failed to log error:', logError);
      console.error('[ErrorService] Original error:', errorData);
      return 'error-service-failure';
    }
  }

  /**
   * Wrapper pour try/catch avec logging automatique
   */
  public async safeExecute<T>(
    operation: () => Promise<T>,
    context: {
      source: string;
      category: ErrorCategory;
      severity?: ErrorSeverity;
      fallback?: T;
    }
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.logError({
        message: `Error in ${context.source}`,
        details: error,
        severity: context.severity || ErrorSeverity.MEDIUM,
        category: context.category,
        source: context.source,
        stack: error instanceof Error ? error.stack : undefined
      });

      return context.fallback;
    }
  }

  /**
   * Version synchrone de safeExecute
   */
  public safeExecuteSync<T>(
    operation: () => T,
    context: {
      source: string;
      category: ErrorCategory;
      severity?: ErrorSeverity;
      fallback?: T;
    }
  ): T | undefined {
    try {
      return operation();
    } catch (error) {
      this.logError({
        message: `Error in ${context.source}`,
        details: error,
        severity: context.severity || ErrorSeverity.MEDIUM,
        category: context.category,
        source: context.source,
        stack: error instanceof Error ? error.stack : undefined
      });

      return context.fallback;
    }
  }

  /**
   * Logging console adapté à la sévérité
   */
  private consoleLog(error: ErrorEntry): void {
    const logMessage = `[${error.category.toUpperCase()}] ${error.message}`;
    const logData = {
      id: error.id,
      source: error.source,
      details: error.details,
      timestamp: new Date(error.timestamp).toISOString()
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info(logMessage, logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, logData);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error(logMessage, logData);
        if (error.stack) {
          console.error('Stack trace:', error.stack);
        }
        break;
    }
  }

  /**
   * Gestion des notifications utilisateur
   */
  private handleUserNotification(error: ErrorEntry): void {
    // Notifier uniquement les erreurs importantes
    if (error.severity === ErrorSeverity.HIGH || error.severity === ErrorSeverity.CRITICAL) {
      if (this.notificationCallback && !error.userNotified) {
        this.notificationCallback(error);
        error.userNotified = true;
      }
    }
  }

  /**
   * Tentatives de récupération automatique
   */
  private attemptRecovery(error: ErrorEntry): void {
    try {
      switch (error.category) {
        case ErrorCategory.AUDIO:
          if (error.message.includes('context')) {
            // Tentative de redémarrage du contexte audio
            this.eventBus.emit('engine:restart-audio', {
              reason: 'Audio context recovery',
              errorId: error.id
            }, 'ErrorService');
          }
          break;

        case ErrorCategory.PATTERN:
          if (error.severity === ErrorSeverity.CRITICAL) {
            // Clear du pattern en cas d'erreur critique
            this.eventBus.emit('pattern:clear', {
              reason: 'Pattern recovery',
              errorId: error.id
            }, 'ErrorService');
          }
          break;
      }
    } catch (recoveryError) {
      console.error('[ErrorService] Recovery attempt failed:', recoveryError);
    }
  }

  /**
   * Gestionnaire des erreurs d'engine
   */
  private handleEngineError(event: any): void {
    const { error, details, source } = event.payload;
    
    this.logError({
      message: error,
      details,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUDIO,
      source: source || 'engine'
    });
  }

  /**
   * Marquer une erreur comme résolue
   */
  public resolveError(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Obtenir les statistiques d'erreurs
   */
  public getStats(): ErrorStats {
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    
    const stats: ErrorStats = {
      total: this.errors.size,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recent: 0
    };

    // Initialiser les compteurs
    Object.values(ErrorCategory).forEach(cat => {
      stats.byCategory[cat] = 0;
    });
    Object.values(ErrorSeverity).forEach(sev => {
      stats.bySeverity[sev] = 0;
    });

    // Compter les erreurs
    for (const error of this.errors.values()) {
      stats.byCategory[error.category]++;
      stats.bySeverity[error.severity]++;
      
      if (error.timestamp > fiveMinutesAgo) {
        stats.recent++;
      }
    }

    return stats;
  }

  /**
   * Obtenir les erreurs récentes
   */
  public getRecentErrors(limit: number = 10): ErrorEntry[] {
    return Array.from(this.errors.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Configurer callback de notification
   */
  public setNotificationCallback(callback: (error: ErrorEntry) => void): void {
    this.notificationCallback = callback;
  }

  /**
   * Nettoyer les anciennes erreurs
   */
  private cleanupOldErrors(): void {
    if (this.errors.size <= this.maxErrors) return;

    const sortedErrors = Array.from(this.errors.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);

    const toDelete = sortedErrors.slice(0, sortedErrors.length - this.maxErrors);
    
    for (const [id] of toDelete) {
      this.errors.delete(id);
    }
  }

  /**
   * Générer un ID d'erreur unique
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Nettoyer les ressources
   */
  public dispose(): void {
    try {
      this.errors.clear();
      this.notificationCallback = undefined;
      console.log('[ErrorService] Disposed successfully');
    } catch (error) {
      console.error('[ErrorService] Error during disposal:', error);
    }
  }
}