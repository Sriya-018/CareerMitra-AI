import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AssessmentPage from './pages/AssessmentPage';
import ResultsPage from './pages/ResultsPage';
import AboutPage from './pages/AboutPage';
import ResumePage from './pages/ResumePage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import AdminPage from './pages/AdminPage';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/assessment" element={<AssessmentPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/resume" element={<ResumePage />} />
              <Route path="/interview-prep" element={<InterviewPrepPage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* 404 fallback */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen pt-20 flex flex-col items-center justify-center text-center px-4">
                    <div className="text-6xl font-extrabold text-primary-600 mb-4">404</div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Page Not Found
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      The page you're looking for doesn't exist.
                    </p>
                    <a href="/" className="btn-primary">
                      Go Home
                    </a>
                  </div>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
