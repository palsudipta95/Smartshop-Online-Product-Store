// ─── Load Products ──
function loadProducts() {
  fetch('product.json')
    .then(res => res.json())
    .then(data => showDetails(data.products))
}

loadProducts();

// ─── Product Cards ───
const showDetails = (products) => {
  const list = document.getElementById('product-list');
  products.forEach(item => {
    const div = document.createElement('div');
    div.dataset.id = item.id;
    div.innerHTML = `
      <div class="card bg-base-100 shadow-md border border-base-200 hover:shadow-lg transition-shadow h-full">
        <figure class="px-6 pt-6">
          <img src="${item.image}" alt="${item.title}" class="rounded-xl h-40 w-full object-cover"
               onerror="this.src='https://placehold.co/300x160?text=No+Image'"/>
        </figure>
        <div class="card-body items-center text-center p-4">
          <h2 class="card-title text-sm">${item.title}</h2>
          <p class="text-xs text-gray-500">${item.description.slice(0, 80)}...</p>
          <div class="flex items-center gap-1 text-yellow-400 text-sm">
            ${'★'.repeat(Math.floor(item.rating))}${'☆'.repeat(5 - Math.floor(item.rating))}
            <span class="text-gray-400 text-xs">(${item.rating})</span>
          </div>
          <p class="text-primary font-bold text-lg">$${item.price.toFixed(2)}</p>
          <div class="card-actions w-full">
            <button class="btn btn-primary btn-sm w-full"
              onclick="addToCart(${item.id}, ${item.price}, \`${item.title}\`, '${item.image}')">
              🛒 Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
    list.appendChild(div);
  });
};

// ─── Cart State ──────
let cart = {}; 
let userBalance = 1000;
let appliedDiscount = 0; 
let shipping = 80;

// ─── Balance & Coupon Helpers ────
const updateBalanceDisplay = () => {
  const el = document.getElementById('user-balance');
  if (el) el.textContent = '$' + userBalance.toFixed(2);
};

const applyCoupon = () => {
  const code = document.getElementById('coupon-input').value.trim().toUpperCase();
  const status = document.getElementById('coupon-status');
  if (code === 'SMART10') {
    appliedDiscount = 10;
    status.innerHTML = '<span class="text-success">✅ 10% off applied</span>';
    renderCart();
  } else {
    status.innerHTML = '<span class="text-error">❌ Invalid coupon</span>';
  }
};

const addMoney = () => {
  userBalance += 1000;
  updateBalanceDisplay();
  showToast("✅ $1000 added to your balance!");
  renderCart();
};

// ─── Customer Reviews ───────────────────────────────────────────────────────
let currentReview = 0;
let autoSlide;

function loadReviews() {
  fetch('reviews.json')
    .then(res => res.json())
    .then(data => {
      renderReviews(data.reviews);
    })
    .catch(() => {
      // Fallback in case JSON fails
      console.log("Using fallback reviews");
      const fallbackReviews = [
        { name: "John Smith", date: "May 2026", rating: 5, comment: "Amazing products and super fast delivery!" },
        { name: "Sarah Johnson", date: "April 2026", rating: 4, comment: "Excellent quality and great support." }
      ];
      renderReviews(fallbackReviews);
    });
}

function renderReviews(reviews) {
  const reviewSlider = document.getElementById("review-slider");
  const reviewDots = document.getElementById("review-dots");

  if (!reviewSlider || !reviewDots) return;

  reviewSlider.innerHTML = reviews.map(review => `
    <div class="min-w-full px-4">
      <div class="card bg-base-100 shadow-lg border border-base-300">
        <div class="card-body">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold text-lg">${review.name}</h3>
              <p class="text-sm text-gray-500">${review.date}</p>
            </div>
            <div class="text-yellow-400 text-lg">
              ${'★'.repeat(Math.floor(review.rating))}${'☆'.repeat(5 - Math.floor(review.rating))}
            </div>
          </div>
          <p class="mt-4 text-gray-600 leading-relaxed">"${review.comment}"</p>
        </div>
      </div>
    </div>
  `).join("");

  reviewDots.innerHTML = reviews.map((_, index) => `
    <button class="w-3 h-3 rounded-full bg-gray-300 review-dot" onclick="goToReview(${index})"></button>
  `).join("");

  currentReview = 0;
  updateReviewSlider();
}

function updateReviewSlider() {
  const reviewSlider = document.getElementById("review-slider");
  if (!reviewSlider) return;
  
  reviewSlider.style.transform = `translateX(-${currentReview * 100}%)`;

  document.querySelectorAll(".review-dot").forEach((dot, index) => {
    if (index === currentReview) {
      dot.classList.add("bg-primary");
      dot.classList.remove("bg-gray-300");
    } else {
      dot.classList.remove("bg-primary");
      dot.classList.add("bg-gray-300");
    }
  });
}

function nextReview() {
  currentReview = (currentReview + 1) % document.querySelectorAll("#review-slider > div").length;
  updateReviewSlider();
}

function prevReview() {
  currentReview = (currentReview - 1 + document.querySelectorAll("#review-slider > div").length) % document.querySelectorAll("#review-slider > div").length;
  updateReviewSlider();
}

function goToReview(index) {
  currentReview = index;
  updateReviewSlider();
}

function startAutoSlide() {
  if (autoSlide) clearInterval(autoSlide);
  autoSlide = setInterval(nextReview, 4000);
}

// ─── Cart Functions ─────────────────────────────────────────────────────────
const addToCart = (id, price, title, image) => {
  if (cart[id]) {
    cart[id].qty++;
  } else {
    cart[id] = { id, title, price, qty: 1, image };
  }
  renderCart();
  showToast(`"${title}" added to cart!`);
};

const removeFromCart = (id) => {
  delete cart[id];
  renderCart();
};

const updateQty = (id, delta) => {
  if (!cart[id]) return;
  cart[id].qty += delta;
  if (cart[id].qty <= 0) delete cart[id];
  renderCart();
};

const clearCart = () => {
  cart = {};
  renderCart();
};

const renderCart = () => {
  const items = Object.values(cart);
  const itemList = document.getElementById('cart-items');
  const emptyState = document.getElementById('cart-empty');
  const cartFooter = document.getElementById('cart-footer');
  const cartCount = document.getElementById('cart-count');

  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  let subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmount = subtotal * (appliedDiscount / 100);
  subtotal -= discountAmount;

  cartCount.textContent = totalQty > 0 ? `(${totalQty})` : '';

  if (items.length === 0) {
    itemList.innerHTML = '';
    emptyState.style.display = 'flex';
    cartFooter.style.display = 'none';
    return;
  }

  emptyState.style.display = 'none';
  cartFooter.style.display = 'block';

  itemList.innerHTML = items.map(item => `
    <div class="flex items-center gap-3 py-3 border-b border-base-200 last:border-0">
      <img src="${item.image}" alt="${item.title}" class="w-14 h-14 object-cover rounded-lg shrink-0 bg-base-200"
           onerror="this.src='https://placehold.co/56x56?text=?'"/>
      <div class="flex-1 min-w-0">
        <p class="text-xs font-semibold leading-tight line-clamp-2">${item.title}</p>
        <p class="text-xs text-gray-400 mt-0.5">$${item.price.toFixed(2)} each</p>
        <div class="flex items-center gap-1 mt-1.5">
          <button class="btn btn-xs btn-circle btn-outline" onclick="updateQty(${item.id}, -1)">−</button>
          <span class="text-sm font-bold w-6 text-center">${item.qty}</span>
          <button class="btn btn-xs btn-circle btn-outline" onclick="updateQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <div class="text-right shrink-0 flex flex-col items-end gap-1">
        <p class="text-sm font-bold text-primary">$${(item.price * item.qty).toFixed(2)}</p>
        <button class="btn btn-xs btn-ghost text-error px-1" onclick="removeFromCart(${item.id})">✕</button>
      </div>
    </div>
  `).join('');

  let delivery = 0;
  let deliveryNote = '';
  if (subtotal <= 500) {
    delivery = 0;
    deliveryNote = `Spend $${(500.01 - subtotal).toFixed(2)} more for paid delivery tier`;
  } else if (subtotal < 800) {
    delivery = 50;
    deliveryNote = `Spend $${(800 - subtotal).toFixed(2)} more → delivery becomes $100`;
  } else {
    delivery = 100;
    deliveryNote = 'Free delivery on orders over $800 is not available yet';
  }

  const total = subtotal + delivery + shipping;

  document.getElementById('cart-subtotal').textContent = subtotal.toFixed(2);
  document.getElementById('cart-delivery').textContent = delivery.toFixed(2);
  document.getElementById('shipping-cost').textContent = shipping.toFixed(2);
  document.getElementById('cart-total').textContent = total.toFixed(2);
  document.getElementById('delivery-note').textContent = deliveryNote;

  updateBalanceDisplay();
};

// Place Order, Toast, etc.
const placeOrder = () => {
  const items = Object.values(cart);
  if (items.length === 0) {
    showToast("❌ Your cart is empty!");
    return;
  }

  const total = parseFloat(document.getElementById('cart-total').textContent);

  if (userBalance < total) {
    showToast("❌ Insufficient balance! Add more funds.");
    return;
  }

  // Deduct balance
  userBalance -= total;

  // Build order summary for modal
  const summaryHTML = `
    <div class="space-y-2 mb-4">
      ${items.map(item => `
        <div class="flex justify-between text-sm">
          <span class="text-gray-600">${item.title} × ${item.qty}</span>
          <span class="font-medium">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `).join('')}
    </div>
    <div class="border-t border-base-300 pt-3 space-y-1">
      <div class="flex justify-between text-sm text-gray-500">
        <span>Delivery</span>
        <span>$${document.getElementById('cart-delivery').textContent}</span>
      </div>
      <div class="flex justify-between text-sm text-gray-500">
        <span>Shipping</span>
        <span>$${document.getElementById('shipping-cost').textContent}</span>
      </div>
      <div class="flex justify-between font-bold text-base mt-2">
        <span>Total Paid</span>
        <span class="text-primary">$${total.toFixed(2)}</span>
      </div>
      <div class="flex justify-between text-sm text-gray-500 mt-1">
        <span>Remaining Balance</span>
        <span>$${userBalance.toFixed(2)}</span>
      </div>
    </div>
  `;

  document.getElementById('order-summary').innerHTML = summaryHTML;
  document.getElementById('order-modal').showModal();

  // Clear cart and reset coupon
  cart = {};
  appliedDiscount = 0;
  document.getElementById('coupon-input').value = '';
  document.getElementById('coupon-status').innerHTML = '';
  renderCart();
  updateBalanceDisplay();
};

const showToast = (message) => {
  const toast = document.getElementById('cart-toast');
  const msg = document.getElementById('toast-msg');
  msg.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(20px)'; }, 2500);
};

// ─── Auto Sliding Hero Carousel ─────────────────────────────────────
let heroIndex = 0;
const heroSlides = document.getElementById('hero-slides');
const totalHeroSlides = 4;

function moveHero() {
  heroIndex = (heroIndex + 1) % totalHeroSlides;
  heroSlides.style.transform = `translateX(-${heroIndex * 100}%)`;
}

function nextHero() {
  clearInterval(heroAuto);
  moveHero();
  startHeroAuto();
}

function prevHero() {
  clearInterval(heroAuto);
  heroIndex = (heroIndex - 1 + totalHeroSlides) % totalHeroSlides;
  heroSlides.style.transform = `translateX(-${heroIndex * 100}%)`;
  startHeroAuto();
}

function startHeroAuto() {
  heroAuto = setInterval(moveHero, 4000); // Change image every 4 seconds
}

startHeroAuto();

// ─── Auto Sliding Reviews ───────────────────────────────────────────
function startReviewAutoSlide() {
  if (typeof autoSlide !== 'undefined') clearInterval(autoSlide);
  autoSlide = setInterval(() => {
    if (typeof nextReview === 'function') nextReview();
  }, 4500);
}

// Restart auto slide when manual navigation is used
document.getElementById('next-review').addEventListener('click', () => {
  if (typeof startAutoSlide === 'function') startAutoSlide();
});
document.getElementById('prev-review').addEventListener('click', () => {
  if (typeof startAutoSlide === 'function') startAutoSlide();
});

// Initialize both auto sliders
window.addEventListener('load', () => {
  startReviewAutoSlide();
});

// Initialize Everything
loadReviews();
updateBalanceDisplay();

// ─── Product Filters ──────────────────────────────────────────────────────────
var productMeta = {
    1:  { brand: 'Generic',        stock: 'instock' },
    2:  { brand: 'Generic',        stock: 'tba'     },
    3:  { brand: 'Generic',        stock: 'tba'     },
    4:  { brand: 'Intel',          stock: 'instock' },
    5:  { brand: 'NVIDIA',         stock: 'instock' },
    6:  { brand: 'Corsair',        stock: 'instock' },
    7:  { brand: 'Samsung',        stock: 'instock' },
    8:  { brand: 'ASUS',           stock: 'instock' },
    9:  { brand: 'Corsair',        stock: 'instock' },
    10: { brand: 'Noctua',         stock: 'instock' },
    11: { brand: 'Fractal Design', stock: 'instock' },
    12: { brand: 'WD',             stock: 'instock' },
    13: { brand: 'TP-Link',        stock: 'instock' }
};

var productPrices = {
    1: 59.99,  2: 99.99,  3: 29.99,
    4: 389.99, 5: 599.99, 6: 74.99,
    7: 109.99, 8: 299.99, 9: 134.99,
    10: 99.99, 11: 149.99, 12: 54.99, 13: 39.99
};

var allBrands = ['ASUS', 'Corsair', 'Fractal Design', 'Generic', 'Intel', 'Noctua', 'NVIDIA', 'Samsung', 'TP-Link', 'WD'];

function buildBrandCheckboxes() {
    var container = document.getElementById('brand-filter-list');
    container.innerHTML = '';

    for (var i = 0; i < allBrands.length; i++) {
        var brand = allBrands[i];
        var label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer';
        label.innerHTML =
            '<input type="checkbox" class="checkbox checkbox-primary checkbox-sm brand-cb" value="' + brand + '" checked onchange="updateFilters()" />' +
            '<span class="text-sm">' + brand + '</span>';
        container.appendChild(label);
    }
}

buildBrandCheckboxes();

function onPriceChange(val) {
    var label = document.getElementById('price-label');
    if (parseInt(val) >= 700) {
        label.textContent = 'Any price';
    } else {
        label.textContent = '$' + val;
    }
    updateFilters();
}

function updateFilters() {
    var maxPrice = parseInt(document.getElementById('price-range').value);
    var showInstock = document.getElementById('filter-instock').checked;
    var showTba = document.getElementById('filter-tba').checked;
    var checkedBrands = [];
    var brandCheckboxes = document.querySelectorAll('.brand-cb:checked');
    for (var i = 0; i < brandCheckboxes.length; i++) {
        checkedBrands.push(brandCheckboxes[i].value);
    }

    var visibleCount = 0;
    var cards = document.querySelectorAll('#product-list > div');

    for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var id = parseInt(card.dataset.id);
        var meta = productMeta[id];
        var price = productPrices[id] || 0;

        var priceOk = (maxPrice >= 700) || (price <= maxPrice);
        var stockOk = (meta.stock === 'instock' && showInstock) || (meta.stock === 'tba' && showTba);
        var brandOk = checkedBrands.indexOf(meta.brand) !== -1;

        if (priceOk && stockOk && brandOk) {
            card.style.display = '';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    }

    var noResults = document.getElementById('no-results');
    if (visibleCount === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
    }
}

function resetFilters() {
    document.getElementById('price-range').value = 700;
    document.getElementById('price-label').textContent = 'Any price';
    document.getElementById('filter-instock').checked = true;
    document.getElementById('filter-tba').checked = false;

    var brandCheckboxes = document.querySelectorAll('.brand-cb');
    for (var i = 0; i < brandCheckboxes.length; i++) {
        brandCheckboxes[i].checked = true;
    }

    updateFilters();
}

var observer = new MutationObserver(function() {
    updateFilters();
});
observer.observe(document.getElementById('product-list'), { childList: true });
