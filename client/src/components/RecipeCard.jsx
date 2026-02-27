import { Link } from 'react-router-dom';

function RecipeCard({ recipe, showResults }) {
  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      <div className="card-image-wrapper">
        {showResults && (
          <div className="card-badge" style={{ backgroundColor: recipe.missingCount === 0 ? '#10B981' : '#F59E0B' }}>
            {recipe.missingCount === 0 ? "Ready to Cook" : `Missing ${recipe.missingCount}`}
          </div>
        )}
        {!showResults && (
          <div className="card-badge" style={{ backgroundColor: '#3B82F6' }}>
            Popular 🔥
          </div>
        )}

        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.title} loading="lazy" />
        ) : (
          <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Image</div>
        )}
      </div>
      
      <div className="card-content">
        <h3 className="card-title">{recipe.title}</h3>
        
        <div className="card-meta" style={{ justifyContent: 'space-between', width: '100%' }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>
            {recipe.description}
          </span>
          
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, fontWeight: '500' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.time_minutes} min
          </span>
        </div>
        
        {showResults && (
          <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
            <span style={{ color: '#10B981', fontWeight: '700' }}>{recipe.essentialMatch}</span> of {recipe.essentialTotal} ingredients found
          </div>
        )}
      </div>
    </Link>
  );
}

export default RecipeCard;