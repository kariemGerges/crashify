/**
 * CICOP SLA Service
 *
 * - Business-hours aware deadline calculation (Mon–Fri, configurable)
 * - Per-insurer SLA config and commitment text
 * - Breach detection
 *
 * Config loaded from cicop_config: business_hours, insurer_sla, sla_default_hours
 */

import { createServerClient } from '@/server/lib/supabase/client';

export interface BusinessHoursConfig {
  enabled: boolean;
  timezone: string;
  days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat. Typically [1,2,3,4,5] for Mon-Fri
  start_hour: number;
  end_hour: number;
}

export interface InsurerSlaConfig {
  sla_hours: number;
  business_hours_only: boolean;
  commitment_text: string;
}

export interface SlaConfig {
  sla_hours: number;
  business_hours_only: boolean;
  commitment_text: string;
}

export interface SlaTrackingResult {
  claim_reference: string;
  sla_hours: number;
  sla_deadline: Date;
  business_hours_only: boolean;
  commitment_text: string;
}

const DEFAULT_SLA_HOURS = 48;
const DEFAULT_COMMITMENT =
  'A member of our leadership team will contact you within the next 48 hours.';
const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  enabled: false,
  timezone: 'Australia/Melbourne',
  days: [1, 2, 3, 4, 5], // Mon-Fri
  start_hour: 9,
  end_hour: 17,
};

export class CICOPSLAService {
  private configCache: {
    business_hours: BusinessHoursConfig;
    insurer_sla: Record<string, InsurerSlaConfig>;
    default_sla_hours: number;
  } | null = null;

  private async loadConfig(): Promise<{
    business_hours: BusinessHoursConfig;
    insurer_sla: Record<string, InsurerSlaConfig>;
    default_sla_hours: number;
  }> {
    if (this.configCache) return this.configCache;

    const supabase = createServerClient();

    type ConfigRow = { data: { value?: unknown } | null };
    const [bhRes, insurerRes, defaultRes] = await Promise.all([
      supabase.from('cicop_config').select('value').eq('key', 'business_hours').single(),
      supabase.from('cicop_config').select('value').eq('key', 'insurer_sla').single(),
      supabase.from('cicop_config').select('value').eq('key', 'sla_default_hours').single(),
    ]);
    const bhRow = bhRes as ConfigRow;
    const insurerRow = insurerRes as ConfigRow;
    const defaultRow = defaultRes as ConfigRow;

    const business_hours: BusinessHoursConfig = bhRow?.data?.value
      ? { ...DEFAULT_BUSINESS_HOURS, ...(bhRow.data.value as object) }
      : DEFAULT_BUSINESS_HOURS;

    const insurer_sla: Record<string, InsurerSlaConfig> = insurerRow?.data?.value
      ? (insurerRow.data.value as Record<string, InsurerSlaConfig>)
      : {};

    const default_sla_hours =
      (defaultRow?.data?.value as number) ?? DEFAULT_SLA_HOURS;

    this.configCache = { business_hours, insurer_sla, default_sla_hours };
    return this.configCache;
  }

  getInsurerDomain(senderEmail: string): string {
    if (senderEmail.includes('@')) {
      return senderEmail.split('@')[1].toLowerCase();
    }
    return 'unknown';
  }

  async getSlaConfig(insurerDomain: string): Promise<SlaConfig> {
    const { insurer_sla, default_sla_hours, business_hours } = await this.loadConfig();

    if (insurerDomain && insurer_sla[insurerDomain]) {
      const c = insurer_sla[insurerDomain];
      return {
        sla_hours: c.sla_hours,
        business_hours_only: c.business_hours_only ?? false,
        commitment_text: c.commitment_text ?? DEFAULT_COMMITMENT,
      };
    }

    for (const [key, c] of Object.entries(insurer_sla)) {
      if (key && (insurerDomain?.includes(key) || key.includes(insurerDomain))) {
        return {
          sla_hours: c.sla_hours,
          business_hours_only: c.business_hours_only ?? false,
          commitment_text: c.commitment_text ?? DEFAULT_COMMITMENT,
        };
      }
    }

    const commitment =
      business_hours.enabled
        ? `A member of our leadership team will contact you within ${default_sla_hours} business hours.`
        : `A member of our leadership team will contact you within the next ${default_sla_hours} hours.`;

    return {
      sla_hours: default_sla_hours,
      business_hours_only: false,
      commitment_text: commitment,
    };
  }

