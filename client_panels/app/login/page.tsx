'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/hooks/useAuth'

export default function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { login, authenticated, user } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Client-side validation
    if (!formData.username.trim()) {
      setError('Please enter your username')
      setLoading(false)
      return
    }

    if (!formData.password.trim()) {
      setError('Please enter your password')
      setLoading(false)
      return
    }

    try {
      const result = await login(formData.username, formData.password)
      
      if (result.success) {
        setSuccess('Login successful! Redirecting...')
        // Force a page reload to ensure auth state is updated
        setTimeout(() => {
          window.location.href = '/app/dashboard'
        }, 1000)
      } else {
        setError(result.error || 'Login failed. Please try again.')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
         <div 
       className="h-dvh w-full light-bg flex items-center overflow-y-auto p-[12px]" 
               style={{
          backgroundImage: 'url("/images/login.png")',
          backgroundSize: '120%',
          backgroundPosition: 'center center'
        }}
     >
                                                               <div className="w-full max-w-[400px] px-6 py-8 ml-[10%] bg-blue-600 bg-opacity-90 rounded-lg shadow-lg">
         <div className="flex justify-center mb-2">
           <div className="relative">
             <div className="flex items-center justify-center mx-4 mb-3">
               <img className="w-[200px]" src="/images/2xbatlogo.png" alt="2XBAT Logo" />
             </div>
           </div>
         </div>
         
         <form className="space-y-5 mt-5 mx-auto" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-sm p-3">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-600 text-sm font-medium">{success}</p>
              </div>
            </div>
          )}
          
                     <div className="relative">
             <input
               id="username"
               className="w-full px-[16.5px] py-[14px] border text-black border-gray-300 rounded-sm focus:outline-none focus:ring-0 focus:border-gray-300 text-[16px] peer bg-white"
               type="text"
               name="username"
               value={formData.username}
               onChange={handleInputChange}
               required
             />
                         <label 
               htmlFor="username" 
               className={`absolute login-btn text-[#6b6b70] left-[2px] transition-all duration-200 pointer-events-none bg-white px-2 !text-[#6b6b70] ${
                 formData.username ? '-top-2 text-xs px-1' : 'top-4 text-base font-medium text-black'
               }`}
             >
               Client Code *
             </label>
          </div>
          
          <div className="relative">
            <input
              id="password"
              className="w-full px-[16.5px] py-[14px] border text-black border-gray-300 rounded-sm focus:outline-none focus:ring-0 focus:border-gray-300 text-lg bg-white"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
                         <label 
               htmlFor="password" 
               className={`absolute login-btn text-[#6b6b70] left-[2px] transition-all duration-200 pointer-events-none bg-white px-2 ${
                 formData.password ? '-top-2 text-xs px-1 text-[#6b6b70]' : 'top-4 text-base font-medium text-black'
               }`}
             >
               Password *
             </label>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full login-btn !bg-[#282a2b] !text-white !font-bold py-3 px-4 -mt-2 !rounded-sm transition-colors duration-200 !text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </button>
        </form>
        
                 <div className="mt-4 text-center">
           <p className="text-xs text-blue-200">
             Only client users can access this panel
           </p>
           <p className="text-xs text-blue-300 mt-1">
             Contact administrator for login credentials
           </p>
         </div>
      </div>
    </div>
  )
} 