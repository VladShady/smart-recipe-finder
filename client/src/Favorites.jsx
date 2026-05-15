import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import RecipeCard from './components/RecipeCard';

function Favorites() {
  const { token, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://${window.location.hostname}:5000/api/favorites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setFavorites(data);
        }
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [token, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '16px' }}>My Favorites</h2>
        <p style={{ color: 'var(--text-muted)' }}>Please sign in to view your saved recipes.</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <svg width="28" height="28" fill="#EF4444" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '800' }}>My Favorites</h1>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading your recipes...
        </div>
      ) : favorites.length > 0 ? (
        <div className="recipe-grid">
          {favorites.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
          <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No saved recipes yet</p>
          <p style={{ color: 'var(--text-muted)' }}>When you find a recipe you like, click the heart icon to save it here.</p>
        </div>
      )}
    </div>
  );
}

export default Favorites;