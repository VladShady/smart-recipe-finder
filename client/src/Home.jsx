import { useState, useEffect } from 'react'
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

  useEffect(() => {
    sessionStorage.setItem('myIngredients', JSON.stringify(selectedIngredients));
    sessionStorage.setItem('myRecipes', JSON.stringify(recipes));
  }, [selectedIngredients, recipes]);

  useEffect(() => {
    if (selectedIngredients.length === 0) {
      setRecipes([]);
    }
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
    } 
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } 
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        addIngredient(suggestions[activeIndex]);
      }
    }
    else if (e.key === 'Escape') setSuggestions([]); 
  }

  const addIngredient = (ingredient) => {
    if (!selectedIngredients.find(item => item.id === ingredient.id)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
    }
    setInputText("");
    setSuggestions([]);
    setActiveIndex(-1); 
  }

  const removeIngredient = (id) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.id !== id));
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
          
          if (hasItem) {
            essentialMatch++;
          }
        }
      });
    }

    return {
      essentialTotal,
      essentialMatch,
      missingCount: essentialTotal - essentialMatch
    };
  };

  const handleSearchRecipes = async () => {
    const ids = selectedIngredients.map(i => i.id);
    
    const res = await fetch('http://localhost:5000/api/recipes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredientIds: ids })
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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1>Smart Recipe Finder 🍳</h1>
      
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Type an ingredient (e.g. 'chicken')..." 
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown} 
          style={{ width: '100%', padding: '15px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        
        {suggestions.length > 0 && (
          <ul style={{ 
            listStyle: 'none', padding: 0, margin: 0, 
            border: '1px solid #ccc', borderRadius: '0 0 8px 8px',
            position: 'absolute', width: '100%', backgroundColor: 'white', zIndex: 100
          }}>
            {suggestions.map((ing, index) => {
              const isActive = index === activeIndex;
              return (
                <li 
                  key={ing.id} 
                  onClick={() => addIngredient(ing)}
                  onMouseEnter={() => setActiveIndex(index)} 
                  style={{ 
                    padding: '10px', 
                    cursor: 'pointer', 
                    borderBottom: '1px solid #eee',
                    backgroundColor: isActive ? '#f0f0f0' : 'white'
                  }}
                >
                  {ing.name}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', minHeight: '40px' }}>
        {selectedIngredients.map(ing => (
          <span key={ing.id} style={{ 
            background: '#e0f7fa', padding: '8px 15px', borderRadius: '20px', 
            display: 'flex', alignItems: 'center', gap: '10px' 
          }}>
            {ing.name}
            <button onClick={() => removeIngredient(ing.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </span>
        ))}
      </div>

      <button 
        onClick={handleSearchRecipes}
        disabled={selectedIngredients.length === 0}
        style={{ width: '100%', padding: '15px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', cursor: 'pointer', opacity: selectedIngredients.length ? 1 : 0.5 }}
      >
        🔍 Find Recipes
      </button>

      <div style={{ marginTop: '30px' }}>
        
        {selectedIngredients.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px 20px', border: '2px dashed #eee', borderRadius: '10px' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🥗</div>
            <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>Your fridge is empty... logically speaking</h3>
            <p>Start typing ingredients above to find delicious recipes!</p>
          </div>
        )}

        {selectedIngredients.length > 0 && recipes.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>
            <p>Click "Find Recipes" to see results...</p>
          </div>
        )}

        {recipes.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
             {recipes.map(r => (
               <Link to={`/recipe/${r.id}`} key={r.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                 <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'transform 0.2s', height: '100%', backgroundColor: 'white', position: 'relative' }}>
                    
                    <div style={{ 
                      position: 'absolute', top: '10px', right: '10px', 
                      backgroundColor: r.missingCount === 0 ? '#4CAF50' : '#FF9800',
                      color: 'white', padding: '5px 10px', borderRadius: '15px', 
                      fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                      {r.missingCount === 0 ? "Ready to Cook! 🔥" : `Missing ${r.missingCount} items`}
                    </div>

                    {r.image_url && <img src={r.image_url} alt={r.title} style={{width: '100%', height: '150px', objectFit: 'cover'}} />}
                    <div style={{ padding: '10px' }}>
                      <h3 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{r.title}</h3>
                      
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        You have {r.essentialMatch} / {r.essentialTotal} ingredients (excluding staples)
                      </span>
                    </div>
                 </div>
               </Link>
             ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default Home