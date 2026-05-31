import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import RecipePage from './pages/RecipePage';
import Header from './components/layout/Header';
import Favorites from './pages/Favorites';

function App() {
  return (
    <Router>
      <ThemeProvider>
      <AuthProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/favorites" element={<Favorites />} />
      </Routes>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;