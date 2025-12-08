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

// Helper: get user's current geolocation (resolve even if denied)
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
const qrcode = new QRCode(qrcodeContainer, {
    width: 128, height: 128, colorDark : "#000000", colorLight : "#ffffff",
    correctLevel : QRCode.CorrectLevel.H
});

const grid = document.querySelector('.category-grid');
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
    categories: [
        { id: 'groceries', name: 'Groceries', icon: 'fas fa-shopping-basket' },
        { id: 'vegfruits', name: 'Vegetables & Fruits', icon: 'fas fa-carrot' },
        { id: 'icejuice', name: 'Ice Cream & Juice', icon: 'fas fa-ice-cream' },
        { id: 'snacksmed', name: 'Snacks', icon: 'fas fa-pills' },
        { id: 'hotel', name: 'Hotel', icon: 'fas fa-utensils' },
        { id: 'meat', name: 'Meat', icon: 'fas fa-drumstick-bite' },
        { id: 'fishes', name: 'Fishes', icon: 'fas fa-fish' }               
    ],
    currentCategory: null,
    ads: [],
    currentLocation: { lat: null, lng: null },
    confirmationResult: null // For Phone Auth
};

const elements = {
    loaderBar: document.getElementById('loader-bar'),
    hamburger: document.getElementById('hamburger'),
    drawer: document.getElementById('drawer'),
    drawerItems: document.querySelectorAll('#drawer li'),
    logoutDrawerBtn: document.getElementById('logout-drawer-btn'),
    loginModal: document.getElementById('login-modal'),
    loginModalContent: document.getElementById('login-modal-content'),
    closeLoginModal: document.getElementById('close-login-modal'),
    cartBtn: document.getElementById('cart-btn'),
    cartCount: document.getElementById('cart-count'),
    cartDrawer: document.getElementById('cart-drawer'),
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
    // Auth elements
    googleLoginBtn: document.getElementById('google-login-btn'),
    loginPhone: document.getElementById('loginPhone'),
    sendOtpBtn: document.getElementById('send-otp-btn'),
    phoneStep1: document.getElementById('phone-step-1'),
    phoneStep2: document.getElementById('phone-step-2'),
    loginOtp: document.getElementById('loginOtp'),
    verifyOtpBtn: document.getElementById('verify-otp-btn'),
    backToPhoneBtn: document.getElementById('back-to-phone-btn'),
    detectAddressBtn: document.getElementById('detect-address-btn'),
    // Search Elements
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
    setTimeout(() => toast.classList.add('show'), 100);
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
    elements.cartDrawer.classList.remove('open');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!skipHistory) {
        history.pushState({ view: viewId }, "", `#${viewId}`);
    }
}

window.addEventListener("popstate", (event) => {
    const viewId = event.state?.view || "home-view";
    switchView(viewId, true);
});

// ================= NEW AUTH LOGIC WITH BUTTON LOADERS =================

// Helper: Toggle Button Loading State
function setButtonLoading(btn, isLoading) {
    if (!btn) return;
    const span = btn.querySelector('.btn-text');
    if (isLoading) {
        if (!btn.getAttribute('data-original-text')) {
             // Save original text/html mostly for the span content
             if(span) btn.setAttribute('data-original-text', span.textContent);
        }
        btn.disabled = true;
        // Keep the img if exists (Google btn) but hide text and show spinner
        if(span) span.style.opacity = '0';
        
        let loader = btn.querySelector('.btn-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.className = 'btn-loader';
            btn.appendChild(loader);
        }
    } else {
        btn.disabled = false;
        const loader = btn.querySelector('.btn-loader');
        if (loader) loader.remove();
        if(span) span.style.opacity = '1';
    }
}

// Setup Recaptcha
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
    'size': 'normal',
    'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
    }
});

// Check if user exists in DB, else create basic profile and SYNC email/phone
async function ensureUserProfile(user) {
    const userRef = db.ref(`users/${user.uid}`);
    const snapshot = await userRef.once('value');
    const currentData = snapshot.val() || {};
    
    // Prioritize DB data if it exists, otherwise use Auth data, otherwise empty string
    const updates = {
        name: currentData.name || user.displayName || ('User ' + (user.phoneNumber ? user.phoneNumber.slice(-4) : '')),
        email: currentData.email || user.email || '',
        phone: currentData.phone || user.phoneNumber || '',
        lat: currentData.lat || appState.currentLocation.lat || null,
        lng: currentData.lng || appState.currentLocation.lng || null,
        address: currentData.address || ''
    };
    
    // Only update if we have new data to add/sync
    await userRef.update(updates);
}

