import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, LogOut, AlertTriangle, ShieldCheck, User, BrainCircuit, Users, Activity, BarChart2, DollarSign, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#ef4444', '#10b981'];

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('eagle'); 
  
  // Eagle View State
  const [companyData, setCompanyData] = useState({ total_headcount: 0, global_risk: 0, departments: [] });
  const [loadingEagle, setLoadingEagle] = useState(true);

  // Scanner State
  const [empId, setEmpId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // What-If State
  const [simSalary, setSimSalary] = useState(5000);

  useEffect(() => {
    if (activeTab === 'eagle') {
      fetchCompanyOverview();
    }
  }, [activeTab]);

  const fetchCompanyOverview = async () => {
    setLoadingEagle(true);
    try {
      const response = await axios.get('http://127.0.0.1:8000/company-overview');
      setCompanyData(response.data);
    } catch (err) {
      console.error("Failed to load company overview", err);
    }
    setLoadingEagle(false);
  };

  const analyzeEmployee = async () => {
    if (!empId) return;
    setLoading(true); 
    setError('');
    try {
      const response = await axios.get(`http://127.0.0.1:8000/analyze-employee/${empId}?role=admin`);
      setResult(response.data);
      setSimSalary(response.data.monthly_income || 5000);
    } catch (err) {
      setError("Employee not found in the database.");
      setResult(null);
    }
    setLoading(false);
  };

  // Dynamic Pie Chart based on real backend averages
  const riskPie = [
    { name: 'Average Risk', value: companyData.global_risk }, 
    { name: 'Safe Margin', value: 100 - companyData.global_risk }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Navbar */}
      <div className="max-w-7xl mx-auto flex justify-between items-center bg-white p-6 rounded-xl shadow-sm mb-8 border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg"><BrainCircuit className="text-white w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">HR Intelligence Hub</h1>
            <p className="text-sm text-slate-500">Admin Privileges Active • {user.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 font-semibold transition">
          <LogOut size={18} /> Logout
        </button>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tab Controls */}
        <div className="flex gap-4 mb-6 border-b border-slate-200 pb-4">
          <button onClick={() => setActiveTab('eagle')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'eagle' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Activity size={18} /> Company Eagle View
          </button>
          <button onClick={() => setActiveTab('scanner')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${activeTab === 'scanner' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Search size={18} /> Individual AI Scanner
          </button>
        </div>

        {/* TAB 1: EAGLE VIEW */}
        {activeTab === 'eagle' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {loadingEagle ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-slate-100">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { title: "Total Headcount", val: companyData.total_headcount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Global Attrition Risk", val: `${companyData.global_risk}%`, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
                    { title: "Retention Budget", val: "$120k", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
                    { title: "Models Deployed", val: "Random Forest", icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-50" }
                  ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className={`${kpi.bg} p-4 rounded-xl`}><kpi.icon className={`${kpi.color} w-6 h-6`} /></div>
                      <div><p className="text-sm text-slate-500 font-bold uppercase">{kpi.title}</p><p className="text-2xl font-black text-slate-800">{kpi.val}</p></div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><BarChart2 size={18}/> Average Attrition Risk by Department (%)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={companyData.departments}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="avgRisk" fill="#3b82f6" radius={[4,4,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-6">Company Risk Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={riskPie} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {riskPie.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: INDIVIDUAL SCANNER */}
        {activeTab === 'scanner' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Search Box */}
            <div className="col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Search size={18} /> Target Employee ID</h3>
                <input type="number" placeholder="Enter ID (e.g., 2)" value={empId} onChange={(e) => setEmpId(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none mb-4" />
                <button onClick={analyzeEmployee} disabled={loading} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 disabled:opacity-50 flex justify-center items-center gap-2">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Running Inference...</> : 'Analyze Flight Risk'}
                </button>
                {error && <p className="text-red-500 text-sm mt-3 font-semibold">{error}</p>}
              </div>
            </div>

            {/* AI Results */}
            <div className="col-span-2">
              {result ? (
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start mb-6 border-b pb-6 border-slate-100">
                    <div>
                      <h2 className="text-3xl font-black text-slate-800">{result.employee_name}</h2>
                      <p className="text-slate-500 text-lg mt-1 font-medium">{result.department} Department</p>
                    </div>
                    <div className={`flex flex-col items-end`}>
                      <div className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-lg border ${result.ai_analysis.flight_risk_probability > 50 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        {result.ai_analysis.flight_risk_probability > 50 ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
                        {result.ai_analysis.flight_risk_probability}% Flight Risk
                      </div>
                    </div>
                  </div>

                  {/* What-If Simulator */}
                  <div className="mb-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><DollarSign size={18}/> Counterfactual What-If Simulator</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-slate-600 mb-2">Simulate Salary Adjustment</label>
                        <input type="range" min="1000" max="15000" step="500" value={simSalary} onChange={(e) => setSimSalary(e.target.value)} className="w-full accent-slate-800" />
                        <p className="text-right text-sm font-black text-slate-800">${simSalary} / month</p>
                      </div>
                      <div className="flex items-end justify-end">
                        <button className="bg-slate-800 text-white font-bold px-6 py-2 rounded-lg hover:bg-slate-700 w-full h-10">Recalculate AI Risk</button>
                      </div>
                    </div>
                  </div>

                  {/* Markdown Gemini Strategy */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <h4 className="text-blue-800 font-black mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                      <BrainCircuit size={18} /> Gemini Generated Retention Strategy
                    </h4>
                    <div className="prose prose-blue max-w-none text-slate-700 text-lg leading-relaxed">
                      <ReactMarkdown>{result.ai_analysis.strategy}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white h-full p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <Search className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">System Ready</h3>
                  <p className="text-slate-500 mt-2">Enter an Employee ID to initiate the Predictive Attrition Model.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}