  /**
   * Calculate SLA deadline, optionally counting only business hours.
   * Business days/hours from config (e.g. Mon–Fri 9–17).
   */
  calculateSlaDeadline(
    startTime: Date,
    slaHours: number,
    businessHoursOnly: boolean
  ): Date {
    const { business_hours } = this.getConfigSync();
    if (!businessHoursOnly || !business_hours.enabled) {
      const end = new Date(startTime.getTime() + slaHours * 60 * 60 * 1000);
      return end;
    }

    const startHour = business_hours.start_hour;
    const endHour = business_hours.end_hour;
    const businessDays = new Set(business_hours.days);

    let current = new Date(startTime.getTime());
    let hoursRemaining = slaHours;

    while (hoursRemaining > 0) {
      const dayOfWeek = current.getDay();
      if (!businessDays.has(dayOfWeek)) {
        current.setDate(current.getDate() + 1);
        current.setHours(startHour, 0, 0, 0);
        continue;
      }

      const hour = current.getHours();
      if (hour < startHour) {
        current.setHours(startHour, 0, 0, 0);
        continue;
      }
      if (hour >= endHour) {
        current.setDate(current.getDate() + 1);
        current.setHours(startHour, 0, 0, 0);
        continue;
      }

      const hoursAvailableToday = endHour - hour;
      if (hoursRemaining <= hoursAvailableToday) {
        current.setTime(current.getTime() + hoursRemaining * 60 * 60 * 1000);
        hoursRemaining = 0;
      } else {
        hoursRemaining -= hoursAvailableToday;
        current.setDate(current.getDate() + 1);
        current.setHours(startHour, 0, 0, 0);
      }
    }

    return current;
  }

  private getConfigSync(): { business_hours: BusinessHoursConfig } {
    if (this.configCache) return this.configCache;
    return { business_hours: DEFAULT_BUSINESS_HOURS };
  }

  /**
   * Start SLA tracking for a claim: get per-insurer config, calculate deadline, insert row.
   */
  async startSlaTracking(
    claimReference: string,
    sender: string,
    urgency: string
  ): Promise<SlaTrackingResult> {
    const supabase = createServerClient();
    const insurerDomain = this.getInsurerDomain(sender);
    const config = await this.getSlaConfig(insurerDomain);

    let slaHours = config.sla_hours;
    let commitmentText = config.commitment_text;

    if (urgency === 'urgent' && slaHours > 2) {
      slaHours = Math.max(2, Math.floor(slaHours / 2));
      commitmentText = commitmentText.replace(
        `${config.sla_hours} hours`,
        `${slaHours} hours (URGENT)`
      );
    }

    const startTime = new Date();
    const slaDeadline = this.calculateSlaDeadline(
      startTime,
      slaHours,
      config.business_hours_only
    );

    const { data: existing } = await supabase
      .from('cicop_sla_tracking')
      .select('id')
      .eq('claim_reference', claimReference)
      .single();

    if (!existing) {
      // cicop_sla_tracking may not be in generated Supabase types
      const table = supabase.from('cicop_sla_tracking') as unknown as { insert: (row: object) => ReturnType<ReturnType<typeof supabase.from>['insert']> };
      await table.insert({
        claim_reference: claimReference,
        sender,
        insurer_domain: insurerDomain,
        urgency,
        sla_deadline: slaDeadline.toISOString(),
        sla_hours: slaHours,
        business_hours_only: config.business_hours_only,
        commitment_text: commitmentText,
        status: 'in_progress',
      });
    }

    return {
      claim_reference: claimReference,
      sla_hours: slaHours,
      sla_deadline: slaDeadline,
      business_hours_only: config.business_hours_only,
      commitment_text: commitmentText,
    };
  }

  invalidateConfigCache(): void {
    this.configCache = null;
  }
}

export const cicopSlaService = new CICOPSLAService();
