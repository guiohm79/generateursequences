'use client';

import React, { useEffect, useRef } from 'react';
import { Pattern } from '../types';

interface MagentaVisualizerProps {
  pattern: Pattern;
  currentStep: number;
  isPlaying: boolean;
  width?: number;
  height?: number;
}

interface NoteEvent {
  pitch: number;
  startTime: number;
  endTime: number;
  velocity: number;
  instrument: number;
}

export function MagentaVisualizer({
  pattern,
  currentStep,
  isPlaying,
  width = 800,
  height = 200
}: MagentaVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Convert pattern to note events
  const convertPatternToNoteEvents = (): NoteEvent[] => {
    const events: NoteEvent[] = [];
    const stepDuration = 0.25; // 16th notes

    Object.entries(pattern).forEach(([noteName, steps]) => {
      const pitch = convertNoteNameToMidi(noteName);
      
      steps.forEach((step, stepIndex) => {
        if (step.on) {
          events.push({
            pitch,
            startTime: stepIndex * stepDuration,
            endTime: (stepIndex + 1) * stepDuration,
            velocity: step.velocity,
            instrument: 0
          });
        }
      });
    });

    return events.sort((a, b) => a.startTime - b.startTime);
  };

  const convertNoteNameToMidi = (noteName: string): number => {
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
    };
    
    const match = noteName.match(/([A-G]#?)(\d+)/);
    if (!match) return 60; // Default to C4
    
    const [, note, octaveStr] = match;
    const octave = parseInt(octaveStr);
    return octave * 12 + noteMap[note];
  };

  // Waterfall-style visualizer (inspired by Magenta demos)
  const renderWaterfallView = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const noteEvents = convertPatternToNoteEvents();
    
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', width.toString());
    bg.setAttribute('height', height.toString());
    bg.setAttribute('fill', '#0f172a');
    svg.appendChild(bg);

    if (noteEvents.length === 0) return;

    // Calculate scales
    const minPitch = Math.min(...noteEvents.map(e => e.pitch));
    const maxPitch = Math.max(...noteEvents.map(e => e.pitch));
    const totalTime = Math.max(...noteEvents.map(e => e.endTime));
    
    const pitchRange = Math.max(maxPitch - minPitch, 12); // Minimum range of an octave
    const xScale = width / totalTime;
    const yScale = height / pitchRange;

    // Current time indicator
    if (isPlaying) {
      const currentTime = currentStep * 0.25;
      const currentX = currentTime * xScale;
      
      const timeLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      timeLine.setAttribute('x1', currentX.toString());
      timeLine.setAttribute('y1', '0');
      timeLine.setAttribute('x2', currentX.toString());
      timeLine.setAttribute('y2', height.toString());
      timeLine.setAttribute('stroke', '#fbbf24');
      timeLine.setAttribute('stroke-width', '2');
      timeLine.setAttribute('opacity', '0.8');
      svg.appendChild(timeLine);
    }

    // Render notes as falling bars (waterfall effect)
    noteEvents.forEach((event, index) => {
      const x = event.startTime * xScale;
      const noteWidth = (event.endTime - event.startTime) * xScale;
      const y = height - ((event.pitch - minPitch) * yScale + 20);
      const noteHeight = 15;
      
      // Note rectangle with Magenta-style CSS variable velocity
      const noteRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      noteRect.setAttribute('x', x.toString());
      noteRect.setAttribute('y', y.toString());
      noteRect.setAttribute('width', noteWidth.toString());
      noteRect.setAttribute('height', noteHeight.toString());
      noteRect.setAttribute('rx', '2');
      
      // Dynamic color based on velocity (Magenta.js style)
      const hue = (event.pitch % 12) * 30; // Different color per pitch class
      const saturation = 70;
      const lightness = 30 + event.velocity * 40;
      noteRect.setAttribute('fill', `hsl(${hue}, ${saturation}%, ${lightness}%)`);
      
      // CSS custom properties for dynamic styling
      noteRect.style.setProperty('--midi-velocity', event.velocity.toString());
      noteRect.style.setProperty('--midi-pitch', event.pitch.toString());
      
      noteRect.setAttribute('opacity', '0.8');
      noteRect.classList.add('note', 'waterfall-note');
      
      // Hover effects
      noteRect.addEventListener('mouseenter', () => {
        noteRect.setAttribute('opacity', '1');
        noteRect.setAttribute('stroke', '#60a5fa');
        noteRect.setAttribute('stroke-width', '1');
      });
      
      noteRect.addEventListener('mouseleave', () => {
        noteRect.setAttribute('opacity', '0.8');
        noteRect.removeAttribute('stroke');
        noteRect.removeAttribute('stroke-width');
      });
      
      svg.appendChild(noteRect);

      // Note label
      if (noteWidth > 30) {
        const noteText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        noteText.setAttribute('x', (x + noteWidth / 2).toString());
        noteText.setAttribute('y', (y + noteHeight / 2 + 3).toString());
        noteText.setAttribute('text-anchor', 'middle');
        noteText.setAttribute('font-size', '10');
        noteText.setAttribute('font-family', 'monospace');
        noteText.setAttribute('fill', '#f1f5f9');
        noteText.setAttribute('pointer-events', 'none');
        noteText.textContent = `${event.pitch}`;
        svg.appendChild(noteText);
      }
    });

    // Grid lines
    for (let i = 0; i <= totalTime; i += 1) {
      const x = i * xScale;
      const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gridLine.setAttribute('x1', x.toString());
      gridLine.setAttribute('y1', '0');
      gridLine.setAttribute('x2', x.toString());
      gridLine.setAttribute('y2', height.toString());
      gridLine.setAttribute('stroke', '#334155');
      gridLine.setAttribute('stroke-width', '0.5');
      gridLine.setAttribute('opacity', '0.3');
      svg.appendChild(gridLine);
    }
  };

  useEffect(() => {
    renderWaterfallView();
  }, [pattern, currentStep, isPlaying, width, height]);

  return (
    <div className="magenta-visualizer bg-slate-900 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">
          Magenta.js Waterfall Visualizer
        </h3>
        <div className="text-xs text-slate-400">
          {Object.keys(pattern).length} notes • {convertPatternToNoteEvents().length} events
        </div>
      </div>
      
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="waterfall-svg border border-slate-600 rounded"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)'
        }}
      />
      
      <div className="mt-2 text-xs text-slate-400 text-center">
        Notes flow from left to right • Color intensity = velocity • Yellow line = current position
      </div>
    </div>
  );
}