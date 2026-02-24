import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

const STAPLES = ['water', 'salt', 'oil', 'sugar', 'pepper', 'flour'];

function Home() {
  const [inputText, setInputText] = useState("") 
  const [suggestions, setSuggestions] = useState([]) 
  const [activeIndex, setActiveIndex] = useState(-1)

  const [selectedIngredients, setSelectedIngredients] = useState(() => {
    const saved = sessionStorage.getItem('myIngredients');
    return saved ? JSON.parse(saved) : [];
  });
  const [recipes, setRecipes] = useState(() => {
    const saved = sessionStorage.getItem('myRecipes');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState(() => {
    return sessionStorage.getItem('myCategory') || "";
  }); 
  const [maxTime, setMaxTime] = useState(() => {
    const saved = sessionStorage.getItem('myMaxTime');
    return saved ? Number(saved) : 120;
  }); 
  const [hasSearched, setHasSearched] = useState(() => {
    return sessionStorage.getItem('myHasSearched') === 'true';
  });
  
  const [categories, setCategories] = useState([]); 
  const [popularRecipes, setPopularRecipes] = useState([]);

  // --- СТАН: Темна/Світла тема ---
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const searchSectionRef = useRef(null);

  // --- НОВИЙ EFFECT: Автоматичний скрол при поверненні ---
  useEffect(() => {
    // Якщо користувач вже має вибрані інгредієнти (тобто повернувся з рецепту)
    if (selectedIngredients.length > 0 && searchSectionRef.current) {
      // Використовуємо setTimeout, щоб React встиг відмалювати всі блоки перед скролом
      setTimeout(() => {
        searchSectionRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 50);
    }
  }, []); // Порожній масив означає, що це спрацює лише один раз при завантаженні

  useEffect(() => {
    fetch('http://localhost:5000/api/recipes/popular')
      .then(res => res.json())
      .then(data => setPopularRecipes(data))
      .catch(err => console.error("Error fetching popular recipes:", err));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('myIngredients', JSON.stringify(selectedIngredients));
    sessionStorage.setItem('myRecipes', JSON.stringify(recipes));
    sessionStorage.setItem('myCategory', selectedCategory);
    sessionStorage.setItem('myMaxTime', maxTime.toString());
    sessionStorage.setItem('myHasSearched', hasSearched.toString());
  }, [selectedIngredients, recipes, selectedCategory, maxTime, hasSearched]);

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.style.backgroundColor = isDark ? '#111827' : '#F9FAFB';
  }, [isDark]);

  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setRecipes([]);
      setCategories([]);
      setSelectedCategory("");
      setHasSearched(false);
      return;
    }
    const fetchCategories = async () => {
      try {
        const ids = selectedIngredients.map(i => i.id);
        const res = await fetch('http://localhost:5000/api/categories/available', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ingredientIds: ids })
        });
        const data = await res.json();
        setCategories(data);
        if (selectedCategory && !data.includes(selectedCategory)) {
          setSelectedCategory("");
        }
      } catch (err) { console.error(err); }
    };
    fetchCategories();
  }, [selectedIngredients]);

  const handleInputChange = async (e) => {
    const text = e.target.value;
    setInputText(text);
    setActiveIndex(-1); 
    if (text.length > 1) {
      try {
        const res = await fetch(`http://localhost:5000/api/ingredients/search?query=${text}`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) { console.error(err); }
    } else { setSuggestions([]); }
  }

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault(); 
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        addIngredient(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') setSuggestions([]); 
  }

  const addIngredient = (ingredient) => {
    if (!selectedIngredients.find(item => item.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
      setHasSearched(false);
    }
    setInputText("");
    setSuggestions([]);
    setActiveIndex(-1); 
  }

  const removeIngredient = (id) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.id !== id));
    setHasSearched(false);
  }

  const handleReset = () => {
    setSelectedIngredients([]);
    setRecipes([]);
    setSelectedCategory("");
    setMaxTime(120);
    setHasSearched(false);
    setInputText("");
    setSuggestions([]);
  }

  const calculateStats = (recipe, myIngredients) => {
    let essentialTotal = 0;
    let essentialMatch = 0;
    if (recipe.ingredients_list) {
      recipe.ingredients_list.forEach(line => {
        const lineLower = line.toLowerCase();
        const isStaple = STAPLES.some(staple => lineLower.includes(staple));
        if (!isStaple) {
          essentialTotal++;
          const hasItem = myIngredients.some(myIng => 
            lineLower.includes(myIng.name.toLowerCase())
          );
          if (hasItem) { essentialMatch++; }
        }
      });
    }
    return { essentialTotal, essentialMatch, missingCount: essentialTotal - essentialMatch };
  };

  const handleSearchRecipes = async () => {
    setHasSearched(true);
    const ids = selectedIngredients.map(i => i.id);
    
    const res = await fetch('http://localhost:5000/api/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ingredientIds: ids,
          category: selectedCategory || null,
          maxTime: maxTime 
        })
    });
    const serverData = await res.json();

    const processedRecipes = serverData.map(recipe => {
      const stats = calculateStats(recipe, selectedIngredients);
      return { ...recipe, ...stats }; 
    });

    processedRecipes.sort((a, b) => {
      if (a.missingCount !== b.missingCount) {
        return a.missingCount - b.missingCount;
      }
      return b.essentialMatch - a.essentialMatch;
    });

    setRecipes(processedRecipes);
  }

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const showResults = hasSearched && recipes.length > 0;
  const showPopular = !hasSearched && popularRecipes.length > 0;

  const themeStyles = {
    '--bg-color': isDark ? '#111827' : '#F9FAFB',         
    '--card-bg': isDark ? '#1F2937' : '#FFFFFF',          
    '--text-main': isDark ? '#F9FAFB' : '#111827',        
    '--text-muted': isDark ? '#9CA3AF' : '#6B7280',       
    '--border-color': isDark ? '#374151' : '#E5E7EB',     
    '--input-bg': isDark ? '#111827' : '#FFFFFF',         
    '--input-border': isDark ? '#4B5563' : '#D1D5DB',     
    '--hover-bg': isDark ? '#374151' : '#F3F4F6',         
    '--tag-bg': isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', 
    '--tag-text': isDark ? '#34D399' : '#065F46',         
    '--error-bg': isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
    '--error-border': isDark ? '#7F1D1D' : '#FCA5A5',
    '--error-text': isDark ? '#FCA5A5' : '#B91C1C',
    '--error-sub': isDark ? '#F87171' : '#991B1B',
    '--shadow': isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-main)',
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  };

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
          margin: 0;
          padding: 0;
          background-color: ${isDark ? '#111827' : '#F9FAFB'};
          transition: background-color 0.3s ease;
        }
        .custom-input, .custom-select {
          background-color: var(--input-bg);
          color: var(--text-main);
          border: 1px solid var(--input-border);
          transition: all 0.2s ease;
        }
        .custom-input::placeholder { color: var(--text-muted); }
        .custom-input:focus, .custom-select:focus {
          outline: none;
          border-color: #10B981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2) !important;
        }
        .btn-primary { transition: all 0.2s ease; }
        .btn-primary:hover:not(:disabled) {
          background-color: #059669 !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .btn-secondary { transition: all 0.2s ease; }
        .btn-secondary:hover:not(:disabled) {
          background-color: var(--hover-bg) !important;
        }
        .ingredient-tag { transition: all 0.2s ease; }
        .ingredient-tag:hover { opacity: 0.8; }
        .recipe-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border-color);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .recipe-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow);
        }
        .fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .step-card {
          flex: 1; min-width: 250px; text-align: center; padding: 20px;
        }
        .icon-wrapper {
          width: 48px; height: 48px; background-color: var(--tag-bg); color: #10B981;
          border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto;
        }
        .suggestion-item:hover { background-color: var(--hover-bg) !important; }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.3s ease' }}>
          <div className="fade-in" style={{ textAlign: 'center', maxWidth: '800px', width: '100%' }}>
            <h1 style={{ margin: '0 0 16px 0', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1.2' }}>
              Turn your ingredients into <br/><span style={{ color: '#10B981' }}>delicious meals.</span>
            </h1>
            <p style={{ margin: '0 auto 32px auto', color: 'var(--text-muted)', fontSize: 'clamp(16px, 2vw, 18px)', maxWidth: '540px', lineHeight: '1.6' }}>
              Stop wasting food and wondering what to cook. Just tell us what you have in your pantry, and we'll do the magic.
            </p>
            <button 
              className="btn-primary"
              onClick={scrollToSearch}
              style={{ padding: '16px 36px', background: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
            >
              Start Searching
            </button>
          </div>
        </div>

        <div style={{ padding: '40px 20px', backgroundColor: 'var(--bg-color)', transition: 'background-color 0.3s ease' }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="step-card">
              <div className="icon-wrapper">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>1. Check your fridge</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>Add the ingredients you already have at home to your virtual pantry.</p>
            </div>

            <div className="step-card">
              <div className="icon-wrapper">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>2. Set your filters</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>Choose a category and set how much time you want to spend cooking.</p>
            </div>

            <div className="step-card">
              <div className="icon-wrapper">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>3. Cook & Enjoy</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>Get matching recipes, follow the instructions, and enjoy your meal.</p>
            </div>
          </div>
        </div>

      </div>

      <div ref={searchSectionRef} style={{ padding: '60px 20px 40px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'var(--card-bg)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow)', transition: 'all 0.3s ease' }}>
          
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>What's in your pantry?</h2>
          
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <input 
              className="custom-input"
              type="text" 
              placeholder="Type an ingredient (e.g. chicken, tomato)..." 
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown} 
              style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '10px', boxSizing: 'border-box' }}
            />
            {suggestions.length > 0 && (
              <ul style={{ 
                listStyle: 'none', padding: 0, margin: '4px 0 0 0', 
                border: '1px solid var(--border-color)', borderRadius: '10px',
                position: 'absolute', width: '100%', backgroundColor: 'var(--card-bg)', zIndex: 100,
                boxShadow: 'var(--shadow)', overflow: 'hidden'
              }}>
                {suggestions.map((ing, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <li 
                      key={ing.id} 
                      className="suggestion-item"
                      onClick={() => addIngredient(ing)}
                      onMouseEnter={() => setActiveIndex(index)} 
                      style={{ 
                        padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isActive ? 'var(--hover-bg)' : 'transparent',
                        color: 'var(--text-main)', fontSize: '15px'
                      }}
                    >
                      {ing.name}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Category</label>
                <select 
                  className="custom-select"
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={categories.length === 0}
                  style={{ 
                      width: '100%', padding: '14px', borderRadius: '10px',
                      fontSize: '15px', 
                      opacity: categories.length === 0 ? 0.6 : 1,
                      cursor: categories.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                <option value="">
                    {categories.length === 0 ? "Add ingredients first..." : "All Categories"}
                </option>
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
                </select>
            </div>

            <div style={{ flex: '1 1 200px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>Max Time</label>
                    <span style={{ fontWeight: '600', color: '#10B981', fontSize: '14px' }}>
                        {maxTime === 120 ? "120+ min" : `${maxTime} min`}
                    </span>
                </div>
                <input 
                    type="range" 
                    min="10" max="120" step="5" 
                    value={maxTime} 
                    onChange={(e) => setMaxTime(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#10B981', height: '6px' }}
                />
            </div>
          </div>

          {selectedIngredients.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px', minHeight: '34px' }}>
              {selectedIngredients.map(ing => (
                <span key={ing.id} className="ingredient-tag" style={{ 
                  background: 'var(--tag-bg)', color: 'var(--tag-text)', padding: '6px 14px', borderRadius: '20px', 
                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500'
                }}>
                  {ing.name}
                  <button 
                    onClick={() => removeIngredient(ing.id)} 
                    style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', padding: '0', fontSize: '16px', display: 'flex', alignItems: 'center' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className="btn-secondary"
              onClick={handleReset}
              disabled={selectedIngredients.length === 0}
              style={{ flex: 1, padding: '16px', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: selectedIngredients.length ? 'pointer' : 'not-allowed', opacity: selectedIngredients.length ? 1 : 0.4 }}
            >
              Clear All
            </button>
            
            <button 
              className="btn-primary"
              onClick={handleSearchRecipes}
              disabled={selectedIngredients.length === 0}
              style={{ flex: 2, padding: '16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: selectedIngredients.length ? 'pointer' : 'not-allowed', opacity: selectedIngredients.length ? 1 : 0.6 }}
            >
              Find Recipes
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 20px 60px 20px' }}>
        
        {selectedIngredients.length > 0 && hasSearched && recipes.length === 0 && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '30px', border: '1px solid var(--error-border)', borderRadius: '12px', backgroundColor: 'var(--error-bg)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--error-text)', fontSize: '18px', fontWeight: '600' }}>No recipes found</h3>
            <p style={{ margin: 0, color: 'var(--error-sub)', fontSize: '15px' }}>Try changing the category, increasing the cooking time, or adding different ingredients.</p>
          </div>
        )}

        {(showResults || showPopular) && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                {showResults ? "Your Matching Recipes" : "Need Inspiration? Popular Recipes"}
              </h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {(showResults ? recipes : popularRecipes).map((r) => (
                <Link to={`/recipe/${r.id}`} key={r.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="recipe-card" style={{ 
                      borderRadius: '16px', overflow: 'hidden', 
                      position: 'relative', height: '100%', display: 'flex', flexDirection: 'column'
                    }}>
                      
                      {showResults && (
                        <div style={{ 
                          position: 'absolute', top: '12px', right: '12px', 
                          backgroundColor: r.missingCount === 0 ? '#10B981' : '#F59E0B',
                          color: 'white', padding: '6px 12px', borderRadius: '20px', 
                          fontSize: '12px', fontWeight: '600', letterSpacing: '0.3px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          {r.missingCount === 0 ? "Ready to Cook" : `Missing ${r.missingCount}`}
                        </div>
                      )}

                      {showPopular && (
                        <div style={{ 
                          position: 'absolute', top: '12px', right: '12px', 
                          backgroundColor: '#3B82F6', color: 'white', padding: '6px 12px', 
                          borderRadius: '20px', fontSize: '12px', fontWeight: '600', letterSpacing: '0.3px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                          Popular 🔥
                        </div>
                      )}

                      {r.image_url ? (
                        <img src={r.image_url} alt={r.title} style={{width: '100%', height: '200px', objectFit: 'cover'}} />
                      ) : (
                        <div style={{ width: '100%', height: '200px', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
                      )}
                      
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', lineHeight: '1.3' }}>{r.title}</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
                          {r.description} • {r.time_minutes} min
                        </p>
                        
                        {showResults && (
                          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
                              <span style={{ color: '#10B981', fontWeight: '700' }}>{r.essentialMatch}</span> of {r.essentialTotal} ingredients found
                            </span>
                          </div>
                        )}

                        {showPopular && (
                          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '14px', color: '#10B981', fontWeight: '600' }}>
                              View Recipe →
                            </span>
                          </div>
                        )}
                      </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Home