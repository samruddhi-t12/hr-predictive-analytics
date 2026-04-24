import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, LogOut, Sparkles, Briefcase, TrendingUp, Settings, BarChart2, CheckCircle, Target, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ReactMarkdown from 'react-markdown';

// Mock Data for Employee Visualizations
const skillAllocation = [
  { name: 'Core Tasks', value: 60 },
  { name: 'Upskilling', value: 20 },
  { name: 'Mentorship', value: 10 },
  { name: 'Admin', value: 10 },
];
const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#94a3b8'];

const performanceHistory = [
  { year: '2023', rating: 3 },
  { year: '2024', rating: 4 },
  { year: '2025', rating: 4 },
  { year: '2026', rating: 5 },
];

export default function EmployeeDashboard({ user, onLogout }) {
  const [result, setResult] = useState(null);
  // DEFAULT TO ANALYTICS SO IT LOADS INSTANTLY
  const [activeTab, setActiveTab] = useState('analytics'); 
  const [isUpdating, setIsUpdating] = useState(false);

  const [pulseData, setPulseData] = useState({
    job_satisfaction: 3,
    environment_satisfaction: 3,
    over_time: 'No'
  });

  useEffect(() => {
    const loadMyData = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/analyze-employee/${user.user_id}?role=employee`);
        setResult(response.data);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    loadMyData();
  }, [user.user_id]);

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setIsUpdating(true);
    setTimeout(() => {
      setIsUpdating(false);
      alert("Pulse Profile Updated! The AI Mentor will use this fresh data for your next strategy.");
      setActiveTab('overview');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 text-slate-800">
      {/* Top Navbar - RENDERS INSTANTLY */}
      <div className="max-w-5xl mx-auto flex justify-between items-center bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl shadow-sm border border-blue-700">
            <User className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nexus Career Portal</h1>
            <p className="text-sm text-slate-500 font-medium">Welcome back, {user.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition font-semibold">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        
        {/* Tab Navigation - RENDERS INSTANTLY */}
        <div className="flex gap-4 mb-6 border-b border-slate-200 pb-4">
          <button 
            onClick={() => setActiveTab('analytics')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <BarChart2 size={18} /> My Analytics
          </button>
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Briefcase size={18} /> AI Career Roadmap
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'profile' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Settings size={18} /> Update Pulse Data
          </button>
        </div>

        {/* TAB 1: ANALYTICS (Instant Load) */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-6">Time & Skill Allocation</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={skillAllocation} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {skillAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-6">Annual Performance Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 5]} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="rating" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI OVERVIEW (Waits for Backend) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {result ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                     <div className="bg-indigo-50 p-3 rounded-lg"><Target className="text-indigo-600 w-6 h-6" /></div>
                     <div><p className="text-sm text-slate-500">Department</p><p className="text-xl font-bold">{result.department}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                     <div className="bg-green-50 p-3 rounded-lg"><CheckCircle className="text-green-600 w-6 h-6" /></div>
                     <div><p className="text-sm text-slate-500">Profile Status</p><p className="text-xl font-bold text-green-600">Active & Healthy</p></div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-xl shadow-xl overflow-hidden text-white border border-slate-800">
                  <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <Sparkles className="text-blue-300 w-6 h-6" />
                    <h3 className="text-xl font-bold">Generative AI Career Mentor</h3>
                  </div>
                  <div className="p-8">
                    <p className="text-blue-200 mb-6 flex items-center gap-2 font-medium">
                      <TrendingUp className="w-5 h-5" /> Based on your latest metrics, here is your personalized growth strategy:
                    </p>
                    <div className="bg-white/10 p-6 rounded-lg backdrop-blur-md border border-white/20">
                      {/* MAGIC HAPPENS HERE: ReactMarkdown parses the asterisks into clean lists/bold text */}
                      <div className="text-lg leading-relaxed prose prose-invert max-w-none">
                        <ReactMarkdown>{result.ai_analysis.strategy}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center h-64">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-slate-700">Connecting to Gemini AI...</h3>
                <p className="text-slate-500 mt-2">Analyzing your metrics to generate a personalized career roadmap.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: UPDATE PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Update Pulse Data</h2>
              <p className="text-slate-500 mb-8">Keep your metrics up to date so the AI Mentor can provide the most accurate career advice.</p>
              
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Job Satisfaction (1-4)</label>
                  <input type="range" min="1" max="4" value={pulseData.job_satisfaction} onChange={(e) => setPulseData({...pulseData, job_satisfaction: e.target.value})} className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                    <span>1 - Low</span><span>4 - High</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Environment Satisfaction (1-4)</label>
                  <input type="range" min="1" max="4" value={pulseData.environment_satisfaction} onChange={(e) => setPulseData({...pulseData, environment_satisfaction: e.target.value})} className="w-full accent-blue-600" />
                  <div className="flex justify-between text-xs text-slate-400 mt-1 font-medium">
                    <span>1 - Low</span><span>4 - High</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Are you currently working overtime?</label>
                  <select value={pulseData.over_time} onChange={(e) => setPulseData({...pulseData, over_time: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-600 outline-none">
                    <option value="Yes">Yes, taking on extra hours</option>
                    <option value="No">No, standard hours</option>
                  </select>
                </div>

                <button type="submit" disabled={isUpdating} className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-70">
                  {isUpdating ? 'Syncing to Database...' : 'Save & Recalculate Profile'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}