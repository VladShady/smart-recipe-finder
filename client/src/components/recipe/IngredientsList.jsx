import { STAPLES } from '../../constants';

function IngredientsList({ recipe, checkedItems, toggleCheck }) {
  if (!recipe || !recipe.ingredients_list) return null;

  return (
    <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: 'var(--shadow)' }}>
      <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', paddingLeft: '12px' }}>
        Ingredients
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {recipe.ingredients_list.map((ing, idx) => {
          const ingLower = ing.toLowerCase();
          const isStaple = STAPLES.some(staple => ingLower.includes(staple));
          const isChecked = checkedItems.has(idx);

          const rawIngName = recipe.ingredient_names ? recipe.ingredient_names[idx] : null;
          const imgFileName = rawIngName ? rawIngName.replace(/\s+/g, '_') : '';
          const imgUrl = imgFileName ? `https://www.themealdb.com/images/ingredients/${imgFileName}-Small.png` : null;

          return (
            <div key={idx} className="ingredient-list-item" onClick={() => toggleCheck(idx)}>
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
              <span style={{ flex: 1, color: isChecked ? 'var(--text-muted)' : 'var(--text-main)', transition: 'color 0.2s ease' }}>
                {ing}
              </span>
              {isStaple && (
                <span style={{ fontSize: '11px', backgroundColor: 'var(--staple-bg)', color: 'var(--staple-text)', padding: '4px 8px', borderRadius: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase', marginLeft: '8px' }}>
                  Staple
                </span>
              )}
              {imgUrl && (
                <div className="ingredient-image-tooltip" onClick={(e) => e.stopPropagation()}>
                  <svg className="img-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="tooltip-content">
                    <img src={imgUrl} alt={rawIngName || 'Ingredient'} loading="lazy" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IngredientsList;