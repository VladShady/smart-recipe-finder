function InstructionsList({ recipe, aiLoading, isExpanded, setIsExpanded }) {
  if (!recipe) return null;

  if (aiLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '24px', textAlign: 'center', color: '#10B981', fontWeight: '600', backgroundColor: 'var(--tag-bg)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <div className="spinner"></div>
          Formatting the perfect steps for you...
        </div>
        {[1, 2, 3].map((skeleton) => (
          <div key={skeleton} className="skeleton-card">
            <div className="skeleton-circle"></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ width: '90%' }}></div>
              <div className="skeleton-line" style={{ width: '60%' }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  let steps = [];
  if (recipe.ai_instructions && Array.isArray(recipe.ai_instructions)) {
    steps = recipe.ai_instructions;
  } else if (recipe.instructions) {
    steps = recipe.instructions.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  }

  if (steps.length === 0) return null;

  const INITIAL_COUNT = 4;
  const initialSteps = steps.slice(0, INITIAL_COUNT);
  const extraSteps = steps.slice(INITIAL_COUNT);
  const hasMore = extraSteps.length > 0;

  const renderStep = (step, idx) => {
    const cleanStep = (recipe.ai_instructions && Array.isArray(recipe.ai_instructions)) 
      ? step 
      : step.replace(/^(?:Step\s*\d+:?|\d+[\.\)]?)\s*/i, '');

    return (
      <div key={idx} className="recipe-step-card fade-in">
        <div className="step-number">{idx + 1}</div>
        <p className="step-text">{cleanStep}</p>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {initialSteps.map((step, idx) => renderStep(step, idx))}

      {hasMore && (
        <div className={`expandable-wrapper ${isExpanded ? 'open' : ''}`}>
          <div className="expandable-inner">
            {extraSteps.map((step, idx) => renderStep(step, idx + INITIAL_COUNT))}
          </div>
        </div>
      )}

      {hasMore && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="btn-outline"
          style={{
            marginTop: '10px', padding: '14px 24px', borderRadius: '10px', fontSize: '16px', fontWeight: '600',
            cursor: 'pointer', alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {isExpanded ? 'Show Less' : `Show All ${steps.length} Steps`}
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default InstructionsList;