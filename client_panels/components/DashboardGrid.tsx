'use client'

import Link from 'next/link'

export default function DashboardGrid() {
  const menuItems = [
    {
      title: 'IN PLAY',
      subtitle: 'LIVE SPORTS',
      description: 'CRICKET SOCCER',
      href: '/app/inplay',
      gif: '/images/1.gif'
    },
    {
      title: 'CASINO',
      subtitle: 'LIVE CASINO',
      description: '',
      href: '/app/casino',
      gif: '/images/indian-casino.gif?v=2'
    },
    {
      title: 'MY LEDGER',
      subtitle: 'MY LEDGER',
      description: '',
      href: '/app/ledger',
      gif: '/images/3.gif'
    },
    {
      title: 'PROFILE',
      subtitle: 'MY PROFILE',
      description: 'MY DETAILS',
      href: '/app/profile',
      gif: '/images/4.gif'
    },
    {
      title: 'PASSWORD',
      subtitle: 'PASSWORD',
      description: '',
      href: '/app/change-password',
      gif: '/images/5.gif'
    },
    {
      title: 'PASSBOOK',
      subtitle: 'PASSBOOK',
      description: '',
      href: '/app/client-Statement',
      gif: '/images/6.gif'
    }
  ]

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto p-4">
      {/* Main Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {menuItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <Link href={item.href}>
              <button className="w-[150px] h-[150px] rounded-full bg-blue-900 border-2 border-blue-800 relative overflow-hidden flex flex-col items-center justify-center text-white hover:bg-blue-800 transition-colors">
                
                {/* ✅ GIF Image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={item.gif}
                    alt={item.title}
                    className="w-[120px] h-[120px] object-cover rounded-full"
                  />
                </div>

              </button>
            </Link>
            <span className="text-gray-800 text-sm font-bold mt-2 text-center">
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
} 