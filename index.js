// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5jaPVkCwxXiMYhSn0uuW9QSMc-B5C9YY",
  authDomain: "mjsmartapps.firebaseapp.com",
  databaseURL: "https://mjsmartapps-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mjsmartapps",
  storageBucket: "mjsmartapps.firebasestorage.app",
  messagingSenderId: "1033240518010",
  appId: "1:1033240518010:web:930921011dda1bd56e0ac3",
  measurementId: "G-959VLQSHH2"
};

firebase.initializeApp(firebaseConfig);

// Helper: get user's current geolocation
function getCurrentLocation(timeout = 5000) {
    return new Promise((resolve) => {
        if (!navigator.geolocation) return resolve({ lat: null, lng: null });
        let resolved = false;
        const onSuccess = (pos) => {
            if (resolved) return;
            resolved = true;
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        };
        const onError = () => {
            if (resolved) return;
            resolved = true;
            resolve({ lat: null, lng: null });
        };
        navigator.geolocation.getCurrentPosition(onSuccess, onError, { timeout });
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve({ lat: null, lng: null });
            }
        }, timeout + 500);
    });
}

const auth = firebase.auth();
const db = firebase.database();
const DELIVERY_CHARGE = 50;
const qrcodeContainer = document.getElementById('qrcode-temp-container');
// Initialize QR helper but keep hidden until needed
const qrcode = new QRCode(qrcodeContainer, {
    width: 128, height: 128, colorDark : "#000000", colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});

const grid = document.querySelector('.category-grid');
// Basic Autoscroll logic for categories
let autoScrollSpeed = 0.5;
let isUserScrolling = false;
function autoScroll() {
    if (!isUserScrolling && grid) {
        grid.scrollLeft += autoScrollSpeed;
        if (grid.scrollLeft >= grid.scrollWidth - grid.clientWidth) {
            grid.scrollLeft = 0;
        }
    }
    requestAnimationFrame(autoScroll);
}
if (grid) {
    grid.addEventListener('mousedown', () => isUserScrolling = true);
    grid.addEventListener('touchstart', () => isUserScrolling = true);
    grid.addEventListener('mouseup', () => isUserScrolling = false);
    grid.addEventListener('mouseleave', () => isUserScrolling = false);
    grid.addEventListener('touchend', () => isUserScrolling = false);
    requestAnimationFrame(autoScroll);
}

const appState = {
    currentUser: null,
    cart: JSON.parse(localStorage.getItem('cart')) || {},
    products: [],
    // Updated Icons for Premium Look
    categories: [
        { id: 'groceries', name: 'Groceries', icon: 'fas fa-leaf' },
        { id: 'vegfruits', name: 'Fresh', icon: 'fas fa-apple-alt' },
        { id: 'icejuice', name: 'Coolers', icon: 'fas fa-glass-martini-alt' },
        { id: 'snacksmed', name: 'Pantry', icon: 'fas fa-cookie-bite' },
        { id: 'hotel', name: 'Dining', icon: 'fas fa-utensils' },
        { id: 'meat', name: 'Meats', icon: 'fas fa-drumstick-bite' },
        { id: 'fishes', name: 'Seafood', icon: 'fas fa-fish' }               
    ],
    currentCategory: null,
    ads: [],
    currentLocation: { lat: null, lng: null },
    confirmationResult: null
};

