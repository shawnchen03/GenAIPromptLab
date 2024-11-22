import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as XLSX from 'xlsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PROMPT_TYPES = ['base', 'with_artist', 'without_artist'] as const
export type PromptType = typeof PROMPT_TYPES[number]

export interface Prompt {
  value: string
  label: string
}

export const CURATED_PROMPTS: Prompt[] = [
  { value: "0", label: "Cyberpunk Mercenary Portrait" },
  { value: "1", label: "Photorealistic Group Scene" },
  { value: "2", label: "Art Nouveau Waves" },
  { value: "3", label: "Mystical Portrait Scene" },
  { value: "4", label: "Lucid Dream" },
  { value: "5", label: "Forest River Scene" },
  { value: "6", label: "Anime Character" },
  { value: "7", label: "Spirit Photography" },
  { value: "8", label: "Gangster Cats" },
  { value: "9", label: "Fantasy School Scene" }
]

const folderMap: Record<PromptType, string> = {
  'base': 'base',
  'with_artist': 'positive',
  'without_artist': 'negative'
}

// Function to get score from Excel file
export async function getScoreFromExcel(type: PromptType, subfolder: number, imageNumber: string) {
  try {
    const response = await fetch(`/Sample image/${folderMap[type]}/${subfolder}/sorted_${subfolder}.xlsx`)
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    const imageData = data.find((row: any) => row.Filename === `image_${imageNumber}.png`)
    return imageData ? imageData['Aesthetic Score'] : 0
  } catch (error) {
    console.error(`Error getting score for ${type}/${subfolder}/image_${imageNumber}:`, error)
    return 0
  }
}

// Function to get all images and scores from the same subfolder
export async function getImageSetWithScores(promptNumber: string) {
  const subfolder = Math.floor(Math.random() * 3) + 1  // Random 1, 2, or 3

  const imagePaths = {
    base: `/Sample image/base/${subfolder}/image_${promptNumber}.png`,
    with_artist: `/Sample image/positive/${subfolder}/image_${promptNumber}.png`,
    without_artist: `/Sample image/negative/${subfolder}/image_${promptNumber}.png`
  }

  const scores = {
    base: await getScoreFromExcel('base', subfolder, promptNumber),
    with_artist: await getScoreFromExcel('with_artist', subfolder, promptNumber),
    without_artist: await getScoreFromExcel('without_artist', subfolder, promptNumber)
  }

  return {
    subfolder,
    imagePaths,
    scores
  }
}
