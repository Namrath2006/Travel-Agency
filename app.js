const STORAGE_KEY = "skyway_travels_cart_v1";
const STORAGE_DISCOUNT_KEY = "skyway_travels_discount_v1";

const state = {
  cart: [],
  discount: {
    code: null,
    percentage: 0,
  },
};

const discountCodes = {
  SKY10: 10,
  WELCOME20: 20,
};

const els = {};

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function cacheElements() {
  els.cartCount = qs("#cartCount");
  els.cartItems = qs("#cartItems");
  els.drawerCartItems = qs("#drawerCartItems");
  els.subtotalValue = qs("#subtotalValue");
  els.discountValue = qs("#discountValue");
  els.totalValue = qs("#totalValue");
  els.drawerTotalValue = qs("#drawerTotalValue");
  els.cartEmptyMessage = qs("#cartEmptyMessage");
  els.discountInput = qs("#discountCode");
  els.discountMessage = qs("#discountMessage");
  els.applyDiscountBtn = qs("#applyDiscountBtn");
  els.removeDiscountBtn = qs("#removeDiscountBtn");
  els.checkoutForm = qs("#checkoutForm");
  els.toast = qs("#toast");
  els.cartDrawer = qs("#cartDrawer");
  els.cartDrawerBackdrop = qs("#cartDrawerBackdrop");
  els.openCartBtn = qs("#openCartBtn");
  els.closeCartBtn = qs("#closeCartBtn");
  els.goToCheckoutFromCart = qs("#goToCheckoutFromCart");
  els.navToggle = qs("#navToggle");
  els.navLinks = qs(".nav-links");
  els.exploreBtn = qs("#exploreBtn");
  els.heroScrollBilling = qs("#heroScrollBilling");
  els.contactForm = qs("#contactForm");
  els.contactName = qs("#contactName");
  els.contactEmail = qs("#contactEmail");
  els.contactMessage = qs("#contactMessage");
  els.sendContactBtn = qs("#sendContactBtn");
}

function loadStateFromStorage() {
  try {
    const storedCart = window.localStorage.getItem(STORAGE_KEY);
    const storedDiscount = window.localStorage.getItem(STORAGE_DISCOUNT_KEY);
    if (storedCart) {
      const parsed = JSON.parse(storedCart);
      if (Array.isArray(parsed)) {
        state.cart = parsed;
      }
    }
    if (storedDiscount) {
      const parsedDiscount = JSON.parse(storedDiscount);
      if (parsedDiscount && typeof parsedDiscount === "object") {
        state.discount.code = parsedDiscount.code || null;
        state.discount.percentage = parsedDiscount.percentage || 0;
      }
    }
  } catch (err) {
    console.error("Failed to load cart from storage", err);
  }
}

function saveStateToStorage() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
    window.localStorage.setItem(
      STORAGE_DISCOUNT_KEY,
      JSON.stringify(state.discount)
    );
  } catch (err) {
    console.error("Failed to save cart to storage", err);
  }
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
}

function showToast(message) {
  if (!els.toast) return;
  els.toast.textContent = message;
  els.toast.classList.add("visible");
  clearTimeout(showToast._timeout);
  showToast._timeout = setTimeout(() => {
    els.toast.classList.remove("visible");
  }, 2500);
}

function findCartItem(id) {
  return state.cart.find((item) => item.id === id);
}

function addToCart(product) {
  const existing = findCartItem(product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }
  saveStateToStorage();
  updateCartUI();
  showToast(`${product.name} added to cart`);
}

function removeFromCart(id) {
  state.cart = state.cart.filter((item) => item.id !== id);
  saveStateToStorage();
  updateCartUI();
}

function updateQuantity(id, delta) {
  const item = findCartItem(id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(id);
  } else {
    saveStateToStorage();
    updateCartUI();
  }
}

function calculateTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = state.discount.percentage
    ? (subtotal * state.discount.percentage) / 100
    : 0;
  const total = Math.max(subtotal - discount, 0);
  return { subtotal, discount, total };
}