auth.onAuthStateChanged(async user => {
    appState.currentUser = user;
    if (user) {
        elements.logoutDrawerBtn.style.display = 'list-item';
        
        await ensureUserProfile(user);
        
        db.ref(`users/${user.uid}`).once('value', snapshot => {
            const profile = snapshot.val();
            if (profile) {
                updateLocationDisplay(profile.lat, profile.lng);
            }
        });
        renderCart();
    } else {
        elements.logoutDrawerBtn.style.display = 'none';
        elements.locationDisplay.style.display = 'none';
    }
});

elements.closeLoginModal.addEventListener('click', () => {
    elements.loginModal.classList.remove('open');
});

// Google Login
elements.googleLoginBtn.addEventListener('click', async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        showLoader();
        setButtonLoading(elements.googleLoginBtn, true);
        await auth.signInWithPopup(provider);
        elements.loginModal.classList.remove('open');
        showToast('Signed in with Google!');
    } catch (error) {
        showToast('Google Sign-In Error: ' + error.message);
    } finally {
        hideLoader();
        setButtonLoading(elements.googleLoginBtn, false);
    }
});

// Phone Login: Send OTP
elements.sendOtpBtn.addEventListener('click', async () => {
    let phoneNumber = elements.loginPhone.value.trim();
    if(!phoneNumber) {
        showToast("Please enter a phone number");
        return;
    }
    // Hardcoded India +91 logic
    if (phoneNumber.length !== 10) {
        showToast("Please enter a valid 10-digit number");
        return;
    }
    const fullPhoneNumber = "+91" + phoneNumber;
    
    const appVerifier = window.recaptchaVerifier;
    try {
        showLoader();
        setButtonLoading(elements.sendOtpBtn, true);
        appState.confirmationResult = await auth.signInWithPhoneNumber(fullPhoneNumber, appVerifier);
        elements.phoneStep1.style.display = 'none';
        elements.phoneStep2.style.display = 'block';
        showToast("OTP Sent!");
    } catch (error) {
        showToast("SMS Error: " + error.message);
        console.error(error);
        // Reset recaptcha if failed
        window.recaptchaVerifier.render().then(function(widgetId) {
            grecaptcha.reset(widgetId);
        });
    } finally {
        hideLoader();
        setButtonLoading(elements.sendOtpBtn, false);
    }
});

// Phone Login: Verify OTP
elements.verifyOtpBtn.addEventListener('click', async () => {
    const code = elements.loginOtp.value;
    if(!code) {
        showToast("Please enter OTP");
        return;
    }
    if(!appState.confirmationResult) return;

    try {
        showLoader();
        setButtonLoading(elements.verifyOtpBtn, true);
        await appState.confirmationResult.confirm(code);
        elements.loginModal.classList.remove('open');
        showToast("Phone verified successfully!");
    } catch (error) {
        showToast("Invalid OTP. Try again.");
        console.error(error);
    } finally {
        hideLoader();
        setButtonLoading(elements.verifyOtpBtn, false);
    }
});

elements.backToPhoneBtn.addEventListener('click', () => {
    elements.phoneStep1.style.display = 'block';
    elements.phoneStep2.style.display = 'none';
});

// Logout logic
async function handleLogout() {
        try {
        showLoader();
        await auth.signOut();
        showToast('Logged out successfully!');
        switchView('home-view');
    } catch (error) {
        showToast('Logout failed: ' + error.message);
    } finally {
        hideLoader();
    }
}

elements.profileLogoutBtn.addEventListener('click', handleLogout);
elements.logoutDrawerBtn.addEventListener('click', handleLogout);


// ================= END NEW AUTH LOGIC =================


// UI Listeners
elements.hamburger.addEventListener('click', () => {
    elements.drawer.classList.toggle('open');
});

elements.drawerItems.forEach(item => {
    item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if (view) {
            if (view === 'products') {
                loadProducts();
            } else if (view === 'orders') {
                if (!appState.currentUser) {
                    showToast('Please login to view orders.');
                    elements.loginModal.classList.add('open');
                    // Render Recaptcha only when modal opens to avoid ID issues
                        if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                    return;
                }
                loadOrders();
            } else if (view === 'queries') {
                    if (!appState.currentUser) {
                    showToast('Please login to submit a query.');
                    elements.loginModal.classList.add('open');
                    if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                    return;
                }
            } else if (view === 'profile') {
                if (!appState.currentUser) {
                    showToast('Please login to view your profile.');
                    elements.loginModal.classList.add('open');
                    if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                    return;
                }
                loadProfile();
            } else if (view === 'cart') {
                // === ADDED LOGIN CHECK FOR CART VIEW IN DRAWER ===
                if (!appState.currentUser) {
                    showToast('Please login to view your cart.');
                    elements.loginModal.classList.add('open');
                    if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                    return;
                }
                renderCartView();
            }
            switchView(`${view}-view`);
        }
    });
});

// Cart
elements.cartBtn.addEventListener('click', () => {
    elements.cartDrawer.classList.toggle('open');
});

