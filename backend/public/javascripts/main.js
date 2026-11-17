// Minimal front page: lists genres, lists books for the chosen genre, downloads PDF / EPUB (login is optional).
var token = localStorage.getItem('token') || '';
var genresEl = document.getElementById('genres');
var booksEl = document.getElementById('books');
var whoEl = document.getElementById('who');

function api(path, options) {
  options = options || {};
  options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
  if (token) options.headers.Authorization = 'Bearer ' + token;
  return fetch('/api' + path, options);
}

function showGenres() {
  api('/categories').then(function (r) { return r.json(); }).then(function (data) {
    genresEl.innerHTML = '<button data-slug="">All</button> ' + data.categories.map(function (c) {
      return '<button data-slug="' + c.slug + '">' + c.name + ' (' + c.bookCount + ')</button>';
    }).join(' ');
  });
}

function showBooks(slug) {
  api('/books?limit=50' + (slug ? '&category=' + encodeURIComponent(slug) : ''))
    .then(function (r) { return r.json(); })
    .then(function (data) {
      booksEl.innerHTML = data.books.map(function (b) {
        var cover = b.coverImage && b.coverImage.url ? '<img src="' + b.coverImage.url + '" alt="" height="80"> ' : '';
        return '<p>' + cover + '<strong>' + b.name + '</strong> by ' + b.author + ' &middot; ' +
          (b.category ? b.category.name : '') +
          (b.hasPdf ? ' <button data-download="' + b._id + '" data-format="pdf" data-name="' + b.slug + '.pdf">PDF</button>' : '') +
          (b.hasEpub ? ' <button data-download="' + b._id + '" data-format="epub" data-name="' + b.slug + '.epub">EPUB</button>' : '') +
          '</p>';
      }).join('') || '<p>No books yet.</p>';
    });
}

genresEl.addEventListener('click', function (e) {
  if (e.target.tagName === 'BUTTON') showBooks(e.target.getAttribute('data-slug'));
});

booksEl.addEventListener('click', function (e) {
  var id = e.target.getAttribute('data-download');
  if (!id) return;
  api('/books/' + id + '/download?format=' + e.target.getAttribute('data-format')).then(function (r) {
    if (!r.ok) return r.json().then(function (d) { alert(d.message); });
    var disposition = r.headers.get('Content-Disposition') || '';
    var match = /filename="?([^";]+)"?/.exec(disposition);
    return r.blob().then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = match ? match[1] : e.target.getAttribute('data-name');
      a.click();
      URL.revokeObjectURL(a.href);
    });
  });
});

document.getElementById('login').addEventListener('submit', function (e) {
  e.preventDefault();
  api('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value }),
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (!d.success) return alert(d.message);
    token = d.data.token;
    localStorage.setItem('token', token);
    whoEl.textContent = 'Logged in as ' + d.data.user.username;
  });
});

if (token) whoEl.textContent = 'Logged in';
showGenres();
showBooks('');
