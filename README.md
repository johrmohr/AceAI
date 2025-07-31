# 🚀 AceAI Coding Platform

A professional-grade coding platform built with React, Monaco Editor, and Node.js/Express backend with MongoDB. Features a complete testing system with public and hidden test cases, similar to platforms like LeetCode and HackerRank.

## ✨ Features

### 🎯 **Core Features**
- **Monaco Editor Integration** - Professional code editor with syntax highlighting
- **Multi-Language Support** - Python, JavaScript, Java, C++
- **Real-time Code Execution** - Test your solutions immediately
- **Professional Testing System** - Public and hidden test cases
- **MongoDB Backend** - Scalable database for problems and solutions
- **RESTful API** - Clean, documented API endpoints

### 🧪 **Testing System**
- **Public Test Cases** - Visible to users for basic validation
- **Hidden Test Cases** - Backend validation for thorough testing
- **Edge Case Coverage** - Comprehensive test scenarios
- **Secure Validation** - Prevents cheating and ensures code quality

### 🎨 **User Experience**
- **Modern UI/UX** - Clean, responsive design
- **Dark Theme** - Easy on the eyes for long coding sessions
- **Real-time Feedback** - Immediate test results
- **Detailed Error Messages** - Helpful debugging information

## 🏗️ Architecture

```
AceAI/
├── frontend/                 # React application
│   ├── src/
│   │   ├── App.js           # Main application component
│   │   ├── App.css          # Styling
│   │   └── index.js         # Entry point
│   ├── public/
│   └── package.json
├── server/                   # Node.js/Express backend
│   ├── config/
│   │   └── database.js      # MongoDB connection
│   ├── models/
│   │   └── Problem.js       # Problem schema
│   ├── routes/
│   │   └── problems.js      # API endpoints
│   ├── seed/
│   │   └── sampleProblems.js # Database seeding
│   ├── server.js            # Express server
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/johrmohr/AceAI.git
   cd AceAI
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Set up MongoDB**
   - Create a MongoDB Atlas account or use local MongoDB
   - Update the connection string in `server/config/database.js`

5. **Start the backend server**
   ```bash
   cd server
   node server.js
   ```
   The server will run on `http://localhost:5001`

6. **Start the frontend application**
   ```bash
   npm start
   ```
   The application will run on `http://localhost:3000`

## 📚 Usage

### For Users
1. **Select a Problem** - Choose from available coding problems
2. **Write Your Solution** - Use the Monaco editor to write code
3. **Run Public Tests** - Test your solution against visible test cases
4. **Submit Solution** - Submit for thorough hidden test validation
5. **Review Results** - See detailed pass/fail results

### For Developers
1. **Add New Problems** - Use the API to create new coding problems
2. **Customize Test Cases** - Add public and hidden test cases
3. **Extend Language Support** - Add support for additional programming languages
4. **Modify UI** - Customize the frontend design and functionality

## 🔧 API Endpoints

### Problems
- `GET /api/problems` - Get all problems (without hidden test cases)
- `GET /api/problems/:id` - Get specific problem
- `GET /api/problems/:id/public-tests` - Get problem with public test cases
- `POST /api/problems/:id/validate` - Submit solution for hidden test validation
- `POST /api/problems` - Create new problem
- `PUT /api/problems/:id` - Update problem
- `DELETE /api/problems/:id` - Delete problem

### Example API Usage
```bash
# Get all problems
curl http://localhost:5001/api/problems

# Submit solution for validation
curl -X POST http://localhost:5001/api/problems/optimal-power-pair/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"def solution(): return [0,1]", "language":"python"}'
```

## 🗄️ Database Schema

### Problem Schema
```javascript
{
  problem_id: String,           // Unique identifier
  title: String,               // Problem title
  difficulty: String,          // Easy, Medium, Hard
  description: String,         // Problem description
  examples: Array,             // Example inputs/outputs
  constraints: Array,          // Problem constraints
  starter_code: Object,        // Starter code for each language
  public_test_cases: Array,    // Visible test cases
  hidden_test_cases: Array     // Backend-only test cases
}
```

## 🧪 Testing System

### Public Test Cases
- **Purpose**: Help users understand the problem
- **Visibility**: Visible to users
- **Execution**: Frontend (browser)
- **Count**: 2 test cases per problem

### Hidden Test Cases
- **Purpose**: Thorough validation of solutions
- **Visibility**: Backend only
- **Execution**: Server-side
- **Count**: 4+ test cases per problem
- **Security**: Never exposed to frontend

## 🛠️ Development

### Adding New Problems
1. Create problem data following the schema
2. Add to database using the API or seeding script
3. Test with various solutions
4. Verify test cases work correctly

### Extending Language Support
1. Update `executePythonFunction` pattern for new language
2. Add language to `languageOptions` in frontend
3. Update starter code templates
4. Test execution and validation

### Customizing UI
1. Modify `src/App.css` for styling changes
2. Update `src/App.js` for functionality changes
3. Add new components as needed
4. Test responsiveness and accessibility

## 🔒 Security Features

- **Hidden test cases** are never exposed to the frontend
- **Backend validation** prevents client-side manipulation
- **Input sanitization** prevents code injection
- **Error handling** provides safe error messages

## 🚀 Deployment

### Frontend (React)
```bash
npm run build
# Deploy build/ folder to your hosting service
```

### Backend (Node.js)
```bash
# Set environment variables
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string

# Start server
node server.js
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monaco Editor** - Professional code editor
- **React** - Frontend framework
- **Express.js** - Backend framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM

## 📞 Support

For support, email support@aceai.com or create an issue in this repository.

---

**Built with ❤️ for the coding community** 