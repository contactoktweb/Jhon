import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  try {
    const body = await request.json()
    const { action, payload } = body

    if (action === 'approveUser') {
      const { error } = await supabase.from('profiles').update({ estado: 'activo' }).eq('id', payload.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }
    
    if (action === 'blockUser') {
      const { error } = await supabase.from('profiles').update({ estado: 'bloqueado' }).eq('id', payload.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'approveGanancia') {
      const { error } = await supabase.from('solicitudes').update({ estado: 'aprobada' }).eq('id', payload.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }
    
    if (action === 'rejectGanancia') {
      const { error } = await supabase.from('solicitudes').update({ estado: 'rechazada' }).eq('id', payload.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (action === 'correctGanancia') {
      const { error } = await supabase.from('solicitudes').update({ estado: 'revision' }).eq('id', payload.id)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    // Default response for unhandled actions
    return NextResponse.json({ success: true, message: 'Action mock handled on backend' })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
