import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Home from './Home';
import RecipePage from './components/RecipePage';
import Header from './Header';
import Favorites from './Favorites';

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