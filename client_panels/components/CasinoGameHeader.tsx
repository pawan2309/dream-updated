'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'

interface CasinoGameHeaderProps {
  gameName: string
  gameId: string
  streamingId: string
  roundId?: string
}

export default function CasinoGameHeader({ 
  gameName, 
  gameId, 
  streamingId, 
  roundId = '114250815134239' 
}: CasinoGameHeaderProps) {
  const [countdown, setCountdown] = useState({ minutes: 2, seconds: 6 })
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [useIframe, setUseIframe] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  // Fetch live stream URL
  useEffect(() => {
    const fetchStream = async () => {
      try {
        setIsLoading(true)
        setStreamError(null)
        
        // Use the same live TV API endpoint we created for cricket
        const response = await fetch(`/api/live-tv/stream/${streamingId}`)
        
        if (!response.ok) {
          throw new Error(`Stream API error: ${response.status}`)
        }
        
        const data = await response.json()
        
        if (data.streamUrl) {
          setStreamUrl(data.streamUrl)
          // Check if this is a casino game (iframe) or cricket game (HLS)
          setUseIframe(data.streamUrl.includes('casinostream.trovetown.co'))
          console.log('🎰 Stream URL fetched:', data.streamUrl, 'Use iframe:', data.streamUrl.includes('casinostream.trovetown.co'))
        } else {
          throw new Error('No stream URL in response')
        }
      } catch (error) {
        console.error('❌ Error fetching stream:', error)
        setStreamError('Failed to load stream')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStream()
  }, [streamingId])

  // Initialize HLS player
  const initializeHLS = useCallback((url: string) => {
    if (!videoRef.current) return

    // Destroy existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 10,
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      })

      hlsRef.current = hls

      hls.loadSource(url)
      hls.attachMedia(videoRef.current)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('🎰 Stream manifest parsed')
        if (videoRef.current) {
          videoRef.current.play().catch(console.error)
        }
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('🎰 HLS Error:', data)
        if (data.fatal) {
          setStreamError('Stream error occurred')
        }
      })

      hls.on(Hls.Events.MANIFEST_LOADING, (event: any, data: any) => {
        console.log('🎰 Stream manifest loading:', data)
      })
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Fallback for Safari
      videoRef.current.src = url
      videoRef.current.addEventListener('loadedmetadata', () => {
        videoRef.current?.play().catch(console.error)
      })
    } else {
      setStreamError('HLS not supported in this browser')
    }
  }, [])

  // Initialize stream when URL is available
  useEffect(() => {
    if (streamUrl && !streamError && !useIframe) {
      initializeHLS(streamUrl)
    }
  }, [streamUrl, streamError, useIframe, initializeHLS])

  // Cleanup HLS on unmount
  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }
    }
  }, [])

  // Handle retry
  const handleRetry = useCallback(async () => {
    setStreamError(null)
    setStreamUrl(null)
    
    try {
      setIsLoading(true)
      const response = await fetch(`/api/live-tv/stream/${streamingId}`)
      
      if (!response.ok) {
        throw new Error(`Stream API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.streamUrl) {
        setStreamUrl(data.streamUrl)
        setUseIframe(data.streamUrl.includes('casinostream.trovetown.co'))
        if (!data.streamUrl.includes('casinostream.trovetown.co')) {
          initializeHLS(data.streamUrl)
        }
      } else {
        throw new Error('No stream URL in response')
      }
    } catch (error) {
      console.error('❌ Retry failed:', error)
      setStreamError('Retry failed')
    } finally {
      setIsLoading(false)
    }
  }, [streamingId, initializeHLS])

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 }
        } else {
          // Reset countdown when it reaches 0
          return { minutes: 2, seconds: 6 }
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="sm:w-4xl w-[100%] mx-auto mt-2">
      {/* Back to Casino List Button */}
      <div>
        <Link href="/app/casino">
          <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold text-md p-3 border border-blue-400 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            BACK TO CASINO LIST
          </button>
        </Link>
      </div>

      {/* Game Header */}
      <div className="flex w-full flex-wrap align-items-center gap-1 justify-between bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-lg shadow-lg">
        <div className="">
          <h4 className="text-white font-bold md:text-[14px] text-[13px] uppercase">
            {gameName}
          </h4>
        </div>
        <div className="flex items-center text-white gap-2">
          <p className="text-white font-bold md:text-[13px] text-[12px] uppercase">
            Round ID: <span className="text-yellow-200">{roundId}</span>
          </p>
          <svg 
            className="cursor-pointer hover:text-yellow-200 transition-colors" 
            stroke="currentColor" 
            fill="currentColor" 
            strokeWidth="0" 
            viewBox="0 0 512 512" 
            height="1em" 
            width="1em" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm19 304h-38.2V207.9H275V352zm-19.1-159.8c-11.3 0-20.5-8.6-20.5-20s9.3-19.9 20.5-19.9c11.4 0 20.7 8.5 20.7 19.9s-9.3 20-20.7 20z"></path>
          </svg>
        </div>
      </div>

      {/* Video and Sidebar Container */}
      <div className="relative">
        <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex">
            {/* Video Player - HLS or Iframe */}
            <div className="mx-auto w-[80%] h-[250px] p-2">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-2"></div>
                    <p className="text-sm">Loading stream...</p>
                  </div>
                </div>
              ) : streamError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
                  <div className="text-center text-white">
                    <p className="text-sm mb-3">{streamError}</p>
                    <button
                      onClick={handleRetry}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm transition-colors"
                    >
                      Retry Stream
                    </button>
                  </div>
                </div>
              ) : useIframe && streamUrl ? (
                // Casino game - use iframe
                <iframe 
                  className="w-full h-full rounded-lg"
                  title={gameId}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen 
                  src={streamUrl}
                />
              ) : (
                // Cricket game - use HLS video player
                <video
                  ref={videoRef}
                  className="w-full h-full rounded-lg"
                  controls
                  autoPlay
                  muted
                  playsInline
                />
              )}
            </div>
          </div>

          {/* Player Information Sidebar */}
          <div className="heading-sidebar">
            <div className="absolute top-[5px] left-1 z-2">
              <div className="">
                <div className="w-full">
                  <div className="w-full px-2 lg:space-y-2 space-y-1">
                    <div className="bg-black bg-opacity-50 rounded-lg p-2">
                      <div className="font-bold uppercase tracking-tight text-[12px] text-white">
                        Player 8 :<span className="text-yellow-300 ml-1">Ready</span>
                      </div>
                      <div className="flex space-x-2 justify-start"></div>
                    </div>
                    <div className="bg-black bg-opacity-50 rounded-lg p-2">
                      <div className="font-bold uppercase tracking-tight text-[12px] text-white">
                        Player 9 :<span className="text-yellow-300 ml-1">Ready</span>
                      </div>
                      <div className="flex space-x-2 justify-start"></div>
                    </div>
                    <div className="bg-black bg-opacity-50 rounded-lg p-2">
                      <div className="font-bold uppercase tracking-tight text-[12px] text-white">
                        Player 10 :<span className="text-yellow-300 ml-1">Ready</span>
                      </div>
                      <div className="flex space-x-2 justify-start"></div>
                    </div>
                    <div className="bg-black bg-opacity-50 rounded-lg p-2">
                      <div className="font-bold uppercase tracking-tight text-[12px] text-white">
                        Player 11 :<span className="text-yellow-300 ml-1">Ready</span>
                      </div>
                      <div className="flex space-x-2 justify-start"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Countdown Timer Sidebar */}
          <div className="h-full md:w-[20%] sm:w-[25%] w-[150px] absolute top-0 right-0">
            <div className="absolute bottom-0 right-0">
              <div className="relative -right-[30px]" style={{ transform: 'scale(0.45)' }}>
                <div className="flip-countdown theme-dark size-medium">
                  <span className="flip-countdown-piece">
                    <span className="flip-countdown-card">
                      <span className="flip-countdown-card-sec one flip">
                        <span className="card__top">{countdown.minutes}</span>
                        <span className="card__bottom" data-value={countdown.minutes}></span>
                        <span className="card__bottom" data-value={countdown.minutes}></span>
                      </span>
                      <span className="flip-countdown-card-sec two flip">
                        <span className="card__top">{countdown.seconds}</span>
                        <span className="card__bottom" data-value={countdown.seconds}></span>
                        <span className="card__bottom" data-value={countdown.seconds}></span>
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full"></div>
      </div>
    </div>
  )
}
