/* ============================================================
   SURTI EGG TADKA — script.js
   Cart System + UI Interactions
   ============================================================ */

/* ── Cart State ── */
var cart = {};

/* ── Loader ── */
window.addEventListener('load', function () {
  setTimeout(function () {
    var loader = document.getElementById('loader');
    if (loader) loader.classList.add('hide');
  }, 1800);
});

/* ── Navbar scroll ── */
var navbar    = document.getElementById('navbar');
var scrollBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', function () {
  if (navbar)    navbar.classList.toggle('scrolled', window.scrollY > 40);
  if (scrollBtn) scrollBtn.classList.toggle('visible', window.scrollY > 400);
});
scrollBtn && scrollBtn.addEventListener('click', function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── Mobile menu ── */
function toggleMobile() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
}

/* ── Menu tab switching ── */
function switchTab(cat, btn) {
  document.querySelectorAll('.menu-category').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
  var target = document.getElementById('cat-' + cat);
  if (target) target.classList.add('active');
  if (btn)    btn.classList.add('active');
  setTimeout(triggerReveal, 60);
}

/* ── Scroll reveal ── */
function triggerReveal() {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry, i) {
      if (entry.isIntersecting) {
        setTimeout(function () {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }, i * 55);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(function (el) { observer.observe(el); });
}

/* ── Image fallback ── */
function setupImageFallbacks() {
  document.querySelectorAll('.card-img-wrap img').forEach(function (img) {
    img.addEventListener('error', function () {
      this.style.display = 'none';
      var fb = this.parentElement.querySelector('.card-img-fallback');
      if (fb) fb.style.display = 'flex';
    });
  });
}

/* ══════════════════════════════════════════════════════
   CART SYSTEM
══════════════════════════════════════════════════════ */

/* Extract price number from string like "₹130" or "₹10 / ₹20" */
function extractPrice(priceStr) {
  var match = priceStr.match(/₹(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/* Add item to cart — called from each menu card button */
function addToCart(name, priceStr, imgSrc) {
  var price = extractPrice(priceStr);
  if (cart[name]) {
    cart[name].qty += 1;
  } else {
    cart[name] = { name: name, price: price, qty: 1, img: imgSrc || '' };
  }
  updateCartUI();
  showAddedFeedback(name);
}

/* Show brief "Added!" toast */
function showAddedFeedback(name) {
  var toast = document.getElementById('cartToast');
  toast.textContent = '✅ ' + name + ' added!';
  toast.classList.add('show');
  setTimeout(function () { toast.classList.remove('show'); }, 1800);
}

/* Update cart count badge + drawer */
function updateCartUI() {
  var totalItems = 0;
  var totalCost  = 0;
  Object.values(cart).forEach(function (item) {
    totalItems += item.qty;
    totalCost  += item.price * item.qty;
  });

  /* Badge on nav button */
  var badge = document.getElementById('cartBadge');
  badge.textContent = totalItems;
  badge.style.display = totalItems > 0 ? 'flex' : 'none';

  /* Cart drawer items list */
  var list = document.getElementById('cartItemsList');
  if (Object.keys(cart).length === 0) {
    list.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon">🛒</div><p>Your cart is empty</p><p class="cart-empty-sub">Add items from the menu!</p></div>';
  } else {
    list.innerHTML = '';
    Object.values(cart).forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML =
        '<div class="cart-item-info">' +
          (item.img ? '<img src="' + item.img + '" class="cart-item-img" onerror="this.style.display=\'none\'">' : '') +
          '<div><div class="cart-item-name">' + item.name + '</div>' +
          '<div class="cart-item-unit">₹' + item.price + ' each</div></div>' +
        '</div>' +
        '<div class="cart-item-controls">' +
          '<button class="qty-btn" onclick="changeQty(\'' + item.name.replace(/'/g, "\\'") + '\',-1)">−</button>' +
          '<span class="qty-num">' + item.qty + '</span>' +
          '<button class="qty-btn" onclick="changeQty(\'' + item.name.replace(/'/g, "\\'") + '\',1)">+</button>' +
          '<div class="cart-item-total">₹' + (item.price * item.qty) + '</div>' +
        '</div>';
      list.appendChild(row);
    });
  }

  /* Total */
  document.getElementById('cartTotal').textContent = '₹' + totalCost;
  document.getElementById('cartTotalBottom').textContent = '₹' + totalCost;

  /* Checkout button state */
  var checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn.disabled = totalItems === 0;
}

/* Change quantity */
function changeQty(name, delta) {
  if (!cart[name]) return;
  cart[name].qty += delta;
  if (cart[name].qty <= 0) delete cart[name];
  updateCartUI();
}

/* Open / close cart drawer */
function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* Checkout — show bill modal */
function checkout() {
  if (Object.keys(cart).length === 0) return;

  var totalCost = 0;
  var rows = '';
  Object.values(cart).forEach(function (item) {
    var sub = item.price * item.qty;
    totalCost += sub;
    rows += '<tr><td>' + item.name + '</td><td class="bill-center">' + item.qty + '</td>' +
            '<td class="bill-right">₹' + item.price + '</td><td class="bill-right">₹' + sub + '</td></tr>';
  });

  document.getElementById('billRows').innerHTML = rows;
  document.getElementById('billGrandTotal').textContent = '₹' + totalCost;

  /* Order number */
  var orderNo = 'SET' + Date.now().toString().slice(-5);
  document.getElementById('billOrderNo').textContent = orderNo;
  document.getElementById('billTime').textContent = new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  closeCart();
  document.getElementById('billModal').classList.add('open');
  document.getElementById('billOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

/* Confirm order */
function confirmOrder() {
  document.getElementById('billModal').classList.remove('open');
  document.getElementById('thankModal').classList.add('open');
  cart = {};
  updateCartUI();
}

/* Close thank you */
function closeThankYou() {
  document.getElementById('thankModal').classList.remove('open');
  document.getElementById('billOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

/* Close bill */
function closeBill() {
  document.getElementById('billModal').classList.remove('open');
  document.getElementById('billOverlay').classList.remove('open');
  document.body.style.overflow = '';
  openCart();
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', function () {
  triggerReveal();
  setupImageFallbacks();
  updateCartUI();

  /* Inject Add to Cart buttons into every menu card */
  document.querySelectorAll('.menu-card').forEach(function (card) {
    var nameEl  = card.querySelector('.card-name');
    var priceEl = card.querySelector('.card-price');
    var imgEl   = card.querySelector('.card-img-wrap img');
    if (!nameEl || !priceEl) return;

    var name     = nameEl.textContent.trim();
    var priceStr = priceEl.textContent.trim();
    var imgSrc   = imgEl ? imgEl.src : '';

    /* Replace footer with Add to Cart control */
    var footer = card.querySelector('.card-footer');
    if (footer) {
      footer.innerHTML =
        '<div class="card-price">' + priceStr + '</div>' +
        '<button class="add-cart-btn" onclick="addToCart(\'' + name.replace(/'/g, "\\'") + '\',\'' + priceStr.replace(/'/g, "\\'") + '\',\'' + imgSrc + '\')">' +
          '<span>+</span> Add' +
        '</button>';
    }
  });
});