import React from 'react';

export default function RegistroPage() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <div id="registerScreen" className="login-screen">
        <aside className="login-aside">
          <div className="login-brand">
            <svg className="logo-mark" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="2" y="2" width="40" height="40" rx="11" fill="#0F4C5C" stroke="#D6A84F" strokeWidth="2"/>
              <path d="M14 28V16M22 28V16M30 28V16" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="14" cy="13" r="2" fill="#22C55E"/>
            </svg>
            <strong style={{ fontSize: '1.1rem' }}>Plataforma de Inversión</strong>
          </div>
          <div>
            <h1 className="text-balance">Únete a nuestro ecosistema de inversión y referidos.</h1>
            <p className="lead">Crea tu cuenta con un código de registro válido y accede a la gestión de ganancias y formación académica.</p>
            <ul className="login-points">
              <li><i className="bi bi-shield-check"></i> Registro seguro y verificado</li>
              <li><i className="bi bi-diagram-3"></i> Conexión inmediata a tu red de referidos</li>
              <li><i className="bi bi-bank"></i> Gestión de retornos financieros</li>
            </ul>
          </div>
          <p className="login-foot">
            &copy; {currentYear} Plataforma de Inversión · 
            <a href="https://www.kytcode.lat" style={{ color: 'inherit', textDecoration: 'none', marginLeft: '4px' }}>
              Desarrollado por K&T <i className="bi bi-heart-fill" style={{ color: '#fff', marginLeft: '4px' }}></i>
            </a>
          </p>
        </aside>

        <main className="login-main">
          <div className="login-card">
            <h2>Crear nueva cuenta</h2>
            <p className="sub">El código de registro es obligatorio para continuar.</p>

            <form id="standaloneRegisterForm" className="form-grid" style={{ gap: '14px' }}>
              <div className="field float">
                <input type="text" id="regName" placeholder=" " required />
                <label htmlFor="regName">Nombre completo</label>
              </div>
              <div className="field float">
                <input type="email" id="regEmail" placeholder=" " required />
                <label htmlFor="regEmail">Correo electrónico</label>
              </div>
              <div className="field float">
                <input type="password" id="regPass" placeholder=" " required minLength={6} />
                <label htmlFor="regPass">Contraseña</label>
              </div>
              <div className="field float">
                <input type="text" id="regCode" placeholder=" " required />
                <label htmlFor="regCode">Código de registro (Obligatorio)</label>
              </div>
              
              <button className="btn btn-green btn-lg btn-block" type="submit">
                <i className="bi bi-person-plus"></i> Registrarme ahora
              </button>
              
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span className="cell-muted" style={{ fontSize: '0.9rem' }}>
                  ¿Ya tienes cuenta? <a href="/" style={{ color: 'var(--petrol)', fontWeight: 600, textDecoration: 'none' }}>Inicia sesión aquí</a>
                </span>
              </div>
            </form>

            <p style={{ marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-soft)', textAlign: 'center' }}>
              Asegúrate de ingresar el código de registro que te fue proporcionado.
            </p>
          </div>
        </main>
      </div>

      <div className="toast-container" id="toastRoot"></div>
    </>
  );
}
