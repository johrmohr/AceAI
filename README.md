# Monaco Code Editor Web App

A modern, responsive web application featuring the Monaco Editor (the same editor that powers VS Code) built with React.

## Features

- **Monaco Editor Integration**: Full-featured code editor with syntax highlighting
- **Multiple Language Support**: JavaScript, TypeScript, Python, Java, C++, C#, PHP, HTML, CSS, JSON, SQL, Markdown
- **Dark Theme**: Beautiful dark theme optimized for coding
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Editing**: Live code editing with syntax validation
- **Modern UI**: Clean, professional interface with smooth animations

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone or download this project
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

### Building for Production

To create a production build:

```bash
npm run build
```

## Usage

1. **Language Selection**: Use the dropdown in the header to switch between different programming languages
2. **Code Editing**: Start typing in the editor - it supports all standard code editor features
3. **Syntax Highlighting**: Automatic syntax highlighting based on the selected language
4. **Auto-completion**: Intelligent code suggestions and auto-completion
5. **Error Detection**: Real-time error detection and validation

## Technologies Used

- **React**: Frontend framework
- **Monaco Editor**: Code editor component
- **CSS3**: Styling with modern CSS features
- **Create React App**: Development environment

## Project Structure

```
monaco-code-editor-app/
├── public/
│   └── index.html
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Application styles
│   ├── index.js        # React entry point
│   └── index.css       # Global styles
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Customization

You can customize the editor by modifying the options in `App.js`:

- Change the default theme
- Adjust font size and family
- Enable/disable features like minimap
- Modify editor behavior and appearance

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## License

This project is open source and available under the MIT License. 