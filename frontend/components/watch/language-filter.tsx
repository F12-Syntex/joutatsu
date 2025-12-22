'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Languages } from 'lucide-react'

interface LanguageFilterProps {
  selectedLanguages: string[]
  onLanguageChange: (languages: string[]) => void
}

const COMMON_LANGUAGES = [
  { code: 'ja', name: 'Japanese' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ko', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
]

export function LanguageFilter({
  selectedLanguages,
  onLanguageChange,
}: LanguageFilterProps) {
  const toggleLanguage = (code: string) => {
    if (selectedLanguages.includes(code)) {
      onLanguageChange(selectedLanguages.filter((l) => l !== code))
    } else {
      onLanguageChange([...selectedLanguages, code])
    }
  }

  const clearAll = () => onLanguageChange([])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          Subtitle Languages
          {selectedLanguages.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0">
              {selectedLanguages.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Filter by subtitle language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {COMMON_LANGUAGES.map((lang) => (
          <DropdownMenuCheckboxItem
            key={lang.code}
            checked={selectedLanguages.includes(lang.code)}
            onCheckedChange={() => toggleLanguage(lang.code)}
          >
            {lang.name}
          </DropdownMenuCheckboxItem>
        ))}
        {selectedLanguages.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 w-full text-xs"
              >
                Clear all
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
