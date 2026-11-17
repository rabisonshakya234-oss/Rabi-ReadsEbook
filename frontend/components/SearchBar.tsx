// A plain GET form: works without JavaScript and gives crawlers a real search URL.
export default function SearchBar({ action = '/search', defaultValue = '', size = '' }) {
  return (
    <form action={action} method="get" role="search" className="d-flex" style={{ gap: 8 }}>
      <input type="search" name="q" defaultValue={defaultValue} className={`form-control ${size}`} placeholder="Search title, author or keyword" aria-label="Search books" maxLength={100} />
      <button className={`btn btn-primary ${size}`} type="submit">Search</button>
    </form>
  );
}
