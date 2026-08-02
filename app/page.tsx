import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Consultar todas las tablas para inyectarlas en el frontend (Sustituyendo el mock local)
  const [
    { data: perfiles },
    { data: referrals },
    { data: solicitudes },
    { data: retiros },
    { data: utilidades },
    { data: historial },
    { data: notificaciones },
    { data: escuela }
  ] = await Promise.all([
    supabase.from('profiles').select('*').order('fecha_registro', { ascending: false }),
    supabase.from('referrals').select('*'),
    supabase.from('solicitudes').select('*').order('fecha', { ascending: false }),
    supabase.from('retiros').select('*').order('fecha', { ascending: false }),
    supabase.from('utilidades').select('*').order('fecha', { ascending: false }),
    supabase.from('historial').select('*').order('fecha', { ascending: false }),
    supabase.from('notificaciones').select('*').order('created_at', { ascending: false }),
    supabase.from('escuela').select('*')
  ])

  const usuarios = perfiles || []
  
  // Construir el árbol de referidos de forma recursiva (basado en referrals)
  const buildTree = (userId: string): any => {
    const user = usuarios.find(u => u.id === userId)
    if (!user) return null
    const children = (referrals || []).filter(r => r.referrer_id === userId).map(r => {
      const child = buildTree(r.referred_id)
      if (child) child.tipo = r.tipo
      return child
    }).filter(Boolean)
    
    return {
      nombre: user.nombre,
      id: user.id,
      cupos: user.ref_count,
      hijos: children
    }
  }

  // Raíz del árbol: Laura Restrepo (la ID de prueba asignada en el script SQL)
  const arbol = buildTree('00000000-0000-0000-0000-000000000002') || { nombre: "Sin red", id: "", cupos: 0, hijos: [] }

  const initialDB = {
    usuarios,
    solicitudes: solicitudes || [],
    retiros: retiros || [],
    utilidades: utilidades || [],
    historial: historial || [],
    notificaciones: notificaciones || [],
    escuela: escuela || [],
    arbol,
    festivos: ["2026-01-01 · Año Nuevo", "2026-01-06 · Reyes Magos", "2026-03-23 · San José", "2026-05-01 · Día del Trabajo"],
    config: { gananciaPct: 2, moodle: "https://escuela.plataformainversion.co", wompi: "activo", moneda: "COP", retiroMin: 50000, retiroMax: 2000000 }
  }

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: `window.__INITIAL_DB__ = ${JSON.stringify(initialDB)};` }} />
      {/* ============ LOGIN ============ */}
      <div id="loginScreen" className="login-screen">
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
            <h1 className="text-balance">Educación, gestión de ganancias y red de referidos en un solo ecosistema.</h1>
            <p className="lead">Plataforma institucional de formación, control de usuarios, solicitudes, reportes y gestión financiera interna.</p>
            <ul className="login-points">
              <li><i className="bi bi-mortarboard"></i> Acceso académico y diplomados certificables</li>
              <li><i className="bi bi-shield-check"></i> Ganancias con revisión manual</li>
              <li><i className="bi bi-diagram-3"></i> Red de referidos estructurada y trazable</li>
              <li><i className="bi bi-bank"></i> Gestión de retornos y retiros controlados</li>
            </ul>
          </div>
          <p className="login-foot">
            &copy; {new Date().getFullYear()} Plataforma de Inversión · 
            <a href="https://www.kytcode.lat" style={{ color: 'inherit', textDecoration: 'none', marginLeft: '4px' }}>
              Desarrollado por K&T <i className="bi bi-heart-fill" style={{ color: '#fff', marginLeft: '4px' }}></i>
            </a>
          </p>
        </aside>

        <main className="login-main">
          <div className="login-card">
            <h2>Bienvenido de nuevo</h2>
            <p className="sub">Selecciona tu tipo de acceso para continuar.</p>

            <div className="role-toggle" id="roleToggle">
              <button className="role-btn active" data-role="admin" type="button">
                <i className="bi bi-sliders"></i>
                <span>Administrador</span>
                <small>Gestión y control</small>
              </button>
              <button className="role-btn" data-role="user" type="button">
                <i className="bi bi-person-badge"></i>
                <span>Usuario</span>
                <small>Mi cuenta</small>
              </button>
            </div>

            {/* Formularios: Login vs Registro */}
            <div id="authForms">
              {/* Formulario de Login */}
              <form id="loginForm" className="form-grid" style={{ gap: '14px' }}>
                <div className="field float">
                  <input type="email" id="loginEmail" placeholder=" " defaultValue="admin@plataformainversion.co" required />
                  <label htmlFor="loginEmail">Correo electrónico</label>
                </div>
                <div className="field float">
                  <input type="password" id="loginPass" placeholder=" " defaultValue="••••••••" required />
                  <label htmlFor="loginPass">Contraseña</label>
                </div>
                <button className="btn btn-primary btn-lg btn-block" type="submit">
                  <i className="bi bi-box-arrow-in-right"></i> Ingresar a la plataforma
                </button>
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <span className="cell-muted" style={{ fontSize: '0.9rem' }}>¿No tienes cuenta? <a href="/registro" style={{ color: 'var(--petrol)', fontWeight: 600, textDecoration: 'none' }}>Regístrate aquí</a></span>
                </div>
              </form>

              {/* Formulario de Registro (oculto por defecto) */}
              <form id="registerForm" className="form-grid hidden" style={{ gap: '14px' }}>
                <div className="field float">
                  <input type="text" id="regName" placeholder=" " required />
                  <label htmlFor="regName">Nombre completo</label>
                </div>
                <div className="field float">
                  <input type="email" id="regEmail" placeholder=" " required />
                  <label htmlFor="regEmail">Correo electrónico</label>
                </div>
                <div className="field float">
                  <input type="password" id="regPass" placeholder=" " required />
                  <label htmlFor="regPass">Contraseña</label>
                </div>
                <div className="field float">
                  <input type="text" id="regRef" placeholder=" " required />
                  <label htmlFor="regRef">Código de referido (Obligatorio)</label>
                </div>
                <button className="btn btn-green btn-lg btn-block" type="submit">
                  <i className="bi bi-person-plus"></i> Crear cuenta
                </button>
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <span className="cell-muted" style={{ fontSize: '0.9rem' }}>¿Ya tienes cuenta? <a href="#" id="showLoginBtn" style={{ color: 'var(--petrol)', fontWeight: 600, textDecoration: 'none' }}>Inicia sesión</a></span>
                </div>
              </form>
            </div>

            <p style={{ marginTop: '18px', fontSize: '0.8rem', color: 'var(--text-soft)', textAlign: 'center' }}>
              Acceso simulado · No se requieren credenciales reales
            </p>
          </div>
        </main>
      </div>

      {/* ============ APP SHELL ============ */}
      <div id="appShell" className="app-shell hidden">
        {/* Sidebar */}
        <aside className="sidebar" id="sidebar">
          <div className="sidebar-head">
            <svg className="logo-mark" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="2" y="2" width="40" height="40" rx="11" fill="#0F4C5C" stroke="#D6A84F" strokeWidth="2"/>
              <path d="M14 28V16M22 28V16M30 28V16" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="14" cy="13" r="2" fill="#22C55E"/>
            </svg>
            <div className="brand-text">Plataforma<small>de Inversión</small></div>
          </div>
          <nav className="sidebar-nav" id="sidebarNav" aria-label="Navegación principal"></nav>
        </aside>

        {/* Main */}
        <div className="main">
          {/* Topbar */}
          <header className="topbar">
            <button className="icon-btn menu-toggle" id="mobileToggle" aria-label="Abrir menú"><i className="bi bi-list"></i></button>
            <button className="icon-btn" id="collapseToggle" aria-label="Colapsar menú"><i className="bi bi-layout-sidebar"></i></button>

            <div className="topbar-search" id="searchTrigger" role="button" tabIndex={0}>
              <i className="bi bi-search"></i>
              <input type="text" placeholder="Buscar en la plataforma..." readOnly />
              <kbd>Ctrl K</kbd>
            </div>

            <div className="topbar-right">
              <button className="icon-btn" id="themeToggle" aria-label="Cambiar tema"><i className="bi bi-moon-stars"></i></button>

              <div className="dropdown">
                <button className="profile-btn" id="profileBtn">
                  <span className="avatar" id="topAvatar">A</span>
                  <span className="who"><strong id="topName">Admin</strong><small id="topRole">Administrador</small></span>
                  <i className="bi bi-chevron-down" style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}></i>
                </button>
                <div className="dropdown-panel sm hidden" id="profilePanel">
                  <a className="menu-link" data-nav="profile"><i className="bi bi-person"></i> Mi perfil</a>
                  <a className="menu-link" id="profileMenuSettings" data-nav="settings"><i className="bi bi-gear"></i> Configuración</a>
                  <a className="menu-link" id="switchRoleBtn"><i className="bi bi-arrow-left-right"></i> Cambiar de rol</a>
                  <a className="menu-link danger" id="logoutBtn"><i className="bi bi-box-arrow-right"></i> Cerrar sesión</a>
                </div>
              </div>
            </div>
          </header>

          {/* Dynamic content */}
          <main className="content" id="view" aria-live="polite"></main>
        </div>
      </div>

      {/* Containers */}
      <div id="modalRoot"></div>
      <div id="cmdkRoot"></div>
      <div className="toast-container" id="toastRoot"></div>
    </>
  );
}