elements.closeCartBtn.addEventListener('click', () => {
    elements.cartDrawer.classList.remove('open');
});

// Helper to generate product card with dynamic button
function createProductCard(product) {
    const card = document.createElement('div');
    card.classList.add('product-card');
    
    const cartItem = appState.cart[product.id];
    
    let actionHtml = '';
    if(cartItem) {
        actionHtml = `
            <div class="card-qty-control">
                <button class="qty-btn minus"><i class="fas fa-minus"></i></button>
                <span>${cartItem.qty}</span>
                <button class="qty-btn plus"><i class="fas fa-plus"></i></button>
            </div>
        `;
    } else {
        actionHtml = `<button class="add-to-cart-btn">Add to Cart</button>`;
    }

    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-card-image">
        <div class="product-card-content">
            <h4>${product.name}</h4>
            <p>${product.unit}</p>
            <span class="product-card-price">₹${(Number(product.price)||0).toFixed(2)}</span>
            ${actionHtml}
        </div>
    `;

    // Listeners
    if (cartItem) {
        card.querySelector('.minus').addEventListener('click', (e) => {
            e.stopPropagation();
            changeQty(product.id, -1);
        });
        card.querySelector('.plus').addEventListener('click', (e) => {
            e.stopPropagation();
            changeQty(product.id, 1);
        });
    } else {
        card.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            // NOTE: Use originalId for buyCount tracking to match DB schema, but unique ID for cart
            const trackingId = product.originalId || product.id;
            db.ref(`popularProducts/${trackingId}/buyCount`).transaction(count => (count || 0) + 1);
            addToCart({ ...product, category: appState.currentCategory || 'general' });
        });
    }
    return card;
}

// Centralized render triggers
function updateProductGrids() {
    renderPopularProducts();
    renderHomeProducts('');
    if(document.getElementById('products-view').classList.contains('active')) {
        renderProducts('');
    }
    // Update search grid if active
    if(document.getElementById('search-view').classList.contains('active')) {
        renderSearchResults(elements.globalSearchInput.value);
    }
}

function addToCart(product) {
    if (appState.cart[product.id]) {
        appState.cart[product.id].qty++;
    } else {
        appState.cart[product.id] = { ...product, qty: 1 };
    }
    localStorage.setItem('cart', JSON.stringify(appState.cart));
    renderCart();
    updateProductGrids(); // Update buttons
    showToast(`${product.name} added to cart!`);
}

function renderCart() {
    let html = '';
    let subtotal = 0;
    let totalItems = 0;
    const cartItems = Object.values(appState.cart);

    if (cartItems.length === 0) {
        html = '<p style="text-align:center; color:#777;">Your cart is empty.</p>';
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
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.name}</h4>
                        <p>${item.unit}</p>
                        <div class="cart-item-qty">
                            <button onclick="changeQty('${item.id}', -1)"><i class="fas fa-minus"></i></button>
                            <span>${item.qty}</span>
                            <button onclick="changeQty('${item.id}', 1)"><i class="fas fa-plus"></i></button>
                        </div>
                    </div>
                    <span class="cart-item-price">₹${itemTotal.toFixed(2)}</span>
                    <button class="remove-from-cart" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
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
    
    // Use cached data for instant UI updates
    const popular = [...appState.products]
        .sort((a, b) => (b.buyCount || 0) - (a.buyCount || 0))
        .slice(0, 6);

    if (popular.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#777;">No popular products yet.</p>';
        return;
    }

    popular.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
}

function renderHomeProducts(query = '') {
    const grid = document.getElementById('home-products-grid');
    grid.innerHTML = '';
    const filteredProducts = appState.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#777;">No products found.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
}


function renderCartView() {
    let html = '';
    let subtotal = 0;
    const cartItems = Object.values(appState.cart);

    if (cartItems.length === 0) {
        html = '<p style="text-align:center; color:#777;">Your cart is empty.</p>';
    } else {
        html += `
            <div class="cart-view-item-header">
                <div>Image</div>
                <div>Product</div>
                <div>Quantity</div>
                <div>Price</div>
            </div>
        `;
        cartItems.forEach(item => {
            const itemTotal = (Number(item.price)||0) * item.qty;
            subtotal += itemTotal;
            html += `
                <div class="cart-view-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-view-item-image">
                    <div class="cart-view-item-info">
                        <h4>${item.name}</h4>
                        <p>${item.unit}</p>
                    </div>
                    <div class="cart-view-item-qty">
                        <div class="qty-controls">
                            <button onclick="changeQty('${item.id}', -1)"><i class="fas fa-minus"></i></button>
                            <span>${item.qty}</span>
                            <button onclick="changeQty('${item.id}', 1)"><i class="fas fa-plus"></i></button>
                        </div>
                        <button class="remove-btn" onclick="removeFromCart('${item.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                    <span class="cart-view-item-price">₹${itemTotal.toFixed(2)}</span>
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
        if (appState.cart[productId].qty <= 0) {
            delete appState.cart[productId];
        }
        localStorage.setItem('cart', JSON.stringify(appState.cart));
        renderCart();
        renderCartView();
        updateProductGrids();
    }
}

