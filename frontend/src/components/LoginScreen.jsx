import { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, Building2, ArrowRight } from 'lucide-react';

export default function LoginScreen({ onLogin, onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.post('http://127.0.0.1:8000/login', { email, password });
      onLogin(res.data);
    } catch (err) {
      setError('Invalid corporate credentials');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="bg-slate-950 p-8 text-center border-b border-slate-700">
          <div className="bg-blue-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="text-blue-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Nexus HR Hub</h2>
          <p className="text-slate-400 text-sm mt-2">Enterprise Intelligence Platform</p>
        </div>

        <div className="p-8">
          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm text-center mb-6 border border-red-500/20">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Corporate Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="admin@company.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-70">
              {isLoading ? 'Authenticating...' : 'Secure Login'} {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button onClick={() => onNavigate('signup')} className="text-slate-400 hover:text-white text-sm transition">
              New Employee? <span className="text-blue-500 font-semibold underline">Register Here</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}