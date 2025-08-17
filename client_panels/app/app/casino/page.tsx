'use client'

import { useState, useEffect } from 'react'
import Header from '../../../components/Header'
import Link from 'next/link'
import casinoService, { CasinoGame } from '../../../lib/casinoService'

export default function Casino() {
  const [casinoGames, setCasinoGames] = useState<CasinoGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Map game names to specific casino images
  const getGameImage = (gameName: string, index: number) => {
    const gameNameLower = gameName.toLowerCase();
    
    // Map specific game names to their respective images
    if (gameNameLower.includes('andar') && gameNameLower.includes('bahar')) {
      return '/images/ab20.png'; // Andar Bahar 20-20
    } else if (gameNameLower.includes('andar') || gameNameLower.includes('bahar')) {
      return '/images/ab.png'; // Andar Bahar
    } else if (gameNameLower.includes('teen') || gameNameLower.includes('patti')) {
      return '/images/teen patti.png'; // Teen Patti
    } else if (gameNameLower.includes('dragon') || gameNameLower.includes('tiger')) {
      return '/images/dt.png'; // Dragon Tiger
    } else if (gameNameLower.includes('32') || gameNameLower.includes('cards')) {
      return '/images/32cards.png'; // 32 Cards
    } else if (gameNameLower.includes('lucky') || gameNameLower.includes('7')) {
      return '/images/lucky7.png'; // Lucky 7
    } else if (gameNameLower.includes('baccarat') || gameNameLower.includes('bacara')) {
      return '/images/32cards.png'; // Baccarat games - use card image
    } else if (gameNameLower.includes('roulette') || gameNameLower.includes('ruleta')) {
      return '/images/lucky7.png'; // Roulette games - use wheel/luck image
    } else if (gameNameLower.includes('blackjack') || gameNameLower.includes('21')) {
      return '/images/32cards.png'; // Blackjack games - use card image
    } else if (gameNameLower.includes('poker') || gameNameLower.includes('texas')) {
      return '/images/32cards.png'; // Poker games - use card image
    } else if (gameNameLower.includes('slot') || gameNameLower.includes('fruit')) {
      return '/images/lucky7.png'; // Slot games - use luck image
    } else if (gameNameLower.includes('craps') || gameNameLower.includes('dice')) {
      return '/images/lucky7.png'; // Dice games - use luck image
    } else if (gameNameLower.includes('keno') || gameNameLower.includes('lottery')) {
      return '/images/lucky7.png'; // Number games - use luck image
    } else if (gameNameLower.includes('sic bo')) {
      return '/images/dt.png'; // Asian dice games - use dragon image
    } else {
      // Default fallback for other games - use appropriate casino image
      const fallbackImages = ['/images/32cards.png', '/images/ab.png', '/images/dt.png', '/images/lucky7.png'];
      return fallbackImages[index % fallbackImages.length];
    }
  };

  // Map short names to full descriptive names
  const getFullGameName = (shortName: string) => {
    // Map exact names from backend to full descriptive names
    switch (shortName) {
      case 'Teen20':
        return 'Teen Patti 20-20';
      case 'AB20':
        return 'Andar Bahar 20-20';
      case 'DT20':
        return 'Dragon Tiger 20-20';
      case 'Card32EU':
        return '32 Cards';
      case 'Lucky7EU':
        return 'Lucky 7';
      case 'AAA':
        return 'AAA';
      default:
        // Fallback for any other names
        if (shortName.toLowerCase().includes('teen')) return 'Teen Patti 20-20';
        if (shortName.toLowerCase().includes('ab')) return 'Andar Bahar 20-20';
        if (shortName.toLowerCase().includes('dt')) return 'Dragon Tiger 20-20';
        if (shortName.toLowerCase().includes('32') || shortName.toLowerCase().includes('card')) return '32 Cards';
        if (shortName.toLowerCase().includes('lucky') || shortName.toLowerCase().includes('7')) return 'Lucky 7';
        return shortName;
    }
  };

  useEffect(() => {
    fetchCasinoGames();
  }, []);

  const fetchCasinoGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await casinoService.getCasinoGames();
      
             if (response.success && response.data) {
         setCasinoGames(response.data);
         console.log('🎰 Casino games loaded:', response.data);
         // Debug: Log each game's name mapping
         response.data.forEach((game, index) => {
           console.log(`Game ${index + 1}:`, {
             originalName: game.name,
             fullName: getFullGameName(game.name),
             gameType: game.name === 'Teen20' ? 'Indian Poker' :
                       game.name === 'AB20' ? 'Card Game' :
                       game.name === 'DT20' ? 'Asian Card' :
                       game.name === 'Card32EU' ? 'Card Game' :
                       game.name === 'Lucky7EU' ? 'Luck Game' :
                       game.name === 'AAA' ? 'Live Casino' : 'Live Casino'
           });
         });
       } else {
        setError('Failed to load casino games');
      }
    } catch (err) {
      console.error('❌ Error loading casino games:', err);
      setError('Failed to load casino games');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchCasinoGames();
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
        <Header />
                 <div className="flex-1 p-2">
           <div className="max-w-4xl mx-auto">
             {/* Loading Content */}
             <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg">
               <div className="w-16 h-16 mx-auto mb-3">
                 <img
                   src="/images/32cards.png"
                   alt="Loading"
                   className="w-full h-full object-contain animate-pulse"
                 />
               </div>
               <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-yellow-400 mx-auto mb-3"></div>
               <h2 className="text-xl font-bold text-gray-800 mb-2">Loading Casino Games</h2>
               <p className="text-gray-600 text-sm font-medium">Preparing your gaming experience...</p>
               <div className="mt-4">
                                    <button
                     onClick={handleRefresh}
                     disabled={loading}
                     className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-lg opacity-50 cursor-not-allowed text-sm"
                   >
                     🔄 Loading...
                   </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
        <Header />
                 <div className="flex-1 p-2">
           <div className="max-w-4xl mx-auto">
             {/* Error Content */}
             <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-6 text-center shadow-lg">
               <div className="w-16 h-16 mx-auto mb-3">
                 <img
                   src="/images/dt.png"
                   alt="Error"
                   className="w-full h-full object-contain"
                 />
               </div>
               <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Games</h2>
               <div className="text-red-600 text-sm mb-3 font-medium">{error}</div>
                                <button
                   onClick={handleRefresh}
                   className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white font-bold rounded-lg hover:from-red-300 hover:to-red-500 transition-all duration-300 transform hover:scale-105 text-sm"
                 >
                   🔄 Try Again
                 </button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative pt-[60px]">
      <Header />
      <div className="flex-1 p-2">
                 <div className="max-w-4xl mx-auto">
          
          {/* Games Grid */}
                     {casinoGames.length === 0 ? (
             <div className="text-center py-12 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-lg">
               <div className="w-16 h-16 mx-auto mb-3">
                 <img
                   src="/images/lucky7.png"
                   alt="No Games"
                   className="w-full h-full object-contain"
                 />
               </div>
               <div className="text-gray-800 text-base mb-3 font-semibold">No casino games available</div>
               <button
                 onClick={handleRefresh}
                 className="px-5 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-bold rounded-lg hover:from-blue-300 hover:to-blue-500 transition-all duration-300"
               >
                 🔄 Refresh Games
               </button>
             </div>
           ) : (
                                                   <div className="grid grid-cols-3 gap-3">
               {casinoGames.map((game, index) => (
                 <div key={game.streamingId} className="group">
                   <Link href={`/app/game/${game.name.toLowerCase().replace(/\s+/g, '-')}`} className="block">
                     <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-xl overflow-hidden transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl border border-gray-200 shadow-lg">
                                               {/* Game Image - Square Aspect Ratio */}
                        <div className="relative w-full pt-[100%] overflow-hidden">
                          <img
                            alt={game.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            src={getGameImage(game.name, index)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-yellow-400 text-black px-6 py-3 rounded-full font-bold text-lg shadow-lg">
                              ▶ PLAY NOW
                            </div>
                          </div>
                        </div>
                      
                                                                     {/* Game Info */}
                                                 <div className="p-2 text-center">
                           <h3 
                             className="font-bold text-sm text-gray-800 mb-1 group-hover:text-yellow-600 transition-colors duration-300"
                           >
                             {getFullGameName(game.name)}
                           </h3>
                           <div className="text-gray-600 text-xs font-medium">
                             {game.name === 'Teen20' ? 'Indian Poker' :
                              game.name === 'AB20' ? 'Card Game' :
                              game.name === 'DT20' ? 'Asian Card' :
                              game.name === 'Card32EU' ? 'Card Game' :
                              game.name === 'Lucky7EU' ? 'Luck Game' :
                              game.name === 'AAA' ? 'Live Casino' :
                              'Live Casino'}
                           </div>
                         </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
          
          
        </div>
      </div>
    </div>
  )
} 