function removeFromCart(productId) {
    if (confirm('Are you sure you want to remove this item?')) {
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
        if(window.recaptchaVerifier) window.recaptchaVerifier.render();
        return;
    }
    switchView('cart-view');
    elements.cartDrawer.classList.remove('open');
    loadUserProfileForCheckout();
});

async function loadUserProfileForCheckout() {
    if (!appState.currentUser) return;
    const snapshot = await db.ref(`users/${appState.currentUser.uid}`).once('value');
    const profile = snapshot.val() || {};
    
    // Auto-fill priority: DB Profile -> Auth Provider -> Empty
    const autoName = profile.name || appState.currentUser.displayName || '';
    const autoPhone = profile.phone || appState.currentUser.phoneNumber || '';
    const autoEmail = profile.email || appState.currentUser.email || '';
    const autoAddress = profile.address || '';

    elements.checkoutName.value = autoName;
    elements.checkoutPhone.value = autoPhone;
    elements.checkoutEmail.value = autoEmail;
    elements.checkoutAddress.value = autoAddress;
    
    // Make Primary Keys Readonly if they are the login source
    elements.checkoutEmail.readOnly = !!appState.currentUser.email;
    elements.checkoutPhone.readOnly = !!appState.currentUser.phoneNumber && !appState.currentUser.email;

    renderCartView();
}

