# CLAUDE.md - Melody Sequencer Project

This file provides guidance to Claude Code (claude.ai/code) when working with the Melody Sequencer project.

## 🎯 Project Structure Overview

This project uses a **dual-version architecture** with V1 (stable) and V2 (modern) development streams:

```
melody-sequencer/
├── v1/                    # Stable version (JavaScript)
│   ├── CLAUDE_V1.md      # Complete V1 documentation
│   └── ...               # Working V1 codebase
├── v2/                    # Modern version (TypeScript + AI)  
│   ├── CLAUDE_V2.md      # V2 architecture and patterns
│   └── ...               # V2 development codebase
└── README.md             # Project overview and quick start
```

## 🚦 Working with Versions

### **When working on V1 (Stable/Maintenance):**
- Read `v1/CLAUDE_V1.md` for complete V1 documentation
- V1 is **feature-frozen** - only critical bugfixes
- Focus on stability and user experience
- Contains full project history and lessons learned

### **When working on V2 (Active Development):**
- Read `v2/CLAUDE_V2.md` for modern architecture patterns
- V2 is **actively developed** with TypeScript + Magenta.js
- Focus on clean architecture and AI features
- Follow TDD approach with comprehensive testing

## 🎵 Current Development Status (2025-07-23)

### V1 Status
- ✅ **Production ready** - Fully functional sequencer
- ⚠️ **Known issues** - Transport timing bugs, speed change issues
- 🔒 **Maintenance mode** - No new features, stability focus
- 📚 **Complete documentation** in `v1/CLAUDE_V1.md`

### V2 Status  
- 🎉 **Architecture Phase Complete** - Modular foundation implemented
- ✅ **Interface Operational** - PianoRoll SVG + MagentaVisualizer working
- 🏗️ **Robust Core** - EventBus, SynthEngine, PatternEngine, ErrorService
- 🎯 **Next Session** - Integrate new architecture with components
- 📋 **Full roadmap** in `v2/CLAUDE_V2.md`

## 🛠️ Quick Development Commands

### V1 (Stable)
```bash
cd v1
npm install
npm run dev      # → http://localhost:3000
npm run lint
```

### V2 (Modern)
```bash
cd v2
npm install      # Setup dependencies
npm run dev      # → http://localhost:3001 (when ready)
npm test         # Run test suite
npm run lint
```

## 🧭 Decision Tree: Which Version to Work On?

**Work on V1 if:**
- ❗ **Critical bug** affecting user experience
- 🔧 **Quick fix** needed for production use
- 📚 **Understanding** existing architecture/features
- 🔍 **Investigating** bugs to avoid in V2

**Work on V2 if:**
- ✨ **New features** or improvements
- 🏗️ **Architecture** work or refactoring
- 🤖 **AI features** with Magenta.js
- 📈 **Long-term** development goals

## ⚠️ Important Notes

### V1 Anti-Patterns (Avoid in V2)
- Complex nested React hooks with circular dependencies
- Unstable function references causing re-renders  
- Mixing Tone.js relative notation with absolute durations
- No testing strategy or type safety

### V2 Modern Patterns (Adopt)
- AudioEngine singleton outside React lifecycle
- Full TypeScript with strict mode
- Test-driven development approach
- Clean separation of concerns

## 📖 Documentation Navigation

- **Project Overview**: This file + `README.md`
- **V1 Complete Docs**: `v1/CLAUDE_V1.md`
- **V2 Architecture**: `v2/CLAUDE_V2.md`  
- **Feature Migration**: Guidelines in V2 docs
- **Development History**: Complete timeline in V1 docs

---

**For version-specific guidance, always refer to the respective CLAUDE_V1.md or CLAUDE_V2.md files.**