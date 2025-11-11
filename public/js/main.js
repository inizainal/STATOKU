//  index.html -------------------------------------------------

async function loadFlipbooks() {
  try {
    const response = await fetch('/api/flipbooks?status=active');
    const flipbooks = await response.json();

    const grid = document.getElementById('flipbookGrid');

    // Show only first 4 flipbooks on homepage
    const displayBooks = flipbooks.slice(0, 4);

    if (displayBooks.length === 0) {
      grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #8b95a5;">Belum ada flipbook tersedia</p>';
      return;
    }

    grid.innerHTML = displayBooks.map(book => `
      <a href="/flipbook/${book.id}" class="flipbook-card">
        <div class="flipbook-cover">
          <img src="${book.cover_image}" alt="${book.title}" />
          ${book.status === 'coming-soon' ? `
            <div class="flipbook-status">
              <span class="badge badge-orange">Coming Soon</span>
            </div>
          ` : ''}
        </div>
        <div class="flipbook-info">
          <span class="flipbook-category">${book.category_name}</span>
          <h3>${book.title}</h3>
          <p>${book.description}</p>
        </div>
      </a>
    `).join('');
  } catch (error) {
    console.error('Error loading flipbooks:', error);
  }
}

function scrollToPrevious() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToNext() {
  const nextSection = document.querySelector('.section');
  nextSection.scrollIntoView({ behavior: 'smooth' });
}

// -----------------------------------------------------------------------

// Load flipbooks when page loads
loadFlipbooks();

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Show toast notification
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#5DBFB8' : type === 'error' ? '#FF8C42' : '#2c4a73'};
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// CSS animasi
if (!document.getElementById('toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// API request helper
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  }
}

// Export for use in other files
window.utils = {
  formatDate,
  showToast,
  apiRequest
};


// ==========================================keloeksi.html==========================================
// Elements
const categoryBtn = document.getElementById('categoryBtn');
const categoryMenu = document.getElementById('categoryMenu');
const categoryLabel = document.getElementById('categoryLabel');
const categoryItems = Array.from(categoryMenu.querySelectorAll('.category-item'));
const applyBtn = document.getElementById('applyCat');
const clearBtn = document.getElementById('clearCat');
const searchInput = document.getElementById('searchInput');
const booksGrid = document.getElementById('booksGrid');
const cards = Array.from(booksGrid.querySelectorAll('.book-card'));

// state
let selectedCategory = ''; // '' = all
let pendingCategory = ''; // selection inside menu before apply

// helper to normalize category strings (trim)
function normalizeCats(catString){
  return catString.split(',').map(s => s.trim()).filter(Boolean);
}

// update counts inside menu (total and per category)
function updateCounts(){
  document.getElementById('countAll').textContent = cards.length;
  const counters = {};
  cards.forEach(c => {
    const cats = normalizeCats(c.dataset.category || '');
    cats.forEach(k => {
      counters[k] = (counters[k] || 0) + 1;
    });
  });
  categoryItems.forEach(item => {
    const cat = item.dataset.cat || '';
    if(cat){
      const span = item.querySelector('[data-count-for="'+cat+'"]');
      if(span) span.textContent = (counters[cat] || 0);
    }
  });
}

updateCounts();

// open/close menu
function toggleMenu(open){
  const isOpen = !!open;
  if(isOpen){
    categoryMenu.classList.add('open');
    categoryBtn.setAttribute('aria-expanded','true');
  } else {
    categoryMenu.classList.remove('open');
    categoryBtn.setAttribute('aria-expanded','false');
  }
}

// click on category header toggles menu
categoryBtn.addEventListener('click', () => {
  toggleMenu(!categoryMenu.classList.contains('open'));
});

// keyboard accessibility on button
categoryBtn.addEventListener('keydown', (ev) => {
  if(ev.key === 'Enter' || ev.key === ' '){
    ev.preventDefault();
    toggleMenu(!categoryMenu.classList.contains('open'));
  } else if(ev.key === 'Escape'){
    toggleMenu(false);
  }
});

// clicking outside closes menu
document.addEventListener('click', (ev) => {
  if(!categoryBtn.contains(ev.target) && !categoryMenu.contains(ev.target)){
    toggleMenu(false);
  }
});

// select item in menu (pending)
categoryItems.forEach(item => {
  item.addEventListener('click', () => {
    // mark selected visual
    categoryItems.forEach(i => i.classList.remove('selected'));
    item.classList.add('selected');

    // set pendingCategory (empty string for all)
    pendingCategory = item.dataset.cat || '';
  });
  item.addEventListener('keydown', (ev) => {
    if(ev.key === 'Enter' || ev.key === ' '){
      ev.preventDefault();
      item.click();
    }
  });
});

// apply / clear
applyBtn.addEventListener('click', () => {
  selectedCategory = pendingCategory || '';
  categoryLabel.textContent = selectedCategory || 'All Categories';
  toggleMenu(false);
  filterCards();
});

clearBtn.addEventListener('click', () => {
  pendingCategory = '';
  selectedCategory = '';
  categoryItems.forEach(i => i.classList.remove('selected'));
  // mark first (All) selected visually
  const allItem = categoryItems.find(i => (i.dataset.cat || '') === '');
  if(allItem) allItem.classList.add('selected');
  categoryLabel.textContent = 'All Categories';
  toggleMenu(false);
  filterCards();
});

// search + category combined filter
function filterCards(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const cat = (selectedCategory || '').trim();

  let visibleCount = 0;
  cards.forEach(card => {
    const title = (card.dataset.title || '').toLowerCase();
    const cats = normalizeCats(card.dataset.category || '');
    const matchesSearch = !q || title.includes(q);
    const matchesCategory = !cat || cats.map(s=>s.toLowerCase()).includes(cat.toLowerCase());

    if(matchesSearch && matchesCategory){
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  // update small counts in menu realtime (optional)
  // (we keep the numbers static because they indicate total available per category)
}

// search input listener
searchInput.addEventListener('input', filterCards);

// initialize: select "All" visually
(function initMenu(){
  const allItem = categoryItems.find(i => (i.dataset.cat || '') === '');
  if(allItem) allItem.classList.add('selected');
  pendingCategory = '';
  selectedCategory = '';
  filterCards();
})();

// Accessibility: allow keyboard navigation to close with Escape
document.addEventListener('keydown', (ev) => {
  if(ev.key === 'Escape'){
    toggleMenu(false);
  }
});

// Enhance card status visuals: ensure status-pill classes match data-status
cards.forEach(card => {
  const status = (card.dataset.status || '').toLowerCase();
  const pill = card.querySelector('.status-pill');
  if(pill){
    if(status === 'aktif' || status === 'active'){
      pill.classList.add('aktif');
      pill.textContent = 'Aktif';
    } else {
      pill.classList.add('coming');
      pill.textContent = 'Coming Soon';
    }
  }

  // ensure card-category text matches first category for quick glance
  const catBadge = card.querySelector('.card-category');
  if(catBadge){
    const cats = normalizeCats(card.dataset.category || '');
    catBadge.textContent = cats[0] || '';
  }
});
