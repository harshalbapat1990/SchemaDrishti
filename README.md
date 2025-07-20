# SchemaDrishti

> Modern SQL Server Schema Design & Visualization Tool

[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-Latest-green)](https://microsoft.github.io/monaco-editor/)
[![Mermaid](https://img.shields.io/badge/Mermaid-11.x-orange)](https://mermaid-js.github.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Project Goal

Build a modern, visually elegant web application for designing, viewing, and syncing SQL Server database schemas with a low-friction, intuitive user experience similar to dbdiagram.io.

## ✨ Features (MVP Roadmap)

### ✅ MVP 1: Basic Editor & Visualizer (Current)
- **Monaco Editor Panel:** Professional SQL code editor with syntax highlighting
- **Live ERD Diagram Preview:** Real-time Mermaid.js rendering
- **Two-pane Layout:** Resizable horizontal split
- **Dark/Light Mode Toggle:** Theme persistence
- **Basic Local Storage:** Temporary save during session

### 🚧 Coming Soon
- **MVP 2:** MongoDB Integration & Project Management
- **MVP 3:** Visual Enhancements & Interactive Canvas
- **MVP 4:** Team Collaboration (Azure Deployment)
- **MVP 5:** Database Sync with SQL Server
- **MVP 6:** Authentication & Cloud Storage

## 🛠️ Tech Stack

### Frontend
- **React 18** (JavaScript - NO TypeScript)
- **Monaco Editor** (SQL code editor with IntelliSense)
- **Mermaid.js** (diagram rendering)
- **CSS3 Variables** (lightweight theming, NO Tailwind)

### Future Integrations
- **MongoDB** (local → Azure Cosmos DB)
- **SQL Server** (schema sync)
- **Azure Static Web Apps** (deployment)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/harshalbapat1990/SchemaDrishti.git
cd SchemaDrishti

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3001](http://localhost:3001)

### Available Scripts

```bash
npm start          # Start development server
npm run build      # Build for production
npm run test       # Run test suite
npm run lint       # Fix linting issues
npm run lint:check # Check linting without fixing
```

## 📁 Project Structure

```
schemadrishti/
├── src/
│   ├── components/           # React components
│   ├── state/               # React Context stores
│   ├── services/            # Business logic layer
│   ├── utils/               # Helper functions
│   │   ├── constants.js     # App constants
│   │   └── helpers.js       # Utility functions
│   └── styles/              # CSS files
│       └── theme.css        # Theme system
├── public/                  # Static assets
├── mongodb/                 # Local MongoDB setup (MVP 2)
└── scripts/                 # Setup scripts
```

## 🎨 Development Guidelines

### Code Standards
- **JavaScript only** (NO TypeScript)
- **React Hooks** for state management
- **CSS3 Variables** for theming
- **ESLint** for code quality

### Git Workflow
- `main` branch for stable releases
- Feature branches for development
- Conventional commit messages

## 🔧 Development Status

### ✅ Completed (MVP 1 - Task 1)
- [x] React project setup with JavaScript
- [x] Monaco Editor and Mermaid.js integration
- [x] Theme system with CSS variables
- [x] Utility functions and constants
- [x] ESLint configuration
- [x] Project structure and build process

### 🚧 In Progress
- Layout Container & Theme System (Task 2)
- SQL Editor Integration (Task 3)
- SQL Parser Implementation (Task 4)

### 📋 Roadmap
See our detailed [MVP Roadmap](https://github.com/harshalbapat1990/SchemaDrishti/issues) for upcoming features.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - VS Code's editor
- [Mermaid](https://mermaid-js.github.io/) - Diagram generation
- [React](https://reactjs.org/) - UI framework

---

**Built with ❤️ for database developers and architects**
