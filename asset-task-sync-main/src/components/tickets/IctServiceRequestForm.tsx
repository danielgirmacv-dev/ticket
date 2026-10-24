import { MaintenanceTicket } from '@/integrations/laravel/client';
import { eeccLogo } from '@/lib/branding';
import {
  ICT_FORM_META,
  buildIctLineItems,
  formatFormDate,
  ictDivisionStatus,
  mapIctRequestTypes,
} from '@/lib/ict-request-form';
import './IctServiceRequestForm.css';

function Check({ checked, label }: { checked: boolean; label: string }) {
  return (
    <span className="ict-check-row">
      <span className="ict-check" aria-checked={checked} aria-label={label}>
        {checked ? '✓' : ''}
      </span>
      <span>{label}</span>
    </span>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="ict-field-container">
      <span className="ict-field-label">{label}: </span>
      <span className="ict-field-value">{value || '\u00A0'}</span>
    </div>
  );
}

function SignLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="ict-sign-line-container">
      <span className="ict-sign-label">{label}:</span>
      <span className="ict-sign-line">{value || '\u00A0'}</span>
    </div>
  );
}

function isSuperAdmin(name?: string | null, email?: string | null): boolean {
  const text = `${name || ''} ${email || ''}`.toLowerCase();
  return text.includes('super admin') || text.includes('superadmin');
}

interface IctServiceRequestFormProps {
  ticket: MaintenanceTicket;
}

