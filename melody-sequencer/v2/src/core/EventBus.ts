/**
 * EventBus - Système de communication inter-modules
 * Pattern Observer robuste avec gestion d'erreurs
 */

export type EventType = 
  | 'transport:start'
  | 'transport:stop' 
  | 'transport:step'
  | 'transport:tempo'
  | 'synth:note'
  | 'pattern:change'
  | 'pattern:clear'
  | 'engine:error'
  | 'engine:ready';

export interface Event<T = any> {
  type: EventType;
  payload?: T;
  timestamp: number;
  source: string;
}

export type EventListener<T = any> = (event: Event<T>) => void;

interface ListenerEntry {
  listener: EventListener;
  once: boolean;
  source: string;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<EventType, ListenerEntry[]> = new Map();
  private isDebugMode: boolean = false;

  private constructor() {
    // Singleton privé
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Écouter un événement
   */
  public on<T = any>(
    eventType: EventType, 
    listener: EventListener<T>,
    source: string = 'unknown'
  ): () => void {
    try {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }

      const entry: ListenerEntry = {
        listener: listener as EventListener,
        once: false,
        source
      };

      this.listeners.get(eventType)!.push(entry);

      if (this.isDebugMode) {
        console.log(`[EventBus] Listener added: ${eventType} from ${source}`);
      }

      // Retourner fonction de nettoyage
      return () => this.off(eventType, listener, source);
    } catch (error) {
      console.error('[EventBus] Error adding listener:', error);
      return () => {}; // Fonction vide en cas d'erreur
    }
  }

  /**
   * Écouter un événement une seule fois
   */
  public once<T = any>(
    eventType: EventType,
    listener: EventListener<T>,
    source: string = 'unknown'
  ): () => void {
    try {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, []);
      }

      const entry: ListenerEntry = {
        listener: listener as EventListener,
        once: true,
        source
      };

      this.listeners.get(eventType)!.push(entry);
      return () => this.off(eventType, listener, source);
    } catch (error) {
      console.error('[EventBus] Error adding once listener:', error);
      return () => {};
    }
  }

  /**
   * Arrêter d'écouter un événement
   */
  public off<T = any>(
    eventType: EventType,
    listener: EventListener<T>,
    source?: string
  ): void {
    try {
      const entries = this.listeners.get(eventType);
      if (!entries) return;

      const filteredEntries = entries.filter(entry => {
        const matchesListener = entry.listener !== listener;
        const matchesSource = !source || entry.source === source;
        return matchesListener || !matchesSource;
      });

      this.listeners.set(eventType, filteredEntries);

      if (this.isDebugMode && entries.length !== filteredEntries.length) {
        console.log(`[EventBus] Listener removed: ${eventType}`);
      }
    } catch (error) {
      console.error('[EventBus] Error removing listener:', error);
    }
  }

  /**
   * Émettre un événement
   */
  public emit<T = any>(
    eventType: EventType,
    payload?: T,
    source: string = 'unknown'
  ): void {
    try {
      const event: Event<T> = {
        type: eventType,
        payload,
        timestamp: Date.now(),
        source
      };

      if (this.isDebugMode) {
        console.log(`[EventBus] Event emitted: ${eventType}`, event);
      }

      const entries = this.listeners.get(eventType);
      if (!entries || entries.length === 0) return;

      // Copier la liste pour éviter les modifications concurrent
      const entriesToProcess = [...entries];

      // Traiter les listeners
      for (const entry of entriesToProcess) {
        try {
          entry.listener(event);
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, error);
          // Émettre un événement d'erreur
          this.emitError(error as Error, `listener-${entry.source}`);
        }
      }

      // Supprimer les listeners "once"
      const remainingEntries = entries.filter(entry => !entry.once);
      this.listeners.set(eventType, remainingEntries);

    } catch (error) {
      console.error('[EventBus] Error emitting event:', error);
    }
  }

  /**
   * Émettre une erreur dans le système
   */
  private emitError(error: Error, source: string): void {
    try {
      this.emit('engine:error', {
        error: error.message,
        stack: error.stack,
        source
      }, 'EventBus');
    } catch (nestedError) {
      // Dernière ligne de défense
      console.error('[EventBus] Critical error in error handling:', nestedError);
    }
  }

  /**
   * Nettoyer tous les listeners
   */
  public clear(): void {
    try {
      if (this.isDebugMode) {
        console.log('[EventBus] Clearing all listeners');
      }
      this.listeners.clear();
    } catch (error) {
      console.error('[EventBus] Error clearing listeners:', error);
    }
  }

  /**
   * Obtenir statistiques de debug
   */
  public getStats(): { [eventType: string]: number } {
    const stats: { [eventType: string]: number } = {};
    
    for (const [eventType, entries] of this.listeners.entries()) {
      stats[eventType] = entries.length;
    }
    
    return stats;
  }

  /**
   * Activer/désactiver le mode debug
   */
  public setDebugMode(enabled: boolean): void {
    this.isDebugMode = enabled;
    if (enabled) {
      console.log('[EventBus] Debug mode enabled');
    }
  }
}