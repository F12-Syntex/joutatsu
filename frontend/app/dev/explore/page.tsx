'use client'

import { useState } from 'react'
import { Database, BookOpen, Languages, FileText, Activity } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SystemStatus } from '@/components/explore/system-status'
import { ContentExplorer } from '@/components/explore/content-explorer'
import { DictionaryExplorer } from '@/components/explore/dictionary-explorer'
import { TokenizationExplorer } from '@/components/explore/tokenization-explorer'
import { PitchExplorer } from '@/components/explore/pitch-explorer'

export default function ExplorePage() {
  const [activeTab, setActiveTab] = useState('status')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Data Explorer</h1>
          <p className="text-muted-foreground mt-2">
            Explore the depth of your content, dictionary, and tokenization data
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="status" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Content</span>
            </TabsTrigger>
            <TabsTrigger value="dictionary" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Dictionary</span>
            </TabsTrigger>
            <TabsTrigger value="tokenize" className="gap-2">
              <Languages className="h-4 w-4" />
              <span className="hidden sm:inline">Tokenize</span>
            </TabsTrigger>
            <TabsTrigger value="pitch" className="gap-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Pitch</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <SystemStatus />
          </TabsContent>

          <TabsContent value="content">
            <ContentExplorer />
          </TabsContent>

          <TabsContent value="dictionary">
            <DictionaryExplorer />
          </TabsContent>

          <TabsContent value="tokenize">
            <TokenizationExplorer />
          </TabsContent>

          <TabsContent value="pitch">
            <PitchExplorer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
