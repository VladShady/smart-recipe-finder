import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import RecipePage from './RecipePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/recipe/:id" element={<RecipePage />} />
      </Routes>
    </Router>
  );
}

export default App;