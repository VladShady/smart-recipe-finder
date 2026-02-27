import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Home from './Home';
import RecipePage from './RecipePage';
import Header from './Header';

function App() {
  return (
    <Router>
      <ThemeProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
      </Routes>
      </ThemeProvider>
    </Router>
  );
}

export default App;