// --- NEW ADDRESS DETECTION LOGIC ---
if(elements.detectAddressBtn) {
    elements.detectAddressBtn.addEventListener('click', async () => {
        showLoader();
        try {
            const loc = await getCurrentLocation();
            if (loc.lat && loc.lng) {
                appState.currentLocation = loc;
                // Use Nominatim Reverse Geocoding
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`);
                const data = await response.json();
                
                if(data && data.display_name) {
                    elements.checkoutAddress.value = data.display_name;
                    showToast("Address detected successfully!");
                } else {
                    showToast("Location found but address details unavailable.");
                }
            } else {
                showToast("Could not detect location. Please check GPS settings.");
            }
        } catch(e) {
            console.error("Geocoding Error:", e);
            showToast("Error detecting address. Please enter manually.");
        } finally {
            hideLoader();
        }
    });
}

elements.checkoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const items = Object.values(appState.cart);
    if (items.length === 0) {
        showToast('Your cart is empty.');
        return;
    }

    try {
        showLoader();
        const orderId = db.ref('orders').push().key;
        const customerName = elements.checkoutName.value;
        const phone = elements.checkoutPhone.value;
        const address = elements.checkoutAddress.value;
        const email = elements.checkoutEmail.value;

        const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * item.qty, 0);
        const total = subtotal + DELIVERY_CHARGE;

        const qrCodeDataURL = await new Promise(resolve => {
            const qr = new QRCode(document.createElement("div"), {
                text: orderId, width: 128, height: 128,
                colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H
            });
            setTimeout(() => {
                const img = qr._el.querySelector("img");
                const canvas = qr._el.querySelector("canvas");
                if (canvas) resolve(canvas.toDataURL("image/png"));
                else if (img) resolve(img.src);
                else resolve("");
            }, 500);
        });

        let lat = appState.currentLocation.lat;
        let lng = appState.currentLocation.lng;
        if (lat === null || lng === null) {
            try {
                const loc = await getCurrentLocation(6000);
                lat = loc.lat;
                lng = loc.lng;
            } catch (err) {
                lat = null; lng = null;
            }
        }

        const otp = Math.floor(100000 + Math.random() * 900000);

        const orderData = {
            id: orderId, orderId: orderId, userId: appState.currentUser.uid,
            customerName, phone, email, address, lat, lng,
            items: items.map(item => ({
                productId: item.id, name: item.name, qty: item.qty,
                unit: item.unit, price: Number(item.price) || 0
            })),
            subtotal, deliveryCharge: DELIVERY_CHARGE, total,
            status: 'ORDER PLACED', qrCode: qrCodeDataURL, otp,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };

        // 1. Save Order
        await db.ref(`orders/${orderId}`).set(orderData);

        // 2. NEW: Save Checkout Details to Profile
        await db.ref(`users/${appState.currentUser.uid}`).update({
            name: customerName,
            address: address,
            phone: phone, // Will update unless logic prevents overwrite elsewhere, but beneficial for keeping latest contact info
            email: email
        });

        items.forEach(item => {
            // Use originalId if available to track stats correctly
            const trackId = item.originalId || item.id;
            db.ref(`popularProducts/${trackId}/buyCount`)
                .transaction(count => (count || 0) + item.qty);
        });

        appState.cart = {};
        localStorage.removeItem('cart');
        renderCart();
        updateProductGrids();

        const overlay = document.getElementById('order-success-overlay');
        overlay.classList.add('active');
        setTimeout(() => {
            overlay.classList.remove('active');
            switchView('orders-view');
            loadOrders();
        }, 3000);

    } catch (error) {
        showToast('Order failed: ' + error.message);
        console.error(error);
    } finally {
        hideLoader();
    }
});

// Home View
async function loadAds() {
    try {
        showLoader();
        const snapshot = await db.ref('ads').once('value');
        appState.ads = Object.values(snapshot.val() || {});
        renderAds();
    } catch (error) {
        console.error("Failed to load ads:", error);
    } finally {
        hideLoader();
    }
}

let currentSlide = 0;
let bannerInterval = null;
let bannerResumeTimeout = null;

function throttle(fn, wait = 100) {
    let last = 0;
    return function(...args) {
        const now = Date.now();
        if (now - last >= wait) {
            last = now;
            fn.apply(this, args);
        }
    };
}

function renderAds() {
    const slider = elements.bannerSlider;
    const dotsContainer = document.getElementById('banner-dots');
    if (!slider || !dotsContainer) return;
    slider.innerHTML = '';
    dotsContainer.innerHTML = '';

    appState.ads.forEach((ad, index) => {
        const slide = document.createElement('div');
        slide.className = 'banner-slide';
        slide.style.backgroundImage = `url('${ad.image}')`;
        slider.appendChild(slide);
        const dot = document.createElement('div');
        dot.className = 'banner-dot' + (index === 0 ? ' active' : '');
        dot.addEventListener('click', () => {
            scrollToSlide(index);
            resetAutoScroll();
        });
        dotsContainer.appendChild(dot);
    });

    requestAnimationFrame(() => requestAnimationFrame(() => {
        const totalSlides = slider.querySelectorAll('.banner-slide').length;
        currentSlide = Math.min(currentSlide, Math.max(0, totalSlides - 1));
        updateDots();
        attachBannerListeners();
        startBannerSlider();
        scrollToSlide(currentSlide);
    }));
}

function scrollToSlide(index) {
    const slider = elements.bannerSlider;
    if (!slider) return;
    const slideWidth = slider.clientWidth || slider.getBoundingClientRect().width || 0;
    if (!slideWidth) return;
    slider.scrollTo({ left: slideWidth * index, behavior: 'smooth' });
    currentSlide = index;
    updateDots();
}

function updateDots() {
    const dots = document.querySelectorAll('.banner-dot');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === currentSlide));
}

function attachBannerListeners() {
    const slider = elements.bannerSlider;
    if (!slider) return;
    if (slider._bannerHandlers) {
        slider.removeEventListener('scroll', slider._bannerHandlers.onScroll);
        slider.removeEventListener('pointerdown', slider._bannerHandlers.onPointerDown);
        slider.removeEventListener('pointerup', slider._bannerHandlers.onPointerUp);
        slider.removeEventListener('pointercancel', slider._bannerHandlers.onPointerUp);
        window.removeEventListener('resize', slider._bannerHandlers.onResize);
    } else {
        slider._bannerHandlers = {};
    }

    slider._bannerHandlers.onScroll = throttle(() => {
        const slideWidth = slider.clientWidth || slider.getBoundingClientRect().width || 0;
        if (!slideWidth) return;
        const index = Math.round(slider.scrollLeft / slideWidth);
        if (index !== currentSlide) {
            currentSlide = index;
            updateDots();
        }
    }, 120);

    slider._bannerHandlers.onPointerDown = () => {
        pauseAutoScroll();
        if (bannerResumeTimeout) clearTimeout(bannerResumeTimeout);
    };
    slider._bannerHandlers.onPointerUp = () => {
        if (bannerResumeTimeout) clearTimeout(bannerResumeTimeout);
        bannerResumeTimeout = setTimeout(() => {
            startBannerSlider();
        }, 2000);
    };
    slider._bannerHandlers.onResize = () => {
        setTimeout(() => scrollToSlide(currentSlide), 80);
    };

    slider.addEventListener('scroll', slider._bannerHandlers.onScroll, { passive: true });
    slider.addEventListener('pointerdown', slider._bannerHandlers.onPointerDown);
    slider.addEventListener('pointerup', slider._bannerHandlers.onPointerUp);
    slider.addEventListener('pointercancel', slider._bannerHandlers.onPointerUp);
    window.addEventListener('resize', slider._bannerHandlers.onResize);
}

function startBannerSlider() {
    const slider = elements.bannerSlider;
    if (!slider) return;
    const totalSlides = slider.querySelectorAll('.banner-slide').length;
    if (totalSlides <= 1) {
        if (bannerInterval) { clearInterval(bannerInterval); bannerInterval = null; }
        return;
    }
    if (bannerInterval) clearInterval(bannerInterval);
    bannerInterval = setInterval(() => {
        const total = slider.querySelectorAll('.banner-slide').length || 1;
        currentSlide = (currentSlide + 1) % total;
        scrollToSlide(currentSlide);
    }, 4000);
}

function pauseAutoScroll() {
    if (bannerInterval) {
        clearInterval(bannerInterval);
        bannerInterval = null;
    }
}

function resetAutoScroll() {
    pauseAutoScroll();
    if (bannerResumeTimeout) clearTimeout(bannerResumeTimeout);
    bannerResumeTimeout = setTimeout(() => startBannerSlider(), 2500);
}

function renderCategories(containerId) {
    const container = document.getElementById(containerId || 'category-list');
    if (!container) return;
    container.innerHTML = appState.categories.map(cat => `
        <div class="category-card" data-category="${cat.id}">
            <i class="${cat.icon} category-icon"></i>
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
        showLoader();
        const snapshot = await db.ref('orders').once('value');
        const orders = snapshot.val() || {};
        const counts = {};
        Object.values(orders).forEach(order => {
            if (order.items) {
                order.items.forEach(item => {
                    counts[item.productId] = (counts[item.productId] || 0) + item.qty;
                });
            }
        });
        appState.products = appState.products.map(p => ({
            ...p,
            buyCount: counts[p.id] || 0
        }));
        renderPopularProducts();
    } catch (err) {
        console.error("Failed to load popular products:", err);
    } finally {
        hideLoader();
    }
}

async function initHome() {
    await loadProducts();
    await loadPopularProducts();
    renderHomeProducts();
    loadAds();
    renderCategories('category-list');
}

window.addEventListener("load", () => {
    initHome();
});

// Products View
// FIXED: Added composite ID generation logic to prevent ID collision across categories
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
                // Nested, specific category
                allProducts = Object.entries(categoryData).map(([key, val]) => ({ 
                    id: `${category}_${key}`, // Generate Composite ID
                    originalId: key,
                    ...val 
                }));
            } else {
                // Flat or direct match
                allProducts = Object.entries(data)
                    .filter(([k, v]) => v && v.category === category)
                    .map(([key, val]) => ({ id: key, ...val }));
            }
        } else {
            const keys = Object.keys(data);
            if (keys.length > 0) {
                const firstVal = data[keys[0]];
                // Simple heuristic to check if structure is flat or nested
                const looksLikeProduct = firstVal && (firstVal.name !== undefined || firstVal.price !== undefined);
                
                if (looksLikeProduct) {
                    // Flat structure
                    allProducts = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
                } else {
                    // Nested structure (Categories -> Products)
                    Object.entries(data).forEach(([catKey, catVal]) => {
                        if (catVal && typeof catVal === 'object') {
                            Object.entries(catVal).forEach(([prodKey, prodVal]) => {
                                // FORCE UNIQUE ID by combining Category + Key
                                const uniqueId = `${catKey}_${prodKey}`;
                                allProducts.push({ 
                                    id: uniqueId, 
                                    originalId: prodKey, 
                                    ...prodVal, 
                                    category: catKey 
                                });
                            });
                        }
                    });
                }
            }
        }

        appState.products = allProducts.map(p => ({ ...p, price: Number(p.price) || 0 }));
        renderPopularProducts();
        renderHomeProducts();
        renderProducts();
    } catch (error) {
        console.error("Failed to load products:", error);
    } finally {
        hideLoader();
    }
}

