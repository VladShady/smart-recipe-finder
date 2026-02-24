import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const STAPLES = ['water', 'salt', 'oil', 'sugar', 'pepper', 'flour'];

function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [checkedItems, setCheckedItems] = useState(new Set());

  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.style.backgroundColor = isDark ? '#111827' : '#F9FAFB';
  }, [isDark]);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/recipes/${id}`);
        if (!res.ok) {
          throw new Error('Recipe not found');
        }
        const data = await res.json();
        
        const savedMyIngredients = sessionStorage.getItem('myIngredients');
        const myIngredients = savedMyIngredients ? JSON.parse(savedMyIngredients) : [];
        
        const initialChecked = new Set();
        
        if (data.ingredients_list) {
          data.ingredients_list.forEach((ing, idx) => {
            const ingLower = ing.toLowerCase();
            const isStaple = STAPLES.some(staple => ingLower.includes(staple));
            const hasItem = myIngredients.some(myIng => ingLower.includes(myIng.name.toLowerCase()));
            
            if (isStaple || hasItem) {
              initialChecked.add(idx);
            }
          });
        }
        
        setCheckedItems(initialChecked);
        setRecipe(data);
        setLoading(false);
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

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const themeStyles = {
    '--bg-color': isDark ? '#111827' : '#F9FAFB',         
    '--card-bg': isDark ? '#1F2937' : '#FFFFFF',          
    '--text-main': isDark ? '#F9FAFB' : '#111827',        
    '--text-muted': isDark ? '#9CA3AF' : '#6B7280',       
    '--border-color': isDark ? '#374151' : '#E5E7EB',     
    '--hover-bg': isDark ? '#374151' : '#F3F4F6',         
    '--tag-bg': isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', 
    '--tag-text': isDark ? '#34D399' : '#065F46',
    '--staple-bg': isDark ? '#374151' : '#F3F4F6',
    '--staple-text': isDark ? '#9CA3AF' : '#6B7280',         
    '--shadow': isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-main)',
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    paddingBottom: '80px'
  };

  if (loading) return (
    <div style={{ ...themeStyles, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px', color: 'var(--text-muted)' }}>
      Loading recipe...
    </div>
  );

  if (error) return (
    <div style={{ ...themeStyles, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h2 style={{ color: '#EF4444', marginBottom: '16px' }}>{error}</h2>
      <Link to="/" style={{ color: '#10B981', textDecoration: 'none', fontWeight: '600' }}>← Back to Home</Link>
    </div>
  );

  // --- ОНОВЛЕНА ФУНКЦІЯ: Красиве відображення покрокових інструкцій ---
  const renderInstructions = () => {
    // 1. Якщо у нас є оброблені ШІ кроки (масив)
    if (recipe.ai_instructions && Array.isArray(recipe.ai_instructions)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {recipe.ai_instructions.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
              <div style={{
                flexShrink: 0, width: '32px', height: '32px', backgroundColor: 'var(--tag-bg)', color: '#10B981',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px'
              }}>
                {idx + 1}
              </div>
              <p style={{ margin: 0, paddingTop: '4px', lineHeight: '1.6', color: 'var(--text-main)', fontSize: '16px' }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      );
    }

    // 2. Запасний варіант (якщо ШІ не спрацював або ключ не налаштовано)
    if (!recipe.instructions) return null;
    const steps = recipe.instructions.split('\n').map(s => s.trim()).filter(s => s.length > 0);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ padding: '16px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-main)' }}>{step}</p>
          </div>
        ))}
      </div>
    );
  };

  const embedUrl = getEmbedUrl(recipe.youtube_url);

  return (
    <div style={themeStyles}>
      
      <button 
        onClick={() => setIsDark(!isDark)}
        style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
          background: 'var(--card-bg)', border: '1px solid var(--border-color)',
          borderRadius: '50%', width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-main)',
          boxShadow: 'var(--shadow)', transition: 'all 0.2s ease'
        }}
        aria-label="Toggle Theme"
      >
        {isDark ? (
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>

      <style>{`
        html, body {
          margin: 0; padding: 0;
          background-color: ${isDark ? '#111827' : '#F9FAFB'};
        }
        .back-link {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--text-muted); text-decoration: none; font-weight: 500;
          padding: 8px 16px; border-radius: 8px; transition: all 0.2s ease;
          margin-bottom: 24px;
        }
        .back-link:hover { background-color: var(--hover-bg); color: var(--text-main); }
        
        .recipe-grid {
          display: grid; gap: 40px; grid-template-columns: 1fr;
        }
        @media (min-width: 860px) {
          .recipe-grid { grid-template-columns: 350px 1fr; }
        }
        
        .ingredient-list-item {
          padding: 12px; 
          border-bottom: 1px solid var(--border-color);
          font-size: 15px; 
          display: flex; 
          align-items: center; 
          gap: 12px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-radius: 8px;
        }
        .ingredient-list-item:hover {
          background-color: var(--hover-bg);
        }
        
        .hero-image {
          width: 100%; height: 400px; object-fit: cover; border-radius: 20px;
          box-shadow: var(--shadow); margin-bottom: 32px;
        }

        .video-container {
          position: relative;
          padding-bottom: 56.25%; 
          height: 0;
          overflow: hidden;
          border-radius: 16px;
          box-shadow: var(--shadow);
          background-color: #000;
        }
        .video-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: 0;
        }

        .fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
        
        <Link to="/" className="back-link">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Search
        </Link>

        <div style={{ marginBottom: '32px' }}>
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

        {recipe.image_url && (
          <img src={recipe.image_url} alt={recipe.title} className="hero-image" />
        )}

        <div className="recipe-grid">
          <div>
            <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', position: 'sticky', top: '24px', boxShadow: 'var(--shadow)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', paddingLeft: '12px' }}>
                Ingredients
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recipe.ingredients_list && recipe.ingredients_list.map((ing, idx) => {
                  
                  const ingLower = ing.toLowerCase();
                  const isStaple = STAPLES.some(staple => ingLower.includes(staple));
                  const isChecked = checkedItems.has(idx);

                  return (
                    <div 
                      key={idx} 
                      className="ingredient-list-item"
                      onClick={() => toggleCheck(idx)}
                    >
                      <div style={{ flexShrink: 0, color: isChecked ? '#10B981' : 'var(--text-muted)' }}>
                        {isChecked ? (
                          <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                          </svg>
                        )}
                      </div>
                      
                      <span style={{ 
                        flex: 1, 
                        color: isChecked ? 'var(--text-muted)' : 'var(--text-main)',
                        transition: 'color 0.2s ease'
                      }}>
                        {ing}
                      </span>

                      {isStaple && (
                        <span style={{ 
                          fontSize: '11px', 
                          backgroundColor: 'var(--staple-bg)', 
                          color: 'var(--staple-text)', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          fontWeight: '600',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase'
                        }}>
                          Staple
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700', color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '12px' }}>
              Instructions
            </h3>
            
            {/* Оновлені покрокові інструкції */}
            <div style={{ fontSize: '16px' }}>
              {renderInstructions(recipe.instructions)}
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
    </div>
  );
}

export default RecipePage;