import Header from '../../../components/Header'

export default function Rules() {
  return (
    <div className="min-h-dvh bg-white relative">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Rules & Terms</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">General Rules</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• All bets are final once placed</li>
                  <li>• Minimum bet amount applies</li>
                  <li>• Maximum payout limits apply</li>
                  <li>• Age verification required (18+)</li>
                  <li>• Responsible gambling practices</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Sports Betting Rules</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Match must be completed for bets to be settled</li>
                  <li>• Abandoned matches result in void bets</li>
                  <li>• Live betting odds may change</li>
                  <li>• Multiple bets have different rules</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Casino Rules</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Games are for entertainment purposes</li>
                  <li>• Random number generators ensure fairness</li>
                  <li>• Wagering requirements apply to bonuses</li>
                  <li>• Maximum bet limits per game</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 