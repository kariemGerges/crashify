import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/server/lib/supabase/client';

function getDateRange(
    dateRange: string | null
): { from: string; to: string } | null {
    if (!dateRange || dateRange === 'all') return null;
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    let from: string;
    switch (dateRange) {
        case 'last-7': {
            const d = new Date(now);
            d.setDate(d.getDate() - 7);
            from = d.toISOString().slice(0, 10);
            break;
        }
        case 'last-30': {
            const d = new Date(now);
            d.setDate(d.getDate() - 30);
            from = d.toISOString().slice(0, 10);
            break;
        }
        case 'last-90': {
            const d = new Date(now);
            d.setDate(d.getDate() - 90);
            from = d.toISOString().slice(0, 10);
            break;
        }
        case 'this-year':
            from = `${now.getFullYear()}-01-01`;
            break;
        default:
            return null;
    }
    return { from, to };
}

/**
 * GET /api/cicop/dashboard-stats
 * Get comprehensive dashboard statistics
 * Query params: insurer, repairer, vehicle_make, assessment_type, date_range (last-7|last-30|last-90|this-year)
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = request.nextUrl;
        const insurer = searchParams.get('insurer');
        const repairer = searchParams.get('repairer');
        const vehicleMake = searchParams.get('vehicle_make');
        const assessmentType = searchParams.get('assessment_type');
        const dateRange = searchParams.get('date_range');

        let query = supabase.from('cicop_assessments').select('*');

        if (insurer && insurer !== 'all') query = query.eq('insurer', insurer);
        if (repairer && repairer !== 'all')
            query = query.eq('repairer_name', repairer);
        if (vehicleMake && vehicleMake !== 'all')
            query = query.eq('vehicle_make', vehicleMake);
        if (assessmentType && assessmentType !== 'all')
            query = query.eq('assessment_type', assessmentType);

        const range = getDateRange(dateRange);
        if (range) {
            query = query
                .gte('date_received', range.from)
                .lte('date_received', range.to);
        }

        const { data: assessments, error } = await query;

        if (error) {
            console.error('Error fetching assessments:', error);
            return NextResponse.json(
                { error: 'Failed to fetch assessments' },
                { status: 500 }
            );
        }

        if (!assessments || assessments.length === 0) {
            return NextResponse.json({
                total_assessments: 0,
                total_savings: 0,
                prevented_total_losses: 0,
                fraud_cases: 0,
                fraud_amount_blocked: 0,
                total_quoted: 0,
                total_assessed: 0,
                avg_savings_percentage: 0,
                total_loss_ratio: 0,
                compliance_rate: 0,
            });
        }

        // Calculate total savings
        const totalSavings = assessments.reduce((sum, a) => {
            const savings = parseFloat(a.savings) || 0;
            return sum + savings;
        }, 0);

        // Calculate total quoted and assessed amounts
        const totalQuoted = assessments.reduce((sum, a) => {
            const quote = parseFloat(a.repairer_quote) || 0;
            return sum + quote;
        }, 0);

        const totalAssessed = assessments.reduce((sum, a) => {
            const assessed = parseFloat(a.crashify_assessed) || 0;
            return sum + assessed;
        }, 0);

        // Count prevented total losses (vehicles marked as total_loss but saved)
        const preventedTotalLosses = assessments.filter(a => {
            // Count assessments where total_loss flag is false but vehicle was high-value
            return (
                a.total_loss === false &&
                (parseFloat(a.repairer_quote) || 0) > 15000
            );
        }).length;

        // Count fraud cases (assessments with fraud indicators)
        const fraudCases = assessments.filter(a => {
            return (
                a.fraud_indicators &&
                Array.isArray(a.fraud_indicators) &&
                a.fraud_indicators.length > 0
            );
        }).length;

        // Estimate fraud amount blocked (average 10% of quote for fraud cases)
        const fraudAmountBlocked = assessments
            .filter(
                a =>
                    a.fraud_indicators &&
                    Array.isArray(a.fraud_indicators) &&
                    a.fraud_indicators.length > 0
            )
            .reduce((sum, a) => {
                const quote = parseFloat(a.repairer_quote) || 0;
                return sum + quote * 0.1; // Estimate 10% fraud markup
            }, 0);

        // Calculate average savings percentage
        const avgSavingsPercentage =
            totalQuoted > 0
                ? ((totalSavings / totalQuoted) * 100).toFixed(1)
                : 0;

        // Calculate total loss ratio (percentage of claims that were total losses)
        const totalLossCount = assessments.filter(
            a => a.total_loss === true
        ).length;
        const totalLossRatio =
            assessments.length > 0
                ? ((totalLossCount / assessments.length) * 100).toFixed(1)
                : 0;

        // Calculate repairer compliance (assessments with good compliance scores)
        const compliantAssessments = assessments.filter(
            a => (a.repairer_compliance_score || 0) >= 80
        ).length;
        const complianceRate =
            assessments.length > 0
                ? Math.round((compliantAssessments / assessments.length) * 100)
                : 0;

        // Get current month's data for trend calculation
        const currentDate = new Date();
        const firstDayOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );

        const currentMonthSavings = assessments
            .filter(a => {
                const createdAt = a.created_at ? new Date(a.created_at) : null;
                return createdAt && createdAt >= firstDayOfMonth;
            })
            .reduce((sum, a) => sum + (parseFloat(a.savings) || 0), 0);

        const currentMonthPreventedLosses = assessments.filter(a => {
            const createdAt = a.created_at ? new Date(a.created_at) : null;
            return (
                createdAt &&
                createdAt >= firstDayOfMonth &&
                a.total_loss === false &&
                (parseFloat(a.repairer_quote) || 0) > 15000
            );
        }).length;

        // Format currency values
        const formatCurrency = (value: number) => {
            if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
                return `$${(value / 1000).toFixed(1)}K`;
            }
            return `$${value.toFixed(0)}`;
        };

        return NextResponse.json({
            // Overall stats
            total_assessments: assessments.length,

            // Savings
            total_savings: totalSavings,
            total_savings_formatted: formatCurrency(totalSavings),
            current_month_savings: currentMonthSavings,
            current_month_savings_formatted:
                formatCurrency(currentMonthSavings),
            avg_savings_percentage: parseFloat(avgSavingsPercentage),

            // Prevented total losses
            prevented_total_losses: preventedTotalLosses,
            current_month_prevented_losses: currentMonthPreventedLosses,

            // Fraud
            fraud_cases: fraudCases,
            fraud_amount_blocked: fraudAmountBlocked,
            fraud_amount_blocked_formatted: formatCurrency(fraudAmountBlocked),

            // Financial totals
            total_quoted: totalQuoted,
            total_quoted_formatted: formatCurrency(totalQuoted),
            total_assessed: totalAssessed,
            total_assessed_formatted: formatCurrency(totalAssessed),

            // Ratios
            total_loss_ratio: parseFloat(totalLossRatio),
            compliance_rate: complianceRate,

            // Value preserved from prevented total losses
            value_preserved: preventedTotalLosses * 10000, // Estimate $10K per vehicle
            value_preserved_formatted: formatCurrency(
                preventedTotalLosses * 10000
            ),
        });
    } catch (error: any) {
        console.error('Error in dashboard stats API:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
