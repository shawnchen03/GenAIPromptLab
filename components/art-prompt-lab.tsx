"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Palette, Wand2, Info, ArrowLeftRight, ChevronDown, Loader2 } from 'lucide-react'
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

const BASE_PROMPTS = CURATED_PROMPTS

interface GeneratedImage {
  url: string
  aestheticScore: number
  prompt: string
}

const BackgroundAnimation = () => (
  <div className="fixed inset-0 z-[-1] overflow-hidden">
    <div className="absolute inset-0 bg-[#030817]" />
    <div className="absolute inset-0 bg-gradient-to-br from-[#00E5E5] to-[#FF9966] opacity-10" />
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.02, 0.05, 0.02],
        scale: [1, 1.1, 1],
        rotate: [0, 5, 0],
      }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
    >
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#00E5E5] blur-3xl"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 200 + 50}px`,
            height: `${Math.random() * 200 + 50}px`,
            opacity: 0.03,
          }}
        />
      ))}
    </motion.div>
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.01, 0.03, 0.01],
        scale: [1, 1.05, 1],
        rotate: [0, -3, 0],
      }}
      transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
    >
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#FF9966] blur-2xl"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 150 + 30}px`,
            height: `${Math.random() * 150 + 30}px`,
            opacity: 0.02,
          }}
        />
      ))}
    </motion.div>
    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.005] mix-blend-overlay" />
  </div>
)

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