function renderCartList(container) {
  container.innerHTML = "";
  if (!state.cart.length) {
    return;
  }

  state.cart.forEach((item) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <div class="cart-item-main">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-meta">
          ${item.quantity} traveler${item.quantity > 1 ? "s" : ""} • ${formatCurrency(
            item.price
          )} each
        </div>
      </div>
      <div class="cart-item-actions">
        <div class="qty-control" data-id="${item.id}">
          <button class="qty-btn" data-action="decrease">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" data-action="increase">+</button>
        </div>
        <div class="cart-item-price">${formatCurrency(item.price * item.quantity)}</div>
        <button class="cart-remove" data-id="${item.id}">Remove</button>
      </div>
    `;
    container.appendChild(div);
  });
}

function updateCartUI() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  if (els.cartCount) {
    els.cartCount.textContent = count;
  }

  if (els.cartEmptyMessage) {
    els.cartEmptyMessage.style.display = state.cart.length ? "none" : "block";
  }

  if (els.cartItems) {
    renderCartList(els.cartItems);
  }
  if (els.drawerCartItems) {
    renderCartList(els.drawerCartItems);
  }

  const { subtotal, discount, total } = calculateTotals();
  if (els.subtotalValue) els.subtotalValue.textContent = formatCurrency(subtotal);
  if (els.discountValue) els.discountValue.textContent = `-${formatCurrency(discount)}`;
  if (els.totalValue) els.totalValue.textContent = formatCurrency(total);
  if (els.drawerTotalValue) els.drawerTotalValue.textContent = formatCurrency(total);
}

function applyDiscount() {
  const code = (els.discountInput.value || "").trim().toUpperCase();
  if (!code) {
    els.discountMessage.textContent = "Enter a discount code to apply.";
    els.discountMessage.className = "discount-message error";
    return;
  }

  const percentage = discountCodes[code];
  if (!percentage) {
    state.discount.code = null;
    state.discount.percentage = 0;
    els.discountMessage.textContent = "This code is not valid for this demo checkout.";
    els.discountMessage.className = "discount-message error";
  } else {
    state.discount.code = code;
    state.discount.percentage = percentage;
    els.discountMessage.textContent = `Discount applied: ${percentage}% off.`;
    els.discountMessage.className = "discount-message success";
  }
  saveStateToStorage();
  updateCartUI();
}

function removeDiscount() {
  state.discount.code = null;
  state.discount.percentage = 0;
  if (els.discountInput) els.discountInput.value = "";
  if (els.discountMessage) {
    els.discountMessage.textContent = "Discount removed.";
    els.discountMessage.className = "discount-message";
  }
  saveStateToStorage();
  updateCartUI();
}

function openCartDrawer() {
  if (!els.cartDrawer) return;
  els.cartDrawer.classList.add("open");
  if (els.cartDrawerBackdrop) {
    els.cartDrawerBackdrop.classList.add("visible");
  }
}

function closeCartDrawer() {
  if (!els.cartDrawer) return;
  els.cartDrawer.classList.remove("open");
  if (els.cartDrawerBackdrop) {
    els.cartDrawerBackdrop.classList.remove("visible");
  }
}

function downloadContactInfo(name, email, message) {
  const date = new Date().toLocaleString();
  const content = `SkyWay Travels - Contact Form Submission
=====================================

Date: ${date}
Name: ${name}
Email: ${email}

Message:
${message}

=====================================
Thank you for contacting SkyWay Travels!
We will get back to you within 24-48 hours.`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `skyway-contact-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleContactForm(e) {
  e.preventDefault();
  
  const name = els.contactName?.value?.trim();
  const email = els.contactEmail?.value?.trim();
  const message = els.contactMessage?.value?.trim();

  if (!name || !email || !message) {
    showToast("Please fill in all fields");
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Please enter a valid email address");
    return;
  }

  // Download the contact information
  downloadContactInfo(name, email, message);
  
  showToast("Message saved! Check your downloads folder.");
  
  // Reset form
  if (els.contactForm) {
    els.contactForm.reset();
  }
}

function setupEventListeners() {
  qsa(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".package-card");
      if (!card) return;
      const id = card.getAttribute("data-id");
      const name = card.getAttribute("data-name");
      const price = parseFloat(card.getAttribute("data-price") || "0");
      addToCart({ id, name, price });
    });
  });

  [els.cartItems, els.drawerCartItems].forEach((container) => {
    if (!container) return;
    container.addEventListener("click", (e) => {
      const target = e.target;
      if (target.matches(".qty-btn")) {
        const wrapper = target.closest(".qty-control");
        const id = wrapper?.getAttribute("data-id");
        if (!id) return;
        const action = target.getAttribute("data-action");
        if (action === "increase") updateQuantity(id, 1);
        if (action === "decrease") updateQuantity(id, -1);
      }
      if (target.matches(".cart-remove")) {
        const id = target.getAttribute("data-id");
        if (!id) return;
        removeFromCart(id);
        showToast("Item removed from cart");
      }
    });
  });

  if (els.applyDiscountBtn) {
    els.applyDiscountBtn.addEventListener("click", applyDiscount);
  }
  if (els.removeDiscountBtn) {
    els.removeDiscountBtn.addEventListener("click", removeDiscount);
  }

  if (els.checkoutForm) {
    els.checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!state.cart.length) {
        showToast("Add at least one trip before completing booking.");
        return;
      }
      const { total } = calculateTotals();
      showToast(`Booking confirmed! Total: ${formatCurrency(total)} (demo).`);
      state.cart = [];
      removeDiscount();
      updateCartUI();
      e.target.reset();
      closeCartDrawer();
      saveStateToStorage();
    });
  }

  // Contact form handler
  if (els.contactForm) {
    els.contactForm.addEventListener("submit", handleContactForm);
  }
  
  if (els.sendContactBtn) {
    els.sendContactBtn.addEventListener("click", handleContactForm);
  }

  if (els.openCartBtn) {
    els.openCartBtn.addEventListener("click", openCartDrawer);
  }
  if (els.closeCartBtn) {
    els.closeCartBtn.addEventListener("click", closeCartDrawer);
  }
  if (els.cartDrawerBackdrop) {
    els.cartDrawerBackdrop.addEventListener("click", closeCartDrawer);
  }
  if (els.goToCheckoutFromCart) {
    els.goToCheckoutFromCart.addEventListener("click", () => {
      closeCartDrawer();
      window.location.href = "billing.html";
    });
  }

  if (els.navToggle && els.navLinks) {
    els.navToggle.addEventListener("click", () => {
      els.navLinks.classList.toggle("open");
    });
    els.navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        els.navLinks.classList.remove("open");
      });
    });
  }

  if (els.exploreBtn) {
    els.exploreBtn.addEventListener("click", () => {
      window.location.href = "destinations.html";
    });
  }
  if (els.heroScrollBilling) {
    els.heroScrollBilling.addEventListener("click", () => {
      window.location.href = "billing.html";
    });
  }
}

function setYear() {
  const span = document.getElementById("year");
  if (span) span.textContent = new Date().getFullYear();
}

window.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadStateFromStorage();
  setYear();
  updateCartUI();
  setupEventListeners();
});