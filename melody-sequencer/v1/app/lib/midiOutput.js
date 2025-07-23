// /app/lib/midiOutput.js
// Module de gestion des sorties MIDI

/**
 * Classe gérant la connexion aux ports MIDI et l'envoi de messages MIDI
 */
export class MIDIOutput {
  constructor() {
    this.midiAccess = null;
    this.outputDevice = null;
    this.isConnected = false;
    this.midiChannel = 0; // Canal MIDI (0-15)
  }

  /**
   * Initialise l'accès au MIDI
   * @returns {Promise<boolean>} Succès de l'initialisation
   */
  async initialize() {
    if (!navigator.requestMIDIAccess) {
      console.error("Web MIDI API non supportée par ce navigateur");
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      console.log("Accès MIDI établi avec succès");
      
      // Afficher les ports disponibles pour le débogage
      let outputs = [];
      this.midiAccess.outputs.forEach((output) => {
        outputs.push({
          id: output.id,
          name: output.name || output.id,
          manufacturer: output.manufacturer || "Inconnu"
        });
      });
      console.log("Ports MIDI disponibles:", outputs);
      
      return true;
    } catch (error) {
      console.error("Erreur d'accès MIDI:", error);
      return false;
    }
  }

  /**
   * Récupère la liste des ports MIDI disponibles
   * @returns {Array} Liste des ports de sortie MIDI
   */
  getOutputPorts() {
    if (!this.midiAccess) return [];
    
    const outputs = [];
    this.midiAccess.outputs.forEach((output) => {
      outputs.push({
        id: output.id,
        name: output.name || output.id,
        manufacturer: output.manufacturer || "Inconnu"
      });
    });
    
    return outputs;
  }