function renderProducts(query = '') {
    elements.productsGrid.innerHTML = '';
    const filteredProducts = appState.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredProducts.length === 0) {
        elements.productsGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#777;">No products found.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        elements.productsGrid.appendChild(createProductCard(product));
    });
}

// New Global Search Logic
function renderSearchResults(query = '') {
    const grid = elements.searchResultsGrid;
    grid.innerHTML = '';
    
    if(!query.trim()) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#777;">Type to search products...</p>';
            return;
    }

    const filteredProducts = appState.products.filter(product =>
        product.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:#777;">No products found.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
}

elements.globalSearchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
});

// Orders View
function loadOrders() {
    if (!appState.currentUser) return;
    showLoader();
    const ordersRef = db.ref('orders').orderByChild('userId').equalTo(appState.currentUser.uid);
    ordersRef.on('value', snapshot => {
        const orders = Object.values(snapshot.val() || {}).reverse();
        renderOrders(orders);
        hideLoader();
    }, error => {
        showToast('Failed to load orders.');
        console.error(error);
        hideLoader();
    });
}

function renderOrders(orders) {
    elements.ordersList.innerHTML = '';
    if (orders.length === 0) {
        elements.ordersList.innerHTML = '<p style="text-align:center; color:#777;">You have not placed any orders yet.</p>';
        return;
    }
    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.classList.add('order-card');
        const status = order.status ? order.status.toUpperCase() : 'PENDING';
        let statusClass;
        switch (status) {
            case 'PENDING': statusClass = 'status-pending'; break;
            case 'SHIPPING': statusClass = 'status-shipping'; break;
            case 'DELIVERED': statusClass = 'status-delivered'; break;
            case 'OUT-OF-DELIVERY': statusClass = 'status-out-of-delivery'; break;
            case 'CANCELLED': statusClass = 'status-cancelled'; break;
            default: statusClass = 'status-pending';
        }
        
        const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '';
        let itemsHtml = order.items.map(item => `
            <div class="order-item-detail">
                <span>${item.name} x ${item.qty}</span>
                <span>₹${(Number(item.price)||0 * item.qty).toFixed(2)}</span>
            </div>
        `).join('');

        let otpHtml = '';
        try {
            if (order.status && order.status.toUpperCase() === 'SHIPPING' && order.otp) {
                otpHtml = `<p style="font-size:1.1rem;"><strong>OTP:</strong> ${order.otp}</p>`;
            }
        } catch(e) { otpHtml = ''; }

        orderCard.innerHTML = `
            <div class="order-header">
                <h4>Order #${(order.id||'').substring(0, 8)}</h4>
                <span class="order-status ${statusClass}">${status}</span>
            </div>
            <p><strong>Date:</strong> ${date}</p>
            ${otpHtml}
            <div class="order-items">${itemsHtml}</div>
            <div style="display:flex; justify-content:space-between; font-weight:600; font-size:1.1rem;">
                <span>Total:</span>
                <span>₹${(Number(order.total)||0).toFixed(2)}</span>
            </div>
            <div class="order-qr">
                <img src="${order.qrCode}" alt="Order QR Code">
                <p style="font-size:0.8rem; color:#777; margin-top:0.5rem;">Scan for order details</p>
            </div>
        `;
        elements.ordersList.appendChild(orderCard);
    });
}

