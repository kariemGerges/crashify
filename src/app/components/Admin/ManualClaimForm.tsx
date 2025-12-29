// Complete manual claim form component with all fields matching customer form
import React from 'react';
import { Loader2, Plus, X } from 'lucide-react';

interface FormData {
    companyName: string;
    yourName: string;
    yourEmail: string;
    yourPhone: string;
    yourRole: string;
    department: string;
    assessmentType: 'Desktop Assessment' | 'Onsite Assessment';
    claimReference: string;
    policyNumber: string;
    incidentDate: string;
    incidentLocation: string;
    vehicleType: string;
    year: string;
    make: string;
    model: string;
    registration: string;
    vin: string;
    color: string;
    odometer: string;
    insuranceValueType: string;
    insuranceValueAmount: string;
    ownerFirstName: string;
    ownerLastName: string;
    ownerEmail: string;
    ownerMobile: string;
    ownerAltPhone: string;
    ownerAddress: string;
    onsiteLocationType: string;
    locationName: string;
    streetAddress: string;
    suburb: string;
    state: string;
    postcode: string;
    locationContactName: string;
    locationPhone: string;
    locationEmail: string;
    preferredDate: string;
    preferredTime: string;
    accessInstructions: string;
    incidentDescription: string;
    damageAreas: string[];
    specialInstructions: string;
    internalNotes: string;
    authorityConfirmed: boolean;
    privacyConsent: boolean;
    emailReportConsent: boolean;
    smsUpdates: boolean;
}

interface ManualClaimFormProps {
    formData: FormData;
    setFormData: React.Dispatch<React.SetStateAction<FormData>>;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitting: boolean;
    handleDamageAreasChange: (area: string) => void;
}

