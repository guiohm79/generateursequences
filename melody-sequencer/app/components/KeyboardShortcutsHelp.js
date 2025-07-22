"use client";
import React, { useState } from 'react';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const { getShortcutsList } = useKeyboardShortcuts({});
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="shortcuts-help-button"
        title="Afficher les raccourcis clavier (H)"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ?
      </button>
    );
  }

  const shortcuts = getShortcutsList();

  return (
    <div 
      className="shortcuts-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="shortcuts-panel"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#1e1e2e',
          borderRadius: '12px',
          padding: '30px',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #333'
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '25px',
          borderBottom: '1px solid #444',
          paddingBottom: '15px'
        }}>
          <h2 style={{ 
            margin: 0, 
            color: '#00eaff',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            🎹 Raccourcis Clavier
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕ Fermer
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
          gap: '25px' 
        }}>
          {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
            <div key={category} style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                color: '#4db6ff', 
                marginBottom: '15px',
                fontSize: '18px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {getCategoryTitle(category)}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(categoryShortcuts).map(([key, description]) => (
                  <div 
                    key={key}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: '#2a2a3a',
                      borderRadius: '6px',
                      border: '1px solid #3a3a4a'
                    }}
                  >
                    <kbd style={{ 
                      backgroundColor: '#404040',
                      color: '#00eaff',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      border: '1px solid #555'
                    }}>
                      {key}
                    </kbd>
                    <span style={{ 
                      color: '#ccc',
                      fontSize: '14px',
                      marginLeft: '15px',
                      flex: 1,
                      textAlign: 'right'
                    }}>
                      {description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ 
          marginTop: '30px',
          padding: '15px',
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          border: '1px solid rgba(255, 193, 7, 0.3)',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <p style={{ 
            color: '#ffc107',
            margin: 0,
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            💡 Les raccourcis sont désactivés quand un champ de saisie est actif
          </p>
        </div>
      </div>
    </div>
  );
}

function getCategoryTitle(category) {
  const titles = {
    transport: '🎮 Transport',
    pattern: '🎵 Pattern', 
    manipulation: '🔧 Manipulation',
    interface: '🖥️ Interface',
    tempo: '🎚️ Tempo',
    pianoroll: '🎹 Piano Roll'
  };
  return titles[category] || category.toUpperCase();
}