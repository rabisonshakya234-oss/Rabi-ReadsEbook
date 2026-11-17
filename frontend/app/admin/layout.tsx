import AdminShell from './AdminShell';
export const metadata = { title: { default: 'Admin', template: '%s | RabiReads Admin' }, robots: { index: false, follow: false } };
export default function AdminLayout({ children }) { return <AdminShell>{children}</AdminShell>; }