export const ManualClaimForm: React.FC<ManualClaimFormProps> = ({
    formData,
    setFormData,
    onSubmit,
    onCancel,
    submitting,
    handleDamageAreasChange,
}) => {
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Section 1: Requestor Information */}
            <div className="border-b border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                    Section 1: Requestor Information
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.companyName}
                            onChange={e =>
                                setFormData({ ...formData, companyName: e.target.value })
                            }
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            placeholder="Insurance company or fleet name"
                        />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Your Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.yourName}
                                onChange={e =>
                                    setFormData({ ...formData, yourName: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Your Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.yourEmail}
                                onChange={e =>
                                    setFormData({ ...formData, yourEmail: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Your Phone <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                required
                                value={formData.yourPhone}
                                onChange={e =>
                                    setFormData({ ...formData, yourPhone: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                placeholder="04XX XXX XXX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Your Role/Position
                            </label>
                            <input
                                type="text"
                                value={formData.yourRole}
                                onChange={e =>
                                    setFormData({ ...formData, yourRole: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                placeholder="e.g., Claims Assessor"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Department
                        </label>
                        <input
                            type="text"
                            value={formData.department}
                            onChange={e =>
                                setFormData({ ...formData, department: e.target.value })
                            }
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            placeholder="e.g., Claims, Fleet Operations"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Claim Information */}
            <div className="border-b border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                    Section 2: Claim Information
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Assessment Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={formData.assessmentType}
                            onChange={e =>
                                setFormData({
                                    ...formData,
                                    assessmentType: e.target.value as 'Desktop Assessment' | 'Onsite Assessment',
                                })
                            }
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                        >
                            <option value="Desktop Assessment">Desktop Assessment</option>
                            <option value="Onsite Assessment">Onsite Assessment</option>
                        </select>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Your Claim/Job Reference
                            </label>
                            <input
                                type="text"
                                value={formData.claimReference}
                                onChange={e =>
                                    setFormData({ ...formData, claimReference: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Insurance Policy Number
                            </label>
                            <input
                                type="text"
                                value={formData.policyNumber}
                                onChange={e =>
                                    setFormData({ ...formData, policyNumber: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Date of Incident
                            </label>
                            <input
                                type="date"
                                value={formData.incidentDate}
                                onChange={e =>
                                    setFormData({ ...formData, incidentDate: e.target.value })
                                }
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Location of Incident
                            </label>
                            <input
                                type="text"
                                value={formData.incidentLocation}
                                onChange={e =>
                                    setFormData({ ...formData, incidentLocation: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                placeholder="Suburb, State"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Vehicle Information */}
            <div className="border-b border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                    Section 3: Vehicle Information
                </h4>
                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Vehicle Type
                            </label>
                            <select
                                value={formData.vehicleType}
                                onChange={e =>
                                    setFormData({ ...formData, vehicleType: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Select type...</option>
                                <option value="Light Vehicle">Light Vehicle</option>
                                <option value="Commercial Vehicle">Commercial Vehicle</option>
                                <option value="Motorcycle">Motorcycle</option>
                                <option value="Heavy Vehicle">Heavy Vehicle</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Year
                            </label>
                            <input
                                type="number"
                                value={formData.year}
                                onChange={e =>
                                    setFormData({ ...formData, year: e.target.value })
                                }
                                min="1900"
                                max="2026"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                placeholder="YYYY"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Make <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.make}
                                onChange={e =>
                                    setFormData({ ...formData, make: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Model <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.model}
                                onChange={e =>
                                    setFormData({ ...formData, model: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Registration
                            </label>
                            <input
                                type="text"
                                value={formData.registration}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        registration: e.target.value.toUpperCase(),
                                    })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                VIN
                            </label>
                            <input
                                type="text"
                                value={formData.vin}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        vin: e.target.value.toUpperCase(),
                                    })
                                }
                                maxLength={17}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500 uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Color
                            </label>
                            <input
                                type="text"
                                value={formData.color}
                                onChange={e =>
                                    setFormData({ ...formData, color: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Odometer (km)
                            </label>
                            <input
                                type="number"
                                value={formData.odometer}
                                onChange={e =>
                                    setFormData({ ...formData, odometer: e.target.value })
                                }
                                min="0"
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Insurance Value Type
                            </label>
                            <select
                                value={formData.insuranceValueType}
                                onChange={e =>
                                    setFormData({ ...formData, insuranceValueType: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Select type...</option>
                                <option value="Market Value">Market Value</option>
                                <option value="Agreed Value">Agreed Value</option>
                                <option value="Replacement Value">Replacement Value</option>
                                <option value="Unknown">Unknown</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Insurance Value Amount
                            </label>
                            <input
                                type="text"
                                value={formData.insuranceValueAmount}
                                onChange={e =>
                                    setFormData({ ...formData, insuranceValueAmount: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                placeholder="$XX,XXX"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 4: Vehicle Owner Details */}
            <div className="border-b border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                    Section 4: Vehicle Owner Details (Optional)
                </h4>
                <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Owner First Name
                            </label>
                            <input
                                type="text"
                                value={formData.ownerFirstName}
                                onChange={e =>
                                    setFormData({ ...formData, ownerFirstName: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Owner Last Name
                            </label>
                            <input
                                type="text"
                                value={formData.ownerLastName}
                                onChange={e =>
                                    setFormData({ ...formData, ownerLastName: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Owner Email
                            </label>
                            <input
                                type="email"
                                value={formData.ownerEmail}
                                onChange={e =>
                                    setFormData({ ...formData, ownerEmail: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Owner Mobile Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.ownerMobile}
                                onChange={e =>
                                    setFormData({ ...formData, ownerMobile: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                placeholder="04XX XXX XXX"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Owner Alternative Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.ownerAltPhone}
                            onChange={e =>
                                setFormData({ ...formData, ownerAltPhone: e.target.value })
                            }
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Owner Postal Address
                        </label>
                        <textarea
                            value={formData.ownerAddress}
                            onChange={e =>
                                setFormData({ ...formData, ownerAddress: e.target.value })
                            }
                            rows={3}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                        />
                    </div>
                </div>
            </div>

            {/* Section 5: Assessment Location (Onsite only) */}
            {formData.assessmentType === 'Onsite Assessment' && (
                <div className="border-b border-gray-700 pb-6">
                    <h4 className="text-lg font-semibold text-white mb-4">
                        Section 5: Assessment Location
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Onsite Location Type
                            </label>
                            <select
                                value={formData.onsiteLocationType}
                                onChange={e =>
                                    setFormData({ ...formData, onsiteLocationType: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            >
                                <option value="">Select location type...</option>
                                <option value="Repairer Workshop">Repairer Workshop</option>
                                <option value="Owner's Home/Business">Owner's Home/Business</option>
                                <option value="Fleet Depot">Fleet Depot</option>
                                <option value="Storage Yard">Storage Yard</option>
                                <option value="Other Location">Other Location</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Location/Repairer Name
                            </label>
                            <input
                                type="text"
                                value={formData.locationName}
                                onChange={e =>
                                    setFormData({ ...formData, locationName: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Street Address
                            </label>
                            <input
                                type="text"
                                value={formData.streetAddress}
                                onChange={e =>
                                    setFormData({ ...formData, streetAddress: e.target.value })
                                }
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Suburb
                                </label>
                                <input
                                    type="text"
                                    value={formData.suburb}
                                    onChange={e =>
                                        setFormData({ ...formData, suburb: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    State
                                </label>
                                <select
                                    value={formData.state}
                                    onChange={e =>
                                        setFormData({ ...formData, state: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                >
                                    <option value="">Select state...</option>
                                    <option value="NSW">NSW</option>
                                    <option value="VIC">VIC</option>
                                    <option value="QLD">QLD</option>
                                    <option value="SA">SA</option>
                                    <option value="WA">WA</option>
                                    <option value="TAS">TAS</option>
                                    <option value="NT">NT</option>
                                    <option value="ACT">ACT</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Postcode
                                </label>
                                <input
                                    type="number"
                                    value={formData.postcode}
                                    onChange={e =>
                                        setFormData({ ...formData, postcode: e.target.value })
                                    }
                                    maxLength={4}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Location Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.locationContactName}
                                    onChange={e =>
                                        setFormData({ ...formData, locationContactName: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Location Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.locationPhone}
                                    onChange={e =>
                                        setFormData({ ...formData, locationPhone: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Location Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.locationEmail}
                                    onChange={e =>
                                        setFormData({ ...formData, locationEmail: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Preferred Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.preferredDate}
                                    onChange={e =>
                                        setFormData({ ...formData, preferredDate: e.target.value })
                                    }
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Preferred Time
                                </label>
                                <select
                                    value={formData.preferredTime}
                                    onChange={e =>
                                        setFormData({ ...formData, preferredTime: e.target.value })
                                    }
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                >
                                    <option value="">Select preferred time...</option>
                                    <option value="Morning (9am-12pm)">Morning (9am-12pm)</option>
                                    <option value="Afternoon (12pm-5pm)">Afternoon (12pm-5pm)</option>
                                    <option value="Anytime">Anytime</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Special Access Instructions
                            </label>
                            <textarea
                                value={formData.accessInstructions}
                                onChange={e =>
                                    setFormData({ ...formData, accessInstructions: e.target.value })
                                }
                                rows={3}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                                placeholder="e.g., Gate code: 1234, Call on arrival"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Section 7: Additional Information */}
            <div className="border-b border-gray-700 pb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                    Section 7: Additional Information
                </h4>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Incident Description
                        </label>
                        <textarea
                            value={formData.incidentDescription}
                            onChange={e =>
                                setFormData({ ...formData, incidentDescription: e.target.value })
                            }
                            rows={4}
                            maxLength={1000}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            placeholder="Brief description of damage/incident"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {formData.incidentDescription.length}/1000 characters
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Damage Areas (Select all that apply)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                'Front End',
                                'Rear End',
                                'Left Side',
                                'Right Side',
                                'Roof',
                                'Undercarriage',
                                'Interior',
                                'Glass',
                                'Mechanical',
                            ].map(area => (
                                <label
                                    key={area}
                                    className="flex items-center space-x-2 bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.damageAreas.includes(area)}
                                        onChange={() => handleDamageAreasChange(area)}
                                        className="w-4 h-4 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-gray-300">{area}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Special Instructions
                        </label>
                        <textarea
                            value={formData.specialInstructions}
                            onChange={e =>
                                setFormData({ ...formData, specialInstructions: e.target.value })
                            }
                            rows={3}
                            maxLength={500}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            placeholder="Any special notes or requirements"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Internal Notes
                        </label>
                        <textarea
                            value={formData.internalNotes}
                            onChange={e =>
                                setFormData({ ...formData, internalNotes: e.target.value })
                            }
                            rows={3}
                            maxLength={500}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-amber-500"
                            placeholder="Your internal notes (not shared with owner)"
                        />
                    </div>
                </div>
            </div>

            {/* Section 8: Consent & Legal */}
            <div className="pb-6">
                <h4 className="text-lg font-semibold text-white mb-4">
                    Section 8: Consent & Legal
                </h4>
                <div className="space-y-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.authorityConfirmed}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        authorityConfirmed: e.target.checked,
                                    })
                                }
                                className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500 mt-1 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-white">
                                    Authority Confirmation <span className="text-red-500">*</span>
                                </span>
                                <p className="text-sm text-gray-400 mt-1">
                                    I confirm that I have authority to request this assessment on
                                    behalf of my organization and that appropriate consents have been
                                    obtained from the vehicle owner.
                                </p>
                            </div>
                        </label>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.privacyConsent}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        privacyConsent: e.target.checked,
                                    })
                                }
                                className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500 mt-1 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-white">
                                    Privacy Consent <span className="text-red-500">*</span>
                                </span>
                                <p className="text-sm text-gray-400 mt-1">
                                    I consent to Crashify collecting and processing information
                                    provided in this form for vehicle damage assessment purposes.
                                </p>
                            </div>
                        </label>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                        <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.emailReportConsent}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        emailReportConsent: e.target.checked,
                                    })
                                }
                                className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500 mt-1 flex-shrink-0"
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium text-white">
                                    Email Report Consent
                                </span>
                                <p className="text-sm text-gray-400 mt-1">
                                    I consent to receive the assessment report via email at the
                                    address provided above.
                                </p>
                            </div>
                        </label>
                    </div>
                    {formData.assessmentType === 'Onsite Assessment' && (
                        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                            <label className="flex items-start space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.smsUpdates}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            smsUpdates: e.target.checked,
                                        })
                                    }
                                    className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-500 mt-1 flex-shrink-0"
                                />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-white">
                                        SMS Updates (Optional)
                                    </span>
                                    <p className="text-sm text-gray-400 mt-1">
                                        I consent to receive SMS notifications for booking
                                        confirmations and appointment reminders (onsite assessments
                                        only).
                                    </p>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-600 text-white rounded-lg hover:from-amber-600 hover:to-red-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        <>
                            <Plus className="w-5 h-5" />
                            Add Claim
                        </>
                    )}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

