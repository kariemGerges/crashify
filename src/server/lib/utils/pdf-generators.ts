// =============================================
// FILE: lib/utils/pdf-generators.ts
// PDF Generation utilities for assessment reports
// =============================================

import { jsPDF } from 'jspdf';
import { readFileSync } from 'fs';
import { join } from 'path';
import type {
    PDFReportType,
    AssessmentData,
    PDFGenerationOptions,
    LaborItem,
    PartItem,
    SubletItem,
    MiscItem,
} from '../types/pdf-report.types';

// Company default information
const DEFAULT_COMPANY_INFO = {
    name: 'Crashify Pty Ltd',
    abn: '82676363116',
    address: '81-83 Campbell Street, Surry Hills NSW 2010',
    phone: '1300 655 106',
    mobile: '0426000910',
    email: 'info@crashify.com.au',
    website: 'https://www.crashify.com.au',
};

/**
 * Load logo as base64 string
 */
function getLogoBase64(): string | null {
    try {
        // Try multiple possible paths
        const possiblePaths = [
            join(process.cwd(), 'public', 'logocrash.png'),
            join(process.cwd(), '..', 'public', 'logocrash.png'),
            join(__dirname, '..', '..', '..', '..', 'public', 'logocrash.png'),
        ];

        for (const logoPath of possiblePaths) {
            try {
                const logoBuffer = readFileSync(logoPath);
                return `data:image/png;base64,${logoBuffer.toString('base64')}`;
            } catch {
                // Try next path
                continue;
            }
        }
        return null;
    } catch (error) {
        console.error('[PDF] Failed to load logo:', error);
        return null;
    }
}

/**
 * Format currency value
 */
function formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null) return '$0.00';
    return `$${value.toFixed(2)}`;
}

/**
 * Format date
 */
function formatDate(date: string | undefined | null): string {
    if (!date) return '';
    try {
        const d = new Date(date);
        return d.toLocaleDateString('en-AU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch {
        return date;
    }
}

/**
 * Add company header with logo to PDF
 */
function addCompanyHeader(
    doc: jsPDF,
    companyInfo: typeof DEFAULT_COMPANY_INFO
): number {
    let yPos = 10;

    // Add logo if available
    const logoBase64 = getLogoBase64();
    if (logoBase64) {
        try {
            // Logo dimensions: 716 x 164, scale to fit width of ~50mm
            const logoWidth = 50;
            const logoHeight = (164 / 716) * logoWidth; // Maintain aspect ratio
            doc.addImage(logoBase64, 'PNG', 80, yPos, logoWidth, logoHeight);
            yPos += logoHeight + 5;
        } catch (error) {
            console.error('[PDF] Failed to add logo image:', error);
            // Fall back to text if logo fails
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(companyInfo.name, 105, yPos, { align: 'center' });
            yPos += 7;
        }
    } else {
        // Fall back to text if no logo
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name, 105, yPos, { align: 'center' });
        yPos += 7;
    }

    // ABN
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`ABN: ${companyInfo.abn}`, 105, yPos, { align: 'center' });
    yPos += 5;

    // Address
    doc.setFontSize(9);
    doc.text(companyInfo.address, 105, yPos, { align: 'center' });
    yPos += 4;

    // Contact info
    doc.text(
        `${companyInfo.phone}`,
        105,
        yPos,
        { align: 'center' }
    );
    yPos += 4;

    doc.text(companyInfo.mobile, 105, yPos, { align: 'center' });
    yPos += 4;

    doc.text(companyInfo.email, 105, yPos, { align: 'center' });
    yPos += 4;

    doc.text(companyInfo.website, 105, yPos, { align: 'center' });
    yPos += 10;

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 10;

    return yPos;
}

/**
 * Generate Assessed Quote PDF - matches exact format from example
 */
