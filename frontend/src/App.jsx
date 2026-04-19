import { useState } from 'react'
import axios from 'axios'

function App() {
  const [empId, setEmpId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeEmployee = async () => {
    if (!empId) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Notice we are just sending the ID to the database now, no hardcoded metrics!
      const response = await axios.get(`http://127.0.0.1:8000/analyze-employee/${empId}`);
      setResult(response.data);
    } catch (err) {
      console.error("Error connecting to backend", err);
      setError(err.response?.data?.detail || "Failed to connect to server");
    }
    
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
        HR Predictive Analytics Dashboard
      </h1>
      <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
        Search the corporate database by Employee ID to run the AI attrition analysis.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <input 
          type="number" 
          placeholder="Enter Employee ID (e.g., 1)"
          value={empId} 
          onChange={(e) => setEmpId(e.target.value)}
          style={{ flex: 1, padding: '15px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '16px' }}
        />
        <button 
          onClick={analyzeEmployee} 
          disabled={loading}
          style={{ 
            backgroundColor: '#3498db', color: 'white', padding: '15px 30px', 
            border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' 
          }}
        >
          {loading ? 'Analyzing...' : 'Run Analysis'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: '#fadbd8', borderLeft: '5px solid #e74c3c' }}>
          <p style={{ color: '#c0392b', margin: 0, fontWeight: 'bold' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{ 
          marginTop: '20px', padding: '20px', borderRadius: '8px', 
          backgroundColor: result.ai_analysis.flight_risk_probability > 50 ? '#ffeaa7' : '#eafaf1',
          borderLeft: result.ai_analysis.flight_risk_probability > 50 ? '5px solid #d35400' : '5px solid #2ecc71'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{result.employee_name}</h2>
          <p style={{ margin: '5px 0', color: '#7f8c8d' }}>Department: {result.department}</p>
          <hr style={{ border: '0', borderTop: '1px solid #ccc', margin: '15px 0' }}/>
          <p style={{ fontSize: '18px', margin: '5px 0' }}>
            <strong>AI Status:</strong> {result.ai_analysis.status}
          </p>
          <p style={{ fontSize: '18px', margin: '5px 0' }}>
            <strong>Flight Risk Probability:</strong> {result.ai_analysis.flight_risk_probability}%
          </p>
          
          {/* THE NEW LLM STRATEGY BOX */}
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '1px solid #ddd' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2980b9' }}>💡 Generative AI Retention Strategy</h3>
            <div style={{ whiteSpace: 'pre-line', color: '#333', lineHeight: '1.5' }}>
              {result.ai_analysis.strategy}
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}

export default App