'use client'

import Header from '../../../components/Header'
import Link from 'next/link'

type CasinoGame = {
  id: string
  name: string
  image: string
  href: string
}

export default function Casino() {
  const casinoGames: CasinoGame[] = [
    {
      id: 'teenpatti-t20',
      name: 'TeenPatti T-20',
      image: '/images/teenpatti-t201ex99.png',
      href: '/app/casino/twenty-twenty-teenpatti/3030'
    },
    {
      id: 'dragon-tiger',
      name: 'Dragon Tiger',
      image: '/images/dragon-tiger1ex99.png',
      href: '/app/casino/dragon-tiger/3035'
    },
    {
      id: 'lucky-7',
      name: 'Lucky 7',
      image: '/images/lucky-seven1ex99.png',
      href: '/app/casino/lucky-7/3032'
    },
    {
      id: 'aaa',
      name: 'AAA',
      image: '/images/aaa1ex99.png',
      href: '/app/casino/aaa/3056'
    },
    {
      id: 'dragon-tiger-2',
      name: 'Dragon Tiger 2',
      image: '/images/dragon-tiger-21ex99.png',
      href: '/app/casino/dt202/3059'
    },
    {
      id: 'worli-matka',
      name: 'Worli Matka',
      image: '/images/worli-matka1ex99.png',
      href: '/app/casino/worli-matka/3054'
    },
    {
      id: 'teenpatti-oneday',
      name: 'TeenPatti One-day',
      image: '/images/teenpatti-oneday1ex99.png',
      href: '/app/casino/teenpatti-oneday/3031'
    },
    {
      id: 'teenpatti-test',
      name: 'TeenPatti Test',
      image: '/images/teenpatti-test1ex99.png',
      href: '/app/casino/teenpatti-test/3048'
    },
    {
      id: '32-card-a',
      name: '32 Card A',
      image: '/images/32-card-a1ex99.png',
      href: '/app/casino/thirty-two-card-a/3055'
    },
    {
      id: '32-card-b',
      name: '32 Card B',
      image: '/images/32-card-b1ex99.png',
      href: '/app/casino/thirty-two-card-b/3034'
    }
  ]

  return (
    <div className="min-h-dvh bg-white relative">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Casino Games</h1>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mt-2">
            {casinoGames.map((game) => (
              <div key={game.id} className="text-center mt-2">
                <Link href={game.href} className="text-dark block">
                  <img
                    alt={game.name}
                    className="w-full max-h-[100px] card_3d object-fill"
                    src={game.image}
                  />
                  <b 
                    className="underline uppercase block mt-2"
                    style={{ color: 'rgb(210, 164, 60)' }}
                  >
                    {game.name}
                  </b>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 