function generateAssessedQuote(
    doc: jsPDF,
    data: AssessmentData,
    companyInfo: typeof DEFAULT_COMPANY_INFO
): void {
    let yPos = addCompanyHeader(doc, companyInfo);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Repair Authority', 105, yPos, { align: 'center' });
    yPos += 10;

    // Repairer info
    if (data.repairer) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('The Proprietor', 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text(data.repairer.name, 20, yPos);
        yPos += 5;
        if (data.repairer.address) {
            const addressLines = doc.splitTextToSize(data.repairer.address, 100);
            doc.text(addressLines, 20, yPos);
            yPos += addressLines.length * 5;
        }
        if (data.repairer.abn) {
            doc.text(`ABN: ${data.repairer.abn}`, 20, yPos);
            yPos += 5;
        }
        yPos += 5;
    }

    // Vehicle and claim info table - exact format from example
    doc.setFontSize(9);
    const tableStartX = 20;
    const tableStartY = yPos;
    let currentY = tableStartY;

    // Table header style
    doc.setFont('helvetica', 'bold');
    const tableWidth = 170;
    const col1Width = 30;
    const col2Width = tableWidth - col1Width;

    // Draw table border
    doc.setLineWidth(0.3);
    doc.rect(tableStartX, tableStartY - 5, tableWidth, 60);

    // Table rows
    const tableRows: Array<[string, string]> = [];
    if (data.owner?.full_name || (data.owner?.first_name && data.owner?.last_name)) {
        tableRows.push([
            'Insured',
            data.owner.full_name || `${data.owner.first_name} ${data.owner.last_name}`,
        ]);
    }
    if (data.vehicle?.registration) {
        tableRows.push([
            'Rego',
            `${data.vehicle.registration_state || ''} ${data.vehicle.registration}`.trim(),
        ]);
    }
    if (data.vehicle) {
        const vehicleDesc = [
            data.vehicle.year,
            data.vehicle.make,
            data.vehicle.model,
        ]
            .filter(Boolean)
            .join(' ');
        tableRows.push(['Vehicle', vehicleDesc]);
    }
    if (data.claim_reference) {
        tableRows.push(['Claim', data.claim_reference]);
    }
    if (data.excess_amount) {
        tableRows.push(['Excess', formatCurrency(data.excess_amount)]);
    }
    if (data.estimate_number) {
        tableRows.push(['Estimate No.', data.estimate_number]);
    }
    if (data.assessor?.name) {
        tableRows.push(['Assessor', data.assessor.name]);
    }
    if (data.assessor?.phone) {
        tableRows.push(['Assessor Phone', data.assessor.phone]);
    }
    if (data.assessor?.email) {
        tableRows.push(['Assessor Email', data.assessor.email]);
    }

    // Draw table rows
    tableRows.forEach(([label, value], index) => {
        const rowY = tableStartY + (index * 6);
        doc.setFont('helvetica', 'bold');
        doc.text(label, tableStartX + 2, rowY);
        doc.setFont('helvetica', 'normal');
        const valueLines = doc.splitTextToSize(value, col2Width - 4);
        doc.text(valueLines, tableStartX + col1Width + 2, rowY);
    });

    yPos = tableStartY + (tableRows.length * 6) + 8;

    // Assessment totals section
    if (data.labor_total_cost || data.parts_total_cost || data.sublet_total_cost || data.total_including_gst) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        if (data.labor_total_cost) {
            doc.text(`Assessed Labour Total`, 20, yPos);
            doc.text(formatCurrency(data.labor_total_cost), 150, yPos, { align: 'right' });
            yPos += 6;
        }
        if (data.parts_total_cost) {
            doc.text(`Plus Parts as Authorised`, 20, yPos);
            doc.text(formatCurrency(data.parts_total_cost), 150, yPos, { align: 'right' });
            yPos += 6;
        }
        if (data.sublet_total_cost) {
            doc.text(`Plus Sublets as Authorised`, 20, yPos);
            doc.text(formatCurrency(data.sublet_total_cost), 150, yPos, { align: 'right' });
            yPos += 6;
        }
        if (data.total_including_gst) {
            doc.setFont('helvetica', 'bold');
            doc.text(`Total Including GST`, 20, yPos);
            doc.text(formatCurrency(data.total_including_gst), 150, yPos, { align: 'right' });
            yPos += 8;
        }
    }

    // Insurer authorization section
    if (data.insurer) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const authText = 'Thank you for your repair quote for the above vehicle and we confirm that repairs are now authorised, this authority is issued on behalf of:';
        const authLines = doc.splitTextToSize(authText, 170);
        doc.text(authLines, 20, yPos);
        yPos += authLines.length * 5 + 5;

        doc.setFont('helvetica', 'bold');
        doc.text(data.insurer.name, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        if (data.insurer.abn) {
            doc.text(`ABN ${data.insurer.abn}`, 20, yPos);
            yPos += 5;
        }
        if (data.insurer.phone) {
            doc.text(data.insurer.phone, 20, yPos);
            yPos += 5;
        }
        if (data.insurer.email) {
            doc.text(data.insurer.email, 20, yPos);
            yPos += 5;
        }
        yPos += 5;
    }

    // Important notices
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('NO ADDITIONALS WILL BE PAID FOR UNLESS PREVIOUSLY AUTHORISED', 20, yPos, {
        maxWidth: 170,
    });
    yPos += 6;

    doc.text('ALL PART NUMBERS MUST BE SHOWN ON INVOICE', 20, yPos, {
        maxWidth: 170,
    });
    yPos += 8;

    // Conditions text
    if (data.repair_conditions) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const conditions = doc.splitTextToSize(data.repair_conditions, 170);
        doc.text(conditions, 20, yPos);
        yPos += conditions.length * 4 + 5;
    }

    // Standard conditions from example
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const standardConditions = [
        'This Authority is issued on the condition that the vehicle be repaired in accordance with the Assessed Quotation and that all work be carried out by Licensed Tradesmen, on a Licensed Premises in compliance with The Motor Vehicle Repairers Act as applicable.',
        'You should collect the owner\'s proportion of the repair upon delivery of the vehicle and show such a deduction from your account.',
        'Our Principal will not be responsible for payment of any amount in excess of that stated unless the additional cost has been authorised in writing.',
        'In Country areas where freight is applicable to invoice items please show the amount of freight as one separate item in your account.',
        'THE ASSESSMENT HAS BEEN CONDUCTED AND REPAIRS AUTHORISED IN ACCORDANCE WITH CURRENT INDUSTRY REPAIR STANDARDS IN LIEU OF MANUFACTURERS GUIDELINES',
        'PARTS: Our principal will not be table for payment of any amount in excess of ruling recommended List Price as shown in the Vehicle Manufacturer Spare Parts Pdce List plus Goods and Services Tax.',
        'N. B. All parts supplied are to be new genuine factory spares unless otherwise Authaised.',
    ];

    standardConditions.forEach((condition) => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 20;
        }
        const lines = doc.splitTextToSize(condition, 170);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 4 + 3;
    });

    // Invoice instructions
    if (data.insurer) {
        yPos += 5;
        doc.setFontSize(9);
        doc.text('When repairs are completed please make your repair tax invoice out to:', 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text(data.insurer.name, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        if (data.insurer.abn) {
            doc.text(`ABN ${data.insurer.abn}`, 20, yPos);
            yPos += 5;
        }
        if (data.insurer.phone) {
            doc.text(data.insurer.phone, 20, yPos);
            yPos += 5;
        }
        if (data.insurer.email) {
            doc.text(data.insurer.email, 20, yPos);
            yPos += 5;
        }
    }

    // Notes section
    if (data.assessment_notes || data.post_repair_requirements) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (data.post_repair_requirements) {
            const notes = doc.splitTextToSize(data.post_repair_requirements, 170);
            doc.text(notes, 20, yPos);
            yPos += notes.length * 4 + 5;
        }
        if (data.assessment_notes) {
            const notes = doc.splitTextToSize(data.assessment_notes, 170);
            doc.text(notes, 20, yPos);
            yPos += notes.length * 4;
        }
    }

    // Assessor signature section
    if (data.assessor?.name) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(data.assessor.name, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text('Motor Vehicle Assessor', 20, yPos);
        yPos += 5;
        doc.text(companyInfo.name, 20, yPos);
        yPos += 5;
        if (data.assessor.mobile) {
            doc.text(data.assessor.mobile, 20, yPos);
            yPos += 5;
        }
        if (data.assessor.email) {
            doc.text(data.assessor.email, 20, yPos);
            yPos += 5;
        }
        doc.text(companyInfo.address, 20, yPos);
        yPos += 5;
        doc.text(companyInfo.website, 20, yPos);
    }
}

