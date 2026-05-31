import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import IngredientsList from '../components/recipe/IngredientsList';
import InstructionsList from '../components/recipe/InstructionsList';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';
import { STAPLES } from '../utils/constants';
import CookingMode from '../components/recipe/CookingMode';

function RecipePage() {
  const { id } = useParams();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAuthenticated, token } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCookingModeOpen, setIsCookingModeOpen] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`http://${window.location.hostname}:5000/api/recipes/${id}`);
        if (!res.ok) throw new Error('Recipe not found');
        const data = await res.json();
        
        const savedMyIngredients = sessionStorage.getItem('myIngredients');
        const myIngredients = savedMyIngredients ? JSON.parse(savedMyIngredients) : [];
        const initialChecked = new Set();
        
        if (data.ingredients_list) {
          data.ingredients_list.forEach((ing, idx) => {
            const ingLower = ing.toLowerCase();
            const isStaple = STAPLES.some(staple => ingLower.includes(staple));
            const hasItem = myIngredients.some(myIng => ingLower.includes(myIng.name.toLowerCase()));
            if (isStaple || hasItem) initialChecked.add(idx);
          });
        }
        
        setCheckedItems(initialChecked);
        setRecipe(data);
        setLoading(false); 

        // Fetch AI-formatted instructions
        if (!data.ai_instructions) {
          setAiLoading(true);
          try {
            const aiRes = await fetch(`http://${window.location.hostname}:5000/api/recipes/${id}/ai-instructions`);
            if (aiRes.ok) {
              const aiData = await aiRes.json();
              setRecipe(prev => ({ ...prev, ai_instructions: aiData.ai_instructions }));
            }
          } catch (aiErr) {
            console.error("Failed to load AI instructions", aiErr);
          } finally {
            setAiLoading(false);
          }
        }

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && recipe) {
      const checkFavoriteStatus = async () => {
        try {
          const res = await fetch(`http://${window.location.hostname}:5000/api/favorites/check/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          setIsFavorited(data.isFavorited);
        } catch (err) {
          console.error("Failed to check favorite status", err);
        }
      };
      checkFavoriteStatus();
    } else {
      setIsFavorited(false);
    }
  }, [id, isAuthenticated, token, recipe]);

  const handleFavoriteClick = async () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const method = isFavorited ? 'DELETE' : 'POST';
      const res = await fetch(`http://${window.location.hostname}:5000/api/favorites/${id}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setIsFavorited(!isFavorited);
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  const toggleCheck = (idx) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(idx)) {
      newChecked.delete(idx);
    } else {
      newChecked.add(idx);
    }
    setCheckedItems(newChecked);
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: 'var(--text-muted)' }}>
      Loading recipe...
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2 style={{ color: '#EF4444', marginBottom: '16px' }}>{error}</h2>
      <Link to="/" style={{ color: '#10B981', textDecoration: 'none', fontWeight: '600' }}>← Back to Home</Link>
    </div>
  );

  const embedUrl = getEmbedUrl(recipe.youtube_url);

  return (
    <div style={{ paddingBottom: '80px' }}>
      <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        
        <Link to="/" className="back-link">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Search
        </Link>

        {/* Recipe Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', marginBottom: '16px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: '800', lineHeight: '1.2' }}>
              {recipe.title}
            </h1>
            
            <button 
              onClick={handleFavoriteClick}
              className="icon-btn"
              style={{ 
                background: isFavorited ? 'var(--error-bg)' : 'var(--card-bg)', 
                border: `1px solid ${isFavorited ? 'var(--error-border)' : 'var(--border-color)'}`, 
                color: isFavorited ? '#EF4444' : 'var(--text-muted)', 
                cursor: 'pointer', padding: '12px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                transition: 'all 0.2s ease', flexShrink: 0,
                boxShadow: 'var(--shadow)'
              }}
              title={isFavorited ? "Remove from favorites" : "Save to favorites"}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: 'var(--tag-bg)', color: 'var(--tag-text)', padding: '6px 14px', borderRadius: '20px', fontSize: '14px', fontWeight: '600' }}>
              {recipe.description}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {recipe.time_minutes} minutes
            </span>
          </div>
        </div>

        <div className="top-layout">
          <div>
            {recipe.image_url && (
              <img src={recipe.image_url} alt={recipe.title} className="recipe-image" />
            )}
          </div>

          {/* Ingredients Section */}
          <div>
            <IngredientsList recipe={recipe} checkedItems={checkedItems} toggleCheck={toggleCheck} />
          </div>
        </div>

        {/* Instructions Section */}
        <div style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: '2px solid var(--border-color)', 
            paddingBottom: '12px', 
            marginBottom: '24px' 
          }}>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>
              Instructions
            </h3>
            
            {recipe?.ai_instructions && (
              <button
                onClick={() => setIsCookingModeOpen(true)}
                style={{
                  background: '#10B981', color: 'white', border: 'none', padding: '8px 16px',
                  borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Start Cooking
              </button>
            )}
          </div>
          
          <div style={{ fontSize: '16px' }}>
            <InstructionsList recipe={recipe} aiLoading={aiLoading} isExpanded={isExpanded} setIsExpanded={setIsExpanded} />
          </div>

          {embedUrl && (
            <div style={{ marginTop: '48px' }}>
              <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
                Video Tutorial
              </h3>
              <div className="video-container">
                <iframe 
                  src={embedUrl} 
                  title={`${recipe.title} Video Tutorial`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

      </div>
      {isCookingModeOpen && recipe.ai_instructions && (
        <CookingMode 
          steps={recipe.ai_instructions} 
          title={recipe.title}
          onClose={() => setIsCookingModeOpen(false)} 
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
}

export default RecipePage;