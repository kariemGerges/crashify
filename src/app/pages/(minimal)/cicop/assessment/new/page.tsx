'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  'Basic Information',
  'Vehicle Details',
  'Customer Information',
  'Assessment Details',
  'Financial Information',
  'Damage Information',
  'Risk & Fraud',
  'Documents & Photos'
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<any>({
    // Basic Information
    claim_number: '',
    date_received: new Date().toISOString().split('T')[0],
    status: 'In Progress',
    client: '',
    insurer: '',
    
    // Vehicle Details
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    rego: '',
    vin: '',
    vehicle_type: '',
    
    // Customer Information
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_address: '',
    
    // Assessment Details
    assessment_type: 'Desktop',
    inspection_type: '',
    inspection_location: '',
    assessor_name: '',
    assessment_date: '',
    
    // Financial Information
    repairer_quote: '',
    crashify_assessed: '',
    total_actual_cost: '',
    
    // Damage Information
    damage_description: '',
    damage_severity: 'Medium',
    damage_location: '',
    labour_hours: '',
    
    // Risk & Fraud
    risk_level: 'Low',
    total_loss: false,
    
    // Repairer
    repairer_name: '',
    
    // Status
    workflow_stage: 'Received',
    priority: 'Normal',
    assigned_to: ''
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Calculate savings
      const savings = formData.repairer_quote && formData.crashify_assessed
        ? parseFloat(formData.repairer_quote) - parseFloat(formData.crashify_assessed)
        : 0;

      const response = await fetch('/api/cicop/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          savings
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create assessment');
      }

      const result = await response.json();
      setSuccess(`Assessment #${result.assessment_no} created successfully!`);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/pages/cicop/assessment/${result.assessment_no}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center gap-4">
            <Link
              href="/pages/cicop"
              className="p-2 bg-orange-500/20 border border-orange-500 rounded-lg hover:bg-orange-500/30 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white to-orange-500 bg-clip-text text-transparent">
                📝 New Assessment Entry
              </h1>
              <p className="text-slate-400 text-sm mt-1">Complete all sections to create a new assessment</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-xl text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-500/20 border border-green-500 rounded-xl text-green-400">
            ✅ {success}
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {SECTIONS.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSection(idx)}
              className={`px-6 py-3 rounded-xl font-semibold whitespace-nowrap transition-all ${
                activeSection === idx
                  ? 'bg-orange-500 text-white shadow-lg scale-105'
                  : 'bg-white/10 text-slate-400 hover:bg-white/15'
              }`}
            >
              {idx + 1}. {section}
            </button>
          ))}
        </div>

        {/* Form Sections */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/20">
          {activeSection === 0 && <BasicInformation formData={formData} onChange={handleChange} />}
          {activeSection === 1 && <VehicleDetails formData={formData} onChange={handleChange} />}
          {activeSection === 2 && <CustomerInformation formData={formData} onChange={handleChange} />}
          {activeSection === 3 && <AssessmentDetails formData={formData} onChange={handleChange} />}
          {activeSection === 4 && <FinancialInformation formData={formData} onChange={handleChange} />}
          {activeSection === 5 && <DamageInformation formData={formData} onChange={handleChange} />}
          {activeSection === 6 && <RiskAndFraud formData={formData} onChange={handleChange} />}
          {activeSection === 7 && <DocumentsAndPhotos formData={formData} onChange={handleChange} />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={() => setActiveSection(Math.min(SECTIONS.length - 1, activeSection + 1))}
            disabled={activeSection === SECTIONS.length - 1}
            className="px-6 py-3 bg-orange-500 rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// Section Components
function BasicInformation({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Claim Number *" required>
          <input
            type="text"
            value={formData.claim_number}
            onChange={(e) => onChange('claim_number', e.target.value)}
            className="form-input"
            required
          />
        </FormField>
        <FormField label="Date Received *" required>
          <input
            type="date"
            value={formData.date_received}
            onChange={(e) => onChange('date_received', e.target.value)}
            className="form-input"
            required
          />
        </FormField>
        <FormField label="Status">
          <select
            value={formData.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="form-input"
          >
            <option>In Progress</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>On Hold</option>
          </select>
        </FormField>
        <FormField label="Client">
          <input
            type="text"
            value={formData.client}
            onChange={(e) => onChange('client', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Insurer *" required>
          <input
            type="text"
            value={formData.insurer}
            onChange={(e) => onChange('insurer', e.target.value)}
            className="form-input"
            required
          />
        </FormField>
      </div>
    </div>
  );
}

function VehicleDetails({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Vehicle Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Make *" required>
          <input
            type="text"
            value={formData.vehicle_make}
            onChange={(e) => onChange('vehicle_make', e.target.value)}
            className="form-input"
            required
          />
        </FormField>
        <FormField label="Model *" required>
          <input
            type="text"
            value={formData.vehicle_model}
            onChange={(e) => onChange('vehicle_model', e.target.value)}
            className="form-input"
            required
          />
        </FormField>
        <FormField label="Year">
          <input
            type="number"
            value={formData.vehicle_year}
            onChange={(e) => onChange('vehicle_year', e.target.value)}
            className="form-input"
            min="1900"
            max="2030"
          />
        </FormField>
        <FormField label="Registration *" required>
          <input
            type="text"
            value={formData.rego}
            onChange={(e) => onChange('rego', e.target.value.toUpperCase())}
            className="form-input"
            required
          />
        </FormField>
        <FormField label="VIN">
          <input
            type="text"
            value={formData.vin}
            onChange={(e) => onChange('vin', e.target.value.toUpperCase())}
            className="form-input"
            maxLength={17}
          />
        </FormField>
        <FormField label="Vehicle Type">
          <select
            value={formData.vehicle_type}
            onChange={(e) => onChange('vehicle_type', e.target.value)}
            className="form-input"
          >
            <option value="">Select...</option>
            <option>Sedan</option>
            <option>SUV</option>
            <option>Hatchback</option>
            <option>Wagon</option>
            <option>Ute</option>
            <option>Van</option>
            <option>Truck</option>
            <option>Motorcycle</option>
          </select>
        </FormField>
      </div>
    </div>
  );
}

function CustomerInformation({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Customer Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Customer Name">
          <input
            type="text"
            value={formData.customer_name}
            onChange={(e) => onChange('customer_name', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Phone">
          <input
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => onChange('customer_phone', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Email">
          <input
            type="email"
            value={formData.customer_email}
            onChange={(e) => onChange('customer_email', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Address" className="col-span-2">
          <input
            type="text"
            value={formData.customer_address}
            onChange={(e) => onChange('customer_address', e.target.value)}
            className="form-input"
          />
        </FormField>
      </div>
    </div>
  );
}

function AssessmentDetails({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Assessment Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Assessment Type">
          <select
            value={formData.assessment_type}
            onChange={(e) => onChange('assessment_type', e.target.value)}
            className="form-input"
          >
            <option>Desktop</option>
            <option>On-site</option>
            <option>Mobile</option>
            <option>Workshop</option>
          </select>
        </FormField>
        <FormField label="Inspection Type">
          <input
            type="text"
            value={formData.inspection_type}
            onChange={(e) => onChange('inspection_type', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Inspection Location">
          <input
            type="text"
            value={formData.inspection_location}
            onChange={(e) => onChange('inspection_location', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Assessor Name">
          <input
            type="text"
            value={formData.assessor_name}
            onChange={(e) => onChange('assessor_name', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Assessment Date">
          <input
            type="date"
            value={formData.assessment_date}
            onChange={(e) => onChange('assessment_date', e.target.value)}
            className="form-input"
          />
        </FormField>
      </div>
    </div>
  );
}

function FinancialInformation({ formData, onChange }: any) {
  const savings = formData.repairer_quote && formData.crashify_assessed
    ? (parseFloat(formData.repairer_quote) - parseFloat(formData.crashify_assessed)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Financial Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Repairer Quote ($)">
          <input
            type="number"
            step="0.01"
            value={formData.repairer_quote}
            onChange={(e) => onChange('repairer_quote', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Crashify Assessed ($)">
          <input
            type="number"
            step="0.01"
            value={formData.crashify_assessed}
            onChange={(e) => onChange('crashify_assessed', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Total Actual Cost ($)">
          <input
            type="number"
            step="0.01"
            value={formData.total_actual_cost}
            onChange={(e) => onChange('total_actual_cost', e.target.value)}
            className="form-input"
          />
        </FormField>
        <div className="bg-green-500/10 border border-green-500 rounded-xl p-4">
          <div className="text-sm text-slate-400 mb-1">Calculated Savings</div>
          <div className="text-3xl font-extrabold text-green-400">${savings}</div>
        </div>
      </div>
    </div>
  );
}

function DamageInformation({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Damage Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Damage Description" className="col-span-2">
          <textarea
            value={formData.damage_description}
            onChange={(e) => onChange('damage_description', e.target.value)}
            className="form-input min-h-[100px]"
            rows={4}
          />
        </FormField>
        <FormField label="Damage Severity">
          <select
            value={formData.damage_severity}
            onChange={(e) => onChange('damage_severity', e.target.value)}
            className="form-input"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Severe</option>
          </select>
        </FormField>
        <FormField label="Damage Location">
          <input
            type="text"
            value={formData.damage_location}
            onChange={(e) => onChange('damage_location', e.target.value)}
            className="form-input"
            placeholder="e.g., Front bumper, Driver door"
          />
        </FormField>
        <FormField label="Labour Hours">
          <input
            type="number"
            step="0.5"
            value={formData.labour_hours}
            onChange={(e) => onChange('labour_hours', e.target.value)}
            className="form-input"
          />
        </FormField>
      </div>
    </div>
  );
}

function RiskAndFraud({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Risk & Fraud Assessment</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Risk Level">
          <select
            value={formData.risk_level}
            onChange={(e) => onChange('risk_level', e.target.value)}
            className="form-input"
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </FormField>
        <FormField label="Total Loss">
          <select
            value={formData.total_loss.toString()}
            onChange={(e) => onChange('total_loss', e.target.value === 'true')}
            className="form-input"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </FormField>
        <FormField label="Repairer Name">
          <input
            type="text"
            value={formData.repairer_name}
            onChange={(e) => onChange('repairer_name', e.target.value)}
            className="form-input"
          />
        </FormField>
        <FormField label="Workflow Stage">
          <select
            value={formData.workflow_stage}
            onChange={(e) => onChange('workflow_stage', e.target.value)}
            className="form-input"
          >
            <option>Received</option>
            <option>In Review</option>
            <option>Assessment Scheduled</option>
            <option>Assessment Complete</option>
            <option>Report Generated</option>
            <option>Sent to Client</option>
          </select>
        </FormField>
        <FormField label="Priority">
          <select
            value={formData.priority}
            onChange={(e) => onChange('priority', e.target.value)}
            className="form-input"
          >
            <option>Low</option>
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </FormField>
        <FormField label="Assigned To">
          <input
            type="text"
            value={formData.assigned_to}
            onChange={(e) => onChange('assigned_to', e.target.value)}
            className="form-input"
          />
        </FormField>
      </div>
    </div>
  );
}

function DocumentsAndPhotos({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">Documents & Photos</h2>
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg mb-4">📸 Photo & Document Upload</p>
        <p className="text-sm">Photo and document upload functionality will be available soon.</p>
        <p className="text-xs mt-2">For now, complete the assessment and add files later.</p>
      </div>
    </div>
  );
}

// Helper Components
function FormField({ label, required, children, className = '' }: any) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-400 mb-2">
        {label} {required && <span className="text-orange-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// Add global styles
const styles = `
  .form-input {
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;
    font-family: inherit;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #f97316;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
  }
  
  .form-input::placeholder {
    color: rgba(148, 163, 184, 0.7);
  }
  
  .form-input option {
    background: #0f172a;
    color: white;
  }
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
}
