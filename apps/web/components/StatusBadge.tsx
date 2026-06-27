const COLORS: Record<string, string> = {
  enquiry: 'bg-slate-100 text-slate-700',
  offer_otp: 'bg-amber-100 text-amber-800',
  bond_application: 'bg-blue-100 text-blue-800',
  bond_granted: 'bg-indigo-100 text-indigo-800',
  documents_fica: 'bg-purple-100 text-purple-800',
  clearance: 'bg-cyan-100 text-cyan-800',
  lodgement: 'bg-teal-100 text-teal-800',
  registered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = COLORS[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
