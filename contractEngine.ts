export interface Clause {
  type: 'DEPOSIT' | 'LATE_FEE' | 'CANCELLATION_WINDOW' | 'DAMAGE_LIABILITY' | 'REQUIRES_ARBITRATION';
  title: string;
  params: Record<string, any>;
  description?: string;
}

export interface CompiledContractSnapshot {
  compiledAt: string;
  templateId?: string;
  templateName?: string;
  clauses: Clause[];
  legalNotice: string;
}

export function compileContractClauses(templateClauses?: Clause[], templateName?: string, templateId?: string): CompiledContractSnapshot {
  const defaultClauses: Clause[] = [
    {
      type: 'DEPOSIT',
      title: 'Standard Security Deposit',
      params: { amountPercent: 15, refundable: true },
      description: 'A 15% security deposit is held in escrow until item return.',
    },
    {
      type: 'CANCELLATION_WINDOW',
      title: '24-Hour Free Cancellation',
      params: { windowHours: 24, penaltyPercent: 10 },
      description: 'Full refund if cancelled at least 24 hours before start date.',
    },
    {
      type: 'REQUIRES_ARBITRATION',
      title: 'RentAny Platform Binding Arbitration',
      params: { arbitratorRole: 'ADMIN_ARBITRATOR' },
      description: 'All disputes must be submitted to RentAny platform arbitrators whose decision is final and binding.',
    },
  ];

  const activeClauses = (templateClauses && templateClauses.length > 0) ? templateClauses : defaultClauses;

  return {
    compiledAt: new Date().toISOString(),
    templateId: templateId || 'default-standard-template',
    templateName: templateName || 'Standard Rental Agreement',
    clauses: activeClauses,
    legalNotice: 'IMMUTABLE CONTRACT SNAPSHOT: This document represents the binding, frozen contract snapshot agreed upon by Owner and Renter at acceptance time. Subsequent template edits by the Owner do not alter this snapshot.',
  };
}

export function renderHumanReadableContract(
  itemTitle: string,
  ownerName: string,
  renterName: string,
  startDate: string,
  endDate: string,
  totalAmount: number,
  snapshot: CompiledContractSnapshot
): string {
  const clauseSections = snapshot.clauses.map((c, index) => {
    let detailText = c.description || '';
    if (c.type === 'DEPOSIT') {
      detailText = `Security Deposit: ${c.params.amountPercent || 10}% of total rental value. Refundable: ${c.params.refundable ? 'Yes' : 'No'}.`;
    } else if (c.type === 'LATE_FEE') {
      detailText = `Late Fee Rate: $${c.params.dailyFee || 50}/day for unauthorized overdue returns.`;
    } else if (c.type === 'CANCELLATION_WINDOW') {
      detailText = `Cancellation Policy: Free cancellation up to ${c.params.windowHours || 24} hours prior to start. ${c.params.penaltyPercent || 10}% fee thereafter.`;
    } else if (c.type === 'DAMAGE_LIABILITY') {
      detailText = `Damage Liability Limit: Renter assumes liability up to $${c.params.maxDeductible || 500} for repair/replacement of damaged items.`;
    } else if (c.type === 'REQUIRES_ARBITRATION') {
      detailText = `Dispute Resolution: Parties agree to binding arbitration administered by RentAny platform.`;
    }

    return `SECTION ${index + 1}: ${c.title.toUpperCase()}\nType: ${c.type}\n${detailText}\n`;
  }).join('\n----------------------------------------\n');

  return `
================================================================================
                        RENTANY PEER-TO-PEER RENTAL AGREEMENT
================================================================================

AGREEMENT SUMMARY:
- Item: ${itemTitle}
- Owner (Lessor): ${ownerName}
- Renter (Lessee): ${renterName}
- Start Date: ${new Date(startDate).toLocaleString()}
- End Date: ${new Date(endDate).toLocaleString()}
- Total Payable Amount: $${totalAmount.toFixed(2)} USD
- Compiled Date: ${new Date(snapshot.compiledAt).toLocaleString()}

--------------------------------------------------------------------------------
                             BINDING CONTRACT CLAUSES
--------------------------------------------------------------------------------

${clauseSections}

--------------------------------------------------------------------------------
NOTICE & ACKNOWLEDGMENT:
${snapshot.legalNotice}
================================================================================
  `.trim();
}
