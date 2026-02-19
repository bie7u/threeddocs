# 3D Docs - Login Page

A modern, beautiful login page built with React and Tailwind CSS as an extension of the [3ddoc project](https://github.com/bie7u/3ddoc).

## Features

- ✨ Beautiful login page with gradient design
- 🎨 Styled with Tailwind CSS v4
- 🔐 Client-side authentication (demo/prototype)
- 🚀 React Router for navigation
- 📱 Responsive design
- 🎯 Protected routes
- 🔄 Logout functionality

## Demo Credentials

- **Email:** `user@example.com`
- **Password:** `password123`

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bie7u/threeddocs.git
cd threeddocs
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
threeddocs/
├── src/
│   ├── pages/
│   │   ├── Login.jsx       # Login page component
│   │   └── Dashboard.jsx   # Dashboard component (empty placeholder)
│   ├── App.jsx            # Main app with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Tailwind CSS imports
├── public/
├── index.html
├── package.json
└── vite.config.js
```

## Technologies Used

- **React** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Utility-first CSS framework
- **React Router** - Client-side routing

## Future Enhancements

- [ ] Server-side authentication with JWT
- [ ] Password reset functionality
- [ ] User registration
- [ ] Dashboard features (Documents, Projects, Settings)
- [ ] 3D visualization integration
- [ ] API integration

## Security Note

⚠️ **Important:** This is a prototype with client-side mocked authentication. For production use:
- Implement proper server-side authentication
- Use secure tokens (JWT)
- Add HTTPS
- Implement CSRF protection
- Use environment variables for configuration

## Screenshots

### Login Page
![Login Page](https://github.com/user-attachments/assets/9cd32253-95d2-4fc8-9630-80382315d01a)

### Dashboard
![Dashboard](https://github.com/user-attachments/assets/cace4b56-871b-482a-a0d2-910e560e2794)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

