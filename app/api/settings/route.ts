import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase.from('site_settings').select('*').single()
    if (error) throw error
    
    // Parse MoMo settings from site_logo if stored as JSON
    if (data && data.site_logo && data.site_logo.startsWith('{')) {
      try {
        const parsed = JSON.parse(data.site_logo)
        if (parsed.momo) {
          return NextResponse.json({ ...data, ...parsed.momo, site_logo: parsed.logo || '' })
        }
      } catch {}
    }
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({})
  }
}
