import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import IngredientsList from './components/recipe/IngredientsList';
import InstructionsList from './components/recipe/InstructionsList';
import { useTheme } from './context/ThemeContext';
import { STAPLES } from './constants';

function RecipePage() {
  const { id } = useParams();
  
  // Component state
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize recipe data and pantry matches
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        // Fetch primary recipe details
        const res = await fetch(`http://${window.location.hostname}:5000/api/recipes/${id}`);
        if (!res.ok) throw new Error('Recipe not found');
        const data = await res.json();
        
        // Auto-check ingredients present in user's pantry or common staples
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

        // Fetch AI-formatted instructions asynchronously
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

  const toggleCheck = (idx) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(idx)) {
      newChecked.delete(idx);
    } else {
      newChecked.add(idx);
    }
    setCheckedItems(newChecked);
  };

  // Extract YouTube embed ID
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
          <h1 style={{ margin: '0 0 16px 0', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: '800', lineHeight: '1.2' }}>
            {recipe.title}
          </h1>
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
          <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
            Instructions
          </h3>
          
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
    </div>
  );
}

export default RecipePage;