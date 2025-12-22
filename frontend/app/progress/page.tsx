'use client'

import { RefreshCw, BookOpen, Eye, Target, TrendingUp } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import {
  ScoreDisplay,
  WeaknessChart,
  SessionHistory,
  ProficiencyDisplay,
  DifficultySettings,
  PracticeGenerator,
} from '@/components/progress'
import { useProgress } from '@/hooks/use-progress'
import { useProficiency } from '@/hooks/use-proficiency'

export default function ProgressPage() {
  const {
    summary,
    weakestWords,
    sessionHistory,
    sessionStats,
    isLoading,
    error,
    refresh,
  } = useProgress()

  const {
    stats: proficiencyStats,
    recommendations,
    isLoading: proficiencyLoading,
  } = useProficiency()

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">Progress</h1>
              <p className="text-sm text-muted-foreground">
                Track your Japanese learning journey
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={refresh}
              disabled={isLoading}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Score */}
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Mastery Score
                </h3>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              {summary ? (
                <ScoreDisplay
                  score={summary.average_score}
                  size="md"
                  className="mx-auto"
                />
              ) : (
                <div className="h-24 flex items-center justify-center text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No data'}
                </div>
              )}
            </div>

            {/* Vocabulary Stats */}
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Vocabulary
                </h3>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              {summary ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total tracked</span>
                    <span className="font-medium">{summary.total_vocabulary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Known</span>
                    <span className="font-medium text-green-500">{summary.known_words}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Learning</span>
                    <span className="font-medium text-yellow-500">{summary.learning_words}</span>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No data'}
                </div>
              )}
            </div>

            {/* Reading Stats */}
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Reading Activity
                </h3>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              {sessionStats ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Sessions</span>
                    <span className="font-medium">{sessionStats.total_sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="font-medium">{sessionStats.completed_sessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tokens read</span>
                    <span className="font-medium">{sessionStats.total_tokens_read}</span>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No data'}
                </div>
              )}
            </div>

            {/* Lookup Stats */}
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Dictionary Lookups
                </h3>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              {summary ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total lookups</span>
                    <span className="font-medium">{summary.total_lookups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Words seen</span>
                    <span className="font-medium">{summary.total_words_seen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Mastery</span>
                    <span className="font-medium">{summary.mastery_percentage}%</span>
                  </div>
                </div>
              ) : (
                <div className="h-20 flex items-center justify-center text-muted-foreground">
                  {isLoading ? 'Loading...' : 'No data'}
                </div>
              )}
            </div>
          </div>

          {/* Proficiency and Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Proficiency Level */}
            <ProficiencyDisplay
              stats={proficiencyStats}
              recommendations={recommendations}
              isLoading={proficiencyLoading}
            />

            {/* Difficulty Settings */}
            <DifficultySettings />
          </div>

          {/* Practice Generator and Weakest Words */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Practice Text Generator */}
            <PracticeGenerator />

            {/* Weakest Words */}
            <div className="p-6 rounded-xl bg-card border border-border/50">
              <h3 className="text-lg font-semibold mb-4">Words to Review</h3>
              <WeaknessChart words={weakestWords} />
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="p-6 rounded-xl bg-card border border-border/50">
            <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
            <SessionHistory sessions={sessionHistory} />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