const elements = {
    loaderBar: document.getElementById('loader-bar'),
    hamburger: document.getElementById('hamburger'),
    drawer: document.getElementById('drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    drawerItems: document.querySelectorAll('#drawer li'),
    logoutDrawerBtn: document.getElementById('logout-drawer-btn'),
    
    loginModal: document.getElementById('login-modal'),
    closeLoginModal: document.getElementById('close-login-modal'),
    
    cartBtn: document.getElementById('cart-btn'),
    cartCount: document.getElementById('cart-count'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartDrawerOverlay: document.getElementById('cart-drawer-overlay'),
    closeCartBtn: document.getElementById('close-cart-btn'),
    cartItems: document.getElementById('cart-items'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    checkoutBtn: document.getElementById('checkout-btn'),
    
    checkoutForm: document.getElementById('checkout-form'),
    checkoutName: document.getElementById('checkout-name'),
    checkoutPhone: document.getElementById('checkout-phone'),
    checkoutAddress: document.getElementById('checkout-address'),
    checkoutEmail: document.getElementById('checkout-email'),
    checkoutSubtotal: document.getElementById('checkout-subtotal'),
    deliveryCharges: document.getElementById('delivery-charges'),
    checkoutTotal: document.getElementById('checkout-total'),
    
    bannerSlider: document.getElementById('banner-slider'),
    categoryList: document.getElementById('category-list'),
    productsGrid: document.getElementById('products-grid'),
    productsTitle: document.getElementById('products-title'),
    
    ordersList: document.getElementById('orders-list'),
    queriesForm: document.getElementById('queries-form'),
    profileInfo: document.getElementById('profile-info'),
    cartViewItems: document.getElementById('cart-view-items'),
    toastContainer: document.getElementById('toast-container'),
    
    locationDisplay: document.getElementById('location-display'),
    currentLocationText: document.getElementById('current-location-text'),
    changeLocationBtn: document.getElementById('change-location-btn'),
    
    profileMapBtn: document.getElementById('profile-map-btn'),
    mapContainer: document.getElementById('map-container'),
    saveLocationBtn: document.getElementById('save-location-btn'),
    detectLocationBtn: document.getElementById('detect-location-btn'),
    
    editProfileBtn: document.getElementById('edit-profile-btn'),
    profileLogoutBtn: document.getElementById('profile-logout-btn'),
    updateProfileForm: document.getElementById('update-profile-form'),
    updateName: document.getElementById('update-name'),
    updateEmail: document.getElementById('update-email'),
    updatePhone: document.getElementById('update-phone'),
    updateAddress: document.getElementById('update-address'),
    
    // Auth
    loginPhone: document.getElementById('loginPhone'),
    sendOtpBtn: document.getElementById('send-otp-btn'),
    phoneStep1: document.getElementById('phone-step-1'),
    phoneStep2: document.getElementById('phone-step-2'),
    loginOtp: document.getElementById('loginOtp'),
    verifyOtpBtn: document.getElementById('verify-otp-btn'),
    backToPhoneBtn: document.getElementById('back-to-phone-btn'),
    detectAddressBtn: document.getElementById('detect-address-btn'),
    
    // Search
    globalSearchInput: document.getElementById('global-search-input'),
    searchResultsGrid: document.getElementById('search-results-grid')
};

function showLoader() { elements.loaderBar.style.width = '30%'; }
function hideLoader() { elements.loaderBar.style.width = '100%'; setTimeout(() => elements.loaderBar.style.width = '0', 300); }

function showToast(message) {
    const toast = document.createElement('div');
    toast.classList.add('toast');
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function switchView(viewId, skipHistory = false) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
    elements.drawerItems.forEach(item => item.classList.remove('active'));
    
    const drawerItem = document.querySelector(`[data-view="${viewId.replace('-view', '')}"]`);
    if (drawerItem) drawerItem.classList.add('active');
    
    elements.drawer.classList.remove('open');
    elements.drawerOverlay.classList.remove('open');
    elements.cartDrawer.classList.remove('open');
    elements.cartDrawerOverlay.classList.remove('open');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!skipHistory) {
        history.pushState({ view: viewId }, "", `#${viewId}`);
    }
}

window.addEventListener("popstate", (event) => {
    const viewId = event.state?.view || "home-view";
    switchView(viewId, true);
});

// ================= AUTH LOGIC =================

function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    const span = btn.querySelector('.btn-text');
    if (isLoading) {
        if (!btn.getAttribute('data-original-text') && span) {
             btn.setAttribute('data-original-text', span.textContent);
        }
        btn.disabled = true;
        if(span) span.textContent = "Processing...";
    } else {
        btn.disabled = false;
        if(span && btn.getAttribute('data-original-text')) {
             span.textContent = btn.getAttribute('data-original-text');
        }
    }
}

window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'normal',
    'callback': (response) => {}
});
let recaptchaWidgetId = null;
window.recaptchaVerifier.render().then(function(widgetId){ recaptchaWidgetId = widgetId; }).catch(()=>{});

function isRecaptchaSolved() {
    try {
        if (window.grecaptcha && recaptchaWidgetId !== null) {
            return !!grecaptcha.getResponse(recaptchaWidgetId);
        }
    } catch (e) {}
    return false;
}

async function ensureUserProfile(user) {
    const userRef = db.ref(`users/${user.uid}`);
    const snapshot = await userRef.once('value');
    const currentData = snapshot.val() || {};
    const updates = {
        name: currentData.name || user.displayName || ('Guest ' + (user.phoneNumber ? user.phoneNumber.slice(-4) : '')),
        email: currentData.email || user.email || '',
        phone: currentData.phone || user.phoneNumber || '',
        lat: currentData.lat || appState.currentLocation.lat || null,
        lng: currentData.lng || appState.currentLocation.lng || null,
        address: currentData.address || ''
    };
    await userRef.update(updates);
}

