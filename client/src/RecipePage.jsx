import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const STAPLES = ['water', 'salt', 'oil', 'sugar', 'pepper', 'flour'];

function RecipePage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  const checkIfStaple = (text) => {
    return STAPLES.some(staple => text.toLowerCase().includes(staple));
  };

  useEffect(() => {
    fetch(`http://localhost:5000/api/recipes/${id}`)
      .then(res => res.json())
      .then(data => {
        setRecipe(data);
        const userInventory = JSON.parse(sessionStorage.getItem('myIngredients') || '[]');
        const initialChecks = {};
        
        if (data.ingredients_list) {
          data.ingredients_list.forEach((line, index) => {
            const isPresent = userInventory.some(userItem => 
              line.toLowerCase().includes(userItem.name.toLowerCase())
            );
            const isStaple = checkIfStaple(line);
            initialChecks[index] = isPresent || isStaple;
          });
        }
        setCheckedItems(initialChecks);
      })
      .catch(err => console.error(err));
  }, [id]);

  const toggleCheckbox = (index) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatInstructions = (text) => {
    if (!text) return [];
    const rawLines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    const steps = [];
    for (let i = 0; i < rawLines.length; i++) {
      let currentLine = rawLines[i].trim();
      if (i + 1 < rawLines.length) {
        const isHeader = currentLine.endsWith(':');
        const isShortTitle = currentLine.length < 30 && !currentLine.endsWith('.');
        if (isHeader || isShortTitle) {
          currentLine = currentLine + " " + rawLines[i+1].trim();
          i++;
        }
      }
      steps.push(currentLine);
    }
    return steps;
  };

  if (!recipe) return <div style={{padding: '20px'}}>Loading...</div>;

  const stepsList = formatInstructions(recipe.instructions);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      
      <Link to="/" style={{ textDecoration: 'none', color: '#2196F3', fontSize: '18px' }}>← Back to Search</Link>
      
      <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>{recipe.title}</h1>
      <p style={{ color: '#888' }}>Category: {recipe.description} | ⏱ {recipe.time_minutes} min</p>
      
      {recipe.image_url && (
        <img 
          src={recipe.image_url} 
          alt={recipe.title} 
          style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '10px', marginTop: '20px' }} 
        />
      )}

      <div style={{ display: 'flex', gap: '40px', marginTop: '30px', flexWrap: 'wrap' }}>
        
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Shopping List</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {recipe.ingredients_list && recipe.ingredients_list.map((line, idx) => {
              const isChecked = checkedItems[idx] || false;
              const isStaple = checkIfStaple(line);
              
              return (
                <li key={idx} style={{ 
                  marginBottom: '10px', 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: '18px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => toggleCheckbox(idx)}
                >
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    readOnly 
                    style={{ width: '20px', height: '20px', marginRight: '15px', cursor: 'pointer', pointerEvents: 'none' }} 
                  />
                  
                  <span style={{ 
                    textDecoration: isChecked ? 'line-through' : 'none',
                    color: isChecked ? '#aaa' : '#000'
                  }}>
                    {line}
                  </span>

                  {isStaple && (
                    <span style={{ 
                      marginLeft: '10px', 
                      fontSize: '12px', 
                      backgroundColor: '#e3f2fd', 
                      color: '#1565c0', 
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      🧂 Base Item
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <div style={{ flex: 2, minWidth: '300px' }}>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Instructions</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {stepsList.map((step, index) => (
                <div key={index} style={{ 
                  backgroundColor: '#f9f9f9', 
                  padding: '15px', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #2196F3'
                }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#2196F3' }}>Step {index + 1}</h4>
                  <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.5', color: '#333' }}>
                    {step}
                  </p>
                </div>
              ))
            }
          </div>
        </div>

      </div>
    </div>
  );
}

export default RecipePage;