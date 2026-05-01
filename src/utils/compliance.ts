import {
  Chama,
  ChamaContributionSetup,
  Contribution,
  ContributionType,
  MemberComplianceSummary,
  Membership,
  Penalty,
} from '@/types';

type SupportedFrequency = ContributionType['frequency'] | ChamaContributionSetup['frequency'];
type EffectiveContributionRule = {
  id: string;
  contributionTypeId: string | null;
  frequency: SupportedFrequency;
  default_amount: string;
  name: string;
};

const DEFAULT_GRACE_DAYS: Record<SupportedFrequency, number> = {
  daily: 0,
  weekly: 2,
  biweekly: 3,
  monthly: 5,
  quarterly: 7,
  annual: 14,
};

const toNumber = (value?: string | number | null) => Number(value || 0);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getPeriodRange = (reference: Date, frequency: SupportedFrequency, offset = 0) => {
  const base = startOfDay(reference);

  switch (frequency) {
    case 'daily': {
      const start = addDays(base, offset);
      return { start, end: addDays(start, 1) };
    }
    case 'weekly': {
      const day = base.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = addDays(base, mondayOffset + offset * 7);
      return { start, end: addDays(start, 7) };
    }
    case 'biweekly': {
      const day = base.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const anchor = new Date(base.getFullYear(), 0, 1);
      const anchorDay = anchor.getDay();
      const anchorMondayOffset = anchorDay === 0 ? -6 : 1 - anchorDay;
      const firstCycleStart = addDays(anchor, anchorMondayOffset);
      const diffDays = Math.floor(
        (startOfDay(base).getTime() - startOfDay(firstCycleStart).getTime()) / (1000 * 60 * 60 * 24)
      );
      const cycleIndex = Math.floor(diffDays / 14) + offset;
      const start = addDays(firstCycleStart, cycleIndex * 14);
      return { start, end: addDays(start, 14) };
    }
    case 'monthly': {
      const start = new Date(base.getFullYear(), base.getMonth() + offset, 1);
      return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 1) };
    }
    case 'quarterly': {
      const quarterStartMonth = Math.floor(base.getMonth() / 3) * 3 + offset * 3;
      const start = new Date(base.getFullYear(), quarterStartMonth, 1);
      return { start, end: new Date(start.getFullYear(), start.getMonth() + 3, 1) };
    }
    case 'annual': {
      const start = new Date(base.getFullYear() + offset, 0, 1);
      return { start, end: new Date(start.getFullYear() + 1, 0, 1) };
    }
    default:
      return { start: base, end: addDays(base, 1) };
  }
};

const clampDay = (year: number, month: number, day: number) => {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.max(1, Math.min(day, lastDay));
};

const getDueDate = (periodStart: Date, frequency: SupportedFrequency, dueDay?: number | null) => {
  const normalizedDueDay = dueDay && Number.isFinite(dueDay) ? dueDay : null;

  switch (frequency) {
    case 'daily':
      return periodStart;
    case 'weekly': {
      const weeklyOffset = normalizedDueDay ? Math.max(0, Math.min(6, normalizedDueDay - 1)) : 0;
      return addDays(periodStart, weeklyOffset);
    }
    case 'biweekly': {
      const biweeklyOffset = normalizedDueDay ? Math.max(0, Math.min(13, normalizedDueDay - 1)) : 0;
      return addDays(periodStart, biweeklyOffset);
    }
    case 'monthly':
    case 'quarterly':
    case 'annual': {
      const day = normalizedDueDay ?? 1;
      return new Date(
        periodStart.getFullYear(),
        periodStart.getMonth(),
        clampDay(periodStart.getFullYear(), periodStart.getMonth(), day)
      );
    }
    default:
      return periodStart;
  }
};

const getGraceDeadline = (
  periodStart: Date,
  frequency: SupportedFrequency,
  dueDay?: number | null,
  gracePeriodDays?: number | null
) => {
  const dueDate = getDueDate(periodStart, frequency, dueDay);
  const graceDays = gracePeriodDays ?? DEFAULT_GRACE_DAYS[frequency] ?? 0;
  return addDays(dueDate, graceDays);
};

const sumContributionAmount = (
  contributions: Contribution[],
  memberId: string,
  contributionTypeId: string | null,
  start: Date,
  end: Date
) =>
  contributions
    .filter((contribution) => {
      const paidAt = new Date(contribution.date_paid);
      return (
        contribution.member.id === memberId &&
        (contributionTypeId ? contribution.contribution_type === contributionTypeId : true) &&
        paidAt >= start &&
        paidAt < end
      );
    })
    .reduce((sum, contribution) => sum + toNumber(contribution.amount), 0);

const getLastContributionDate = (contributions: Contribution[], memberId: string) => {
  const latest = contributions
    .filter((contribution) => contribution.member.id === memberId)
    .sort((left, right) => new Date(right.date_paid).getTime() - new Date(left.date_paid).getTime())[0];

  return latest?.date_paid || null;
};

const getPenaltySummary = (penalties: Penalty[], memberId: string) => {
  const pending = penalties.filter(
    (penalty) =>
      (penalty.member?.id || penalty.member_id) === memberId &&
      ['pending', 'due', 'overdue'].includes(penalty.status)
  );

  return {
    count: pending.length,
    total: pending.reduce((sum, penalty) => sum + toNumber(penalty.amount), 0),
  };
};

