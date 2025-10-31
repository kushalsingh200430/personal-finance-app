import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <nav className="navbar">
        <div className="container navbar-content">
          <div className="navbar-brand">💰 Pocket Guard</div>
          <div>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="nav-link">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="hero">
        <div className="container">
          <h1>Manage Your Personal Finances Effortlessly</h1>
          <p>Track EMIs, expenses, and file taxes all in one place</p>
          <Link to="/signup" className="btn btn-primary btn-lg">Get Started</Link>
        </div>
      </div>

      <div className="features container">
        <div className="feature-card">
          <h3>📊 EMI Calculator</h3>
          <p>Calculate and track loan EMIs with detailed amortization schedules</p>
        </div>
        <div className="feature-card">
          <h3>💳 Expense Tracking</h3>
          <p>Categorize and monitor your daily expenses with visual reports</p>
        </div>
        <div className="feature-card">
          <h3>📋 Tax Filing</h3>
          <p>File ITR-1 directly with pre-filled data and government integration</p>
        </div>
        <div className="feature-card">
          <h3>🔐 Secure 2FA</h3>
          <p>Two-factor authentication to keep your financial data safe</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
