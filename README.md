# Enhanced Chat Application

A modern, real-time chat application built with vanilla JavaScript, WebSockets, and Node.js.

## Features

- **Real-time messaging** with WebSocket connections
- **User authentication** with login/register functionality
- **Modern UI** with light/dark theme support
- **Responsive design** for mobile and desktop
- **Connection status** indicators and auto-reconnection
- **Message timestamps** and user avatars
- **Notification system** for user feedback
- **Rate limiting** to prevent spam
- **Accessibility** features with ARIA support

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, WebSocket (ws library)
- **Deployment**: Vercel

## Project Structure

            chat/
            ├── frontend/
            │   ├── css/
            │   │   └── style.css          
            │   ├── js/
            │   │   ├── app.js            
            │   │   └── modules/
            │   │       ├── auth.js        
            │   │       ├── chat.js        
            │   │       └── ui.js          
            │   ├── images/
            │   │   └── background.png     
            │   └── index.html             
            ├── backend/
            │   ├── src/
            │   │   └── server.js          
            │   └── package.json           
            ├── vercel.json                
            └── README.md                  

## Local Development

### Prerequisites

- Node.js 18+ installed
- A modern web browser

### Setup

1. **Clone the repository** (or download the files)

2. **Install backend dependencies**:

         cd backend
         npm install

3. **Start the backend server**:
   
         npm start
   **or for development with auto-reload**:
         
         npm run dev

4. **Serve the frontend**:
   - Option 1: Use a local server like `http-server`:

            cd frontend
            npx http-server -p 3000

   - Option 2: Open `frontend/index.html` directly in your browser

5. **Access the application**:
   - Open your browser and go to `http://localhost:3000` (or the file:// URL)

## Features Overview

### Authentication System
- Secure login/register forms
- Session persistence with sessionStorage
- Input validation and error handling
- Smooth transitions between forms

### Chat Interface
- Real-time message delivery
- User avatars generated from initials
- Message timestamps
- System notifications for user events
- Connection status indicators
- Auto-reconnection on connection loss

### UI/UX Enhancements
- Light/dark theme toggle
- Responsive design for all devices
- Smooth animations and transitions
- Toast notifications for user feedback
- Accessible design with ARIA support

### Backend Features
- WebSocket server with ping/pong heartbeat
- Rate limiting to prevent spam
- Client connection tracking
- Proper error handling and logging
- Graceful connection management

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Considerations

- Input sanitization for XSS prevention
- Rate limiting for spam prevention
- Connection validation
- Error message sanitization

## Performance Optimizations

- Efficient DOM operations
- Event delegation
- Smooth scrolling with CSS
- Optimized WebSocket reconnection logic
- Minimal JavaScript bundle size

## Accessibility Features

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Focus management
