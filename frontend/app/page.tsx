'use client'

import { BookOpen, Library, Target, Clock, TrendingUp, Flame } from 'lucide-react'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QuickReader } from '@/components/reader/quick-reader'

// Placeholder stats - will be dynamic later
const stats = [
  {
    title: 'Words Learned',
    value: '0',
    description: 'Total vocabulary',
    icon: BookOpen,
  },
  {
    title: 'Texts Read',
    value: '0',
    description: 'Completed readings',
    icon: Library,
  },
  {
    title: 'Study Streak',
    value: '0',
    description: 'Days in a row',
    icon: Flame,
  },
  {
    title: 'Time Today',
    value: '0m',
    description: 'Study time',
    icon: Clock,
  },
]

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Ready to practice Japanese?
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Reader */}
          <div className="lg:col-span-2">
            <QuickReader />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm">Start reading to track your progress</p>
              </div>
            </CardContent>
          </Card>

          {/* Daily Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Target className="h-12 w-12 mb-4 opacity-50" />
                <p>No goal set</p>
                <p className="text-sm">Set a daily reading goal in settings</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
