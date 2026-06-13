import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, LogOut, AlertTriangle, ShieldCheck, User, BrainCircuit, Users, Activity, BarChart2, DollarSign, Loader2, Network, Upload, FileText, Zap, ShieldAlert } from 'lucide-react';
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
  
  // Batch Processing State
  const [batchFile, setBatchFile] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');

  // Diagnostics & Health State
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'eagle') fetchCompanyOverview();
    if (activeTab === 'diagnostics') fetchModelHealth();
  }, [activeTab]);

  const fetchCompanyOverview = async () => {
    setLoadingEagle(true);
    try {
      const response = await axios.get('https://hr-predictive-analytics.onrender.com/company-overview');
      setCompanyData(response.data);
    } catch (err) {
      console.error("Failed to load company overview", err);
    }
    setLoadingEagle(false);
  };

  const fetchModelHealth = async () => {
    setHealthLoading(true);
    try {
      const response = await axios.get('https://hr-predictive-analytics.onrender.com/model-health');
      setHealthData(response.data);
    } catch (err) {
      console.error("Failed to fetch model health", err);
    }
    setHealthLoading(false);
  };

  const analyzeEmployee = async () => {
    if (!empId) return;
    setLoading(true); 
    setError('');
    try {
      const response = await axios.get(`https://hr-predictive-analytics.onrender.com/analyze-employee/${empId}?role=admin`);
      setResult(response.data);
    } catch (err) {
      setError("Employee not found in the database.");
      setResult(null);
    }
    setLoading(false);
  };

  const handleBatchUpload = async (e) => {
    e.preventDefault();
    if (!batchFile) {
      setBatchError("Please select a CSV file to upload.");
      return;
    }
    setBatchLoading(true);
    setBatchError('');
    setBatchResults(null);

    const formData = new FormData();
    formData.append("file", batchFile);

    try {
      const response = await axios.post('https://hr-predictive-analytics.onrender.com/batch-predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchResults(response.data);
    } catch (err) {
      setBatchError(err.response?.data?.detail || "Failed to process batch file. Check format.");
    }
    setBatchLoading(false);
  };

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
        <div className="flex gap-4 mb-6 border-b border-slate-200 pb-4 overflow-x-auto">
          <button onClick={() => setActiveTab('eagle')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'eagle' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Activity size={18} /> Company Eagle View
          </button>
          <button onClick={() => setActiveTab('scanner')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'scanner' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Search size={18} /> Individual AI Scanner
          </button>
          <button onClick={() => setActiveTab('batch')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'batch' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Upload size={18} /> Enterprise Batch Sync
          </button>
          <button onClick={() => setActiveTab('diagnostics')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all whitespace-nowrap ${activeTab === 'diagnostics' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-200'}`}>
            <Network size={18} /> Model Diagnostics
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { title: "Total Headcount", val: companyData.total_headcount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Global Attrition Risk", val: `${companyData.global_risk}%`, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
                    { title: "Retention Budget", val: "$120k", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
                    { title: "Model Deployed", val: "Logistic Reg.", icon: BrainCircuit, color: "text-purple-600", bg: "bg-purple-50" }
                  ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                      <div className={`${kpi.bg} p-4 rounded-xl`}><kpi.icon className={`${kpi.color} w-6 h-6`} /></div>
                      <div><p className="text-sm text-slate-500 font-bold uppercase">{kpi.title}</p><p className="text-2xl font-black text-slate-800">{kpi.val}</p></div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><BarChart2 size={18}/> Average Attrition Risk by Department (%)</h3>
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
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
                    <div style={{ width: '100%', height: 250 }}>
                      <ResponsiveContainer>
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
            <div className="col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Search size={18} /> Target Employee ID</h3>
                <input type="number" placeholder="Enter ID (e.g., 622)" value={empId} onChange={(e) => setEmpId(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none mb-4" />
                <button onClick={analyzeEmployee} disabled={loading} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-700 disabled:opacity-50 flex justify-center items-center gap-2">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Running Inference...</> : 'Analyze Flight Risk'}
                </button>
                {error && <p className="text-red-500 text-sm mt-3 font-semibold">{error}</p>}
              </div>
            </div>

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

                  {result.ai_analysis.top_drivers && (
                    <div className="mb-6 grid grid-cols-3 gap-4">
                      {result.ai_analysis.top_drivers.map((driver, idx) => (
                        <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p className="text-xs text-slate-500 font-bold uppercase mb-1">Risk Driver {idx + 1}</p>
                          <p className="font-semibold text-slate-800 truncate" title={driver.feature_name}>{driver.feature_name}</p>
                        </div>
                      ))}
                    </div>
                  )}

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

        {/* TAB 3: ENTERPRISE BATCH SYNC */}
        {activeTab === 'batch' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Upload size={18} /> Upload Roster (CSV)</h3>
                <p className="text-sm text-slate-500 mb-6">Process up to 10,000 employee records simultaneously through the AI pipeline.</p>
                
                <form onSubmit={handleBatchUpload}>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center mb-4 bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={(e) => setBatchFile(e.target.files[0])} 
                      className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 w-full cursor-pointer"
                    />
                  </div>
                  
                  <button type="submit" disabled={batchLoading || !batchFile} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-500 disabled:opacity-50 flex justify-center items-center gap-2 transition">
                    {batchLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Vectorizing Data...</> : 'Initiate Batch Inference'}
                  </button>
                </form>
                {batchError && <p className="text-red-500 text-sm mt-3 font-semibold text-center">{batchError}</p>}
              </div>
            </div>

            <div className="col-span-2">
              {batchResults ? (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-black text-slate-800">Batch Analysis Complete</h2>
                      <p className="text-slate-500 font-medium">Processed {batchResults.total_records_processed} records in memory.</p>
                    </div>
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                      <AlertTriangle size={18} /> {batchResults.critical_flight_risks} Critical Risks Detected
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-[600px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-slate-50 shadow-sm">
                        <tr className="text-slate-600 text-sm border-b border-slate-200">
                          <th className="p-4 font-bold">Employee ID</th>
                          <th className="p-4 font-bold">Department</th>
                          <th className="p-4 font-bold">Flight Risk Score</th>
                          <th className="p-4 font-bold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResults.actionable_targets.map((employee, idx) => (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="p-4 font-semibold text-slate-800">#{employee.employee_id}</td>
                            <td className="p-4 text-slate-600">{employee.department}</td>
                            <td className="p-4">
                              <span className="bg-red-50 text-red-700 font-bold px-3 py-1 rounded-full text-sm border border-red-200">
                                {employee.flight_risk_probability}%
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button onClick={() => { setActiveTab('scanner'); setEmpId(employee.employee_id); }} className="text-indigo-600 font-bold hover:text-indigo-800 text-sm">
                                Run Deep Scan
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 h-full p-8 rounded-xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center">
                  <Upload className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">Awaiting Data Payload</h3>
                  <p className="text-slate-500 mt-2 max-w-md">Upload a CSV file containing employee features to rapidly identify high-priority flight risks across your organization.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MODEL DIAGNOSTICS */}
        {activeTab === 'diagnostics' && (
          <div className="animate-in fade-in duration-500 space-y-6">
            
            {/* NEW OBSERVABILITY PANEL */}
            <div className="bg-slate-900 p-8 rounded-xl shadow-lg border border-slate-800 text-white">
              <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                <div>
                  <h2 className="text-2xl font-black flex items-center gap-2"><Zap className="text-yellow-400" /> Live Production Telemetry</h2>
                  <p className="text-slate-400 mt-1">Real-time monitoring of inference latency and statistical data drift.</p>
                </div>
                {healthLoading ? <Loader2 className="animate-spin text-slate-400" /> : (
                   <button onClick={fetchModelHealth} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition">Refresh Logs</button>
                )}
              </div>

              {healthData && healthData.telemetry ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-sm font-bold text-slate-400 uppercase">Inferences Served</p>
                    <p className="text-3xl font-black mt-2">{healthData.telemetry.total_inferences_served}</p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-sm font-bold text-slate-400 uppercase">Avg Latency</p>
                    <p className="text-3xl font-black mt-2">{healthData.telemetry.average_latency_ms} <span className="text-lg text-slate-500">ms</span></p>
                  </div>
                  <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-sm font-bold text-slate-400 uppercase">P99 Latency</p>
                    <p className="text-3xl font-black mt-2 text-yellow-400">{healthData.telemetry.p99_latency_ms} <span className="text-lg text-yellow-600">ms</span></p>
                  </div>
                  <div className={`p-6 rounded-xl border ${healthData.drift_monitoring.drift_detected ? 'bg-red-900/30 border-red-500' : 'bg-green-900/20 border-green-500/30'}`}>
                    <p className={`text-sm font-bold uppercase ${healthData.drift_monitoring.drift_detected ? 'text-red-400' : 'text-green-400'}`}>Drift Status</p>
                    <div className="mt-2 flex items-center gap-2">
                       {healthData.drift_monitoring.drift_detected ? <ShieldAlert className="text-red-400" size={28}/> : <ShieldCheck className="text-green-400" size={28} />}
                       <p className={`text-xl font-black ${healthData.drift_monitoring.drift_detected ? 'text-red-400' : 'text-green-400'}`}>
                         {healthData.drift_monitoring.drift_detected ? 'DRIFT DETECTED' : 'NOMINAL'}
                       </p>
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="text-slate-500 text-center py-8">Awaiting initial inference traffic to generate telemetry logs.</div>
              )}
            </div>

            {/* STATIC ARCHITECTURE PANEL */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 mt-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Training Methodology & Architecture</h2>
                  <p className="text-slate-500 mt-1">Algorithm Selection: Logistic Regression vs Ensemble Methods</p>
                </div>
              </div>

              <p className="text-slate-600 mb-8 max-w-4xl">
                The IBM HR Attrition dataset contains a heavy class imbalance. Standard models optimize for raw accuracy by predicting the majority class (retention) and missing the actual flight risks. During the training pipeline, we evaluated Logistic Regression, Random Forest, and XGBoost. 
                <br/><br/>
                <b>Logistic Regression with balanced class weights</b> was specifically selected as the deployment model. While Random Forest achieved higher overall accuracy (87.41%), its Recall was exceptionally poor (7.69%), rendering it useless for HR interventions. Logistic Regression yielded the highest F1-Score (0.36) and a massive jump in Recall (58.97%), making it the superior algorithm for identifying hidden attrition risks.
              </p>

              <div className="overflow-x-auto rounded-lg border border-slate-200 mb-8">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                      <th className="p-4 font-bold">Algorithm Evaluated</th>
                      <th className="p-4 font-bold">Accuracy</th>
                      <th className="p-4 font-bold">Precision</th>
                      <th className="p-4 font-bold">Recall (Key Metric)</th>
                      <th className="p-4 font-bold">F1-Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 hover:bg-indigo-50/50 transition">
                      <td className="p-4 font-bold text-indigo-700 flex items-center gap-2">Logistic Regression <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider">Deployed</span></td>
                      <td className="p-4 text-slate-700 font-semibold">71.77%</td>
                      <td className="p-4 text-slate-700 font-semibold">25.56%</td>
                      <td className="p-4 text-indigo-700 font-black">58.97%</td>
                      <td className="p-4 text-indigo-700 font-black">0.36</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-800">XGBoost (scale_pos_weight=5)</td>
                      <td className="p-4 text-slate-600">85.37%</td>
                      <td className="p-4 text-slate-600">42.31%</td>
                      <td className="p-4 text-slate-600">28.21%</td>
                      <td className="p-4 text-slate-600">0.34</td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-800">Random Forest (balanced)</td>
                      <td className="p-4 text-slate-600">87.41%</td>
                      <td className="p-4 text-slate-600">75.00%</td>
                      <td className="p-4 text-red-500 font-semibold">7.69%</td>
                      <td className="p-4 text-red-500 font-semibold">0.14</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-slate-700 mb-4">Explainable AI (SHAP) Integration</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Nexus HR utilizes a Permutation Explainer from the SHAP (SHapley Additive exPlanations) library. Instead of a "black box" prediction, the explainer calculates the marginal contribution of every single feature (Age, Overtime, Distance From Home) to the final probability score for that specific employee. This mathematical driver array is then passed to Gemini to generate context-aware retention strategies.
                  </p>
                </div>
                <div className="bg-slate-800 rounded-xl p-6 text-white font-mono text-sm overflow-x-auto shadow-inner border border-slate-700">
                  <p className="text-slate-400 mb-2"># Live Pipeline Initialization Log</p>
                  <p className="text-green-400">Loading ML assets from /ml_engine directory...</p>
                  <p className="text-slate-300 mt-2">[OK] attrition_model.pkl (82kb) loaded into memory.</p>
                  <p className="text-slate-300">[OK] scaler.pkl (4kb) loaded into memory.</p>
                  <p className="text-slate-300">[OK] shap_explainer.pkl (1.2mb) initialized.</p>
                  <p className="text-slate-300">[OK] model_features.pkl array validated.</p>
                  <p className="text-blue-400 mt-2">Lifespan context manager ready. Awaiting inference calls...</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}