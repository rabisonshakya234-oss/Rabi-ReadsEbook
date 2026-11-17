'use client';
import { useAuth } from '@/components/AuthProvider';
import { api } from '@/lib/api';
import { useLoad } from '@/lib/hooks';
import BookForm from '@/components/BookForm';
import Alert from '@/components/Alert';

export default function EditBook({ params }) {
  const { token } = useAuth();
  const { data, error, loading } = useLoad(() => api(`/books/${params.id}`, { token }), [token, params.id]);
  return (<><h1 className="h3 mb-3">Edit Book</h1>{loading ? <p className="text-muted">Loading…</p> : error ? <Alert error={error} /> : <BookForm book={data.data} />}</>);
}
