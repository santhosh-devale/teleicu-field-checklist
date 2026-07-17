import { allItems } from '../data/checklistData';
import type { OverallStatus, ResponsesMap } from '../types';

export interface StatusBreakdown {
  overall: OverallStatus;
  totalItems: number;
  answered: number;
  workingCount: number;
  notWorkingCount: number;
  criticalFailures: { id: string; label: string }[];
}

/**
 * Rules (adjustable):
 *  - Any "critical" item marked Not Working  -> Critical
 *  - No critical failures, but > 3 non-critical items Not Working -> Critical
 *  - No critical failures, 1-3 items Not Working -> Issues Found
 *  - Zero items Not Working -> OK
 */
export function calculateOverallStatus(responses: ResponsesMap): StatusBreakdown {
  let workingCount = 0;
  let notWorkingCount = 0;
  let answered = 0;
  const criticalFailures: { id: string; label: string }[] = [];

  for (const item of allItems) {
    const r = responses[item.id];
    if (!r || r.status === null) continue;
    answered += 1;
    if (r.status === 'working') {
      workingCount += 1;
    } else {
      notWorkingCount += 1;
      if (item.critical) {
        criticalFailures.push({ id: item.id, label: item.label });
      }
    }
  }

  let overall: OverallStatus = 'OK';
  if (criticalFailures.length > 0 || notWorkingCount > 3) {
    overall = 'Critical';
  } else if (notWorkingCount > 0) {
    overall = 'Issues Found';
  }

  return {
    overall,
    totalItems: allItems.length,
    answered,
    workingCount,
    notWorkingCount,
    criticalFailures,
  };
}