export const buildComplianceSummaries = (params: {
  chamaId: string;
  chama?: Chama | null;
  members: Membership[];
  contributionTypes: ContributionType[];
  contributions: Contribution[];
  penalties: Penalty[];
  now?: Date;
}): MemberComplianceSummary[] => {
  const {
    chamaId,
    chama,
    members,
    contributionTypes,
    contributions,
    penalties,
    now = new Date(),
  } = params;

  const activeTypes = contributionTypes.filter((type) => type.is_active);
  const policy = chama?.contribution_setup;
  const effectiveTypes: EffectiveContributionRule[] =
    activeTypes.length > 0
      ? activeTypes.map((type) => ({
          id: type.id,
          contributionTypeId: type.id,
          frequency: type.frequency,
          default_amount: type.default_amount,
          name: type.name,
        }))
      : policy
      ? [
          {
            id: `${chamaId}-default-contribution`,
            contributionTypeId: null,
            name: 'Default Contribution',
            frequency: policy.frequency,
            default_amount: policy.amount,
          },
        ]
      : [];

  return members
    .filter((member) => member.is_active && member.is_approved)
    .map((member) => {
      let expectedAmount = 0;
      let paidAmount = 0;
      let missedCurrent = 0;
      let latestGraceDeadlineMs: number | null = null;
      let suggestedFineAmount = 0;

      effectiveTypes.forEach((type) => {
        const currentRange = getPeriodRange(now, type.frequency, 0);
        const currentPaid = sumContributionAmount(
          contributions,
          member.user.id,
          type.contributionTypeId,
          currentRange.start,
          currentRange.end
        );
        const targetAmount = toNumber(type.default_amount);
        const graceDeadline = getGraceDeadline(
          currentRange.start,
          type.frequency,
          policy?.due_day,
          policy?.grace_period_days
        );
        const hasMetTarget = targetAmount > 0 ? currentPaid >= targetAmount : currentPaid > 0;

        expectedAmount += targetAmount;
        paidAmount += currentPaid;
        latestGraceDeadlineMs =
          latestGraceDeadlineMs === null || graceDeadline.getTime() > latestGraceDeadlineMs
            ? graceDeadline.getTime()
            : latestGraceDeadlineMs;

        if (!hasMetTarget && now > graceDeadline) {
          missedCurrent += 1;
          suggestedFineAmount += policy?.late_fine_amount
            ? toNumber(policy.late_fine_amount)
            : Math.max(50, Math.round(targetAmount * 0.05));
        }
      });

      const isPeriodSatisfied = (offset: number) => {
        let satisfied = true;

        effectiveTypes.forEach((type) => {
          const range = getPeriodRange(now, type.frequency, offset);
          const historicalPaid = sumContributionAmount(
            contributions,
            member.user.id,
            type.contributionTypeId,
            range.start,
            range.end
          );
          const targetAmount = toNumber(type.default_amount);

          if (targetAmount > 0 ? historicalPaid < targetAmount : historicalPaid <= 0) {
            satisfied = false;
          }
        });

        return satisfied;
      };

      let missedCycles = 0;
      for (let offset = -1; offset >= -6; offset -= 1) {
        if (!isPeriodSatisfied(offset)) {
          missedCycles += 1;
        }
      }

      let contributionStreak = 0;
      for (let offset = -1; offset >= -6; offset -= 1) {
        if (isPeriodSatisfied(offset)) {
          contributionStreak += 1;
        } else {
          break;
        }
      }

      const penaltiesSummary = getPenaltySummary(penalties, member.user.id);
      let currentStatus: MemberComplianceSummary['current_status'] = 'missed';
      if (missedCurrent === 0) {
        if (paidAmount >= expectedAmount && expectedAmount > 0) {
          currentStatus = 'paid';
        } else if (latestGraceDeadlineMs !== null && now.getTime() <= latestGraceDeadlineMs) {
          currentStatus = 'in_grace';
        } else if (expectedAmount <= 0) {
          currentStatus = 'paid';
        }
      }

      const complianceScore = Math.max(
        0,
        Math.min(
          100,
          60 +
            contributionStreak * 8 +
            (currentStatus === 'paid' ? 12 : currentStatus === 'in_grace' ? 4 : -18) -
            missedCycles * 14 -
            penaltiesSummary.count * 10
        )
      );

      const riskScore = Math.max(
        0,
        Math.min(100, 100 - complianceScore + penaltiesSummary.count * 5 + missedCurrent * 8)
      );

      return {
        member_id: member.user.id,
        member_name: member.user.full_name,
        chama_id: chamaId,
        expected_amount: expectedAmount.toFixed(2),
        paid_amount: paidAmount.toFixed(2),
        pending_penalties: penaltiesSummary.count,
        pending_penalty_amount: penaltiesSummary.total.toFixed(2),
        missed_cycles: missedCycles + missedCurrent,
        contribution_streak: contributionStreak,
        compliance_score: complianceScore,
        risk_score: riskScore,
        current_status: currentStatus,
        suggested_fine_amount: suggestedFineAmount.toFixed(2),
        grace_deadline: latestGraceDeadlineMs !== null ? new Date(latestGraceDeadlineMs).toISOString() : null,
        last_paid_at: getLastContributionDate(contributions, member.user.id),
      };
    })
    .sort((left, right) => right.risk_score - left.risk_score);
};
