export interface PerformanceMetrics {
  lcp: number
  fid: number
  cls: number
  fcp: number
  ttfb: number
}

interface LayoutShift {
  value: number
  hadRecentInput: boolean
}

export interface PerformanceConfig {
  lcpTarget: number // in milliseconds
  fidTarget: number
  clsTarget: number
  fcpTarget: number
  ttfbTarget: number
  enableMonitoring: boolean
  enableOptimizations: boolean
}

export const defaultPerformanceConfig: PerformanceConfig = {
  lcpTarget: 2500,
  fidTarget: 100,
  clsTarget: 0.1,
  fcpTarget: 1800,
  ttfbTarget: 600,
  enableMonitoring: process.env.NODE_ENV === 'production',
  enableOptimizations: true
}

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const metrics = {
    lcp: 0,
    fid: 0,
    cls: 0,
    fcp: 0,
    ttfb: 0
  }

  // Measure LCP
  const measureLCP = () => {
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const lastEntry = entries[entries.length - 1]
        metrics.lcp = lastEntry.startTime
        console.log(`LCP: ${metrics.lcp}ms`)
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
    }
  }

  // Measure FID
  const measureFID = () => {
    if ('PerformanceObserver' in window) {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries()
        const firstEntry = entries[0] as PerformanceEventTiming
        metrics.fid = firstEntry.processingStart - firstEntry.startTime
        console.log(`FID: ${metrics.fid}ms`)
      })
      fidObserver.observe({ entryTypes: ['first-input'] })
    }
  }

  // Measure CLS
  const measureCLS = () => {
    if ('PerformanceObserver' in window) {
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0
        entryList.getEntries().forEach((entry) => {
          const layoutShift = entry as unknown as LayoutShift
          if (layoutShift.hadRecentInput) return
          clsValue += layoutShift.value
        })
        metrics.cls = clsValue
        console.log(`CLS: ${metrics.cls}`)
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    }
  }

  // Initialize all measurements
  const init = () => {
    measureLCP()
    measureFID()
    measureCLS()
  }

  return { metrics, init }
}

// Performance utility functions
export const optimizeImages = (src: string): string => {
  // Add WebP format support
  if (src.endsWith('.jpg') || src.endsWith('.jpeg')) {
    return src.replace(/\.(jpg|jpeg)$/, '.webp')
  }
  if (src.endsWith('.png')) {
    return src.replace('.png', '.webp')
  }
  return src
}

export const preloadCriticalResources = (resources: string[]) => {
  resources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = resource.includes('.css') ? 'style' : 'script'
    link.href = resource
    document.head.appendChild(link)
  })
}

export const deferNonCriticalScripts = () => {
  const scripts = document.querySelectorAll('script[data-defer="true"]')
  scripts.forEach(script => {
    const newScript = document.createElement('script')
    newScript.src = script.getAttribute('src') || ''
    newScript.async = true
    script.parentNode?.replaceChild(newScript, script)
  })
}

// Performance monitoring API route
export const performanceReportHandler = async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const metrics = await req.json()
    // Log metrics to your monitoring service
    console.log('Performance metrics:', metrics)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error processing performance metrics:', error)
    return new Response('Internal server error', { status: 500 })
  }
}