const AestheticScoreVisualization = React.memo(({ scores }: { scores: Record<PromptType, number> }) => {
  const maxScore = Math.max(...Object.values(scores))
  const normalizedScores = Object.entries(scores).reduce((acc, [key, value]) => {
    acc[key as PromptType] = value / maxScore
    return acc
  }, {} as Record<PromptType, number>)

  const colors = {
    base: "#00E5E5",
    with_artist: "#FF9966",
    without_artist: "#40F99B"
  }

  return (
    <div className="relative w-full h-64 lg:h-full group">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {PROMPT_TYPES.map((type, index) => (
          <motion.circle
            key={type}
            cx="50"
            cy="50"
            r={48 - index * 8}
            fill="none"
            stroke={colors[type]}
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: normalizedScores[type], rotate: 360 }}
            transition={{ duration: 1.2, ease: "easeOut", rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
            className="group-hover:filter group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-4xl font-bold text-white"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {maxScore.toFixed(2)}
        </motion.div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-around text-xs">
        {PROMPT_TYPES.map((type) => (
          <div key={type} className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-1`} style={{ backgroundColor: colors[type] }} />
            <span>{type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}</span>
          </div>
        ))}
      </div>
    </div>
  )
})

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

const getImagePath = (type: PromptType, promptNumber: string) => {
  const subfolder = Math.floor(Math.random() * 3) + 1  // Random 1, 2, or 3
  const folderMap: Record<PromptType, string> = {
    'base': 'base',
    'with_artist': 'positive',
    'without_artist': 'negative'
  }
  return `/Sample image/${folderMap[type]}/${subfolder}/image_${promptNumber}.png`
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

      const newImages: Record<PromptType, GeneratedImage> = {
        base: {
          url: imageSet.imagePaths.base,
          aestheticScore: imageSet.scores.base,
          prompt: selectedBasePrompt
        },
        with_artist: {
          url: imageSet.imagePaths.with_artist,
          aestheticScore: imageSet.scores.with_artist,
          prompt: `${selectedBasePrompt} in the style of Greg Rutkowski`
        },
        without_artist: {
          url: imageSet.imagePaths.without_artist,
          aestheticScore: imageSet.scores.without_artist,
          prompt: `${selectedBasePrompt} without any specific artist style`
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
    <div className="min-h-screen text-white overflow-hidden">
      <BackgroundAnimation />
      <CustomCursor />
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12 relative z-10">
        <motion.h1 
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00E5E5] to-[#FF9966]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
          style={{ fontFamily: 'Inter, sans-serif', textShadow: '0 0 20px rgba(0,229,229,0.15)' }}
        >
          ArtPromptLab
        </motion.h1>
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.6, 0.01, 0.05, 0.95] }}
        >
          <p className="text-xl md:text-2xl lg:text-3xl text-[#FF9966] mb-4" style={{ textShadow: '0 0 20px rgba(255,153,102,0.15)' }}>
            Exploring the impact of artist-inspired prompts on AI-generated images
          </p>
          <div className="flex items-center justify-center text-[#00E5E5]">
            <Info className="w-5 h-5 mr-2" strokeWidth={1} />
            <p className="text-sm md:text-base">
              Compare outputs with and without artist styles using our curated prompts
            </p>
          </div>
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          <motion.div 
            className="lg:col-span-4 space-y-6 md:space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.6, 0.01, 0.05, 0.95] }}
          >
            <Card className="bg-[#030817] bg-opacity-85 border-none shadow-lg backdrop-blur-xl border border-[rgba(255,255,255,0.1)] overflow-hidden hover:shadow-[0_0_30px_rgba(0,229,229,0.2)] transition-all duration-500">
              <CardContent className="p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-[#FF9966]" style={{ textShadow: '0 0 20px rgba(255,153,102,0.3)' }}>Research Parameters</h2>
                <div className="space-y-6 md:space-y-8">
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

            <GenerateButton onClick={handleGenerate} isGenerating={isGenerating} />
          </motion.div>

          <motion.div 
            className="lg:col-span-8 space-y-6 md:space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
          >
            <div className="flex flex-col lg:flex-row justify-between items-start gap-6 md:gap-8">
              <Tabs defaultValue="base" className="w-full lg:w-2/3">
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
                    <Card className="bg-[#030817] bg-opacity-85 border-none shadow-lg backdrop-blur-xl border border-[rgba(255,255,255,0.1)] overflow-hidden hover:shadow-[0_0_30px_rgba(0,229,229,0.2)] transition-all duration-500">
                      <CardContent className="p-6 md:p-8">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                          <h3 className="text-xl md:text-2xl font-bold text-[#00E5E5]">
                            {type === 'base' ? 'Base' : type === 'with_artist' ? 'With Artist Style' : 'Without Artist Style'} Image
                          </h3>
                          {generatedImages[type] && (
                            <div className="flex items-center">
                              <Sparkles className="w-5 h-5 mr-2 text-[#FF9966]" strokeWidth={1} />
                              <span className="text-lg font-semibold">{generatedImages[type]!.aestheticScore.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                        <motion.div 
                          className="aspect-square bg-[#030817] rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)]"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.3 }}
                        >
                          {generatedImages[type] ? (
                            <motion.img 
                              src={generatedImages[type]!.url}
                              alt={`${type} generated image`}
                              className="w-full h-full object-cover"
                              initial={{ opacity: 0, scale: 1.1 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#00E5E5]">
                              <motion.div
                                animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                              >
                                <Palette className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1} />
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                        <div className="mt-6 md:mt-8">
                          <h4 className="text-base md:text-lg font-semibold mb-2 text-[#FF9966]">Prompt Used:</h4>
                          <p className="text-sm md:text-base text-gray-300">
                            {generatedImages[type]?.prompt || 'No prompt generated yet'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
              <div className="w-full lg:w-1/3 flex justify-center lg:justify-end">
                <AestheticScoreVisualization
                  scores={{
                    base: generatedImages.base?.aestheticScore || 0,
                    with_artist: generatedImages.with_artist?.aestheticScore || 0,
                    without_artist: generatedImages.without_artist?.aestheticScore || 0,
                  }}
                />
              </div>
            </div>

            {generatedImages.base && generatedImages.with_artist && generatedImages.without_artist && (
              <Card className="bg-[#030817] bg-opacity-85 border-none shadow-lg backdrop-blur-xl border border-[rgba(255,255,255,0.1)] overflow-hidden hover:shadow-[0_0_30px_rgba(0,229,229,0.2)] transition-all duration-500">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-6 md:mb-8 text-[#00E5E5]">Comparison View</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {PROMPT_TYPES.map((type) => (
                      <div key={type} className="flex flex-col items-center">
                        <motion.div 
                          whileHover={{ scale: 1.05 }} 
                          transition={{ duration: 0.3 }}
                          className="relative group"
                        >
                          <img 
                            src={generatedImages[type]!.url}
                            alt={`${type} generated image`}
                            className="w-full aspect-square object-cover rounded-2xl border border-[rgba(255,255,255,0.1)]"
                          />
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4 rounded-2xl"
                          >
                            <p className="text-white text-sm text-center">
                              {generatedImages[type]!.prompt}
                            </p>
                          </motion.div>
                        </motion.div>
                        <p className="text-center mt-4 text-sm md:text-base text-[#FF9966]">
                          {type === 'base' ? 'Base' : type === 'with_artist' ? 'With Artist Style' : 'Without Artist Style'}
                        </p>
                        <p className="text-center mt-2 text-lg font-semibold text-[#00E5E5]">
                          Score: {generatedImages[type]!.aestheticScore.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-center items-center mt-8">
                    <ArrowLeftRight className="w-8 h-8 text-[#FF9966]" strokeWidth={1} />
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}