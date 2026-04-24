import { useState } from 'react';
import axios from 'axios';
import { UserPlus, ArrowLeft, Building2, ShieldAlert } from 'lucide-react';

export default function SignUpScreen({ onNavigate }) {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', age: '', gender: 'Male',
    marital_status: 'Single', education_field: 'Life Sciences', 
    distance_from_home: '', department: 'Sales', job_role: 'Sales Executive',
    job_level: '1', monthly_income: '', role: 'employee', admin_code: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Security Check for Admins
    if (formData.role === 'admin' && formData.admin_code !== 'NEXUS2026') {
      setError('Invalid HR Admin Invite Code.');
      setIsLoading(false);
      return;
    }

    try {
      await axios.post('http://127.0.0.1:8000/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        age: parseInt(formData.age),
        gender: formData.gender,
        marital_status: formData.marital_status,
        education_field: formData.education_field,
        distance_from_home: parseInt(formData.distance_from_home),
        job_role: formData.job_role,
        job_level: parseInt(formData.job_level),
        monthly_income: parseInt(formData.monthly_income)
      });
      alert(`Registration successful as ${formData.role.toUpperCase()}! You can now log in.`);
      onNavigate('login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Check inputs.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 py-12">
      <div className="bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        <div className="bg-slate-950 p-6 text-center border-b border-slate-700 relative">
          <button onClick={() => onNavigate('login')} className="absolute left-6 top-8 text-slate-400 hover:text-white flex items-center gap-2">
            <ArrowLeft size={18} /> Back to Login
          </button>
          <Building2 className="text-blue-500 w-12 h-12 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-white">System Onboarding</h2>
        </div>

        <div className="p-8">
          {error && <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm text-center mb-6">{error}</div>}

          <form onSubmit={handleSignUp} className="space-y-6">
            
            {/* ROLE SELECTION */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 space-y-4">
              <h3 className="text-white font-semibold">Account Type</h3>
              <div className="flex gap-4">
                <select name="role" onChange={handleChange} className="w-1/2 bg-slate-800 text-white border border-slate-600 rounded-lg p-3">
                  <option value="employee">Standard Employee</option>
                  <option value="admin">HR Administrator</option>
                </select>
                {formData.role === 'admin' && (
                  <div className="w-1/2 relative">
                    <ShieldAlert className="absolute left-3 top-3 text-red-400 w-5 h-5" />
                    <input type="password" name="admin_code" required placeholder="HR Invite Code (NEXUS2026)" onChange={handleChange} className="w-full bg-slate-800 text-white border border-red-500/50 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input type="text" name="name" required placeholder="Full Name" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                <input type="email" name="email" required placeholder="Corporate Email" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                <input type="password" name="password" required placeholder="Create Password" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" name="age" required placeholder="Age" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                  <input type="number" name="distance_from_home" required placeholder="Commute (Miles)" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                </div>
              </div>

              <div className="space-y-4">
                <select name="department" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3">
                  <option>Sales</option><option>Research & Development</option><option>Human Resources</option><option>IT</option>
                </select>
                <input type="text" name="job_role" required placeholder="Job Role" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" name="job_level" required placeholder="Level (1-5)" min="1" max="5" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                  <input type="number" name="monthly_income" required placeholder="Salary ($)" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select name="gender" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3"><option>Male</option><option>Female</option></select>
                  <select name="marital_status" onChange={handleChange} className="w-full bg-slate-900 text-white border border-slate-700 rounded-lg p-3"><option>Single</option><option>Married</option></select>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-lg mt-4 flex justify-center items-center gap-2">
              {isLoading ? 'Registering...' : 'Complete Onboarding'} <UserPlus className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}