auth.onAuthStateChanged(async user => {
    appState.currentUser = user;
    if (user) {
        elements.logoutDrawerBtn.style.display = 'flex';
        await ensureUserProfile(user);
        db.ref(`users/${user.uid}`).once('value', snapshot => {
            const profile = snapshot.val();
            // Pass the full address string to the display function
            if (profile) updateLocationDisplay(profile.lat, profile.lng, profile.address);
        });
        renderCart();
    } else {
        elements.logoutDrawerBtn.style.display = 'none';
        elements.locationDisplay.classList.remove('active');
    }
});

elements.closeLoginModal.addEventListener('click', () => {
    elements.loginModal.classList.remove('open');
});

elements.sendOtpBtn.addEventListener('click', async () => {
    let phoneNumber = elements.loginPhone.value.trim();
    if(!phoneNumber || phoneNumber.length !== 10) {
        showToast("Enter a valid 10-digit number");
        return;
    }
    const fullPhoneNumber = "+91" + phoneNumber;
    
    if (!isRecaptchaSolved()) {
        showToast('Please complete verification');
        return;
    }
    
    const appVerifier = window.recaptchaVerifier;
    try {
        showLoader();
        setButtonLoading(elements.sendOtpBtn, true);
        appState.confirmationResult = await auth.signInWithPhoneNumber(fullPhoneNumber, appVerifier);
        elements.phoneStep1.style.display = 'none';
        elements.phoneStep2.style.display = 'block';
        showToast("OTP Sent!");
    } catch (error) {
        showToast("Error: " + error.message);
        window.recaptchaVerifier.render().then(function(widgetId) { grecaptcha.reset(widgetId); });
    } finally {
        hideLoader();
        setButtonLoading(elements.sendOtpBtn, false);
    }
});

elements.verifyOtpBtn.addEventListener('click', async () => {
    const code = elements.loginOtp.value;
    if(!code) return showToast("Enter OTP");
    if(!appState.confirmationResult) return;

    try {
        showLoader();
        setButtonLoading(elements.verifyOtpBtn, true);
        await appState.confirmationResult.confirm(code);
        elements.loginModal.classList.remove('open');
        showToast("Welcome back!");
    } catch (error) {
        showToast("Invalid OTP.");
    } finally {
        hideLoader();
        setButtonLoading(elements.verifyOtpBtn, false);
    }
});

elements.backToPhoneBtn.addEventListener('click', () => {
    elements.phoneStep1.style.display = 'block';
    elements.phoneStep2.style.display = 'none';
});

async function handleLogout() {
    try {
        showLoader();
        await auth.signOut();
        showToast('Logged out');
        switchView('home-view');
    } catch (error) {
        showToast(error.message);
    } finally {
        hideLoader();
    }
}

elements.profileLogoutBtn.addEventListener('click', handleLogout);
elements.logoutDrawerBtn.addEventListener('click', handleLogout);

// ================= UI INTERACTIONS =================

elements.hamburger.addEventListener('click', () => {
    elements.drawer.classList.add('open');
    elements.drawerOverlay.classList.add('open');
});

elements.drawerOverlay.addEventListener('click', () => {
    elements.drawer.classList.remove('open');
    elements.drawerOverlay.classList.remove('open');
});

elements.drawerItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if (view) {
            if (view === 'products') loadProducts();
            else if (['orders', 'queries', 'profile', 'cart'].includes(view)) {
                if (!appState.currentUser) {
                    showToast('Please login first.');
                    elements.loginModal.classList.add('open');
                    if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                    return;
                }
                if (view === 'orders') loadOrders();
                if (view === 'profile') loadProfile();
                if (view === 'cart') {
                    renderCartView();
                    loadUserProfileForCheckout();
                }
            }
            switchView(`${view}-view`);
        }
    });
});

// Cart Drawer
elements.cartBtn.addEventListener('click', () => {
    elements.cartDrawer.classList.add('open');
    elements.cartDrawerOverlay.classList.add('open');
});
elements.closeCartBtn.addEventListener('click', () => {
    elements.cartDrawer.classList.remove('open');
    elements.cartDrawerOverlay.classList.remove('open');
});
elements.cartDrawerOverlay.addEventListener('click', () => {
    elements.cartDrawer.classList.remove('open');
    elements.cartDrawerOverlay.classList.remove('open');
});

