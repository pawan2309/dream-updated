import Header from '../../../components/Header'

export default function Profile() {
  return (
    <div className="min-h-dvh bg-white relative pt-[72px]">
      <Header />
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h1>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Username</label>
                    <p className="text-gray-800">Pinki</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">User ID</label>
                    <p className="text-gray-800">C50002</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Account Type</label>
                    <p className="text-gray-800">Client</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <p className="text-green-600 font-semibold">Active</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Balance</label>
                    <p className="text-gray-800">0.00</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Member Since</label>
                    <p className="text-gray-800">2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 