// Queries
elements.queriesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = e.target['query-name'].value;
    const email = e.target['query-email'].value;
    const message = e.target['query-message'].value;
    try {
        showLoader();
        await db.ref('queries').push({ name, email, message, createdAt: firebase.database.ServerValue.TIMESTAMP, status: 'PENDING' });
        showToast('Your query has been submitted successfully!');
        elements.queriesForm.reset();
    } catch (error) {
        showToast('Failed to submit query: ' + error.message);
    } finally {
        hideLoader();
    }
});

// Profile
async function loadProfile() {
    if (!appState.currentUser) return;
    showLoader();
    try {
        const snapshot = await db.ref(`users/${appState.currentUser.uid}`).once('value');
        const profile = snapshot.val();
        if (profile) {
            elements.profileInfo.innerHTML = `
                <p><strong>Name:</strong> ${profile.name}</p>
                <p><strong>Email:</strong> ${profile.email}</p>
                <p><strong>Phone:</strong> ${profile.phone}</p>
                <p><strong>Address:</strong> ${profile.address}</p>
                <p><strong>Lat:</strong> ${profile.lat || 'N/A'}</p>
                <p><strong>Lng:</strong> ${profile.lng || 'N/A'}</p>
            `;
            
            const autoName = profile.name || appState.currentUser.displayName || '';
            const autoEmail = profile.email || appState.currentUser.email || '';
            const autoPhone = profile.phone || appState.currentUser.phoneNumber || '';
            const autoAddress = profile.address || '';
            
            elements.updateName.value = autoName;
            elements.updateEmail.value = autoEmail;
            elements.updatePhone.value = autoPhone;
            elements.updateAddress.value = autoAddress;
            
            // Set ReadOnly based on Login Method
            if(appState.currentUser.email) elements.updateEmail.readOnly = true;
            if(appState.currentUser.phoneNumber) elements.updatePhone.readOnly = true;

            appState.currentLocation.lat = profile.lat;
            appState.currentLocation.lng = profile.lng;
            updateLocationDisplay(profile.lat, profile.lng);
        } else {
            elements.profileInfo.innerHTML = '<p>No profile data found.</p>';
        }
        elements.updateProfileForm.style.display = 'none';
    } catch (error) {
        showToast('Failed to load profile.');
        console.error(error);
    } finally {
        hideLoader();
    }
}

elements.editProfileBtn.addEventListener('click', () => {
    elements.updateProfileForm.style.display = 'flex';
});

