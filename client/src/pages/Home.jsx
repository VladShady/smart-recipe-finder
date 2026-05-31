import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext';
import RecipeCard from '../components/recipe/RecipeCard';
import HeroSection from '../components/home/HeroSection';
import { STAPLES } from '../utils/constants';

function Home() {
  const [inputText, setInputText] = useState("") 
  const [suggestions, setSuggestions] = useState([]) 
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false);

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

  const searchSectionRef = useRef(null);
  const resultsSectionRef = useRef(null);
  const debounceTimer = useRef(null); 

  // Auto-scroll on component mount when returning from recipe details
  useEffect(() => {
    if (selectedIngredients.length > 0 && searchSectionRef.current) {
      setTimeout(() => {
        searchSectionRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 50);
    }
  }, []);

  // Initial fetch for popular recipes
  useEffect(() => {
    fetch(`http://${window.location.hostname}:5000/api/recipes/popular`)
      .then(res => res.json())
      .then(data => setPopularRecipes(data))
      .catch(err => console.error("Error fetching popular recipes:", err));
  }, []);

  // Persist user session data
  useEffect(() => {
    sessionStorage.setItem('myIngredients', JSON.stringify(selectedIngredients));
    sessionStorage.setItem('myRecipes', JSON.stringify(recipes));
    sessionStorage.setItem('myCategory', selectedCategory);
    sessionStorage.setItem('myMaxTime', maxTime.toString());
    sessionStorage.setItem('myHasSearched', hasSearched.toString());
  }, [selectedIngredients, recipes, selectedCategory, maxTime, hasSearched]);

  // Fetch available categories dynamically based on selected ingredients
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
        const res = await fetch(`http://${window.location.hostname}:5000/api/categories/available`, {
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

  // Handle autocomplete input
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    setActiveIndex(-1); 

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.length > 1) {
      debounceTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`http://${window.location.hostname}:5000/api/ingredients/search?query=${text}`);
          const data = await res.json();
          setSuggestions(data);
        } catch (err) { 
          console.error(err); 
        }
      }, 300);
    } else { 
      setSuggestions([]); 
    }
  };

  // Keyboard navigation for search suggestions
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
    }
    setInputText("");
    setSuggestions([]);
    setActiveIndex(-1); 
  }

  const handleAddClick = () => {
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      addIngredient(suggestions[activeIndex]);
    } else if (suggestions.length > 0) {
      addIngredient(suggestions[0]);
    }
  }

  const removeIngredient = (id) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.id !== id));
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

  // Calculate missing and matching ingredients for recipe scoring
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

  const processedRecipes = useMemo(() => {
    if (!recipes || recipes.length === 0) return [];

    const processed = recipes.map(recipe => {
      const stats = calculateStats(recipe, selectedIngredients);
      return { ...recipe, ...stats }; 
    });

    return processed.sort((a, b) => {
      if (a.missingCount !== b.missingCount) {
        return a.missingCount - b.missingCount;
      }
      if (a.essentialMatch !== b.essentialMatch) {
        return b.essentialMatch - a.essentialMatch;
      }
    
      return a.id - b.id; 
    });
  }, [recipes, selectedIngredients]);

  const handleSearchRecipes = async () => {
    setHasSearched(true);
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const ids = selectedIngredients.map(i => i.id);
    
    try {
      const res = await fetch(`http://${window.location.hostname}:5000/api/recipes/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            ingredientIds: ids,
            category: selectedCategory || null,
            maxTime: maxTime 
          })
      });
      const serverData = await res.json();
      setRecipes(serverData);

      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const scrollToSearch = () => {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const showResults = hasSearched && recipes.length > 0;
  const showPopular = !hasSearched && popularRecipes.length > 0;

  return (
    <div>
      <HeroSection onStartSearch={scrollToSearch} />

      {/* Main Search Interface */}
      <div className="search-card-container" ref={searchSectionRef} style={{ padding: '60px 20px 40px', scrollMarginTop: '80px' }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', backgroundColor: 'var(--card-bg)', padding: '40px', borderRadius: '16px', boxShadow: 'var(--shadow)', transition: 'all 0.3s ease' }}>
          
          <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '700' }}>What's in your pantry?</h2>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                className="custom-input"
                type="text" 
                placeholder="Type an ingredient (e.g. chicken)" 
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

            <button 
              className="btn-primary add-btn"
              onClick={handleAddClick}
              disabled={!inputText.trim()}
              style={{ 
                padding: '0 24px', 
                background: '#10B981', 
                color: 'white', 
                border: 'none', 
                borderRadius: '10px', 
                fontSize: '16px', 
                fontWeight: '600', 
                cursor: inputText.trim() ? 'pointer' : 'not-allowed', 
                opacity: inputText.trim() ? 1 : 0.6 
              }}
            >
              Add
            </button>
            
          </div>

          {/* Filters Interface */}
          <div className="filters-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', alignItems: 'center' }}>
            
            <div>
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
                      cursor: categories.length === 0 ? 'not-allowed' : 'pointer',
                      boxSizing: 'border-box'
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

            <div>
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
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#10B981', height: '6px', boxSizing: 'border-box' }}
                />
            </div>
          </div>

          {/* Selected Ingredients Tags */}
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

          {/* Form Actions */}
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

      {/* Results Section */}
      <div ref={resultsSectionRef} style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 60px 20px', scrollMarginTop: '80px' }}>
        
        {/* Empty State */}
        {!isLoading && selectedIngredients.length > 0 && hasSearched && processedRecipes.length === 0 && (
          <div className="fade-in" style={{ textAlign: 'center', padding: '30px', border: '1px solid var(--error-border)', borderRadius: '12px', backgroundColor: 'var(--error-bg)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--error-text)', fontSize: '18px', fontWeight: '600' }}>No recipes found</h3>
            <p style={{ margin: 0, color: 'var(--error-sub)', fontSize: '15px' }}>
              {selectedIngredients.length < 3 
                ? "You've selected very few ingredients. Try adding more items to your pantry to unlock recipes!" 
                : "Try changing the category, increasing the cooking time, or adding different ingredients."}
            </p>
          </div>
        )}

        {/* Recipe Cards & Skeletons */}
        {(isLoading || showResults || showPopular) && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                {isLoading 
                  ? "Searching your pantry..." 
                  : (showResults ? "Your Matching Recipes" : "Need Inspiration? Popular Recipes")}
              </h2>
            </div>
            
            <div className="recipe-grid">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <div key={i} className="recipe-card" style={{ pointerEvents: 'none' }}>
                    <div className="card-image-wrapper" style={{ backgroundColor: 'var(--hover-bg)', animation: 'pulse 1.5s infinite' }}></div>
                    <div className="card-content">
                      <div style={{ height: '24px', backgroundColor: 'var(--hover-bg)', borderRadius: '6px', marginBottom: '12px', width: '70%', animation: 'pulse 1.5s infinite' }}></div>
                      <div style={{ height: '16px', backgroundColor: 'var(--hover-bg)', borderRadius: '6px', width: '40%', animation: 'pulse 1.5s infinite' }}></div>
                      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                        <div style={{ height: '14px', backgroundColor: 'var(--hover-bg)', borderRadius: '6px', width: '50%', animation: 'pulse 1.5s infinite' }}></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                (showResults ? processedRecipes : popularRecipes).map((r) => (
                  <RecipeCard key={r.id} recipe={r} showResults={showResults} />  
                ))
              )}
            </div>

            {/* End of Results Message */}
            {!isLoading && (
              <div style={{ textAlign: 'center', marginTop: '48px', paddingBottom: '24px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ height: '1px', flex: 1, maxWidth: '60px', backgroundColor: 'var(--border-color)' }}></div>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.5 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div style={{ height: '1px', flex: 1, maxWidth: '60px', backgroundColor: 'var(--border-color)' }}></div>
                </div>
                <p style={{ fontSize: '15px', margin: 0, fontWeight: '500' }}>
                  {showResults 
                    ? (selectedIngredients.length < 3 
                        ? "That's all we found! Adding a few more ingredients might unlock many more recipes."
                        : "That's all we found! Try tweaking your filters or ingredients for more.")
                    : "That's all for now! Add what's in your pantry above to find matches."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Home