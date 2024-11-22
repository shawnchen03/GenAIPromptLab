"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Palette, Wand2, Info, ChevronDown, Loader2 } from 'lucide-react'
import { cn, PROMPT_TYPES, type PromptType, CURATED_PROMPTS, getImageSetWithScores } from '@/lib/utils'

const AI_MODELS = [
  { value: "dalle", label: "DALL-E" },
  { value: "midjourney", label: "Midjourney" },
  { value: "sd", label: "Stable Diffusion" }
]

const ARTISTS = [
  "Vincent van Gogh",
  "Claude Monet",
  "Pablo Picasso",
  "Leonardo da Vinci",
  "Frida Kahlo",
  "Greg Rutkowski"
]


interface GeneratedImage {
  url: string
  aestheticScore: number
  prompt: string
}

const BackgroundAnimation = React.memo(() => {
  const circles = React.useMemo(() => [
    ...[...Array(6)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 300 + 200,
      delay: Math.random() * 3,
      color: '#00E5E5',
      blur: 'blur-3xl',
    })),
    ...[...Array(4)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 250 + 150,
      delay: Math.random() * 3,
      color: '#FF9966',
      blur: 'blur-2xl',
    }))
  ], []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#030817]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#00E5E5]/10 via-[#FF9966]/5 to-[#9945FF]/10 opacity-30" />

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {circles.map((circle, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${circle.blur}`}
            style={{
              top: circle.top,
              left: circle.left,
              width: circle.size,
              height: circle.size,
              backgroundColor: circle.color,
              willChange: 'transform',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0.1, 0.2, 0.1],
              scale: [1, 1.1, 1],
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
              delay: circle.delay,
            }}
          />
        ))}

        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-[2px] h-[2px] bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: '0 0 10px rgba(255,255,255,0.5)',
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
              x: [0, (Math.random() - 0.5) * 50],
            }}
            transition={{
              duration: Math.random() * 2 + 1,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </motion.div>

      <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#030817]/50 to-[#030817] opacity-60" />
    </div>
  );
});

BackgroundAnimation.displayName = 'BackgroundAnimation';

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [cursorVisible, setCursorVisible] = useState(false)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = `${e.clientX}px`
        cursorRef.current.style.top = `${e.clientY}px`
      }
      setCursorVisible(true)
    }

    const onMouseLeave = () => setCursorVisible(false)

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseleave', onMouseLeave)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <motion.div
      ref={cursorRef}
      className="fixed pointer-events-none z-50 w-6 h-6 rounded-full mix-blend-difference"
      animate={{
        opacity: cursorVisible ? 1 : 0,
        scale: cursorVisible ? 1 : 0.8,
      }}
      transition={{ duration: 0.15 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-[#00E5E5] to-[#FF9966]"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  )
}

const EnhancedSelect = ({ value, onValueChange, options, placeholder }: {
  value: string
  onValueChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full bg-white bg-opacity-5 border-none text-white hover:bg-opacity-10 transition-all duration-300 backdrop-blur-[20px] hover:translate-y-[-2px] focus:shadow-[0_0_20px_rgba(0,229,229,0.3)] bg-gradient-radial from-white/10 to-transparent">
        <SelectValue placeholder={placeholder} />
        <ChevronDown className="w-4 h-4 text-[#00E5E5]" />
      </SelectTrigger>
      <SelectContent className="bg-[#030817] bg-opacity-90 border-none text-white backdrop-blur-[20px]">
        <AnimatePresence>
          {options.map((option, index) => (
            <motion.div
              key={option.value}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <SelectItem
                value={option.value}
                className="hover:bg-[#00E5E5] hover:bg-opacity-20 transition-all duration-300"
              >
                {option.label}
              </SelectItem>
            </motion.div>
          ))}
        </AnimatePresence>
      </SelectContent>
    </Select>
  )
}

const AestheticScoreVisualization = React.memo(({ 
  scores, 
  selectedType 
}: { 
  scores: Record<PromptType, number>
  selectedType?: PromptType | null
}) => {
  const normalizedScores = Object.entries(scores).reduce((acc, [key, value]) => {
    acc[key as PromptType] = Math.min(Math.max(value, 0), 10) / 10
    return acc
  }, {} as Record<PromptType, number>)

  const colors = {
    base: "#00E5E5",
    with_artist: "#FF9966",
    without_artist: "#40F99B"
  }

  const selectedScore = selectedType ? scores[selectedType] : null

  return (
    <div className="relative w-full h-64 lg:h-full flex flex-col gap-8">
      <div className="relative flex-1">
        <div className="absolute inset-[10%] bg-[#030817]/95 rounded-full backdrop-blur-sm">
          {selectedType && (
            <div 
              className="absolute inset-0 rounded-full transition-opacity duration-300"
              style={{
                background: `radial-gradient(circle, ${colors[selectedType]}30 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
            />
          )}
        </div>
        
        <motion.div 
          className="absolute inset-0 flex items-center justify-center z-20"
          initial={false}
        >
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: selectedScore !== null ? 1 : 0,
              scale: selectedScore !== null ? 1 : 0.8,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {selectedScore !== null && (
              <>
                <motion.span 
                  className="text-4xl font-bold drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                  style={{ color: selectedType ? colors[selectedType] : 'white' }}
                  layoutId="score-value"
                >
                  {selectedScore.toFixed(1)}
                </motion.span>
                <motion.span 
                  className="text-xs text-white/70 mt-1"
                  layoutId="score-label"
                >
                  Aesthetic Score
                </motion.span>
              </>
            )}
          </motion.div>
        </motion.div>
        
        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
          {PROMPT_TYPES.map((type, index) => (
            <motion.circle
              key={`bg-${type}`}
              cx="50"
              cy="50"
              r={42 - index * 10}
              fill="none"
              stroke={colors[type]}
              strokeWidth="6"
              strokeOpacity={selectedType === type ? "0.1" : "0.05"}
              className="transition-all duration-300"
              style={{
                filter: selectedType === type ? `drop-shadow(0 0 6px ${colors[type]}40)` : 'none'
              }}
            />
          ))}
          
          {PROMPT_TYPES.map((type, index) => (
            <motion.circle
              key={type}
              cx="50"
              cy="50"
              r={42 - index * 10}
              fill="none"
              stroke={colors[type]}
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ 
                pathLength: normalizedScores[type] || 0,
                opacity: selectedType === type ? 1 : 0.3
              }}
              transition={{ 
                pathLength: {
                  duration: 0.8,
                  ease: "easeOut",
                },
                opacity: { duration: 0.2 }
              }}
              className="transition-all duration-300"
              transform="rotate(180 50 50)"
              style={{
                filter: `drop-shadow(0 0 ${selectedType === type ? '20px' : '3px'} ${colors[type]}${selectedType === type ? 'FF' : '20'})`,
              }}
            />
          ))}
        </svg>
      </div>

      <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/5">
        <div className="text-xs text-white/50 mb-3 font-medium">Aesthetic Scores</div>
        <div className="flex flex-col gap-3">
          {PROMPT_TYPES.map((type) => (
            <motion.div 
              key={type} 
              className={cn(
                "flex items-center justify-between p-2 rounded-lg transition-all duration-200",
                selectedType === type ? "bg-white/15" : "bg-black/20"
              )}
              whileHover={{ scale: 1.02 }}
              animate={{
                opacity: selectedType ? (selectedType === type ? 1 : 0.4) : 1
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-3 h-3 rounded-full"
                  animate={{
                    scale: selectedType === type ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 1,
                    repeat: selectedType === type ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                  style={{ 
                    backgroundColor: colors[type],
                    boxShadow: `0 0 ${selectedType === type ? '25px' : '8px'} ${colors[type]}${selectedType === type ? 'FF' : '40'}`
                  }} 
                />
                <span className={cn(
                  "whitespace-nowrap text-sm font-medium transition-all duration-200",
                  selectedType === type ? "text-white" : "text-white/50"
                )}>
                  {type.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                </span>
              </div>
              <span className={cn(
                "font-bold text-lg tracking-wider transition-all duration-200",
                selectedType === type 
                  ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]" 
                  : "text-white/40"
              )}>
                {(scores[type] || 0).toFixed(1)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
})

AestheticScoreVisualization.displayName = 'AestheticScoreVisualization'

const GenerateButton = ({ onClick, isGenerating }: { onClick: () => void, isGenerating: boolean }) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      button.style.setProperty('--mouse-x', `${x}px`)
      button.style.setProperty('--mouse-y', `${y}px`)
    }

    button.addEventListener('mousemove', handleMouseMove)

    return () => {
      button.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  return (
    <motion.button
      ref={buttonRef}
      className="relative w-full px-8 py-6 text-xl font-medium rounded-full text-white shadow-lg bg-gradient-to-r from-[#00E5E5] to-[#FF9966] hover:shadow-xl transition-all duration-300 overflow-hidden"
      onClick={onClick}
      disabled={isGenerating}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <span className="relative z-10">
        {isGenerating ? (
          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
        ) : (
          <>
            <Wand2 className="w-5 h-5 mr-2 inline-block" />
            Generate Images
          </>
        )}
      </span>
      <div
        className="absolute inset-0 bg-gradient-to-r from-[#00E5E5] to-[#FF9966] opacity-0 transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          backgroundImage: "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.2), transparent 80%)"
        }}
      />
      {isHovered && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{
                x: "var(--mouse-x)",
                y: "var(--mouse-y)",
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x: `calc(var(--mouse-x) + ${(Math.random() - 0.5) * 100}px)`,
                y: `calc(var(--mouse-y) + ${(Math.random() - 0.5) * 100}px)`,
                scale: Math.random() * 3,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 2 + 1,
                ease: "easeOut",
                delay: Math.random() * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
      {isGenerating && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-[#00E5E5] to-[#FF9966]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ transformOrigin: "left" }}
        />
      )}
    </motion.button>
  )
}

export function ArtPromptLabComponent() {
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedBasePrompt, setSelectedBasePrompt] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Record<PromptType, GeneratedImage | null>>({
    base: null,
    with_artist: null,
    without_artist: null,
  })
  const [selectedTab, setSelectedTab] = useState<PromptType>('base')

  const handleGenerate = React.useCallback(async () => {
    try {
      if (!selectedBasePrompt || !selectedModel || !selectedArtist) {
        throw new Error('Please select all options')
      }

      if (selectedModel !== 'sd' || selectedArtist !== 'Greg Rutkowski') {
        throw new Error('This combination is not yet available')
      }

      setIsGenerating(true)
      
      const promptNumber = selectedBasePrompt
      const imageSet = await getImageSetWithScores(promptNumber)
      
      // Get the actual prompt text from CURATED_PROMPTS
      const basePromptText = CURATED_PROMPTS.find(p => p.value === selectedBasePrompt)?.label || ''

      const newImages: Record<PromptType, GeneratedImage> = {
        base: {
          url: imageSet.imagePaths.base,
          aestheticScore: imageSet.scores.base,
          prompt: basePromptText
        },
        with_artist: {
          url: imageSet.imagePaths.with_artist,
          aestheticScore: imageSet.scores.with_artist,
          prompt: `${basePromptText} in the style of ${selectedArtist}`
        },
        without_artist: {
          url: imageSet.imagePaths.without_artist,
          aestheticScore: imageSet.scores.without_artist,
          prompt: `${basePromptText} without the style of ${selectedArtist}`
        }
      }

      setGeneratedImages(newImages)
    } catch (error) {
      console.error('Generation failed:', error)
      // Add user feedback here
    } finally {
      setIsGenerating(false)
    }
  }, [selectedBasePrompt, selectedModel, selectedArtist])

  return (
    <div className="min-h-screen text-white overflow-hidden py-8">
      <BackgroundAnimation />
      <CustomCursor />
      <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-10 md:space-y-16 relative z-10">
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-4 md:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#00E5E5] to-[#FF9966]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
          style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 0 20px rgba(0,229,229,0.15)' }}
        >
          ArtPromptLab
        </motion.h1>
        <motion.div
          className="text-center mb-10 md:mb-16"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.6, 0.01, 0.05, 0.95] }}
        >
          <p className="text-xl md:text-2xl lg:text-3xl text-[#FF9966] mb-6" style={{ textShadow: '0 0 20px rgba(255,153,102,0.15)' }}>
            Exploring the impact of artist-inspired prompts on AI-generated images
          </p>
          <div className="flex items-center justify-center text-[#00E5E5] gap-2">
            <Info className="w-5 h-5" strokeWidth={1} />
            <p className="text-sm md:text-base">
              Compare outputs with and without artist styles using our curated prompts
            </p>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14">
          <motion.div 
            className="lg:col-span-4 space-y-8 md:space-y-10"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.6, 0.01, 0.05, 0.95] }}
          >
            <Card className="bg-[#030817] bg-opacity-85 border-none shadow-lg backdrop-blur-xl border border-[rgba(255,255,255,0.1)] overflow-hidden hover:shadow-[0_0_30px_rgba(0,229,229,0.2)] transition-all duration-500">
              <CardContent className="p-8 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-10 text-[#FF9966]" style={{ textShadow: '0 0 20px rgba(255,153,102,0.3)' }}>Research Parameters</h2>
                <div className="space-y-8 md:space-y-10">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#00E5E5]">AI Model</label>
                    <EnhancedSelect
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                      options={AI_MODELS}
                      placeholder="Choose AI model"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#00E5E5]">Base Prompt</label>
                    <EnhancedSelect
                      value={selectedBasePrompt}
                      onValueChange={setSelectedBasePrompt}
                      options={CURATED_PROMPTS}
                      placeholder="Select base prompt"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#00E5E5]">Artist Style</label>
                    <EnhancedSelect
                      value={selectedArtist}
                      onValueChange={setSelectedArtist}
                      options={ARTISTS.map(artist => ({ value: artist, label: artist }))}
                      placeholder="Select artist style"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-4">
              <GenerateButton onClick={handleGenerate} isGenerating={isGenerating} />
            </div>
          </motion.div>

          <motion.div 
            className="lg:col-span-8 space-y-8 md:space-y-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
          >
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8 md:gap-10">
              <Tabs 
                defaultValue="base" 
                className="w-full lg:w-2/3 space-y-6"
                onValueChange={(value) => setSelectedTab(value as PromptType)}
              >
                <TabsList className="grid w-full grid-cols-3 bg-[#030817] bg-opacity-70 backdrop-blur-xl rounded-full p-1">
                  {PROMPT_TYPES.map((type) => (
                    <TabsTrigger 
                      key={type} 
                      value={type} 
                      className="text-sm rounded-full transition-all duration-300 data-[state=active]:bg-[#00E5E5] data-[state=active]:bg-opacity-20 data-[state=active]:text-white"
                    >
                      {type === 'base' ? 'Base' : type === 'with_artist' ? 'With Artist' : 'Without Artist'}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {PROMPT_TYPES.map((type) => (
                  <TabsContent key={type} value={type}>
                    <Card className={cn(
                      "bg-[#030817] bg-opacity-85 border-none shadow-lg backdrop-blur-xl border border-[rgba(255,255,255,0.1)] overflow-hidden transition-all duration-500",
                      selectedTab === type 
                        ? "hover:shadow-[0_0_30px_rgba(0,229,229,0.2)]" 
                        : "opacity-50 scale-95 blur-[1px]"
                    )}>
                      <CardContent className="p-6 md:p-8">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                          <h3 className={cn(
                            "text-xl md:text-2xl font-bold transition-colors duration-300",
                            selectedTab === type ? "text-[#00E5E5]" : "text-white/50"
                          )}>
                            {type === 'base' ? 'Base' : type === 'with_artist' ? 'With Artist Style' : 'Without Artist Style'} Image
                          </h3>
                          {generatedImages[type] && (
                            <div className={cn(
                              "flex items-center transition-all duration-300",
                              selectedTab === type ? "opacity-100 scale-100" : "opacity-50 scale-95"
                            )}>
                              <Sparkles className="w-5 h-5 mr-2 text-[#FF9966]" strokeWidth={1} />
                              <span className="text-lg font-semibold">{generatedImages[type]!.aestheticScore.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        <motion.div 
                          className={cn(
                            "aspect-square bg-[#030817] rounded-2xl overflow-hidden border transition-all",
                            selectedTab === type 
                              ? "border-[rgba(255,255,255,0.2)] shadow-[0_0_30px_rgba(0,229,229,0.1)]"
                              : "border-[rgba(255,255,255,0.05)]"
                          )}
                          animate={{
                            scale: selectedTab === type ? 1 : 0.98,
                            opacity: selectedTab === type ? 1 : 0.7,
                          }}
                          transition={{ duration: 0.15 }}
                        >
                          {generatedImages[type] ? (
                            <motion.img 
                              src={generatedImages[type]!.url}
                              alt={`${type} generated image`}
                              loading="lazy"
                              decoding="async"
                              className={cn(
                                "w-full h-full object-cover",
                                selectedTab !== type && "filter grayscale brightness-75"
                              )}
                              initial={false}
                              animate={{ 
                                opacity: 1,
                                filter: selectedTab === type ? 'none' : 'grayscale(0.5) brightness(0.75)'
                              }}
                              transition={{ 
                                duration: 0.1,
                                ease: "linear"
                              }}
                              style={{
                                willChange: 'filter, opacity'
                              }}
                            />
                          ) : (
                            <div className={cn(
                              "w-full h-full flex items-center justify-center",
                              selectedTab === type ? "text-[#00E5E5]" : "text-[#00E5E5]/30"
                            )}>
                              <motion.div
                                animate={{ 
                                  rotate: 360, 
                                  scale: selectedTab === type ? [1, 1.1, 1] : [0.9, 0.95, 0.9]
                                }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                              >
                                <Palette className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1} />
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                        <div className={cn(
                          "mt-6 md:mt-8 transition-all duration-300",
                          selectedTab === type ? "opacity-100" : "opacity-50"
                        )}>
                          <h4 className={cn(
                            "text-base md:text-lg font-semibold mb-2",
                            selectedTab === type ? "text-[#FF9966]" : "text-[#FF9966]/50"
                          )}>
                            Prompt Used:
                          </h4>
                          <p className={cn(
                            "text-sm md:text-base",
                            selectedTab === type ? "text-gray-300" : "text-gray-500"
                          )}>
                            {generatedImages[type]?.prompt || 'No prompt generated yet'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
              <div className="w-full lg:w-1/3 flex justify-center lg:justify-end pt-4 lg:pt-0">
                <AestheticScoreVisualization
                  scores={{
                    base: generatedImages.base?.aestheticScore || 0,
                    with_artist: generatedImages.with_artist?.aestheticScore || 0,
                    without_artist: generatedImages.without_artist?.aestheticScore || 0,
                  }}
                  selectedType={selectedTab}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}