// === UPDATED RENDER FUNCTION FOR PRODUCT CARD ===
function createProductCard(product) {
    const card = document.createElement('div');
    card.classList.add('product-card');
    
    const cartItem = appState.cart[product.id];
    
    let actionHtml = '';
    if(cartItem) {
        actionHtml = `
            <div class="qty-control-sm">
                <button class="minus"><i class="fas fa-minus"></i></button>
                <span>${cartItem.qty}</span>
                <button class="plus"><i class="fas fa-plus"></i></button>
            </div>
        `;
    } else {
        actionHtml = `<button class="add-btn-fab"><i class="fas fa-plus"></i></button>`;
    }

    card.innerHTML = `
        <div class="product-img-wrap">
            <img src="${product.image}" alt="${product.name}" class="product-card-image" loading="lazy">
        </div>
        <div class="product-info">
            <h4>${product.name}</h4>
            <p>${product.unit}</p>
            <div class="price-row">
                <span class="price">₹${(Number(product.price)||0).toFixed(2)}</span>
                <div class="action-wrapper">${actionHtml}</div>
            </div>
        </div>
    `;

    // Listeners
    if (cartItem) {
        const minus = card.querySelector('.minus');
        const plus = card.querySelector('.plus');
        if(minus) minus.addEventListener('click', (e) => { e.stopPropagation(); changeQty(product.id, -1); });
        if(plus) plus.addEventListener('click', (e) => { e.stopPropagation(); changeQty(product.id, 1); });
    } else {
        const addBtn = card.querySelector('.add-btn-fab');
        if(addBtn) addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const trackingId = product.originalId || product.id;
            db.ref(`popularProducts/${trackingId}/buyCount`).transaction(count => (count || 0) + 1);
            addToCart({ ...product, category: appState.currentCategory || 'general' });
        });
    }
    return card;
}

function updateProductGrids() {
    renderPopularProducts();
    renderHomeProducts('');
    if(document.getElementById('products-view').classList.contains('active')) renderProducts('');
    if(document.getElementById('search-view').classList.contains('active')) renderSearchResults(elements.globalSearchInput.value);
}

function addToCart(product) {
    if (appState.cart[product.id]) {
        appState.cart[product.id].qty++;
    } else {
        appState.cart[product.id] = { ...product, qty: 1 };
    }
    localStorage.setItem('cart', JSON.stringify(appState.cart));
    renderCart();
    updateProductGrids();
    showToast(`${product.name} added!`);
}

