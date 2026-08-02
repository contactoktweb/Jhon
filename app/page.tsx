import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let connectionStatus = 'Comprobando conexión...'
  let data: any[] | null = null
  let errorMessage = ''

  try {
    // Intentamos hacer una consulta a una tabla (por defecto "todos")
    // Si la tabla no existe, esto devolverá un error, pero confirmará 
    // que la conexión a la base de datos es exitosa.
    const response = await supabase.from('todos').select().limit(5)
    
    if (response.error) {
      connectionStatus = 'Conexión a Supabase Exitosa'
      // Es normal obtener un error si la tabla "todos" no existe aún en tu base de datos
      errorMessage = response.error.message
    } else {
      connectionStatus = '¡Conexión y Consulta Exitosas!'
      data = response.data
    }
  } catch (err: any) {
    connectionStatus = 'Error Crítico de Conexión'
    errorMessage = err.message || JSON.stringify(err)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        maxWidth: '600px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#111827', margin: '0 0 0.5rem 0' }}>Estado de Supabase</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>Verificación de conexión a la base de datos</p>
        </div>
        
        <div style={{ 
          padding: '1.25rem', 
          borderRadius: '8px',
          backgroundColor: connectionStatus.includes('Exitosa') ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${connectionStatus.includes('Exitosa') ? '#a7f3d0' : '#fecaca'}`,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            borderRadius: '50%', 
            backgroundColor: connectionStatus.includes('Exitosa') ? '#10b981' : '#ef4444' 
          }}></div>
          <strong style={{ color: connectionStatus.includes('Exitosa') ? '#065f46' : '#991b1b', fontSize: '1.1rem' }}>
            {connectionStatus}
          </strong>
        </div>

        {errorMessage && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>Detalle de respuesta (Error de DB):</h3>
            <pre style={{ 
              background: '#f3f4f6', 
              padding: '1rem', 
              borderRadius: '6px',
              fontSize: '0.85rem',
              color: '#1f2937',
              whiteSpace: 'pre-wrap',
              margin: 0
            }}>
              {errorMessage}
            </pre>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.5rem' }}>
              * Nota: Si ves un error que dice "relation 'public.todos' does not exist", significa que 
              tu conexión es perfecta, pero aún no has creado la tabla "todos" en tu base de datos.
            </p>
          </div>
        )}

        {data && (
          <div>
            <h3 style={{ fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>Datos en la tabla "todos":</h3>
            {data.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
                {data.map((item, i) => (
                  <li key={i} style={{ marginBottom: '0.5rem' }}>{JSON.stringify(item)}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 0 }}>La tabla existe pero no contiene registros.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
