import { useState, useRef } from 'react';
import { apiPublicRegister, type AuthUser } from './api';

interface AuthState { user: AuthUser; token: string; }

interface LandingPageProps {
  onComplete: (auth: AuthState) => void;
}

const FEATURES = [
  { icon: '⚖️', text: 'חידות אינטראקטיביות מעולם המשפט העברי' },
  { icon: '🔍', text: 'חקירת ראיות ועדים' },
  { icon: '🤖', text: 'שופט מבוסס בינה מלאכותית' },
  { icon: '👨‍👩‍👧‍👦', text: 'מתאים לכל המשפחה' },
];

export function LandingPage({ onComplete }: LandingPageProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [marketing, setMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiPublicRegister({ name, phone, email, marketingConsent: marketing });
      setSuccess(true);
      setTimeout(() => onComplete(data), 1800);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-page" dir="rtl">
      <style>{`
        .landing-page {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #060404;
          color: #e8d9b0;
          min-height: 100vh;
          overflow-x: hidden;
        }
        .landing-hero {
          min-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 24px 56px;
          background: radial-gradient(ellipse at 50% 40%, #1e1508 0%, #060404 70%);
          position: relative;
        }
        .landing-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(201,162,39,0.018) 2px,
            rgba(201,162,39,0.018) 4px
          );
          pointer-events: none;
        }
        .landing-logos {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .landing-game-logo {
          width: 100px;
          height: 100px;
          object-fit: contain;
          filter: drop-shadow(0 0 18px rgba(201,162,39,0.35));
        }
        .kollel-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(201,162,39,0.12);
          border: 1px solid rgba(201,162,39,0.3);
          border-radius: 50px;
          padding: 6px 16px;
          font-size: 0.9rem;
          color: #c9a227;
          letter-spacing: 0.5px;
        }
        .landing-suptitle {
          font-size: 1.1rem;
          color: #a0926e;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }
        .landing-title {
          font-size: clamp(2.4rem, 7vw, 4rem);
          font-weight: 900;
          color: #c9a227;
          text-shadow: 0 0 28px rgba(201,162,39,0.4);
          margin-bottom: 12px;
          line-height: 1.15;
        }
        .landing-subtitle {
          font-size: clamp(1.1rem, 3vw, 1.5rem);
          color: #d9c89a;
          font-weight: 300;
          margin-bottom: 36px;
        }
        .landing-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px 18px;
          max-width: 420px;
          margin: 0 auto 40px;
          text-align: right;
        }
        .landing-feat {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 0.95rem;
          color: #c5b07a;
        }
        .landing-feat-icon {
          font-size: 1.15rem;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .landing-cta-btn {
          display: inline-block;
          background: linear-gradient(135deg, #c9a227 0%, #a07c18 100%);
          color: #0d0900;
          font-size: 1.15rem;
          font-weight: 800;
          padding: 15px 44px;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(201,162,39,0.4);
          transition: transform 0.25s, box-shadow 0.25s;
          letter-spacing: 0.3px;
        }
        .landing-cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 7px 26px rgba(201,162,39,0.55);
        }
        .landing-divider {
          width: 60px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #c9a227, transparent);
          margin: 56px auto 0;
        }
        /* Form section */
        .landing-form-section {
          background: #0d0a04;
          padding: 56px 24px;
          display: flex;
          justify-content: center;
        }
        .landing-form-box {
          width: 100%;
          max-width: 500px;
          background: #1a1309;
          border: 1px solid rgba(201,162,39,0.22);
          border-radius: 18px;
          padding: 36px 32px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        }
        .landing-form-title {
          font-size: 1.7rem;
          font-weight: 800;
          color: #c9a227;
          text-align: center;
          margin-bottom: 6px;
        }
        .landing-form-hint {
          text-align: center;
          color: #8a7a5a;
          font-size: 0.88rem;
          margin-bottom: 28px;
        }
        .lf-group {
          margin-bottom: 18px;
        }
        .lf-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.9rem;
          color: #c5b07a;
          font-weight: 600;
        }
        .lf-group input[type="text"],
        .lf-group input[type="tel"],
        .lf-group input[type="email"] {
          width: 100%;
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid rgba(201,162,39,0.22);
          background: #0d0a04;
          color: #e8d9b0;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.25s;
          font-family: inherit;
        }
        .lf-group input:focus {
          border-color: #c9a227;
        }
        .lf-consent {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(201,162,39,0.06);
          border: 1px solid rgba(201,162,39,0.15);
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 22px;
          cursor: pointer;
        }
        .lf-consent input[type="checkbox"] {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
          margin-top: 3px;
          accent-color: #c9a227;
          cursor: pointer;
        }
        .lf-consent-text {
          font-size: 0.82rem;
          color: #9a8c6a;
          line-height: 1.55;
          cursor: pointer;
          user-select: none;
        }
        .landing-submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #c9a227 0%, #a07c18 100%);
          color: #0d0900;
          border: none;
          border-radius: 10px;
          font-size: 1.05rem;
          font-weight: 800;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.2s;
          font-family: inherit;
          letter-spacing: 0.3px;
        }
        .landing-submit-btn:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
        }
        .landing-submit-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .landing-error {
          background: rgba(192,57,43,0.15);
          border: 1px solid rgba(192,57,43,0.3);
          color: #e07060;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
          font-size: 0.9rem;
          text-align: center;
        }
        .landing-success {
          text-align: center;
          padding: 20px 0;
        }
        .landing-success-icon {
          font-size: 3rem;
          margin-bottom: 14px;
        }
        .landing-success-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #27ae60;
          margin-bottom: 8px;
        }
        .landing-success-sub {
          color: #8a7a5a;
          font-size: 0.95rem;
        }
        /* Footer */
        .landing-footer {
          text-align: center;
          padding: 22px;
          background: #060404;
          color: #4a3f2a;
          font-size: 0.82rem;
          border-top: 1px solid rgba(201,162,39,0.1);
        }
        @media (max-width: 480px) {
          .landing-features { grid-template-columns: 1fr; }
          .landing-form-box { padding: 28px 18px; }
        }
      `}</style>

      {/* Hero */}
      <header className="landing-hero">
        <div className="landing-logos">
          <img src="./kollel-logo.jpg" alt="כולל ענב" className="landing-game-logo" />
          <img src="./logo.png" alt="סוד המשפט" className="landing-game-logo" />
          <div className="kollel-badge">🕍 כולל ענב גאה להציג</div>
        </div>
        <p className="landing-suptitle">ברוכים הבאים אל</p>
        <h1 className="landing-title">"סוד המשפט"</h1>
        <h2 className="landing-subtitle">חדרי בריחה אינטראקטיביים לכל המשפחה</h2>

        <div className="landing-features">
          {FEATURES.map((f, i) => (
            <div key={i} className="landing-feat">
              <span className="landing-feat-icon">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>

        <button className="landing-cta-btn" onClick={scrollToForm}>
          להרשמה והשתתפות ↓
        </button>
        <div className="landing-divider" />
      </header>

      {/* Form */}
      <section className="landing-form-section" ref={formRef}>
        <div className="landing-form-box">
          <h3 className="landing-form-title">הירשמו עכשיו</h3>
          <p className="landing-form-hint">מלאו את הפרטים והמשחק ייפתח מיד</p>

          {success ? (
            <div className="landing-success">
              <div className="landing-success-icon">✅</div>
              <div className="landing-success-title">ההרשמה התקבלה בהצלחה!</div>
              <div className="landing-success-sub">מיד תועברו אל המשחק...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="lf-group">
                <label htmlFor="lf-name">שם מלא</label>
                <input
                  id="lf-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="ישראל ישראלי"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="lf-group">
                <label htmlFor="lf-phone">טלפון</label>
                <input
                  id="lf-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  placeholder="050-0000000"
                  dir="ltr"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>

              <div className="lf-group">
                <label htmlFor="lf-email">אימייל</label>
                <input
                  id="lf-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="example@email.com"
                  dir="ltr"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <label className="lf-consent">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={e => setMarketing(e.target.checked)}
                />
                <span className="lf-consent-text">
                  אני מסכים/ה לקבל מכולל ענב ומתוכנית סוד המשפט עדכונים, הזמנות לפעילויות
                  ותכנים חינוכיים באמצעות דוא"ל, SMS או WhatsApp, בהתאם לחוק התקשורת
                  (בזק ושידורים) תיקון מס' 40 (חוק הספאם). ניתן לבטל את ההסכמה בכל עת.
                </span>
              </label>

              {error && <div className="landing-error">⚠️ {error}</div>}

              <button
                type="submit"
                className="landing-submit-btn"
                disabled={loading || !name.trim() || !phone.trim() || !email.trim()}
              >
                {loading ? 'שולח...' : 'שלח פרטים וכנס למשחק →'}
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="landing-footer">
        © כל הזכויות שמורות לכולל ענב — סוד המשפט
      </footer>
    </div>
  );
}
