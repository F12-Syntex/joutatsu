'use client'

import { useState, useEffect } from 'react'
import { Settings2, Languages, BookOpen, PenLine, Gauge } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  getProficiencySettings,
  updateProficiencySettings,
  type ProficiencySettingsResponse,
} from '@/services/api'

interface DifficultySettingsProps {
  className?: string
  onSettingsChange?: (settings: ProficiencySettingsResponse) => void
}

export function DifficultySettings({ className, onSettingsChange }: DifficultySettingsProps) {
  const [settings, setSettings] = useState<ProficiencySettingsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Local state for editing
  const [targetKanji, setTargetKanji] = useState(0.3)
  const [targetLexical, setTargetLexical] = useState(0.3)
  const [targetGrammar, setTargetGrammar] = useState(0.3)
  const [autoFurigana, setAutoFurigana] = useState(true)
  const [autoMeanings, setAutoMeanings] = useState(true)
  const [challengeLevel, setChallengeLevel] = useState(0.1)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await getProficiencySettings()
      setSettings(data)
      setTargetKanji(data.target_kanji_difficulty)
      setTargetLexical(data.target_lexical_difficulty)
      setTargetGrammar(data.target_grammar_difficulty)
      setAutoFurigana(data.auto_adjust_furigana)
      setAutoMeanings(data.auto_adjust_meanings)
      setChallengeLevel(data.challenge_level)
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async () => {
    setIsSaving(true)
    try {
      const updated = await updateProficiencySettings({
        target_kanji_difficulty: targetKanji,
        target_lexical_difficulty: targetLexical,
        target_grammar_difficulty: targetGrammar,
        auto_adjust_furigana: autoFurigana,
        auto_adjust_meanings: autoMeanings,
        challenge_level: challengeLevel,
      })
      setSettings(updated)
      onSettingsChange?.(updated)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = settings && (
    targetKanji !== settings.target_kanji_difficulty ||
    targetLexical !== settings.target_lexical_difficulty ||
    targetGrammar !== settings.target_grammar_difficulty ||
    autoFurigana !== settings.auto_adjust_furigana ||
    autoMeanings !== settings.auto_adjust_meanings ||
    challengeLevel !== settings.challenge_level
  )

  const getDifficultyLabel = (value: number) => {
    if (value < 0.2) return 'Beginner'
    if (value < 0.4) return 'Elementary'
    if (value < 0.6) return 'Intermediate'
    if (value < 0.8) return 'Upper Int.'
    return 'Advanced'
  }

  if (isLoading) {
    return (
      <div className={cn('p-6 rounded-xl bg-card border border-border/50', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('p-6 rounded-xl bg-card border border-border/50', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          Difficulty Settings
        </h3>
        {hasChanges && (
          <Button onClick={saveSettings} disabled={isSaving} size="sm">
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Configure target difficulty levels for content recommendations and text generation.
      </p>

      <div className="space-y-5">
        {/* Target Difficulty Sliders */}
        <div className="space-y-4">
          <DifficultySlider
            label="Target Kanji Difficulty"
            icon={<Languages className="h-4 w-4" />}
            value={targetKanji}
            onChange={setTargetKanji}
            current={settings?.kanji_proficiency || 0}
            levelLabel={getDifficultyLabel(targetKanji)}
          />

          <DifficultySlider
            label="Target Vocabulary Difficulty"
            icon={<BookOpen className="h-4 w-4" />}
            value={targetLexical}
            onChange={setTargetLexical}
            current={settings?.lexical_proficiency || 0}
            levelLabel={getDifficultyLabel(targetLexical)}
          />

          <DifficultySlider
            label="Target Grammar Difficulty"
            icon={<PenLine className="h-4 w-4" />}
            value={targetGrammar}
            onChange={setTargetGrammar}
            current={settings?.grammar_proficiency || 0}
            levelLabel={getDifficultyLabel(targetGrammar)}
          />
        </div>

        <div className="border-t border-border/50 pt-4">
          {/* Challenge Level */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Challenge Level (i+1)</span>
              </div>
              <span className="text-sm font-medium text-primary">
                +{Math.round(challengeLevel * 100)}%
              </span>
            </div>
            <Slider
              value={[challengeLevel]}
              min={0}
              max={0.3}
              step={0.05}
              onValueChange={([v]) => setChallengeLevel(v)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How much harder than your current level for generated content
            </p>
          </div>

          {/* Auto-adjust toggles */}
          <div className="space-y-3">
            <ToggleRow
              label="Auto-adjust furigana"
              description="Show furigana based on content difficulty"
              checked={autoFurigana}
              onChange={setAutoFurigana}
            />
            <ToggleRow
              label="Auto-adjust meanings"
              description="Show word meanings based on difficulty"
              checked={autoMeanings}
              onChange={setAutoMeanings}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface DifficultySliderProps {
  label: string
  icon: React.ReactNode
  value: number
  onChange: (value: number) => void
  current: number
  levelLabel: string
}

function DifficultySlider({
  label,
  icon,
  value,
  onChange,
  current,
  levelLabel,
}: DifficultySliderProps) {
  const percentage = Math.round(value * 100)
  const currentPercent = Math.round(current * 100)

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{icon}</span>
          <span className="text-sm">{label}</span>
        </div>
        <div className="text-sm">
          <span className="font-medium">{levelLabel}</span>
          <span className="text-muted-foreground ml-1">({percentage}%)</span>
        </div>
      </div>
      <div className="relative">
        <Slider
          value={[value]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([v]) => onChange(v)}
        />
        {/* Current proficiency marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-primary/60 rounded-full pointer-events-none"
          style={{ left: `${currentPercent}%` }}
          title={`Current: ${currentPercent}%`}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
        <span>Easier</span>
        <span className="text-primary/60">Your level: {currentPercent}%</span>
        <span>Harder</span>
      </div>
    </div>
  )
}

interface ToggleRowProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between text-left"
    >
      <div>
        <span className="text-sm">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          'h-5 w-9 rounded-full transition-colors relative flex-shrink-0 ml-4',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
    </button>
  )
}
