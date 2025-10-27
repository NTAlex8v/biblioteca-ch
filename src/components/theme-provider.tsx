"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import dynamic from 'next/dynamic'

const DynamicNextThemesProvider = dynamic(
  () => import('next-themes').then(mod => mod.ThemeProvider),
  { ssr: false }
) as React.FC<ThemeProviderProps>;


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <DynamicNextThemesProvider {...props}>{children}</DynamicNextThemesProvider>
}
