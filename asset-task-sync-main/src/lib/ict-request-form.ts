import { format } from 'date-fns';
import { MaintenanceTicket } from '@/integrations/laravel/client';

export const ICT_FORM_META = {
  companyNameAmharic: 'የኢትዮጵያ ኢንጂነሪንግ ኮርፖሬሽን',
  companyName: 'Ethiopian Engineering Corporation',
  title: 'ICT Service & Requisition Request Form',
  documentNo: 'CSF /CORP/IT/001',
  issueNo: '1',
  pageNo: '1 of 1',
  effectiveDate: '26-Dec-2025',
  footer: 'Please make sure that this document is the correct version before use',
} as const;

export type IctRequestTypeKey =
  | 'hardware'
  | 'technical'
  | 'software'
  | 'network'
  | 'email'
  | 'other';

export interface IctRequestTypeSelection {
  hardware: boolean;
  technical: boolean;
  software: boolean;
  network: boolean;
  email: boolean;
  other: boolean;
}

export interface IctFormLineItem {
  item: number;
  description: string;
  quantity: string;
  justification: string;
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

/**
 * Map existing ticket category/type/text onto the official form checkboxes.
 * Keyword matches use the ticket's own title and description only.
 */
export function mapIctRequestTypes(ticket: MaintenanceTicket): IctRequestTypeSelection {
  const text = `${ticket.title} ${ticket.description || ''} ${ticket.type} ${ticket.support_category || ''}`.toLowerCase();

  const hardware =
    ticket.type === 'installation' ||
    includesAny(text, [
      'hardware',
      'equipment',
      'laptop',
      'desktop',
      'printer',
      'monitor',
      'keyboard',
      'mouse',
      'requisition',
    ]);

  const technical =
    ['repair', 'maintenance', 'inspection'].includes(ticket.type) ||
    ticket.support_category === 'it_support' ||
    includesAny(text, ['troubleshoot', 'not working', 'issue', 'error', 'broken']);

  const software =
    ticket.support_category === 'sap' ||
    includesAny(text, ['software', 'system access', 'sap', 'license', 'application', 'erp']);

  const network = includesAny(text, ['network', 'wifi', 'wi-fi', 'vpn', 'lan', 'wan', 'internet']);
  const email = includesAny(text, ['email', 'active directory', 'ad account', 'outlook', 'mailbox']);

  const matched = hardware || technical || software || network || email;
  const other = ticket.type === 'other' || !matched;

  return { hardware, technical, software, network, email, other };
}

export function formatFormDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, 'dd-MMM-yyyy');
}

export function buildIctLineItems(ticket: MaintenanceTicket): IctFormLineItem[] {
  const parts: IctFormLineItem[] = [];
  const justification = ticket.notes?.trim() || '';

  const problemLines = [
    ticket.title,
    ticket.description?.trim(),
    ticket.asset
      ? `Asset: ${ticket.asset.name}${ticket.asset.serial_number ? ` (${ticket.asset.serial_number})` : ''}`
      : '',
    ticket.actions_taken
      ? `Action Taken: ${ticket.actions_taken}`
      : ticket.diagnosis
        ? `Diagnosis: ${ticket.diagnosis}`
        : '',
  ].filter(Boolean);

  parts.push({
    item: 1,
    description: problemLines.join(' | '),
    quantity: '1',
    justification,
  });

  (ticket.spare_parts || []).forEach((part) => {
    parts.push({
      item: parts.length + 1,
      description: part.name,
      quantity: part.quantity != null ? String(part.quantity) : '1',
      justification: '',
    });
  });

  while (parts.length < 3) {
    parts.push({
      item: parts.length + 1,
      description: '',
      quantity: '',
      justification: '',
    });
  }

  return parts.slice(0, 3);
}

export function ictDivisionStatus(ticket: MaintenanceTicket): {
  completed: boolean;
  inProgress: boolean;
  escalated: boolean;
} {
  if (ticket.status === 'completed') {
    return { completed: true, inProgress: false, escalated: false };
  }
  if (ticket.status === 'reopened') {
    return { completed: false, inProgress: false, escalated: true };
  }
  if (['assigned', 'in_progress', 'approved', 'completed_pending_review'].includes(ticket.status)) {
    return { completed: false, inProgress: true, escalated: false };
  }
  return { completed: false, inProgress: false, escalated: false };
}
