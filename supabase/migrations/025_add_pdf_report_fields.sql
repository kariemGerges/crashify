-- =============================================
-- Migration: Add fields for PDF report generation
-- Supports: Assessed Quote, Detailed Assessment, Salvage Tender, Total Loss reports
-- =============================================

-- Add assessor information fields
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS assessor_name TEXT,
ADD COLUMN IF NOT EXISTS assessor_phone TEXT,
ADD COLUMN IF NOT EXISTS assessor_email TEXT,
ADD COLUMN IF NOT EXISTS assessor_mobile TEXT,
ADD COLUMN IF NOT EXISTS assessment_reference_number TEXT,
ADD COLUMN IF NOT EXISTS assessment_date DATE,
ADD COLUMN IF NOT EXISTS inspection_date DATE,
ADD COLUMN IF NOT EXISTS inspection_address TEXT;

-- Add insurer information
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS insurer_name TEXT,
ADD COLUMN IF NOT EXISTS insurer_abn TEXT,
ADD COLUMN IF NOT EXISTS insurer_phone TEXT,
ADD COLUMN IF NOT EXISTS insurer_email TEXT,
ADD COLUMN IF NOT EXISTS insurer_address TEXT;

-- Add repairer information
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS repairer_name TEXT,
ADD COLUMN IF NOT EXISTS repairer_abn TEXT,
ADD COLUMN IF NOT EXISTS repairer_address TEXT,
ADD COLUMN IF NOT EXISTS repairer_phone TEXT,
ADD COLUMN IF NOT EXISTS repairer_email TEXT;

-- Add labor information (stored as JSONB for flexibility)
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS labor_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS labor_total_hours DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS labor_total_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS labor_rate_rr DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS labor_rate_ra DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS labor_rate_ref DECIMAL(10, 2);

-- Add parts information
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS parts_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS parts_total_cost DECIMAL(10, 2);

-- Add sublet information
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS sublet_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sublet_total_cost DECIMAL(10, 2);

-- Add miscellaneous items
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS misc_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS misc_total_cost DECIMAL(10, 2);

-- Add assessment totals
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS total_excluding_gst DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total_including_gst DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS excess_amount DECIMAL(10, 2);

-- Add repair authority information
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS repair_authority_issued BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS repair_authority_date DATE,
ADD COLUMN IF NOT EXISTS repair_authority_issued_by TEXT,
ADD COLUMN IF NOT EXISTS repair_authority_conditions TEXT;

-- Add assessment type specific fields
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS is_total_loss BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_loss_reason TEXT,
ADD COLUMN IF NOT EXISTS total_loss_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS salvage_tender_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS salvage_tender_date DATE,
ADD COLUMN IF NOT EXISTS salvage_estimated_value DECIMAL(10, 2);

-- Add estimate information
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS estimate_number TEXT,
ADD COLUMN IF NOT EXISTS estimate_date DATE,
ADD COLUMN IF NOT EXISTS quoted_hours DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS assessed_hours DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS hours_variance DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS quoted_total DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS assessed_total DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS total_variance DECIMAL(10, 2);

-- Add notes and conditions
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS assessment_notes TEXT,
ADD COLUMN IF NOT EXISTS repair_conditions TEXT,
ADD COLUMN IF NOT EXISTS additional_damage_notes TEXT,
ADD COLUMN IF NOT EXISTS fault_codes_notes TEXT,
ADD COLUMN IF NOT EXISTS post_repair_requirements TEXT;

-- Add state/registration information
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS registration_state TEXT,
ADD COLUMN IF NOT EXISTS vehicle_state TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assessments_assessment_reference ON assessments(assessment_reference_number);
CREATE INDEX IF NOT EXISTS idx_assessments_assessment_date ON assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_assessments_is_total_loss ON assessments(is_total_loss);
CREATE INDEX IF NOT EXISTS idx_assessments_repair_authority ON assessments(repair_authority_issued);

-- Add comments for documentation
COMMENT ON COLUMN assessments.assessor_name IS 'Name of the assessor conducting the assessment';
COMMENT ON COLUMN assessments.assessment_reference_number IS 'Unique reference number for the assessment';
COMMENT ON COLUMN assessments.labor_items IS 'JSON array of labor items with hours, rates, and costs';
COMMENT ON COLUMN assessments.parts_items IS 'JSON array of parts with part numbers, descriptions, quantities, and prices';
COMMENT ON COLUMN assessments.is_total_loss IS 'Whether the vehicle is assessed as a total loss';
COMMENT ON COLUMN assessments.repair_authority_issued IS 'Whether repair authority has been issued';

