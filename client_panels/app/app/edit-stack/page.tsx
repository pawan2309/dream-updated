import Header from '../../../components/Header'

export default function EditStack() {
  return (
    <div className="min-h-dvh bg-white relative pt-[72px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Stack</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600">Stack editing interface will be implemented here.</p>
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold text-gray-800 mb-2">Stack Features:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Multiple Bet Combinations</li>
                <li>• Odds Calculation</li>
                <li>• Risk Management</li>
                <li>• Stack History</li>
                <li>• Performance Tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 