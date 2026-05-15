import { useState, useEffect, useRef } from 'react';

function CookingMode({ steps, title, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  // 1. Wake Lock API: Prevent screen from sleeping
  useEffect(() => {
    let wakeLock = null;
    
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('Wake Lock error or unsupported:', err);
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock !== null) {
        wakeLock.release();
      }
    };
  }, []);

  // 2. Smart Timer: Extract minutes/seconds from text
  useEffect(() => {
    // Reset timer when step changes
    setTimerActive(false);
    setTimeLeft(null);
    clearInterval(timerRef.current);

    const currentText = steps[currentIndex]?.step || steps[currentIndex] || '';
    
    // Regex to find things like "15 minutes", "2 mins", "30 seconds"
    const timeMatch = currentText.match(/(\d+)\s*(min|minute|sec|second|hr|hour)s?/i);
    
    if (timeMatch) {
      const value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase();
      
      let seconds = 0;
      if (unit.startsWith('sec')) seconds = value;
      else if (unit.startsWith('min')) seconds = value * 60;
      else if (unit.startsWith('hr') || unit.startsWith('hour')) seconds = value * 3600;
      
      if (seconds > 0) setTimeLeft(seconds);
    }
  }, [currentIndex, steps]);

  // Timer countdown logic
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(timerRef.current);
      setTimerActive(false);
      // Optional: Play a sound here
      alert("Time is up!"); 
    }

    return () => clearInterval(timerRef.current);
  }, [timerActive, timeLeft]);

  const toggleTimer = () => setTimerActive(!timerActive);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleNext = () => {
    if (currentIndex < steps.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  if (!steps || steps.length === 0) return null;

  const currentStepText = steps[currentIndex]?.step || steps[currentIndex];

  const getDynamicFontSize = (text) => {
    const len = text.length;
    if (len < 80) return 'clamp(32px, 7vw, 64px)';
    if (len < 180) return 'clamp(24px, 5vw, 48px)';
    if (len < 350) return 'clamp(18px, 3.5vw, 32px)';
    return 'clamp(16px, 2.5vw, 24px)'; 
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--bg-color)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      padding: '20px', boxSizing: 'border-box'
    }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-muted)' }}>{title}</h2>
        <button 
          onClick={onClose}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-main)' }}
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Main Content (Step Text) */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        textAlign: 'center', 
        maxWidth: '1000px', 
        margin: '0 auto', 
        width: '100%',
        padding: '20px 0'
      }}>
        
        {/* Додаємо key={currentIndex}, щоб React перемальовував цей блок з нуля при кожному кроці */}
        <div key={currentIndex} className="step-animate" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Step {currentIndex + 1} of {steps.length}
          </span>
          
          <p style={{ 
            fontSize: getDynamicFontSize(currentStepText), 
            fontWeight: '700', 
            lineHeight: '1.4', 
            margin: '0 0 40px 0', 
            color: 'var(--text-main)'
            /* Ми прибрали transition, тепер за плавність відповідає CSS-клас step-animate */
          }}>
            {currentStepText}
          </p>

          {/* Smart Timer UI */}
          {timeLeft !== null && (
            <div style={{ background: 'var(--card-bg)', border: '2px solid #10B981', borderRadius: '20px', padding: '20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '48px', fontWeight: '800', fontFamily: 'monospace', color: timeLeft === 0 ? '#EF4444' : 'var(--text-main)' }}>
                {formatTime(timeLeft)}
              </span>
              <button 
                onClick={toggleTimer}
                style={{ background: timerActive ? '#EF4444' : '#10B981', color: 'white', border: 'none', padding: '12px 32px', borderRadius: '12px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
              >
                {timeLeft === 0 ? 'Done!' : (timerActive ? 'Pause' : 'Start Timer')}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '20px', flexShrink: 0 }}>
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{ flex: 1, padding: '24px', fontSize: '24px', fontWeight: 'bold', borderRadius: '16px', border: 'none', background: 'var(--card-bg)', color: 'var(--text-main)', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.5 : 1 }}
        >
          &larr; Prev
        </button>
        <button 
          onClick={handleNext}
          disabled={currentIndex === steps.length - 1}
          style={{ flex: 1, padding: '24px', fontSize: '24px', fontWeight: 'bold', borderRadius: '16px', border: 'none', background: '#10B981', color: 'white', cursor: currentIndex === steps.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex === steps.length - 1 ? 0.5 : 1 }}
        >
          Next &rarr;
        </button>
      </div>

    </div>
  );
}

export default CookingMode;