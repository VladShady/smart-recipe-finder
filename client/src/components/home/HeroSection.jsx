function HeroSection({ onStartSearch }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px 40px', backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.3s ease' }}>
        <div className="fade-in" style={{ textAlign: 'center', maxWidth: '800px', width: '100%' }}>
          <h1 style={{ margin: '0 0 16px 0', fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1.2' }}>
            Turn your ingredients into <br/><span style={{ color: '#10B981' }}>delicious meals.</span>
          </h1>
          <p style={{ margin: '0 auto 32px auto', color: 'var(--text-muted)', fontSize: 'clamp(16px, 2vw, 18px)', maxWidth: '540px', lineHeight: '1.6' }}>
            Stop wasting food and wondering what to cook. Just tell us what you have in your pantry, and we'll do the magic.
          </p>
        </div>
      </div>

      <div style={{ padding: '40px 20px 60px 20px', backgroundColor: 'var(--bg-color)', transition: 'background-color 0.3s ease' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '40px' }}>
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

          <div className="fade-in" style={{ textAlign: 'center' }}>
            <button 
              className="btn-primary"
              onClick={onStartSearch}
              style={{ 
                padding: '16px 36px', background: '#10B981', color: 'white', border: 'none', 
                borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                boxShadow: '0 8px 16px -4px rgba(16, 185, 129, 0.3)'
              }}
            >
              Start Searching
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

export default HeroSection;