export function IctServiceRequestForm({ ticket }: IctServiceRequestFormProps) {
  const types = mapIctRequestTypes(ticket);
  const items = buildIctLineItems(ticket);
  const division = ictDivisionStatus(ticket);
  const requester = ticket.requester;

  // Use the approved manager or assigned manager, strictly avoiding Super Admin name
  const managerProfile =
    ticket.assigned_manager && !isSuperAdmin(ticket.assigned_manager.name, ticket.assigned_manager.email)
      ? ticket.assigned_manager
      : ticket.approved_by_profile && !isSuperAdmin(ticket.approved_by_profile.name, ticket.approved_by_profile.email)
        ? ticket.approved_by_profile
        : null;

  const managerName = managerProfile?.name || '';
  const managerApprovalDate = formatFormDate(ticket.approved_at || ticket.completed_date);

  return (
    <div className="ict-a4-sheet print-document" id="ict-service-form">
      {/* 1. DOCUMENT HEADER (Standalone Table) */}
      <header className="ict-doc-header">
        <table className="ict-header-table">
          <tbody>
            <tr>
              <td className="ict-header-company" colSpan={2}>
                <div className="ict-header-brand">
                  <img src={eeccLogo} alt="EEC logo" className="ict-header-logo" />
                  <div>
                    <div className="ict-header-label">የድርጅቱ ስም /Company Name:</div>
                    <div className="ict-header-amharic">{ICT_FORM_META.companyNameAmharic}</div>
                    <div className="ict-header-english">{ICT_FORM_META.companyName}</div>
                  </div>
                </div>
              </td>
              <td className="ict-header-meta" colSpan={2}>
                <div className="ict-header-label">Effective Date:</div>
                <strong>{ICT_FORM_META.effectiveDate}</strong>
              </td>
            </tr>
            <tr>
              <td className="ict-title-cell">
                <div className="ict-header-label">ርዕስ/Title:</div>
                <div className="ict-form-title">{ICT_FORM_META.title}</div>
              </td>
              <td className="ict-doc-cell">
                <div className="ict-header-label">Document No.</div>
                <strong>{ICT_FORM_META.documentNo}</strong>
              </td>
              <td className="ict-issue-cell">
                <div className="ict-header-label">Issue No.</div>
                <strong>{ICT_FORM_META.issueNo}</strong>
              </td>
              <td className="ict-page-cell">
                <div className="ict-header-label">Page No.</div>
                <strong>{ICT_FORM_META.pageNo}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </header>

      {/* 2. BODY — 5 SEPARATE FORM SECTIONS */}
      <main className="ict-doc-body">
        {/* SECTION 1: REQUESTER & DEPARTMENT DETAILS */}
        <section className="ict-section">
          <div className="ict-section-banner">1. REQUESTER &amp; DEPARTMENT DETAILS</div>
          <table className="ict-section-table">
            <tbody>
              <tr>
                <td className="ict-two-col">
                  <Field label="Full Name" value={requester?.name} />
                </td>
                <td className="ict-two-col">
                  <Field label="Employee ID" value="" />
                </td>
              </tr>
              <tr>
                <td className="ict-two-col">
                  <Field label="Department" value={requester?.department} />
                </td>
                <td className="ict-two-col">
                  <Field label="Job Title" value="" />
                </td>
              </tr>
              <tr>
                <td className="ict-two-col">
                  <Field label="Email Address" value={requester?.email} />
                </td>
                <td className="ict-two-col">
                  <Field label="Phone / Ext" value={requester?.phone} />
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* SECTION 2: TYPE OF ICT REQUEST */}
        <section className="ict-section">
          <div className="ict-section-banner">2. TYPE OF ICT REQUEST</div>
          <div className="ict-section-box ict-type-box">
            <div className="ict-type-grid">
              <div className="ict-type-item">
                <span className="ict-check">{types.hardware ? '✓' : ''}</span>
                <span>Hardware / Equipment Requisition</span>
              </div>
              <div className="ict-type-item">
                <span className="ict-check">{types.technical ? '✓' : ''}</span>
                <span>Technical Support / Troubleshooting</span>
              </div>
              <div className="ict-type-item">
                <span className="ict-check">{types.software ? '✓' : ''}</span>
                <span>Software / System Access Request</span>
              </div>
              <div className="ict-type-item">
                <span className="ict-check">{types.network ? '✓' : ''}</span>
                <span>Network / Wi-Fi / VPN Configuration</span>
              </div>
              <div className="ict-type-item">
                <span className="ict-check">{types.email ? '✓' : ''}</span>
                <span>Email / Active Directory Account</span>
              </div>
              <div className="ict-type-item">
                <span className="ict-check">{types.other ? '✓' : ''}</span>
                <span>Other (Specify in details below)</span>
              </div>
            </div>
            <div className="ict-priority-row">
              <span className="ict-priority-label">Priority Level:</span>
              <Check checked={ticket.priority === 'low'} label="Low (Standard)" />
              <Check checked={ticket.priority === 'medium'} label="Medium (3-5 Days)" />
              <Check
                checked={ticket.priority === 'high' || ticket.priority === 'critical'}
                label="High / Critical (Urgent)"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: DETAILED REQUISITION / PROBLEM DESCRIPTION */}
        <section className="ict-section">
          <div className="ict-section-banner">3. DETAILED REQUISITION / PROBLEM DESCRIPTION</div>
          <table className="ict-desc-table">
            <thead>
              <tr>
                <th className="ict-col-item">Item #</th>
                <th className="ict-col-desc">Description / Hardware / Software Name</th>
                <th className="ict-col-qty">Qty</th>
                <th className="ict-col-just">Justification / Business Need</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.item}>
                  <td className="ict-col-item">{item.item}</td>
                  <td className="ict-col-desc">{item.description || '\u00A0'}</td>
                  <td className="ict-col-qty">{item.quantity || '\u00A0'}</td>
                  <td className="ict-col-just">{item.justification || '\u00A0'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* SECTION 4: APPROVALS & SIGNATURES */}
        <section className="ict-section">
          <div className="ict-section-banner">4. APPROVALS &amp; SIGNATURES</div>
          <table className="ict-approval-table">
            <thead>
              <tr>
                <th>Requested By</th>
                <th>Department Head Approval</th>
                <th>ICT Support Client Manager Approval</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="ict-sign-block">
                  <SignLine label="Name" value={requester?.name} />
                  <SignLine label="Signature" value="" />
                  <SignLine label="Date" value={formatFormDate(ticket.created_at)} />
                </td>
                <td className="ict-sign-block">
                  <SignLine label="Name" value="" />
                  <SignLine label="Signature" value="" />
                  <SignLine label="Date" value="" />
                  <div className="ict-status-options">
                    <strong>Status:</strong>
                    <Check checked={false} label="Approved" />
                    <Check checked={false} label="Rejected" />
                  </div>
                </td>
                <td className="ict-sign-block">
                  <SignLine label="Name" value={managerName} />
                  <SignLine label="Signature" value="" />
                  <SignLine label="Date" value={managerApprovalDate} />
                  <div className="ict-status-options">
                    <strong>Status:</strong>
                    <Check checked={true} label="Approved" />
                    <Check checked={false} label="Pending" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* SECTION 5: FOR ICT CLIENT SUPPORT DIVISION USE ONLY */}
        <section className="ict-section">
          <div className="ict-section-banner">5. FOR ICT CLIENT SUPPORT DIVISION USE ONLY</div>
          <div className="ict-section-box ict-division-box">
            <div className="ict-division-grid">
              <div className="ict-division-left">
                <div className="ict-div-field">
                  <span className="ict-field-label">Assigned Technician:</span>
                  <span className="ict-blank-line">{ticket.assigned_technician?.name || '\u00A0'}</span>
                </div>
                <div className="ict-div-field">
                  <span className="ict-field-label">Date Action Taken:</span>
                  <span className="ict-blank-line">{formatFormDate(ticket.completed_date || ticket.updated_at) || '\u00A0'}</span>
                </div>
                <div className="ict-div-field">
                  <span className="ict-field-label">Asset Tag (if applicable):</span>
                  <span className="ict-blank-line">{ticket.asset?.serial_number || '\u00A0'}</span>
                </div>
              </div>
              <div className="ict-division-right">
                <div className="ict-div-field">
                  <span className="ict-field-label">Status:</span>
                  <span className="ict-status-checks">
                    <Check checked={division.completed} label="Completed" />
                    <Check checked={division.inProgress} label="In Progress" />
                    <Check checked={division.escalated} label="Escalated" />
                  </span>
                </div>
                <div className="ict-div-field" style={{ marginTop: '12px' }}>
                  <span className="ict-field-label">Technician Signature:</span>
                  <span className="ict-blank-line">{'\u00A0'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 3. DOCUMENT FOOTER */}
      <footer className="ict-doc-footer">
        <div className="ict-footer-text">{ICT_FORM_META.footer}</div>
      </footer>
    </div>
  );
}