  /**
   * Connecte à un port MIDI spécifique
   * @param {string} portId Identifiant du port MIDI à utiliser
   * @returns {boolean} Succès de la connexion
   */
  connectToPort(portId) {
    if (!this.midiAccess) {
      console.error("Tentative de connexion à un port sans accès MIDI initialise");
      return false;
    }
    
    console.log(`Tentative de connexion au port MIDI: ${portId}`);
    this.outputDevice = this.midiAccess.outputs.get(portId);
    
    if (this.outputDevice) {
      this.isConnected = true;
      console.log(`Connecté au port MIDI: ${this.outputDevice.name}`);
      
      // Test de connexion - envoyer un All Notes Off pour confirmer
      try {
        this.outputDevice.send([0xB0 | this.midiChannel, 123, 0]);
        console.log("Test de connexion MIDI réussi");
      } catch (error) {
        console.error("Test de connexion MIDI échoué:", error);
      }
      
      return true;
    } else {
      console.error(`Port MIDI ${portId} non trouvé`);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Envoie un message Note On
   * @param {string} note Nom de la note (ex: "C4")
   * @param {number} velocity Vélocité (0-127)
   * @returns {boolean} Succès de l'envoi
   */
  sendNoteOn(note, velocity) {
    if (!this.isConnected || !this.outputDevice) {
      console.warn("Impossible d'envoyer Note On - Non connecté", this.isConnected, !!this.outputDevice);
      return false;
    }
    
    const midiNote = this.noteNameToMidi(note);
    if (midiNote === -1) {
      console.warn(`Note invalide pour MIDI: ${note}`);
      return false;
    }
    
    try {
      // Message MIDI Note On: [0x90 | canal, note, vélocité]
      const velocityValue = Math.min(127, Math.max(0, Math.round(velocity)));
      this.outputDevice.send([0x90 | this.midiChannel, midiNote, velocityValue]);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Envoie un message Note Off
   * @param {string} note Nom de la note (ex: "C4")
   * @returns {boolean} Succès de l'envoi
   */
  sendNoteOff(note) {
    if (!this.isConnected || !this.outputDevice) return false;
    
    const midiNote = this.noteNameToMidi(note);
    if (midiNote === -1) return false;
    
    // Message MIDI Note Off: [0x80 | canal, note, 0]
    this.outputDevice.send([0x80 | this.midiChannel, midiNote, 0]);
    return true;
  }

  /**
   * Arrête toutes les notes en cours (All Notes Off)
   */
  allNotesOff() {
    if (!this.isConnected || !this.outputDevice) return;
    
    // CC 123 = All Notes Off
    this.outputDevice.send([0xB0 | this.midiChannel, 123, 0]);
  }
  
  /**
   * Envoie un message Control Change
   * @param {number} controller Numéro de contrôleur (0-127)
   * @param {number} value Valeur (0-127)
   * @returns {boolean} Succès de l'envoi
   */
  sendControlChange(controller, value) {
    if (!this.isConnected || !this.outputDevice) {
      console.warn("Impossible d'envoyer Control Change - Non connecté");
      return false;
    }
    
    try {
      // Message MIDI Control Change: [0xB0 | canal, contrôleur, valeur]
      const controllerValue = Math.min(127, Math.max(0, Math.round(controller)));
      const dataValue = Math.min(127, Math.max(0, Math.round(value)));
      this.outputDevice.send([0xB0 | this.midiChannel, controllerValue, dataValue]);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Joue une note pendant une durée donnée (Note On + délai + Note Off)
   * @param {string|number} note Nom de la note (ex: "C4") ou numéro MIDI (0-127)
   * @param {number} velocity Vélocité (0-127)
   * @param {number} duration Durée en millisecondes
   * @returns {boolean} Succès de l'envoi
   */
  playNote(note, velocity, duration) {
    // Si c'est un numéro MIDI, utiliser directement
    if (typeof note === 'number') {
      return this.playNoteByMidi(note, velocity, duration);
    }
    
    // Sinon, traiter comme nom de note
    if (!this.sendNoteOn(note, velocity)) {
      return false;
    }
    
    // Programmer le Note Off après la durée spécifiée
    setTimeout(() => {
      this.sendNoteOff(note);
    }, duration);
    
    return true;
  }

  /**
   * Joue une note par numéro MIDI pendant une durée donnée
   * @param {number} midiNote Numéro MIDI (0-127)
   * @param {number} velocity Vélocité (0-127) 
   * @param {number} duration Durée en millisecondes
   * @returns {boolean} Succès de l'envoi
   */
  playNoteByMidi(midiNote, velocity, duration) {
    if (!this.isConnected || !this.outputDevice) {
      console.warn("Impossible de jouer note MIDI - Non connecté");
      return false;
    }
    
    const midiNoteValue = Math.min(127, Math.max(0, Math.round(midiNote)));
    const velocityValue = Math.min(127, Math.max(0, Math.round(velocity)));
    
    try {
      // Envoyer Note On
      this.outputDevice.send([0x90 | this.midiChannel, midiNoteValue, velocityValue]);
      
      // Programmer le Note Off après la durée spécifiée
      setTimeout(() => {
        if (this.isConnected && this.outputDevice) {
          this.outputDevice.send([0x80 | this.midiChannel, midiNoteValue, 0]);
        }
      }, duration);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de l'envoi de la note MIDI:", error);
      return false;
    }
  }

  /**
   * Change le canal MIDI utilisé
   * @param {number} channel Numéro du canal (0-15)
   */
  setMIDIChannel(channel) {
    this.midiChannel = Math.max(0, Math.min(15, channel));
  }

  /**
   * Convertit un nom de note en numéro MIDI
   * @param {string} note Nom de la note (ex: "C4")
   * @returns {number} Numéro MIDI de la note (-1 si invalide)
   */
  noteNameToMidi(note) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));
    
    if (isNaN(octave) || octave < 0 || octave > 9) return -1;
    
    const noteIndex = notes.indexOf(noteName);
    if (noteIndex === -1) return -1;
    
    return (octave + 1) * 12 + noteIndex;
  }
}

// Instance singleton pour l'application
let midiOutputInstance = null;

/**
 * Récupère ou crée l'instance unique de MIDIOutput
 * @returns {MIDIOutput} Instance du gestionnaire MIDI
 */
export function getMIDIOutput() {
  if (!midiOutputInstance) {
    midiOutputInstance = new MIDIOutput();
  }
  return midiOutputInstance;
}