/**
 * Generate Detailed Assessment Report PDF - matches exact format from example
 */
function generateDetailedAssessment(
    doc: jsPDF,
    data: AssessmentData,
    companyInfo: typeof DEFAULT_COMPANY_INFO
): void {
    let yPos = addCompanyHeader(doc, companyInfo);

    // Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
        `Estimate Assessed: ${data.assessment_reference_number || 'N/A'}`,
        20,
        yPos
    );
    yPos += 6;

    if (data.assessment_date) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Date Assessed: ${formatDate(data.assessment_date)}`, 20, yPos);
        yPos += 8;
    }

    // Assessment info table
    doc.setFontSize(9);
    const infoTable: Array<[string, string]> = [];
    if (data.repairer?.name) {
        infoTable.push(['Repairer', data.repairer.name]);
    }
    if (data.repairer?.abn) {
        infoTable.push(['Repairer ABN', data.repairer.abn]);
    }
    if (data.owner?.full_name || (data.owner?.first_name && data.owner?.last_name)) {
        infoTable.push([
            'Owner',
            data.owner.full_name || `${data.owner.first_name} ${data.owner.last_name}`,
        ]);
    }
    if (data.owner?.email) {
        infoTable.push(['Email', data.owner.email]);
    }
    if (data.assessor?.name) {
        infoTable.push(['Assessor', data.assessor.name]);
    }
    if (data.claim_reference) {
        infoTable.push(['Claim', data.claim_reference]);
    }
    if (data.vehicle) {
        const vehicleDesc = [
            data.vehicle.year,
            data.vehicle.make,
            data.vehicle.model,
        ]
            .filter(Boolean)
            .join(' ');
        infoTable.push(['Vehicle', vehicleDesc]);
    }
    if (data.vehicle?.registration) {
        infoTable.push([
            'Rego',
            `${data.vehicle.registration_state || ''} ${data.vehicle.registration}`.trim(),
        ]);
    }
    if (data.vehicle?.vin) {
        infoTable.push(['VIN', data.vehicle.vin]);
    }
    if (data.insurer?.name) {
        infoTable.push(['Insurer', data.insurer.name]);
    }

    // Draw info table
    doc.setLineWidth(0.3);
    const tableStartY = yPos;
    const tableHeight = infoTable.length * 6 + 4;
    doc.rect(20, tableStartY - 4, 170, tableHeight);

    infoTable.forEach(([label, value], index) => {
        const rowY = tableStartY + (index * 6);
        doc.setFont('helvetica', 'bold');
        doc.text(label, 22, rowY);
        doc.setFont('helvetica', 'normal');
        const valueLines = doc.splitTextToSize(value, 120);
        doc.text(valueLines, 80, rowY);
    });

    yPos = tableStartY + tableHeight + 8;

    // Labor section with detailed tables
    if (data.labor_items && data.labor_items.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Labour', 20, yPos);
        yPos += 8;

        // Group by rate type
        const laborByRate: Record<string, LaborItem[]> = {
            RR: [],
            RA: [],
            REF: [],
        };

        data.labor_items.forEach((item) => {
            const rateType = item.rate_type || 'RR';
            if (!laborByRate[rateType]) {
                laborByRate[rateType] = [];
            }
            laborByRate[rateType].push(item);
        });

        Object.entries(laborByRate).forEach(([rateType, items]) => {
            if (items.length === 0) return;

            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
            }

            const rateMap: Record<string, number> = {
                RR: data.labor_rate_rr || 32.0,
                RA: data.labor_rate_ra || 32.0,
                REF: data.labor_rate_ref || 56.0,
            };
            const rate = rateMap[rateType] || 0;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(`${rateType} @ ${formatCurrency(rate)} per hour`, 20, yPos);
            yPos += 6;

            // Table header
            doc.setFontSize(8);
            doc.setLineWidth(0.3);
            const headerY = yPos;
            doc.rect(20, headerY - 4, 170, 5);
            doc.text('Comment', 22, headerY);
            doc.text('Hrs Quoted', 100, headerY);
            doc.text('Hrs Assessed', 130, headerY);
            doc.text('Variance', 160, headerY);
            yPos += 6;

            // Table rows
            items.forEach((item) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFont('helvetica', 'normal');
                const descLines = doc.splitTextToSize(item.description || '', 70);
                const commentLines = item.comment
                    ? doc.splitTextToSize(item.comment, 70)
                    : [];
                const maxLines = Math.max(descLines.length, commentLines.length, 1);

                // Description
                doc.text(descLines, 22, yPos);
                
                // Comment if exists
                if (item.comment) {
                    doc.setFontSize(7);
                    doc.text(commentLines, 22, yPos + descLines.length * 3);
                    doc.setFontSize(8);
                }

                // Hours
                doc.text(
                    item.hours_quoted?.toFixed(2) || '-',
                    100,
                    yPos
                );
                doc.text(
                    item.hours_assessed?.toFixed(2) || '-',
                    130,
                    yPos
                );
                doc.text(
                    item.variance ? item.variance.toFixed(2) : '-',
                    160,
                    yPos
                );

                yPos += Math.max(maxLines * 4, 5);
            });

            // Subtotal
            const subtotalHours = items.reduce((sum, item) => sum + (item.hours_assessed || 0), 0);
            const subtotalCost = items.reduce((sum, item) => sum + (item.cost || 0), 0);
            const quotedHours = items.reduce((sum, item) => sum + (item.hours_quoted || 0), 0);
            const quotedCost = quotedHours * rate;
            const varianceHours = subtotalHours - quotedHours;
            const varianceCost = subtotalCost - quotedCost;

            yPos += 3;
            doc.setFont('helvetica', 'bold');
            doc.text('Sub Total', 22, yPos);
            doc.text(`Hrs ${quotedHours.toFixed(2)}`, 100, yPos);
            doc.text(`Hrs ${subtotalHours.toFixed(2)}`, 130, yPos);
            doc.text(`Hrs ${varianceHours.toFixed(2)}`, 160, yPos);
            yPos += 5;
            doc.text(formatCurrency(quotedCost), 100, yPos);
            doc.text(formatCurrency(subtotalCost), 130, yPos);
            doc.text(formatCurrency(varianceCost), 160, yPos);
            yPos += 8;
        });
    }

    // Parts section
    if (data.parts_items && data.parts_items.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Parts', 20, yPos);
        yPos += 8;

        // Table header
        doc.setFontSize(8);
        doc.setLineWidth(0.3);
        const headerY = yPos;
        doc.rect(20, headerY - 4, 170, 5);
        doc.text('Part No', 22, headerY);
        doc.text('Item', 50, headerY);
        doc.text('Part Type', 100, headerY);
        doc.text('Comment', 120, headerY);
        doc.text('Qty', 140, headerY);
        doc.text('Qty Ass', 150, headerY);
        doc.text('Price', 160, headerY);
        doc.text('Price Ass', 170, headerY);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        data.parts_items.forEach((item) => {
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            doc.text(item.part_number || '-', 22, yPos);
            const itemLines = doc.splitTextToSize(item.item || '', 25);
            doc.text(itemLines, 50, yPos);
            doc.text(item.part_type || 'New', 100, yPos);
            if (item.comment) {
                const commentLines = doc.splitTextToSize(item.comment, 15);
                doc.text(commentLines, 120, yPos);
            }
            doc.text((item.quantity || 0).toString(), 140, yPos);
            doc.text((item.quantity_assessed || item.quantity || 0).toString(), 150, yPos);
            doc.text(formatCurrency(item.price), 160, yPos);
            doc.text(formatCurrency(item.price_assessed || item.price), 170, yPos);

            yPos += Math.max(itemLines.length * 4, 5);
        });

        // Parts subtotal
        const partsSubtotal = data.parts_items.reduce(
            (sum, item) => sum + ((item.price_assessed || item.price || 0) * (item.quantity_assessed || item.quantity || 1)),
            0
        );
        yPos += 3;
        doc.setFont('helvetica', 'bold');
        doc.text('Sub Total', 22, yPos);
        doc.text(formatCurrency(partsSubtotal), 170, yPos, { align: 'right' });
        yPos += 8;
    }

    // Summary totals
    if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const totalHours = data.labor_total_hours || 0;
    const totalCost = (data.labor_total_cost || 0) + (data.parts_total_cost || 0) + (data.sublet_total_cost || 0);
    const gst = totalCost * 0.1;
    const grandTotal = totalCost + gst;

    doc.text('Hours', 20, yPos);
    doc.text(`Hrs ${totalHours.toFixed(2)}`, 100, yPos);
    yPos += 6;

    doc.text('Total', 20, yPos);
    doc.text(formatCurrency(totalCost), 100, yPos);
    yPos += 6;

    doc.text('GST', 20, yPos);
    doc.text(formatCurrency(gst), 100, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total', 20, yPos);
    doc.text(formatCurrency(grandTotal), 100, yPos);
    yPos += 8;

    // Notes
    if (data.assessment_notes) {
        yPos += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 20, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const notes = doc.splitTextToSize(data.assessment_notes, 170);
        doc.text(notes, 20, yPos);
        yPos += notes.length * 4;
    }

    // Assessor details
    if (data.assessor) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(data.assessor.name, 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        doc.text('Motor Vehicle Assessor', 20, yPos);
        yPos += 5;
        doc.text(companyInfo.name, 20, yPos);
        yPos += 5;
        if (data.assessor.mobile) {
            doc.text(data.assessor.mobile, 20, yPos);
            yPos += 5;
        }
        if (data.assessor.email) {
            doc.text(data.assessor.email, 20, yPos);
            yPos += 5;
        }
        doc.text(companyInfo.address, 20, yPos);
        yPos += 5;
        doc.text(companyInfo.website, 20, yPos);
    }
}

/**
 * Generate Salvage Tender Request PDF - matches exact format from example
 */
function generateSalvageTender(
    doc: jsPDF,
    data: AssessmentData,
    companyInfo: typeof DEFAULT_COMPANY_INFO
): void {
    let yPos = addCompanyHeader(doc, companyInfo);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Salvage Tender Request Report', 105, yPos, { align: 'center' });
    yPos += 10;

    // Reference number
    if (data.assessment_reference_number) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Reference: ${data.assessment_reference_number}`,
            105,
            yPos,
            { align: 'center' }
        );
        yPos += 10;
    }

    // Vehicle information table
    if (data.vehicle) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicle Details', 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const vehicleInfo: Array<[string, string]> = [];
        if (data.vehicle.make && data.vehicle.model) {
            vehicleInfo.push([
                'Make/Model',
                `${data.vehicle.make} ${data.vehicle.model}`,
            ]);
        }
        if (data.vehicle.year) {
            vehicleInfo.push(['Year', data.vehicle.year.toString()]);
        }
        if (data.vehicle.registration) {
            vehicleInfo.push([
                'Registration',
                `${data.vehicle.registration_state || ''} ${data.vehicle.registration}`.trim(),
            ]);
        }
        if (data.vehicle.vin) {
            vehicleInfo.push(['VIN', data.vehicle.vin]);
        }

        doc.setLineWidth(0.3);
        const tableStartY = yPos;
        const tableHeight = vehicleInfo.length * 6 + 4;
        doc.rect(20, tableStartY - 4, 170, tableHeight);

        vehicleInfo.forEach(([label, value], index) => {
            const rowY = tableStartY + (index * 6);
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 22, rowY);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 80, rowY);
        });

        yPos = tableStartY + tableHeight + 8;
    }

    // Claim information
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Claim Information', 20, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (data.claim_reference) {
        doc.setFont('helvetica', 'bold');
        doc.text('Claim Number:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.claim_reference, 80, yPos);
        yPos += 6;
    }
    if (data.policy_number) {
        doc.setFont('helvetica', 'bold');
        doc.text('Policy Number:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.policy_number, 80, yPos);
        yPos += 6;
    }
    if (data.insurer?.name) {
        doc.setFont('helvetica', 'bold');
        doc.text('Insurer:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.insurer.name, 80, yPos);
        yPos += 6;
    }

    // Salvage information
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Salvage Details', 20, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (data.salvage_estimated_value) {
        doc.setFont('helvetica', 'bold');
        doc.text('Estimated Salvage Value:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(data.salvage_estimated_value), 80, yPos);
        yPos += 6;
    }
    if (data.salvage_tender_date) {
        doc.setFont('helvetica', 'bold');
        doc.text('Tender Date:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(data.salvage_tender_date), 80, yPos);
        yPos += 6;
    }

    // Damage description
    if (data.incident_description || data.damage_areas) {
        yPos += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Damage Description', 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (data.incident_description) {
            const desc = doc.splitTextToSize(data.incident_description, 170);
            doc.text(desc, 25, yPos);
            yPos += desc.length * 5;
        }
        if (data.damage_areas && data.damage_areas.length > 0) {
            doc.text('Damage Areas:', 25, yPos);
            yPos += 5;
            data.damage_areas.forEach((area) => {
                doc.text(`• ${area}`, 30, yPos);
                yPos += 5;
            });
        }
    }

    // Notes
    if (data.assessment_notes) {
        yPos += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Additional Notes', 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const notes = doc.splitTextToSize(data.assessment_notes, 170);
        doc.text(notes, 25, yPos);
        yPos += notes.length * 5;
    }

    // Contact information
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('For further information, please contact:', 20, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    if (data.assessor?.name) {
        doc.text(`Assessor: ${data.assessor.name}`, 25, yPos);
        yPos += 5;
    }
    if (data.assessor?.email) {
        doc.text(`Email: ${data.assessor.email}`, 25, yPos);
        yPos += 5;
    }
    if (data.assessor?.phone) {
        doc.text(`Phone: ${data.assessor.phone}`, 25, yPos);
        yPos += 5;
    }
}

/**
 * Generate Total Loss Assessment PDF - matches exact format from example
 */
function generateTotalLoss(
    doc: jsPDF,
    data: AssessmentData,
    companyInfo: typeof DEFAULT_COMPANY_INFO
): void {
    let yPos = addCompanyHeader(doc, companyInfo);

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Loss Assessment Report', 105, yPos, { align: 'center' });
    yPos += 10;

    // Reference number
    if (data.assessment_reference_number) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Reference: ${data.assessment_reference_number}`,
            105,
            yPos,
            { align: 'center' }
        );
        yPos += 10;
    }

    // Total Loss Declaration
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL LOSS DECLARATION', 105, yPos, { align: 'center' });
    yPos += 10;

    // Vehicle information table
    if (data.vehicle) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Vehicle Details', 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const vehicleInfo: Array<[string, string]> = [];
        if (data.vehicle.make && data.vehicle.model) {
            vehicleInfo.push([
                'Make/Model',
                `${data.vehicle.make} ${data.vehicle.model}`,
            ]);
        }
        if (data.vehicle.year) {
            vehicleInfo.push(['Year', data.vehicle.year.toString()]);
        }
        if (data.vehicle.registration) {
            vehicleInfo.push([
                'Registration',
                `${data.vehicle.registration_state || ''} ${data.vehicle.registration}`.trim(),
            ]);
        }
        if (data.vehicle.vin) {
            vehicleInfo.push(['VIN', data.vehicle.vin]);
        }
        if (data.vehicle.odometer) {
            vehicleInfo.push(['Odometer', data.vehicle.odometer.toString()]);
        }

        doc.setLineWidth(0.3);
        const tableStartY = yPos;
        const tableHeight = vehicleInfo.length * 6 + 4;
        doc.rect(20, tableStartY - 4, 170, tableHeight);

        vehicleInfo.forEach(([label, value], index) => {
            const rowY = tableStartY + (index * 6);
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, 22, rowY);
            doc.setFont('helvetica', 'normal');
            doc.text(value, 80, rowY);
        });

        yPos = tableStartY + tableHeight + 8;
    }

    // Claim information
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Claim Information', 20, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (data.claim_reference) {
        doc.setFont('helvetica', 'bold');
        doc.text('Claim Number:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.claim_reference, 80, yPos);
        yPos += 6;
    }
    if (data.policy_number) {
        doc.setFont('helvetica', 'bold');
        doc.text('Policy Number:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.policy_number, 80, yPos);
        yPos += 6;
    }
    if (data.insurer?.name) {
        doc.setFont('helvetica', 'bold');
        doc.text('Insurer:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.insurer.name, 80, yPos);
        yPos += 6;
    }
    if (data.incident_date) {
        doc.setFont('helvetica', 'bold');
        doc.text('Incident Date:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatDate(data.incident_date), 80, yPos);
        yPos += 6;
    }

    // Total Loss Information
    yPos += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Loss Assessment', 20, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (data.total_loss_value) {
        doc.setFont('helvetica', 'bold');
        doc.text('Total Loss Value:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(formatCurrency(data.total_loss_value), 80, yPos);
        yPos += 6;
    }
    if (data.total_loss_reason) {
        doc.setFont('helvetica', 'bold');
        doc.text('Reason for Total Loss:', 25, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const reason = doc.splitTextToSize(data.total_loss_reason, 170);
        doc.text(reason, 25, yPos);
        yPos += reason.length * 5;
    }

    // Damage description
    if (data.incident_description || data.damage_areas) {
        yPos += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Damage Description', 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (data.incident_description) {
            const desc = doc.splitTextToSize(data.incident_description, 170);
            doc.text(desc, 25, yPos);
            yPos += desc.length * 5;
        }
        if (data.damage_areas && data.damage_areas.length > 0) {
            doc.text('Damage Areas:', 25, yPos);
            yPos += 5;
            data.damage_areas.forEach((area) => {
                doc.text(`• ${area}`, 30, yPos);
                yPos += 5;
            });
        }
    }

    // Assessment details
    if (data.assessment_date || data.inspection_date) {
        yPos += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessment Details', 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        if (data.assessment_date) {
            doc.setFont('helvetica', 'bold');
            doc.text('Assessment Date:', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(data.assessment_date), 80, yPos);
            yPos += 6;
        }
        if (data.inspection_date) {
            doc.setFont('helvetica', 'bold');
            doc.text('Inspection Date:', 25, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(data.inspection_date), 80, yPos);
            yPos += 6;
        }
        if (data.inspection_address) {
            doc.setFont('helvetica', 'bold');
            doc.text('Inspection Address:', 25, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            const address = doc.splitTextToSize(data.inspection_address, 170);
            doc.text(address, 25, yPos);
            yPos += address.length * 5;
        }
    }

    // Notes
    if (data.assessment_notes) {
        yPos += 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Additional Notes', 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const notes = doc.splitTextToSize(data.assessment_notes, 170);
        doc.text(notes, 25, yPos);
        yPos += notes.length * 5;
    }

    // Assessor details
    if (data.assessor) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Assessor Details', 20, yPos);
        yPos += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        if (data.assessor.name) {
            doc.text(`Assessor: ${data.assessor.name}`, 25, yPos);
            yPos += 5;
        }
        if (data.assessor.email) {
            doc.text(`Email: ${data.assessor.email}`, 25, yPos);
            yPos += 5;
        }
        if (data.assessor.phone) {
            doc.text(`Phone: ${data.assessor.phone}`, 25, yPos);
            yPos += 5;
        }
        if (data.assessor.mobile) {
            doc.text(`Mobile: ${data.assessor.mobile}`, 25, yPos);
        }
    }
}

/**
 * Main PDF generation function
 */
export function generatePDFReport(
    options: PDFGenerationOptions
): jsPDF {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
    });

    const companyInfo = {
        name: options.companyName || DEFAULT_COMPANY_INFO.name,
        abn: options.companyAbn || DEFAULT_COMPANY_INFO.abn,
        address: options.companyAddress || DEFAULT_COMPANY_INFO.address,
        phone: options.companyPhone || DEFAULT_COMPANY_INFO.phone,
        mobile: DEFAULT_COMPANY_INFO.mobile,
        email: options.companyEmail || DEFAULT_COMPANY_INFO.email,
        website: options.companyWebsite || DEFAULT_COMPANY_INFO.website,
    };

    switch (options.reportType) {
        case 'assessed-quote':
            generateAssessedQuote(doc, options.assessmentData, companyInfo);
            break;
        case 'detailed-assessment':
            generateDetailedAssessment(
                doc,
                options.assessmentData,
                companyInfo
            );
            break;
        case 'salvage-tender':
            generateSalvageTender(doc, options.assessmentData, companyInfo);
            break;
        case 'total-loss':
            generateTotalLoss(doc, options.assessmentData, companyInfo);
            break;
        default:
            throw new Error(`Unknown report type: ${options.reportType}`);
    }

    return doc;
}
