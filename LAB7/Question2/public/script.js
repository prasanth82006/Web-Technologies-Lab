const booksList = document.getElementById('booksList');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');

let currentPage = 1;

async function loadBooks(page = 1) {
  try {
    const res = await fetch(`/books?page=${page}`);
    const data = await res.json();

    renderBooks(data.books);
    renderPagination(data.currentPage, data.totalPages);
  } catch (err) {
    console.error(err);
    booksList.innerHTML = '<p class="error">Failed to load books</p>';
  }
}

function renderBooks(books) {
  booksList.innerHTML = '';
  if (books.length === 0) {
    booksList.innerHTML = '<p>No books found.</p>';
    return;
  }

  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'book-card';
    card.innerHTML = `
      <h3>${book.title}</h3>
      <p class="author">by ${book.author}</p>
      <p class="category">${book.category}</p>
      <div class="meta">
        <span>₹${book.price}</span>
        <span>★ ${book.rating}</span>
        <span>${book.year}</span>
      </div>
    `;
    booksList.appendChild(card);
  });
}

function renderPagination(current, total) {
  pagination.innerHTML = '';
  if (total <= 1) return;

  const prev = document.createElement('button');
  prev.textContent = 'Previous';
  prev.disabled = current === 1;
  prev.onclick = () => {
    if (current > 1) loadBooks(current - 1);
  };

  const next = document.createElement('button');
  next.textContent = 'Next';
  next.disabled = current === total;
  next.onclick = () => {
    if (current < total) loadBooks(current + 1);
  };

  const info = document.createElement('span');
  info.textContent = `Page ${current} of ${total}`;

  pagination.appendChild(prev);
  pagination.appendChild(info);
  pagination.appendChild(next);
}

async function searchBooks() {
  const query = searchInput.value.trim();
  if (!query) {
    loadBooks(1);
    return;
  }

  try {
    const res = await fetch(`/books/search?title=${encodeURIComponent(query)}`);
    const books = await res.json();
    renderBooks(books);
    pagination.innerHTML = ''; 
  } catch (err) {
    console.error(err);
  }
}

categoryFilter.addEventListener('change', async () => {
  const cat = categoryFilter.value;
  if (!cat) {
    loadBooks(1);
    return;
  }

  try {
    const res = await fetch(`/books/category/${encodeURIComponent(cat)}`);
    const books = await res.json();
    renderBooks(books);
    pagination.innerHTML = '';
  } catch (err) {
    console.error(err);
  }
});

sortFilter.addEventListener('change', async () => {
  const sort = sortFilter.value;
  if (!sort) {
    loadBooks(1);
    return;
  }

  try {
    const res = await fetch(`/books/sort/${sort}`);
    const books = await res.json();
    renderBooks(books);
    pagination.innerHTML = '';
  } catch (err) {
    console.error(err);
  }
});

async function loadTopRated() {
  try {
    const res = await fetch('/books/top');
    const books = await res.json();
    renderBooks(books);
    pagination.innerHTML = '';
  } catch (err) {
    console.error(err);
  }
}

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchBooks();
});

loadBooks(1);