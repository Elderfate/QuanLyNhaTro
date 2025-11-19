"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { Progress } from "@/components/ui/progress"

export function PageProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    // Bắt đầu progress khi pathname thay đổi
    setIsLoading(true)
    setProgress(0)

    // Tăng progress dần
    const timer1 = setTimeout(() => setProgress(30), 50)
    const timer2 = setTimeout(() => setProgress(60), 150)
    const timer3 = setTimeout(() => setProgress(90), 300)
    
    // Hoàn thành progress
    const timer4 = setTimeout(() => {
      setProgress(100)
      // Ẩn progress bar sau khi hoàn thành
      setTimeout(() => setIsLoading(false), 200)
    }, 500)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [pathname])

  if (!isLoading) return null

  return (
    <div className="absolute top-0 left-0 right-0 z-50">
      <Progress 
        value={progress} 
        className="h-0.5 w-full rounded-none bg-transparent"
      />
    </div>
  )
}

