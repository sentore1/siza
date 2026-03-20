'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface HeroSection {
  id: string
  position: number
  vertical_position: 'top' | 'middle' | 'bottom'
  enabled: boolean
  hero_type: 'image' | 'video' | 'gallery' | 'slider'
  hero_content: string
  hero_gallery_images: string[]
  hero_title: string
  hero_subtitle: string
  hero_height: number
  hero_border_radius: number
  hero_overlay_enabled: boolean
  hero_overlay_color: string
  hero_overlay_opacity: number
  hero_button_text: string
  hero_button_link: string
  hero_title_font: string
  hero_title_size: number
}

function parseGalleryImages(raw: any): string[] {
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw || '[]') } catch { return [] }
}

export default function HeroSectionsManager() {
  const [sections, setSections] = useState<HeroSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchSections() }, [])

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('hero_sections')
      .select('*')
      .order('position')

    if (data && !error) {
      setSections(data.map(s => ({ ...s, hero_gallery_images: parseGalleryImages(s.hero_gallery_images) })))
    }
    setLoading(false)
  }

  const addSection = async () => {
    const newSection = {
      position: sections.length,
      vertical_position: 'top',
      enabled: true,
      hero_type: 'image',
      hero_content: '',
      hero_gallery_images: '[]',
      hero_title: 'New Hero',
      hero_subtitle: 'Subtitle',
      hero_height: 400,
      hero_border_radius: 0,
      hero_overlay_enabled: true,
      hero_overlay_color: '#000000',
      hero_overlay_opacity: 0.3,
      hero_button_text: '',
      hero_button_link: '',
      hero_title_font: 'inherit',
      hero_title_size: 48
    }
    const { error } = await supabase.from('hero_sections').insert([newSection])
    if (!error) fetchSections()
  }

  const updateSection = async (id: string, updates: Partial<HeroSection>) => {
    const dbUpdates: any = { ...updates }
    if (Array.isArray(dbUpdates.hero_gallery_images)) {
      dbUpdates.hero_gallery_images = JSON.stringify(dbUpdates.hero_gallery_images)
    }
    const { error } = await supabase.from('hero_sections').update(dbUpdates).eq('id', id)
    if (!error) fetchSections()
  }

  const deleteSection = async (id: string) => {
    if (confirm('Delete this hero section?')) {
      const { error } = await supabase.from('hero_sections').delete().eq('id', id)
      if (!error) fetchSections()
    }
  }

  const moveSection = async (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id)
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return
    const newIndex = direction === 'up' ? index - 1 : index + 1
    const newSections = [...sections]
    ;[newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]]
    await Promise.all(newSections.map((s, i) =>
      supabase.from('hero_sections').update({ position: i }).eq('id', s.id)
    ))
    fetchSections()
  }

  const updateGalleryImage = (section: HeroSection, index: number, url: string) => {
    const imgs = [...section.hero_gallery_images]
    imgs[index] = url
    updateSection(section.id, { hero_gallery_images: imgs })
  }

  const addGalleryImage = (section: HeroSection) => {
    updateSection(section.id, { hero_gallery_images: [...section.hero_gallery_images, ''] })
  }

  const removeGalleryImage = (section: HeroSection, index: number) => {
    updateSection(section.id, { hero_gallery_images: section.hero_gallery_images.filter((_, i) => i !== index) })
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium">Hero Sections</h2>
        <button onClick={addSection} className="bg-black text-white px-4 py-2 rounded flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={section.id} className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-medium">Section {index + 1}</span>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(e) => updateSection(section.id, { enabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Enabled</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => moveSection(section.id, 'up')} disabled={index === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button onClick={() => moveSection(section.id, 'down')} disabled={index === sections.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30">
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button onClick={() => deleteSection(section.id)} className="p-1 hover:bg-red-100 text-red-600 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select value={section.hero_type} onChange={(e) => updateSection(section.id, { hero_type: e.target.value as any })} className="w-full p-2 border rounded">
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="gallery">Gallery (Grid)</option>
                  <option value="slider">Slider (Auto-play)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vertical Position</label>
                <select value={section.vertical_position} onChange={(e) => updateSection(section.id, { vertical_position: e.target.value as any })} className="w-full p-2 border rounded">
                  <option value="top">Top (Before Products)</option>
                  <option value="middle">Middle (Between Products)</option>
                  <option value="bottom">Bottom (After Products)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Height (px)</label>
                <input type="number" value={section.hero_height ?? ''} onChange={(e) => updateSection(section.id, { hero_height: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Single content URL for image/video */}
            {(section.hero_type === 'image' || section.hero_type === 'video') && (
              <div>
                <label className="block text-sm font-medium mb-1">Content URL</label>
                <input type="url" value={section.hero_content ?? ''} onChange={(e) => updateSection(section.id, { hero_content: e.target.value })} className="w-full p-2 border rounded" placeholder="Image or Video URL" />
              </div>
            )}

            {/* Gallery / Slider image list */}
            {(section.hero_type === 'gallery' || section.hero_type === 'slider') && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">
                    {section.hero_type === 'gallery' ? 'Gallery Images' : 'Slider Images'}
                  </label>
                  <button
                    type="button"
                    onClick={() => addGalleryImage(section)}
                    className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                  >
                    + Add Image
                  </button>
                </div>
                <div className="space-y-2">
                  {section.hero_gallery_images.map((url, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateGalleryImage(section, i, e.target.value)}
                        className="flex-1 p-2 border rounded text-sm"
                        placeholder={`Image URL ${i + 1}`}
                      />
                      {url && <img src={url} alt="" className="w-10 h-10 object-cover rounded border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />}
                      <button type="button" onClick={() => removeGalleryImage(section, i)} className="text-red-500 hover:text-red-700 px-2">×</button>
                    </div>
                  ))}
                  {section.hero_gallery_images.length === 0 && (
                    <p className="text-sm text-gray-400">No images yet. Click &quot;+ Add Image&quot; to start.</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value={section.hero_title ?? ''} onChange={(e) => updateSection(section.id, { hero_title: e.target.value })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subtitle</label>
                <input type="text" value={section.hero_subtitle ?? ''} onChange={(e) => updateSection(section.id, { hero_subtitle: e.target.value })} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title Size</label>
                <input type="number" value={section.hero_title_size ?? ''} onChange={(e) => updateSection(section.id, { hero_title_size: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Border Radius</label>
                <input type="number" value={section.hero_border_radius ?? ''} onChange={(e) => updateSection(section.id, { hero_border_radius: parseInt(e.target.value) })} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Overlay Opacity</label>
                <input type="number" step="0.1" min="0" max="1" value={section.hero_overlay_opacity ?? ''} onChange={(e) => updateSection(section.id, { hero_overlay_opacity: parseFloat(e.target.value) })} className="w-full p-2 border rounded" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Button Text</label>
                <input type="text" value={section.hero_button_text || ''} onChange={(e) => updateSection(section.id, { hero_button_text: e.target.value })} className="w-full p-2 border rounded" placeholder="Leave empty to hide" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Button Link</label>
                <input type="text" value={section.hero_button_link || ''} onChange={(e) => updateSection(section.id, { hero_button_link: e.target.value })} className="w-full p-2 border rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
