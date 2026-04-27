// Dashboard JS - Load user data and display cart

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

async function loadDashboard() {
    try {
        const response = await fetch('../../../backend/dashboard.php', { credentials: 'include' });
        if (!response.ok) {
            await loadGuestDashboard();
            return;
        }

        const data = await response.json();

        if (!data.success) {
            await loadGuestDashboard();
            return;
        }

        displayUserInfo(data.user);
        displayCart(data.cartItems || []);
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard. Please try again.');
    }
}

async function loadGuestDashboard() {
    const userSection = document.querySelector('.user-section');
    if (userSection) {
        userSection.innerHTML = `
            <h2>Your Cart</h2>
            <p>Sign in to view account details, or continue shopping with your current cart.</p>
        `;
    }

    const accountMenuLink = document.querySelector('a[href="../../Account Menu/Menu.html"]');
    if (accountMenuLink && accountMenuLink.parentElement) {
        accountMenuLink.parentElement.remove();
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && logoutBtn.parentElement) {
        logoutBtn.parentElement.remove();
    }

    try {
        const guestCartResponse = await fetch('../../../backend/cart.php?action=view', { credentials: 'include' });
        if (!guestCartResponse.ok) {
            displayCart([]);
            return;
        }

        const guestCartData = await guestCartResponse.json();
        displayCart(guestCartData.cart || []);
    } catch (error) {
        console.error('Error loading guest cart:', error);
        displayCart([]);
    }
}

function displayUserInfo(user) {
    document.getElementById('username').textContent = user.Username || 'N/A';
    document.getElementById('firstname').textContent = user.FirstName || 'N/A';
    document.getElementById('lastname').textContent = user.LastName || 'N/A';
    document.getElementById('mi').textContent = user.MI || 'N/A';
    document.getElementById('dob').textContent = user.dob || 'N/A';
    document.getElementById('email').textContent = user.emailAddress || 'N/A';
    document.getElementById('phone').textContent = user.phoneNumber || 'N/A';
}

function displayCart(cartItems) {
    const cartBody = document.getElementById('cart-body');
    const cartContainer = document.getElementById('cart-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.getElementById('cart-summary');

    cartBody.innerHTML = '';

    if (!cartItems || cartItems.length === 0) {
        cartContainer.style.display = 'none';
        emptyMessage.style.display = 'block';
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.textContent = 'Cart (0)';
        }
        return;
    }

    emptyMessage.style.display = 'none';
    cartContainer.style.display = 'block';

    let total = 0;
    let itemCount = 0;

    cartItems.forEach(item => {
        const subtotal = parseFloat(item.Price) * parseInt(item.Quantity);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.ShirtID}</td>
            <td>${item.ColorName || '-'}</td>
            <td>${item.DesignName || '-'}</td>
            <td>$${parseFloat(item.Price).toFixed(2)}</td>
            <td>${item.Quantity}</td>
            <td>$${subtotal.toFixed(2)}</td>
            <td><button onclick="removeFromCart('${item.ShirtID}')">Remove</button></td>
        `;
        cartBody.appendChild(row);
        total += subtotal;
        itemCount += parseInt(item.Quantity);
    });

    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = `Cart (${itemCount})`;
    }

    cartSummary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Total:</span>
            <span class="summary-value">$${total.toFixed(2)}</span>
        </div>
        <button class="checkout-btn" onclick="goToCheckout()">Proceed to Checkout</button>
        <a href="../order-history/order-history.html" style="display:block;margin-top:8px;">View Order History</a>
    `;
}

async function removeFromCart(shirtID) {
    try {
        await fetch('../../../backend/cart.php', {
            method: 'DELETE',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shirtID })
        });
        loadDashboard();
    } catch(e) {
        alert('Error removing item: ' + e.message);
    }
}

function goToCheckout() {
    window.location.href = '../checkout/checkout.html';
}

async function logout() {
    try {
        await fetch('../../../backend/logout.php', { method: 'POST', credentials: 'include' });
    } catch(e) { /* ignore */ }
    window.location.href = '../../../../home.html';
}
