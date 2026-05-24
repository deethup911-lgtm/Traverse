# Traverse - AI-Powered Trip Planner

Traverse is an intelligent, full-stack travel planning application that leverages the power of Google's Gemini AI to generate personalized, budget-conscious travel itineraries. 

Whether you are looking for a weekend getaway or a month-long expedition, Traverse provides detailed, day-by-day schedules tailored to your interests, travel pace, and budget.

## Features

- **AI Trip Generation**: Enter your destination, budget, travel pace, and interests, and let Gemini AI craft a detailed itinerary.
- **Smart Budgeting**: The AI automatically enforces your budget limits, providing cost breakdowns for food, accommodation, transport, and activities.
- **User Authentication**: Secure user registration and login using JWT (JSON Web Tokens) and bcrypt.
- **Interactive UI**: A modern, responsive user interface built with React, Vite, and TailwindCSS.
- **Data Persistence**: Save your generated trips and user profiles using MongoDB.

## Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS 4, React Router, Recharts, Lucide Icons.
- **Backend**: Python, FastAPI, Pydantic, Motor (Async MongoDB client), Google GenAI SDK.
- **Database**: MongoDB.
- **Security**: JWT (pyjwt), bcrypt.

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites
- Node.js installed on your machine.
- Python 3.9 or higher installed on your machine.
- MongoDB installed and running locally.
- A Google Gemini API Key from Google AI Studio.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/deethup911-lgtm/traverse.git
   cd traverse
   ```

2. **Setup Backend**
   Navigate to the backend directory and install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
   Create a `.env` file in the `backend` directory based on the provided `.env.example`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/traverse
   JWT_SECRET=your_super_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Setup Frontend**
   Navigate to the frontend directory and install Node dependencies:
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   uvicorn app.main:app --port 5000 --reload
   ```
   *The backend will run on `http://localhost:5000`*

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173` (or the port Vite provides).*

## Contributing
Contributions, issues, and feature requests are welcome!

## License
This project is open-source and available under the ISC License.
