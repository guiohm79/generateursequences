/**
 * Composant de carte interactive pour le Hub
 * Avec statuts modifiables, checkboxes, notes et documentation
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MenuItem, 
  MenuStatus,
  MenuCheckbox,
  MenuNote,
  MENU_STATUS_COLORS, 
  MENU_STATUS_LABELS,
  CHECKBOX_TYPE_COLORS,
  CHECKBOX_TYPE_ICONS,
  NOTE_TYPE_COLORS,
  NOTE_TYPE_ICONS
} from '../types/menu';
import { hubDataManager } from '../lib/HubDataManager';

interface InteractiveMenuCardProps {
  item: MenuItem;
  onUpdate?: () => void;
}

export function InteractiveMenuCard({ item, onUpdate }: InteractiveMenuCardProps) {
  // États locaux
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<MenuStatus>(item.status);
  const [checkboxes, setCheckboxes] = useState<MenuCheckbox[]>([]);
  const [notes, setNotes] = useState<MenuNote[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [newCheckboxText, setNewCheckboxText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [showAddCheckbox, setShowAddCheckbox] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);

  // Charger les données au montage
  useEffect(() => {
    const savedStatus = hubDataManager.getItemStatus(item.id);
    if (savedStatus) {
      setCurrentStatus(savedStatus);
    }
    
    setCheckboxes(hubDataManager.getItemCheckboxes(item.id));
    setNotes(hubDataManager.getItemNotes(item.id));
  }, [item.id]);

  // Configuration des couleurs et labels
  const statusColor = MENU_STATUS_COLORS[currentStatus];
  const statusLabel = MENU_STATUS_LABELS[currentStatus];
  const isDisabled = currentStatus === 'planned' || currentStatus === 'broken' || currentStatus === 'deprecated';

  // === HANDLERS ===

  const handleStatusChange = (newStatus: MenuStatus) => {
    setCurrentStatus(newStatus);
    hubDataManager.setItemStatus(item.id, newStatus);
    setShowStatusDropdown(false);
    onUpdate?.();
  };

  const handleToggleCheckbox = (checkboxId: string) => {
    const newChecked = hubDataManager.toggleCheckbox(item.id, checkboxId);
    setCheckboxes(prev => 
      prev.map(cb => cb.id === checkboxId ? { ...cb, checked: newChecked } : cb)
    );
    onUpdate?.();
  };

  const handleAddCheckbox = (type: 'test' | 'bug' | 'feature' | 'doc') => {
    if (!newCheckboxText.trim()) return;
    
    const newCheckbox = hubDataManager.addCheckbox(item.id, {
      label: newCheckboxText.trim(),
      checked: false,
      type
    });
    
    setCheckboxes(prev => [...prev, newCheckbox]);
    setNewCheckboxText('');
    setShowAddCheckbox(false);
    onUpdate?.();
  };

  const handleRemoveCheckbox = (checkboxId: string) => {
    hubDataManager.removeCheckbox(item.id, checkboxId);
    setCheckboxes(prev => prev.filter(cb => cb.id !== checkboxId));
    onUpdate?.();
  };

  const handleAddNote = (type: 'info' | 'warning' | 'error' | 'idea') => {
    if (!newNoteText.trim()) return;
    
    const newNote = hubDataManager.addNote(item.id, {
      content: newNoteText.trim(),
      type,
      author: 'Développeur'
    });
    
    setNotes(prev => [...prev, newNote]);
    setNewNoteText('');
    setShowAddNote(false);
    onUpdate?.();
  };

  const handleRemoveNote = (noteId: string) => {
    hubDataManager.removeNote(item.id, noteId);
    setNotes(prev => prev.filter(n => n.id !== noteId));
    onUpdate?.();
  };

  // === STATISTIQUES ===
  const completedCheckboxes = checkboxes.filter(cb => cb.checked).length;
  const totalCheckboxes = checkboxes.length;
  const progressPercentage = totalCheckboxes > 0 ? (completedCheckboxes / totalCheckboxes) * 100 : 0;

  // === RENDER ===

  const cardContent = (
    <div className={`
      bg-gray-800 rounded-lg transition-all duration-200 overflow-hidden
      ${isDisabled 
        ? 'opacity-60' 
        : 'hover:bg-gray-700 hover:shadow-lg'
      }
      ${item.status === 'new' ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
      ${isExpanded ? 'ring-2 ring-purple-400 ring-opacity-30' : ''}
    `}>
      
      {/* En-tête principal */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-white pr-4">{item.title}</h3>
          
          {/* Statut avec dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowStatusDropdown(!showStatusDropdown);
              }}
              className={`text-sm font-medium ${statusColor} hover:opacity-80 transition-opacity bg-gray-700 px-3 py-1 rounded-lg`}
            >
              {statusLabel} ▼
            </button>
            
            {showStatusDropdown && (
              <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-600 rounded-lg shadow-xl z-50 min-w-48">
                {Object.entries(MENU_STATUS_LABELS).map(([status, label]) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStatusChange(status as MenuStatus);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${
                      status === currentStatus ? 'bg-gray-700' : ''
                    } ${MENU_STATUS_COLORS[status as MenuStatus]}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
          {item.description}
        </p>
        
        {/* Barre de progression */}
        {totalCheckboxes > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progression</span>
              <span>{completedCheckboxes}/{totalCheckboxes} ({Math.round(progressPercentage)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Actions principales */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {item.category}
            </div>
            
            {/* Indicateurs rapides */}
            <div className="flex items-center space-x-2 text-xs">
              {totalCheckboxes > 0 && (
                <span className="bg-blue-900 text-blue-300 px-2 py-1 rounded">
                  📋 {totalCheckboxes}
                </span>
              )}
              {notes.length > 0 && (
                <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded">
                  📝 {notes.length}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors"
            >
              {isExpanded ? '▲ Réduire' : '▼ Détails'}
            </button>
            
            {!isDisabled && (
              <span className="text-blue-400 text-sm font-medium">
                Ouvrir →
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Section étendue */}
      {isExpanded && (
        <div className="border-t border-gray-700 bg-gray-850/50">
          
          {/* Checkboxes */}
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-300">📋 Tâches & Tests</h4>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddCheckbox(!showAddCheckbox);
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
              >
                + Ajouter
              </button>
            </div>
            
            {/* Liste des checkboxes */}
            <div className="space-y-2 mb-3">
              {checkboxes.map(checkbox => (
                <div key={checkbox.id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-2 flex-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleCheckbox(checkbox.id);
                      }}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        checkbox.checked 
                          ? 'bg-green-600 border-green-600 text-white' 
                          : 'border-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {checkbox.checked && '✓'}
                    </button>
                    <span className={`text-xs ${CHECKBOX_TYPE_COLORS[checkbox.type]}`}>
                      {CHECKBOX_TYPE_ICONS[checkbox.type]}
                    </span>
                    <span className={`text-sm flex-1 ${
                      checkbox.checked ? 'line-through text-gray-500' : 'text-gray-300'
                    }`}>
                      {checkbox.label}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveCheckbox(checkbox.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {checkboxes.length === 0 && (
                <p className="text-xs text-gray-500 italic">Aucune tâche définie</p>
              )}
            </div>
            
            {/* Formulaire d'ajout de checkbox */}
            {showAddCheckbox && (
              <div className="bg-gray-900 p-3 rounded border border-gray-600">
                <input
                  type="text"
                  placeholder="Nouvelle tâche..."
                  value={newCheckboxText}
                  onChange={(e) => setNewCheckboxText(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCheckbox('test');
                    } else if (e.key === 'Escape') {
                      setShowAddCheckbox(false);
                      setNewCheckboxText('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex justify-between">
                  <div className="flex space-x-1">
                    {(['test', 'bug', 'feature', 'doc'] as const).map(type => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddCheckbox(type);
                        }}
                        className={`text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity ${CHECKBOX_TYPE_COLORS[type]} bg-gray-800`}
                      >
                        {CHECKBOX_TYPE_ICONS[type]} {type}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAddCheckbox(false);
                      setNewCheckboxText('');
                    }}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Notes */}
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-300">📝 Notes & Documentation</h4>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddNote(!showAddNote);
                }}
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded transition-colors"
              >
                + Note
              </button>
            </div>
            
            {/* Liste des notes */}
            <div className="space-y-2 mb-3">
              {notes.map(note => (
                <div key={note.id} className={`p-2 rounded border text-sm group relative ${NOTE_TYPE_COLORS[note.type]}`}>
                  <div className="flex items-start space-x-2">
                    <span className="text-xs">{NOTE_TYPE_ICONS[note.type]}</span>
                    <div className="flex-1">
                      <p className="leading-relaxed">{note.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(note.createdAt).toLocaleDateString()} 
                        {note.author && ` • ${note.author}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveNote(note.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
              
              {notes.length === 0 && (
                <p className="text-xs text-gray-500 italic">Aucune note ajoutée</p>
              )}
            </div>
            
            {/* Formulaire d'ajout de note */}
            {showAddNote && (
              <div className="bg-gray-900 p-3 rounded border border-gray-600">
                <textarea
                  placeholder="Nouvelle note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full bg-gray-800 text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none mb-2 resize-none"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddNote('info');
                    } else if (e.key === 'Escape') {
                      setShowAddNote(false);
                      setNewNoteText('');
                    }
                  }}
                  autoFocus
                />
                <div className="flex justify-between">
                  <div className="flex space-x-1">
                    {(['info', 'warning', 'error', 'idea'] as const).map(type => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddNote(type);
                        }}
                        className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity bg-gray-800 border"
                        style={{ 
                          color: NOTE_TYPE_COLORS[type].split(' ')[0].replace('text-', ''),
                          borderColor: NOTE_TYPE_COLORS[type].split(' ')[2].replace('border-', '')
                        }}
                      >
                        {NOTE_TYPE_ICONS[type]} {type}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAddNote(false);
                      setNewNoteText('');
                    }}
                    className="text-xs text-gray-400 hover:text-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = () => {
      setShowStatusDropdown(false);
    };
    
    if (showStatusDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showStatusDropdown]);

  if (isDisabled) {
    return cardContent;
  }

  return (
    <Link href={item.href}>
      {cardContent}
    </Link>
  );
}