function renderCart() {
    let html = '';
    let subtotal = 0;
    let totalItems = 0;
    const cartItems = Object.values(appState.cart);

    if (cartItems.length === 0) {
        html = '<div style="text-align:center; padding:2rem; color:#999;">Your bag is empty.</div>';
        elements.checkoutBtn.disabled = true;
        elements.checkoutBtn.style.opacity = '0.5';
        elements.cartCount.style.display = 'none';
    } else {
        elements.checkoutBtn.disabled = false;
        elements.checkoutBtn.style.opacity = '1';
        elements.cartCount.style.display = 'block';
        cartItems.forEach(item => {
            const itemTotal = (Number(item.price)||0) * item.qty;
            subtotal += itemTotal;
            totalItems += item.qty;
            html += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="cart-item-info">
                        <div>
                            <h4>${item.name}</h4>
                            <small>${item.unit}</small>
                        </div>
                        <div class="cart-item-controls">
                            <span style="font-weight:600; color:var(--primary);">₹${itemTotal.toFixed(2)}</span>
                            <div class="qty-badge">
                                <button class="qty-btn-mini" onclick="changeQty('${item.id}', -1)">−</button>
                                <span>${item.qty}</span>
                                <button class="qty-btn-mini" onclick="changeQty('${item.id}', 1)">+</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    elements.cartItems.innerHTML = html;
    elements.cartSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    elements.cartCount.textContent = totalItems;
    renderCartView();
}

async function renderPopularProducts() {
    const grid = document.getElementById('popular-products-grid');
    grid.innerHTML = '';
    const popular = [...appState.products]
        .sort((a, b) => (b.buyCount || 0) - (a.buyCount || 0))
        .slice(0, 6);
    if (popular.length === 0) grid.innerHTML = '<p class="empty-state">No trending items yet.</p>';
    else popular.forEach(product => grid.appendChild(createProductCard(product)));
}

function renderHomeProducts(query = '') {
    const grid = document.getElementById('home-products-grid');
    grid.innerHTML = '';
    const filteredProducts = appState.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
    );
    if (filteredProducts.length === 0) grid.innerHTML = '<p class="empty-state">No products found.</p>';
    else filteredProducts.forEach(product => grid.appendChild(createProductCard(product)));
}

function renderCartView() {
    let html = '';
    let subtotal = 0;
    const cartItems = Object.values(appState.cart);

    if (cartItems.length === 0) {
        html = '<p style="text-align:center; padding:2rem; color:#888;">Your cart is empty.</p>';
    } else {
        cartItems.forEach(item => {
            const itemTotal = (Number(item.price)||0) * item.qty;
            subtotal += itemTotal;
            html += `
                <div class="cart-view-item">
                    <img src="${item.image}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
                    <div style="flex:1;">
                        <h4 style="margin:0; font-size:1rem;">${item.name}</h4>
                        <p style="margin:0; color:#888; font-size:0.8rem;">${item.unit}</p>
                        <div style="margin-top:0.5rem; display:flex; gap:10px; align-items:center;">
                             <button style="border:1px solid #ddd; background:white; width:24px; border-radius:4px;" onclick="changeQty('${item.id}', -1)">-</button>
                             <span>${item.qty}</span>
                             <button style="border:1px solid #ddd; background:white; width:24px; border-radius:4px;" onclick="changeQty('${item.id}', 1)">+</button>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700; color:var(--primary);">₹${itemTotal.toFixed(2)}</div>
                        <button onclick="removeFromCart('${item.id}')" style="margin-top:0.5rem; background:none; border:none; color:#ff5252; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
    }
    elements.cartViewItems.innerHTML = html;
    elements.checkoutSubtotal.textContent = `₹${subtotal.toFixed(2)}`;
    const total = subtotal + (subtotal > 0 ? DELIVERY_CHARGE : 0);
    elements.checkoutTotal.textContent = `₹${total.toFixed(2)}`;
}

function changeQty(productId, change) {
    if (appState.cart[productId]) {
        appState.cart[productId].qty += change;
        if (appState.cart[productId].qty <= 0) delete appState.cart[productId];
        localStorage.setItem('cart', JSON.stringify(appState.cart));
        renderCart();
        renderCartView();
        updateProductGrids();
    }
}

function removeFromCart(productId) {
    if (confirm('Remove this item?')) {
        delete appState.cart[productId];
        localStorage.removeItem('cart');
        renderCart();
        renderCartView();
        updateProductGrids();
    }
}

elements.checkoutBtn.addEventListener('click', () => {
    if (!appState.currentUser) {
        showToast('Please login to checkout.');
        elements.loginModal.classList.add('open');
        elements.cartDrawer.classList.remove('open');
        elements.cartDrawerOverlay.classList.remove('open');
        if(window.recaptchaVerifier) window.recaptchaVerifier.render();
        return;
    }
    switchView('cart-view');
    elements.cartDrawer.classList.remove('open');
    elements.cartDrawerOverlay.classList.remove('open');
    loadUserProfileForCheckout();
});

async function loadUserProfileForCheckout() {
    if (!appState.currentUser) return;
    const snapshot = await db.ref(`users/${appState.currentUser.uid}`).once('value');
    const profile = snapshot.val() || {};
    
    elements.checkoutName.value = profile.name || appState.currentUser.displayName || '';
    elements.checkoutPhone.value = profile.phone || appState.currentUser.phoneNumber || '';
    elements.checkoutEmail.value = profile.email || appState.currentUser.email || '';
    elements.checkoutAddress.value = profile.address || '';
    
    elements.checkoutEmail.readOnly = !!appState.currentUser.email;
    elements.checkoutPhone.readOnly = !!appState.currentUser.phoneNumber && !appState.currentUser.email;
    renderCartView();
}

if(elements.detectAddressBtn) {
    elements.detectAddressBtn.addEventListener('click', async () => {
        showLoader();
        try {
            const loc = await getCurrentLocation();
            if (loc.lat && loc.lng) {
                appState.currentLocation = loc;
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
                const data = await response.json();
                if(data && data.display_name) {
                    elements.checkoutAddress.value = data.display_name;
                    showToast("Address Found!");
                } else showToast("Address unknown.");
            } else showToast("GPS Failed.");
        } catch(e) { showToast("Error finding address."); } 
        finally { hideLoader(); }
    });
}

elements.checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const items = Object.values(appState.cart);
    if (items.length === 0) return showToast('Cart is empty.');

    try {
        showLoader();
        const orderId = db.ref('orders').push().key;
        const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0);
        const total = subtotal + DELIVERY_CHARGE;

        // FIXED QR CODE GENERATION
        const qrCodeDataURL = await new Promise(resolve => {
            // Create a dedicated container for generation
            const container = document.createElement("div");
            const qr = new QRCode(container, {
                text: orderId, width: 128, height: 128,
                colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H
            });
            setTimeout(() => {
                // Check for IMG first (standard behaviour)
                const img = container.querySelector("img");
                if (img && img.src) {
                    resolve(img.src);
                } else {
                    // Fallback for Canvas (which qrcode.js often uses by default)
                    const canvas = container.querySelector("canvas");
                    if (canvas) {
                        resolve(canvas.toDataURL());
                    } else {
                        resolve(""); // Failed to generate
                    }
                }
            }, 500);
        });

        const orderData = {
            id: orderId, orderId: orderId, userId: appState.currentUser.uid,
            customerName: elements.checkoutName.value,
            phone: elements.checkoutPhone.value,
            email: elements.checkoutEmail.value,
            address: elements.checkoutAddress.value,
            lat: appState.currentLocation.lat, lng: appState.currentLocation.lng,
            items: items.map(item => ({
                productId: item.id, name: item.name, qty: item.qty,
                unit: item.unit, price: Number(item.price) || 0
            })),
            subtotal, deliveryCharge: DELIVERY_CHARGE, total,
            status: 'ORDER PLACED', qrCode: qrCodeDataURL, 
            otp: Math.floor(100000 + Math.random() * 900000),
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        await db.ref(`orders/${orderId}`).set(orderData);
        await db.ref(`users/${appState.currentUser.uid}`).update({
            name: orderData.customerName, address: orderData.address,
            phone: orderData.phone, email: orderData.email
        });

        items.forEach(item => {
            const trackId = item.originalId || item.id;
            db.ref(`popularProducts/${trackId}/buyCount`).transaction(count => (count || 0) + item.qty);
        });

        appState.cart = {}; localStorage.removeItem('cart');
        renderCart(); updateProductGrids();

        const overlay = document.getElementById('order-success-overlay');
        overlay.classList.add('active');
        setTimeout(() => {
            overlay.classList.remove('active');
            switchView('orders-view');
            loadOrders();
        }, 3000);

    } catch (error) { showToast('Order failed: ' + error.message); } 
    finally { hideLoader(); }
});

// Ads & Banner
async function loadAds() {
    try {
        showLoader();
        const snapshot = await db.ref('ads').once('value');
        appState.ads = Object.values(snapshot.val() || {});
        renderAds();
    } catch (error) {} finally { hideLoader(); }
}

let currentSlide = 0;
let bannerInterval = null;

function renderAds() {
    const slider = elements.bannerSlider;
    const dotsContainer = document.getElementById('banner-dots');
    if (!slider || !dotsContainer) return;
    slider.innerHTML = ''; dotsContainer.innerHTML = '';

    appState.ads.forEach((ad, index) => {
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        slide.style.backgroundImage = `url('${ad.image}')`;
        slider.appendChild(slide);
        const dot = document.createElement('div');
        dot.className = 'banner-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => scrollToSlide(index));
        dotsContainer.appendChild(dot);
    });
    startBannerSlider();
}

function scrollToSlide(index) {
    const slider = elements.bannerSlider;
    const slideWidth = slider.clientWidth;
    slider.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
    currentSlide = index;
    document.querySelectorAll('.banner-dot').forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

function startBannerSlider() {
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const total = elements.bannerSlider.querySelectorAll('.banner-slide').length;
        if(total > 0) scrollToSlide((currentSlide + 1) % total);
    }, 4000);
}

function renderCategories(containerId) {
    const container = document.getElementById(containerId || 'category-list');
    if (!container) return;
    container.innerHTML = appState.categories.map(cat => `
        <div class="category-card" data-category="${cat.id}">
            <div class="cat-icon-box"><i class="${cat.icon}"></i></div>
            <h4>${cat.name}</h4>
        </div>
    `).join('');
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            appState.currentCategory = category;
            loadProducts(category);
            switchView('products-view');
        });
    });
}

async function loadPopularProducts() {
    try {
        const snapshot = await db.ref('orders').once('value');
        const orders = snapshot.val() || {};
        const counts = {};
        Object.values(orders).forEach(order => {
            if (order.items) order.items.forEach(item => counts[item.productId] = (counts[item.productId] || 0) + item.qty);
        });
        appState.products = appState.products.map(p => ({ ...p, buyCount: counts[p.id] || 0 }));
        renderPopularProducts();
    } catch (err) {}
}

async function initHome() {
    await loadProducts();
    await loadPopularProducts();
    renderHomeProducts();
    loadAds();
    renderCategories('category-list');
}
window.addEventListener("load", initHome);

async function loadProducts(category = null) {
    showLoader();
    elements.productsGrid.innerHTML = '';
    appState.currentCategory = category;
    elements.productsTitle.textContent = category ? (appState.categories.find(c => c.id === category)?.name || 'Products') : 'All Products';

    try {
        const snapshot = await db.ref('products').once('value');
        const data = snapshot.val() || {};
        let allProducts = [];

        if (category) {
            const categoryData = data[category] || null;
            if (categoryData && typeof categoryData === 'object' && (categoryData.name === undefined)) {
                allProducts = Object.entries(categoryData).map(([key, val]) => ({ id: `${category}_${key}`, originalId: key, ...val }));
            } else {
                allProducts = Object.entries(data).filter(([k, v]) => v && v.category === category).map(([key, val]) => ({ id: key, ...val }));
            }
        } else {
            const keys = Object.keys(data);
            if (keys.length > 0) {
                const firstVal = data[keys[0]];
                if (firstVal && (firstVal.name !== undefined || firstVal.price !== undefined)) {
                    allProducts = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
                } else {
                    Object.entries(data).forEach(([catKey, catVal]) => {
                        if (catVal && typeof catVal === 'object') {
                            Object.entries(catVal).forEach(([prodKey, prodVal]) => {
                                allProducts.push({ id: `${catKey}_${prodKey}`, originalId: prodKey, ...prodVal, category: catKey });
                            });
                        }
                    });
                }
            }
        }
        appState.products = allProducts.map(p => ({ ...p, price: Number(p.price) || 0 }));
        updateProductGrids();
    } catch (error) { console.error(error); } finally { hideLoader(); }
}

function renderProducts(query = '') {
    elements.productsGrid.innerHTML = '';
    const filteredProducts = appState.products.filter(product => product.name.toLowerCase().includes(query.toLowerCase()));
    if (filteredProducts.length === 0) elements.productsGrid.innerHTML = '<p class="empty-state">No products found.</p>';
    else filteredProducts.forEach(product => elements.productsGrid.appendChild(createProductCard(product)));
}

function renderSearchResults(query = '') {
    const grid = elements.searchResultsGrid;
    grid.innerHTML = '';
    if(!query.trim()) { grid.innerHTML = '<div class="empty-state">Start typing to search...</div>'; return; }
    const filteredProducts = appState.products.filter(product => product.name.toLowerCase().includes(query.toLowerCase()));
    if (filteredProducts.length === 0) grid.innerHTML = '<div class="empty-state">No matches found.</div>';
    else filteredProducts.forEach(product => grid.appendChild(createProductCard(product)));
}
elements.globalSearchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));

function loadOrders() {
    if (!appState.currentUser) return;
    showLoader();
    db.ref('orders').orderByChild('userId').equalTo(appState.currentUser.uid).on('value', snapshot => {
        const orders = Object.values(snapshot.val() || {}).reverse();
        renderOrders(orders);
        hideLoader();
    }, () => hideLoader());
}

function renderOrders(orders) {
    elements.ordersList.innerHTML = '';
    if (orders.length === 0) {
        elements.ordersList.innerHTML = '<div class="empty-state">No past orders.</div>';
        return;
    }
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        
        // FIXED STATUS CHECK (Handle trailing spaces or case issues)
        const rawStatus = order.status || 'PENDING';
        const status = rawStatus.trim().toUpperCase();
        
        let statusClass = 'status-pending';
        if(status === 'SHIPPING' || status === 'DELIVERED') statusClass = 'status-shipping';
        
        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
        let itemsHtml = order.items.map(item => `
            <div class="order-item-detail">
                <span>${item.qty} x ${item.name}</span>
                <span>₹${(Number(item.price)||0 * item.qty).toFixed(2)}</span>
            </div>
        `).join('');

        let otpHtml = (status === 'SHIPPING' && order.otp) ? `<p><strong>OTP:</strong> ${order.otp}</p>` : '';
        let qrCodeHtml = (status === 'SHIPPING') ? `
            <div class="order-qr">
                <img src="${order.qrCode}" alt="QR Code">
                <p>Scan for details</p>
            </div>` : '';

        orderCard.innerHTML = `
            <div class="order-header">
                <span style="font-weight:700;">#${(order.id||'').substring(0, 8)}</span>
                <span class="order-status ${statusClass}">${status}</span>
            </div>
            <p style="font-size:0.8rem; color:#888; margin-top:-10px;">${date}</p>
            ${otpHtml}
            <div class="order-items">${itemsHtml}</div>
            <div style="display:flex; justify-content:space-between; font-weight:700;">
                <span>Total</span>
                <span>₹${(Number(order.total)||0).toFixed(2)}</span>
            </div>
            ${qrCodeHtml}
        `;
        elements.ordersList.appendChild(orderCard);
    });
}

elements.queriesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        showLoader();
        await db.ref('queries').push({ 
            name: e.target['query-name'].value, email: e.target['query-email'].value, 
            message: e.target['query-message'].value, createdAt: firebase.database.ServerValue.TIMESTAMP 
        });
        showToast('Message sent!');
        elements.queriesForm.reset();
    } catch (error) { showToast('Error sending message'); } finally { hideLoader(); }
});

async function loadProfile() {
    if (!appState.currentUser) return;
    showLoader();
    try {
        const snapshot = await db.ref(`users/${appState.currentUser.uid}`).once('value');
        const profile = snapshot.val() || {};
        
        elements.profileInfo.innerHTML = `
            <h3>${profile.name || 'User'}</h3>
            <p style="color:#666;">${profile.phone || ''}</p>
            <p style="color:#888; font-size:0.9rem;">${profile.address || 'No address set'}</p>
        `;
        
        elements.updateName.value = profile.name || '';
        elements.updateEmail.value = profile.email || '';
        elements.updatePhone.value = profile.phone || '';
        elements.updateAddress.value = profile.address || '';
        
        if(appState.currentUser.email) elements.updateEmail.readOnly = true;
        if(appState.currentUser.phoneNumber) elements.updatePhone.readOnly = true;

        appState.currentLocation.lat = profile.lat;
        appState.currentLocation.lng = profile.lng;
        // Pass the address to the display updater
        updateLocationDisplay(profile.lat, profile.lng, profile.address);
        elements.updateProfileForm.style.display = 'none';
    } catch (error) {} finally { hideLoader(); }
}

elements.editProfileBtn.addEventListener('click', () => elements.updateProfileForm.style.display = 'block');

elements.updateProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!appState.currentUser) return;
    showLoader();
    try {
        await db.ref(`users/${appState.currentUser.uid}`).update({
            name: elements.updateName.value, email: elements.updateEmail.value,
            phone: elements.updatePhone.value, address: elements.updateAddress.value
        });
        showToast('Profile updated!');
        loadProfile();
    } catch (error) { showToast(error.message); } finally { hideLoader(); }
});

// Map Logic
let map = null;
let marker = null;
async function initMap() {
    const defaultLocation = [20.5937, 78.9629];
    const locationToUse = appState.currentLocation.lat ? [appState.currentLocation.lat, appState.currentLocation.lng] : defaultLocation;
    
    if (map) map.remove();
    map = L.map('map-container').setView(locationToUse, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    marker = L.marker(locationToUse, { draggable: true }).addTo(map);
    marker.on('dragend', () => {
        const latlng = marker.getLatLng();
        appState.currentLocation = { lat: latlng.lat, lng: latlng.lng };
    });
    
    if (!appState.currentLocation.lat) {
        const loc = await getCurrentLocation();
        if (loc.lat) {
            appState.currentLocation = loc;
            marker.setLatLng([loc.lat, loc.lng]);
            map.setView([loc.lat, loc.lng], 15);
        }
    } else map.setView(locationToUse, 15);
}

if (elements.detectLocationBtn) {
    elements.detectLocationBtn.addEventListener('click', async () => {
        showLoader();
        try {
            const loc = await getCurrentLocation();
            if (loc.lat) {
                appState.currentLocation = loc;
                if (marker) marker.setLatLng([loc.lat, loc.lng]);
                if (map) map.setView([loc.lat, loc.lng], 15);
                showToast('Found you!');
            }
        } finally { hideLoader(); }
    });
}

function updateLocationDisplay(lat, lng, address) {
    if (address) {
        // Priority: Show full address string if available
        elements.currentLocationText.textContent = address;
        elements.locationDisplay.classList.add('active');
    } else if (lat && lng) {
        // Fallback: Show coordinates
        elements.currentLocationText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        elements.locationDisplay.classList.add('active');
    }
}

elements.profileMapBtn.addEventListener('click', () => {
    switchView('map-view'); initMap();
});
elements.changeLocationBtn.addEventListener('click', () => {
    if (!appState.currentUser) return elements.loginModal.classList.add('open');
    switchView('map-view'); initMap();
});

elements.saveLocationBtn.addEventListener('click', async () => {
    if (!appState.currentLocation.lat) return showToast('Pick a location first');
    if (appState.currentUser) {
        showLoader();
        await db.ref(`users/${appState.currentUser.uid}`).update(appState.currentLocation);
        hideLoader();
        showToast('Location Saved');
        loadProfile();
        switchView('profile-view');
    }
});

// Footer Nav
document.querySelectorAll('.footer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if(view === 'cart') {
            if (!appState.currentUser) {
                showToast('Please login first');
                elements.loginModal.classList.add('open');
                if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                return;
            }
            renderCartView();
            loadUserProfileForCheckout();
        } else if(['orders', 'profile'].includes(view) && !appState.currentUser) {
             showToast('Please login first');
             elements.loginModal.classList.add('open');
             if(window.recaptchaVerifier) window.recaptchaVerifier.render();
             return;
        } else if(view === 'orders') loadOrders();
        else if(view === 'profile') loadProfile();
        else if(view === 'search') setTimeout(() => elements.globalSearchInput.focus(), 300);
        
        switchView(view + '-view');
        document.querySelectorAll('.footer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});
