import ResetForm from './ResetForm';
export const metadata = { title: 'Reset password', robots: { index: false, follow: false } };
export default function Reset({ params }) { return <ResetForm token={params.token} />; }
