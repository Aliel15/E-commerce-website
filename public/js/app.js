(function () {
  function getCart() {
    try {
      return JSON.parse(localStorage.getItem('cart') || '[]');
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    var cart = getCart();
    var count = cart.reduce(function (sum, item) { return sum + (item.quantity || 1); }, 0);
    var el = document.getElementById('cart-count');
    if (el) el.textContent = String(count);
  }

  function addToCart(product) {
    var cart = getCart();
    var existing = cart.find(function (c) { return c.id === product.id; });
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, quantity: 1 });
    }
    saveCart(cart);
  }

  function formatCurrency(v) {
    return '$' + Number(v).toFixed(2);
  }

  function renderProducts(products) {
    var grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';
    products.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML =
        '<img src="' + (p.image_url || '') + '" alt="' + (p.name || 'Product') + '">' +
        '<h3>' + (p.name || '') + '</h3>' +
        '<p>' + formatCurrency(p.price || 0) + '</p>' +
        '<button type="button">Add To Cart</button>';
      card.querySelector('button').addEventListener('click', function () { addToCart(p); });
      grid.appendChild(card);
    });
  }

  function loadProducts() {
    fetch('/api/products')
      .then(function (res) { return res.json(); })
      .then(function (data) { renderProducts(Array.isArray(data) ? data : []); })
      .catch(function () { /* silently fail */ });
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateCartCount();
    loadProducts();
    // Reflect login state
    fetch('/auth/me')
      .then(function (res) { if (!res.ok) throw new Error(); return res.json(); })
      .then(function (me) {
        var cartLink = document.getElementById('cart-link');
        if (cartLink && me && me.name) {
          var count = document.getElementById('cart-count');
          cartLink.textContent = me.name + ' — Cart (' + (count ? count.textContent : '0') + ')';
        }
      })
      .catch(function () { /* not logged in */ });
    var cartLink = document.getElementById('cart-link');
    if (cartLink) {
      cartLink.addEventListener('click', function (e) {
        e.preventDefault();
        var cart = getCart();
        if (!cart.length) {
          alert('Your cart is empty.');
          return;
        }
        var total = 0;
        var lines = cart.map(function (item) {
          var line = item.name + ' x' + (item.quantity || 1) + ' — ' + formatCurrency(item.price);
          total += (item.quantity || 1) * Number(item.price || 0);
          return line;
        });
        lines.push('');
        lines.push('Total: ' + formatCurrency(total));
        alert(lines.join('\n'));
      });
    }

    // Order submission
    var orderBtn = document.getElementById('place-order');
    if (orderBtn) {
      orderBtn.addEventListener('click', function () {
        var cart = getCart();
        if (!cart.length) { alert('Your cart is empty.'); return; }
        var addressForm = document.getElementById('order-address-form');
        if (!addressForm) { alert('Missing address form'); return; }
        var payload = {
          items: cart.map(function (c) { return { id: c.id, quantity: c.quantity || 1 }; }),
          firstname: addressForm.firstname.value.trim(),
          lastname: addressForm.lastname.value.trim(),
          address: addressForm.address.value.trim(),
          address2: addressForm.address2.value.trim(),
          city: addressForm.city.value.trim(),
          state: addressForm.state.value.trim(),
          zip: addressForm.zip.value.trim()
        };
        fetch('/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
          .then(function (r) {
            if (!r.ok) { alert(r.data.message || 'Order failed'); return; }
            localStorage.removeItem('cart');
            updateCartCount();
            alert('Order placed! ID: ' + r.data.orderId + '\nTotal: $' + Number(r.data.total).toFixed(2));
          })
          .catch(function () { alert('Order failed'); });
      });
    }
  });
})();