elements.updateProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!appState.currentUser) return;
    showLoader();
    try {
        const name = elements.updateName.value;
        const email = elements.updateEmail.value;
        const phone = elements.updatePhone.value;
        const address = elements.updateAddress.value;
        await db.ref(`users/${appState.currentUser.uid}`).update({ name, email, phone, address });
        showToast('Profile updated successfully!');
        loadProfile();
    } catch (error) {
        showToast('Failed to update profile: ' + error.message);
    } finally {
        hideLoader();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadAds();
    renderCart();
    loadProducts().then(() => {
        renderHomeProducts();
        renderCategories();
    });
    getCurrentLocation().then(loc => {
        if (loc.lat && loc.lng) {
            updateLocationDisplay(loc.lat, loc.lng);
            appState.currentLocation = loc;
        }
    });
});

// Map
let map = null;
let marker = null;

async function initMap() {
    const defaultLocation = [20.5937, 78.9629];
    const locationToUse = appState.currentLocation.lat ? [appState.currentLocation.lat, appState.currentLocation.lng] : defaultLocation;
    
    if (map) { map.remove(); }

    map = L.map('map-container').setView(locationToUse, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    marker = L.marker(locationToUse, { draggable: true }).addTo(map);
    marker.on('dragend', (e) => {
        const latlng = marker.getLatLng();
        appState.currentLocation = { lat: latlng.lat, lng: latlng.lng };
    });

    if (!appState.currentLocation.lat) {
        const loc = await getCurrentLocation();
        if (loc.lat) {
            appState.currentLocation = loc;
            marker.setLatLng([loc.lat, loc.lng]);
            map.setView([loc.lat, loc.lng], 15);
            showToast('Current location detected!');
        } else {
            showToast('Could not detect your location. Please manually choose.');
        }
    } else {
            map.setView(locationToUse, 15);
    }
}

// Detect Location Button Logic
if (elements.detectLocationBtn) {
    elements.detectLocationBtn.addEventListener('click', async () => {
        showLoader();
        try {
            const loc = await getCurrentLocation();
            if (loc.lat && loc.lng) {
                appState.currentLocation = loc;
                if (marker) marker.setLatLng([loc.lat, loc.lng]);
                if (map) map.setView([loc.lat, loc.lng], 15);
                showToast('Location updated!');
            } else {
                showToast('Could not fetch location.');
            }
        } catch (e) {
            console.error(e);
            showToast('Error fetching location.');
        } finally {
            hideLoader();
        }
    });
}

function updateLocationDisplay(lat, lng) {
    if (lat && lng) {
        elements.currentLocationText.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        elements.locationDisplay.classList.add('active');
    } else {
        elements.currentLocationText.textContent = 'Not set';
        elements.locationDisplay.classList.remove('active');
    }
}

elements.profileMapBtn.addEventListener('click', async () => {
    if (!appState.currentUser) {
        showToast('Please login to change your location.');
        elements.loginModal.classList.add('open');
        if(window.recaptchaVerifier) window.recaptchaVerifier.render();
        return;
    }
    switchView('map-view');
    initMap();
});

elements.changeLocationBtn.addEventListener('click', async () => {
        if (!appState.currentUser) {
        showToast('Please login to change your location.');
        elements.loginModal.classList.add('open');
        if(window.recaptchaVerifier) window.recaptchaVerifier.render();
        return;
    }
    switchView('map-view');
    initMap();
});

elements.saveLocationBtn.addEventListener('click', async () => {
    if (appState.currentLocation.lat === null || appState.currentLocation.lng === null) {
        showToast('Please choose a location first.');
        return;
    }
    
    if (appState.currentUser) {
        showLoader();
        try {
            await db.ref(`users/${appState.currentUser.uid}`).update({
                lat: appState.currentLocation.lat,
                lng: appState.currentLocation.lng
            });
            showToast('Location updated successfully!');
            loadProfile();
        } catch(e) {
            showToast('Failed to update location.');
            console.error(e);
        } finally {
            hideLoader();
        }
    }
    if (appState.currentUser) {
        switchView('profile-view');
    } else {
        switchView('home-view');
    }
});

// Bottom Nav logic
document.querySelectorAll('.footer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if(view === 'cart') {
            // === ADDED LOGIN CHECK FOR CART VIEW IN FOOTER ===
            if (!appState.currentUser) {
                showToast('Please login to view your cart.');
                elements.loginModal.classList.add('open');
                if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                return; // Stop execution, do not switch view
            }
            renderCartView();
        } else if(view === 'orders') {
            if (!appState.currentUser) {
                showToast('Please login to view orders.');
                elements.loginModal.classList.add('open');
                if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                return;
            }
            loadOrders();
        } else if(view === 'profile') {
            if (!appState.currentUser) {
                showToast('Please login to view your profile.');
                elements.loginModal.classList.add('open');
                if(window.recaptchaVerifier) window.recaptchaVerifier.render();
                return;
            }
            loadProfile();
        } else if(view === 'search') {
                // Auto focus input when switching to search view
                setTimeout(() => {
                elements.globalSearchInput.focus();
                }, 300);
        }
        switchView(view + '-view');
        document.querySelectorAll('.footer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});
