document.addEventListener('DOMContentLoaded', function() {
    loadDashboard();

    document.getElementById('logout-btn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
});

async function loadDashboard() {
    try {
        const response = await fetch('../../backend/dashboard.php');
        const data = await response.json();

        if (!data.success) {
            window.location.href = '../../home.html';
            return;
        }

        // Display user information
        displayUserInfo(data.user);

        // Display cart
        displayCart(data.cart);
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

function displayCart(cartItems) {
    const cartTableBody = document.getElementById('cart-items');
    const cartContainer = document.getElementById('cart-container');
    const emptyMessage = document.getElementById('empty-cart-message');

    cartTableBody.innerHTML = '';

    if (!cartItems || cartItems.length === 0) {
        cartContainer.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    emptyMessage.style.display = 'none';
    cartContainer.style.display = 'block';

    let total = 0;

    cartItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.ShirtID || 'N/A'}</td>
            <td>${item.Color || 'N/A'}</td>
            <td>${item.Design || 'N/A'}</td>
            <td>$${parseFloat(item.Price).toFixed(2)}</td>
            <td>${item.quantity}</td>
            <td>$${parseFloat(item.subtotal).toFixed(2)}</td>
        `;
        cartTableBody.appendChild(row);
        total += parseFloat(item.subtotal);
    });

    // Display cart summary
    const summaryDiv = document.getElementById('cart-summary');
    summaryDiv.innerHTML = `
        <div class="summary-row">
            <span class="summary-label">Total:</span>
            <span class="summary-value">$${total.toFixed(2)}</span>
        </div>
        <button class="checkout-btn" onclick="goToCheckout()">Proceed to Checkout</button>
    `;
}

function goToCheckout() {
    // Redirect to checkout page (you can adjust the path as needed)
    window.location.href = '../../home.html'; // Replace with actual checkout page
}

function logout() {
    // You can add logout functionality here
    // For now, we'll just redirect to home
    window.location.href = '../../home.html';
}
