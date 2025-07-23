# Guide de connexion MIDI vers un VSTi Standalone

Ce guide vous explique comment connecter le séquenceur de mélodies à votre VSTi standalone via MIDI pour jouer les patterns générés en temps réel.

## Prérequis

- Un navigateur compatible avec la Web MIDI API (Chrome, Edge, Opera)
- Un logiciel de port MIDI virtuel (loopMIDI sous Windows ou IAC sous macOS)
- Un VSTi standalone compatible MIDI

## Installation du port MIDI virtuel

### Windows (loopMIDI)

1. Téléchargez loopMIDI depuis [https://www.tobias-erichsen.de/software/loopmidi.html](https://www.tobias-erichsen.de/software/loopmidi.html)
2. Installez et lancez loopMIDI
3. Dans l'interface de loopMIDI, cliquez sur le bouton "+" pour créer un nouveau port MIDI virtuel
4. Nommez-le comme vous le souhaitez (par exemple "MelodySequencer")
5. Le port virtuel est maintenant actif et utilisable par d'autres applications

### macOS (IAC Driver)

1. Ouvrez l'application "Audio MIDI Setup" (dans Applications > Utilitaires)
2. Ouvrez la fenêtre MIDI Studio (Cmd+2 ou Window > Show MIDI Studio)
3. Double-cliquez sur l'icône "IAC Driver"
4. Cochez la case "Device is online"
5. Si nécessaire, créez un nouveau port en cliquant sur le bouton "+"
6. Renommez le port si nécessaire
7. Fermez la fenêtre, les changements sont sauvegardés automatiquement

## Configuration du séquenceur de mélodies

1. Lancez l'application dans votre navigateur
2. Cliquez sur le bouton "MIDI OFF" pour l'activer (il deviendra "MIDI ON" et passera au vert)
3. La fenêtre de configuration MIDI s'ouvre automatiquement
4. Sélectionnez votre port MIDI virtuel dans la liste déroulante
5. Choisissez le canal MIDI (par défaut: 1)
6. Utilisez le bouton "Test" pour vérifier que la connexion fonctionne
7. Fermez la fenêtre de configuration

## Configuration du VSTi standalone

1. Ouvrez votre VSTi standalone
2. Dans les paramètres MIDI de votre VSTi, recherchez l'option pour sélectionner le port d'entrée MIDI
3. Sélectionnez le port MIDI virtuel que vous avez créé (loopMIDI ou IAC)
4. Assurez-vous que le VSTi est configuré pour écouter sur le même canal MIDI que celui défini dans le séquenceur

## Utilisation

1. Dans le séquenceur, créez ou chargez un pattern
2. Assurez-vous que le bouton "MIDI ON" est actif (vert)
3. Appuyez sur "Play" dans le séquenceur
4. Le son devrait être produit par votre VSTi

## Dépannage

### Le VSTi ne reçoit pas de données MIDI

1. Vérifiez que le bouton "MIDI ON" est vert dans le séquenceur
2. Vérifiez que vous avez sélectionné le bon port MIDI dans la configuration
3. Dans loopMIDI (Windows), vérifiez que les indicateurs de signal clignotent lors de l'envoi de notes
4. Vérifiez que le VSTi est configuré pour recevoir les données du bon port et canal MIDI
5. Testez la connexion avec le bouton "Test" dans la configuration MIDI
6. Rafraîchissez la page et essayez de reconnecter

### Décalage ou latence

Si vous constatez une latence entre le séquenceur visuel et le son de votre VSTi:

1. Vérifiez que le tempo est synchronisé entre le séquenceur et votre VSTi
2. Ajustez les paramètres de buffer audio dans votre VSTi pour réduire la latence
3. Fermez les applications inutiles pour libérer des ressources système

### Les notes s'accumulent ou restent bloquées

1. Appuyez sur "Stop" dans le séquenceur pour envoyer un message "All Notes Off"
2. Si les notes restent bloquées, utilisez la fonction panic/all notes off de votre VSTi
3. En dernier recours, déconnectez et reconnectez le port MIDI

## Conseils avancés

- Pour des performances optimales, utilisez une connexion filaire si vous utilisez un contrôleur MIDI externe
- Si le séquenceur doit fonctionner avec plusieurs VSTi, créez plusieurs ports virtuels distincts
- Sous Windows, considérez l'utilisation de ASIO4ALL pour réduire la latence audio
- Pour obtenir une synchronisation parfaite entre plusieurs applications, envisagez d'utiliser un logiciel de routage MIDI plus avancé (comme MIDIox)
