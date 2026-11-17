import ContactForm from './ContactForm';
export const metadata = { title: 'Contact Us', description: 'Send a message to the RabiReads team.', alternates: { canonical: '/contact' } };
export default function Contact() {
  return (
    <div className="container py-5" style={{ maxWidth: 680 }}>
      <h1 className="mb-3">Contact Us</h1>
      <p className="text-muted">Have a question, a book request or feedback? Send us a message.</p>
      <ContactForm />
    </div>
  );
}
