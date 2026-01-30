'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Send, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

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

function NewAssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams?.get('from') === 'admin';
  const backHref = fromAdmin ? '/pages/admin?tab=dashboard' : '/pages/cicop';
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
      
      setTimeout(() => {
        const q = fromAdmin ? '?from=admin' : '';
        router.push(`/pages/cicop/assessment/${result.assessment_no}${q}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create assessment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white font-sans antialiased p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 rounded-xl border border-amber-500/20 bg-gray-900/50 p-6">
          <div className="flex items-center gap-4">
            <Link
              href={backHref}
              className="p-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-white">New Assessment Entry</h1>
              <p className="text-gray-500 text-sm mt-0.5">Complete all sections to create a new assessment</p>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl border border-red-500/50 bg-red-500/10 text-red-400 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 rounded-xl border border-green-500/50 bg-green-500/10 text-green-400">
            ✅ {success}
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {SECTIONS.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSection(idx)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeSection === idx
                  ? 'bg-gradient-to-r from-amber-500/20 to-red-600/20 text-amber-400 border border-amber-500/50'
                  : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {idx + 1}. {section}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-gray-900/50 p-8">
          {activeSection === 0 && <BasicInformation formData={formData} onChange={handleChange} />}
          {activeSection === 1 && <VehicleDetails formData={formData} onChange={handleChange} />}
          {activeSection === 2 && <CustomerInformation formData={formData} onChange={handleChange} />}
          {activeSection === 3 && <AssessmentDetails formData={formData} onChange={handleChange} />}
          {activeSection === 4 && <FinancialInformation formData={formData} onChange={handleChange} />}
          {activeSection === 5 && <DamageInformation formData={formData} onChange={handleChange} />}
          {activeSection === 6 && <RiskAndFraud formData={formData} onChange={handleChange} />}
          {activeSection === 7 && <DocumentsAndPhotos formData={formData} onChange={handleChange} />}
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            className="px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            ← Previous
          </button>
          <button
            onClick={() => setActiveSection(Math.min(SECTIONS.length - 1, activeSection + 1))}
            disabled={activeSection === SECTIONS.length - 1}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewAssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white flex items-center justify-center p-6">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    }>
      <NewAssessmentContent />
    </Suspense>
  );
}

// Section Components
function BasicInformation({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Basic Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Claim Number *" required>
          <input
            type="text"
            value={formData.claim_number}
            onChange={(e) => onChange('claim_number', e.target.value)}
            className="cicop-form-input"
            required
          />
        </FormField>
        <FormField label="Date Received *" required>
          <input
            type="date"
            value={formData.date_received}
            onChange={(e) => onChange('date_received', e.target.value)}
            className="cicop-form-input"
            required
          />
        </FormField>
        <FormField label="Status">
          <select
            value={formData.status}
            onChange={(e) => onChange('status', e.target.value)}
            className="cicop-form-input"
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
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Insurer *" required>
          <input
            type="text"
            value={formData.insurer}
            onChange={(e) => onChange('insurer', e.target.value)}
            className="cicop-form-input"
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
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Vehicle Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Make *" required>
          <input
            type="text"
            value={formData.vehicle_make}
            onChange={(e) => onChange('vehicle_make', e.target.value)}
            className="cicop-form-input"
            required
          />
        </FormField>
        <FormField label="Model *" required>
          <input
            type="text"
            value={formData.vehicle_model}
            onChange={(e) => onChange('vehicle_model', e.target.value)}
            className="cicop-form-input"
            required
          />
        </FormField>
        <FormField label="Year">
          <input
            type="number"
            value={formData.vehicle_year}
            onChange={(e) => onChange('vehicle_year', e.target.value)}
            className="cicop-form-input"
            min="1900"
            max="2030"
          />
        </FormField>
        <FormField label="Registration *" required>
          <input
            type="text"
            value={formData.rego}
            onChange={(e) => onChange('rego', e.target.value.toUpperCase())}
            className="cicop-form-input"
            required
          />
        </FormField>
        <FormField label="VIN">
          <input
            type="text"
            value={formData.vin}
            onChange={(e) => onChange('vin', e.target.value.toUpperCase())}
            className="cicop-form-input"
            maxLength={17}
          />
        </FormField>
        <FormField label="Vehicle Type">
          <select
            value={formData.vehicle_type}
            onChange={(e) => onChange('vehicle_type', e.target.value)}
            className="cicop-form-input"
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
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Customer Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Customer Name">
          <input
            type="text"
            value={formData.customer_name}
            onChange={(e) => onChange('customer_name', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Phone">
          <input
            type="tel"
            value={formData.customer_phone}
            onChange={(e) => onChange('customer_phone', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Email">
          <input
            type="email"
            value={formData.customer_email}
            onChange={(e) => onChange('customer_email', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Address" className="col-span-2">
          <input
            type="text"
            value={formData.customer_address}
            onChange={(e) => onChange('customer_address', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
      </div>
    </div>
  );
}

function AssessmentDetails({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Assessment Details</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Assessment Type">
          <select
            value={formData.assessment_type}
            onChange={(e) => onChange('assessment_type', e.target.value)}
            className="cicop-form-input"
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
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Inspection Location">
          <input
            type="text"
            value={formData.inspection_location}
            onChange={(e) => onChange('inspection_location', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Assessor Name">
          <input
            type="text"
            value={formData.assessor_name}
            onChange={(e) => onChange('assessor_name', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Assessment Date">
          <input
            type="date"
            value={formData.assessment_date}
            onChange={(e) => onChange('assessment_date', e.target.value)}
            className="cicop-form-input"
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
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Financial Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Repairer Quote ($)">
          <input
            type="number"
            step="0.01"
            value={formData.repairer_quote}
            onChange={(e) => onChange('repairer_quote', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Crashify Assessed ($)">
          <input
            type="number"
            step="0.01"
            value={formData.crashify_assessed}
            onChange={(e) => onChange('crashify_assessed', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Total Actual Cost ($)">
          <input
            type="number"
            step="0.01"
            value={formData.total_actual_cost}
            onChange={(e) => onChange('total_actual_cost', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Calculated Savings</div>
          <div className="text-2xl font-semibold text-amber-400 tabular-nums">${savings}</div>
        </div>
      </div>
    </div>
  );
}

function DamageInformation({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Damage Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Damage Description" className="col-span-2">
          <textarea
            value={formData.damage_description}
            onChange={(e) => onChange('damage_description', e.target.value)}
            className="cicop-form-input min-h-[100px]"
            rows={4}
          />
        </FormField>
        <FormField label="Damage Severity">
          <select
            value={formData.damage_severity}
            onChange={(e) => onChange('damage_severity', e.target.value)}
            className="cicop-form-input"
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
            className="cicop-form-input"
            placeholder="e.g., Front bumper, Driver door"
          />
        </FormField>
        <FormField label="Labour Hours">
          <input
            type="number"
            step="0.5"
            value={formData.labour_hours}
            onChange={(e) => onChange('labour_hours', e.target.value)}
            className="cicop-form-input"
          />
        </FormField>
      </div>
    </div>
  );
}

function RiskAndFraud({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Risk & Fraud Assessment</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FormField label="Risk Level">
          <select
            value={formData.risk_level}
            onChange={(e) => onChange('risk_level', e.target.value)}
            className="cicop-form-input"
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
            className="cicop-form-input"
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
            className="cicop-form-input"
          />
        </FormField>
        <FormField label="Workflow Stage">
          <select
            value={formData.workflow_stage}
            onChange={(e) => onChange('workflow_stage', e.target.value)}
            className="cicop-form-input"
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
            className="cicop-form-input"
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
            className="cicop-form-input"
          />
        </FormField>
      </div>
    </div>
  );
}

function DocumentsAndPhotos({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">Documents & Photos</h2>
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm mb-4">Photo & Document Upload</p>
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
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

// Admin-theme form inputs (Tailwind-compatible classes applied via global style for select/option)
const styles = `
  .cicop-form-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: rgb(31 41 55);
    border: 1px solid rgb(55 65 81);
    border-radius: 0.5rem;
    color: white;
    font-size: 0.875rem;
    font-family: inherit;
  }
  .cicop-form-input:focus {
    outline: none;
    border-color: rgb(245 158 11);
  }
  .cicop-form-input::placeholder {
    color: rgb(107 114 128);
  }
  .cicop-form-input option {
    background: rgb(17 24 39);
    color: white;
  }
`;

if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
}
