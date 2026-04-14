// Dashboard JS - Load user data and display cart

document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();

    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
});

async function loadDashboard() {
    try {
        const response = await fetch('/backend/dashboard.php');
        const data = await response.json();

        if (!data.success) {
            window.location.href = '/home.html';
            return;
        }

        displayUserInfo(data.user);
        displayCart(data.cart || {});
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Error loading dashboard. Please try again.');
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

function displayCart(cart) {
    const cartBody = document.getElementById('cart-body');
    const cartContainer = document.getElementById('cart-container');
    const emptyMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.getElementById('cart-summary');

    cartBody.innerHTML = '';

    if (!cart || Object.keys(cart).length === 0) {
        cartContainer.style.display = 'none';
        emptyMessage.style.display = 'block';
        document.getElementById('cart-count').textContent = 'Cart (0)';
        return;
    }

    emptyMessage.style.display = 'none';
    cartContainer.style.display = 'block';

    let total = 0;
    let itemCount = 0;

    for (const [shirtID, quantity] of Object.entries(cart)) {
        const row = document.createElement('tr');
        
        // For now, display basic info - in real system would fetch price/details
        row.innerHTML = `
            <td>${shirtID}</td>
            <td>-</td>
            <td>-</td>
            <td>-</td>
            <td>${quantity}</td>
            <td>-</td>
        `;
        cartBody.appendChild(row);
        itemCount += parseInt(quantity);
    }

    document.getElementById('cart-count').textContent = `Cart (${itemCount})`;

    // Display summary with checkout button
    cartSummary.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Total Items:</span>
            <span class="summary-value">${itemCount}</span>
        </div>
        <button class="checkout-btn" onclick="goToCheckout()">Proceed to Checkout</button>
    `;
}

function goToCheckout() {
    window.location.href = '/UI/dashboard/checkout/checkout.html';
}

function logout() {
    // Clear session and redirect to home
    window.location.href = '/home.html';
}
