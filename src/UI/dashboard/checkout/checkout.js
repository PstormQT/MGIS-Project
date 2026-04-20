// Checkout page JS - handles displaying cart, selecting addresses and submitting order

document.addEventListener('DOMContentLoaded', async () => {
    const cartList = document.getElementById('cartItems');
    const totalEl = document.getElementById('totalPrice');
    const proceedBtn = document.getElementById('placeOrderBtn');
    const messageEl = document.getElementById('message');
    const addressSelect = document.getElementById('shippingAddress');

    // Fetch cart from backend (session or DB)
    async function fetchCart() {
        const res = await fetch('../../../backend/cart.php?action=view');
        const data = await res.json();
        return data.cart || [];
    }

    function formatCurrency(n){ return '$' + Number(n).toFixed(2); }

    function renderCart(items){
        cartList.innerHTML = '';
        let subtotal = 0;
        items.forEach(i =>{
            const row = document.createElement('div');
            row.className = 'cart-item';
            const left = document.createElement('div');
            left.innerHTML = `<div><strong>${i.DesignName}</strong> <small>(${i.SizeName} - ${i.ColorName})</small></div><div>Qty: ${i.Quantity}</div>`;
            const right = document.createElement('div');
            const price = parseFloat(i.Price);
            right.innerText = formatCurrency(price);
            row.appendChild(left); row.appendChild(right);
            cartList.appendChild(row);
            subtotal += price * i.Quantity;
        });
        // calculate subtotal, tax, and shipping (15% on subtotal + tax)
        const tax = +(subtotal * 0.08).toFixed(2);
        const subtotalWithTax = subtotal + tax;
        const shipping = +(subtotalWithTax * 0.15).toFixed(2);
        const total = subtotalWithTax + shipping;
        
        document.getElementById('subtotalPrice').innerText = formatCurrency(subtotal);
        document.getElementById('taxPrice').innerText = formatCurrency(tax);
        document.getElementById('shippingPrice').innerText = formatCurrency(shipping);
        totalEl.innerText = formatCurrency(total);
    }

    let userAddressInfo = { shippingAdd: null, billingAdd: null };

    async function loadAddresses(){
        try {
            const res = await fetch('../../../backend/dashboard.php', { credentials: 'include' });
            const data = await res.json();
            if (data.success && data.user) {
                userAddressInfo.shippingAdd = data.user.shippingAdd;
                userAddressInfo.billingAdd = data.user.billingAdd;
                addressSelect.innerHTML = `
                    <option value="shipping" selected>Account shipping address (ID: ${data.user.shippingAdd})</option>
                    <option value="billing">Account billing address (ID: ${data.user.billingAdd})</option>
                `;
            }
        } catch(e) {
            console.warn('Could not load addresses', e);
        }
    }

    // initial load
    const cartItems = await fetchCart();
    renderCart(cartItems);
    await loadAddresses();

    // Add auto-formatting for card number (add spaces every 4 digits)
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = formatted;
        });
    }

    // Add auto-formatting for expiry (MM/YY)
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // Only allow digits for CVC and ZIP
    const cardCVCInput = document.getElementById('cardCVC');
    if (cardCVCInput) {
        cardCVCInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    const zipCodeInput = document.getElementById('zipCode');
    if (zipCodeInput) {
        zipCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    proceedBtn.addEventListener('click', async ()=>{
        messageEl.style.display='none';
        
        // Validate payment form
        const cardName = document.getElementById('cardName').value.trim();
        const cardNumber = document.getElementById('cardNumber').value.trim();
        const cardExpiry = document.getElementById('cardExpiry').value.trim();
        const cardCVC = document.getElementById('cardCVC').value.trim();
        const zipCode = document.getElementById('zipCode').value.trim();

        if (!cardName || !cardNumber || !cardExpiry || !cardCVC || !zipCode) {
            messageEl.className = 'error';
            messageEl.innerText = 'Please fill in all payment details';
            messageEl.style.display = 'block';
            return;
        }

        // Validate card number (mock validation - just check length)
        const cardDigits = cardNumber.replace(/\s/g, '');
        if (cardDigits.length !== 16 || isNaN(cardDigits)) {
            messageEl.className = 'error';
            messageEl.innerText = 'Invalid card number (must be 16 digits)';
            messageEl.style.display = 'block';
            return;
        }

        // Validate expiry format
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
            messageEl.className = 'error';
            messageEl.innerText = 'Invalid expiry format (use MM/YY)';
            messageEl.style.display = 'block';
            return;
        }

        // Validate CVC
        if (!/^\d{3,4}$/.test(cardCVC)) {
            messageEl.className = 'error';
            messageEl.innerText = 'Invalid CVC (must be 3-4 digits)';
            messageEl.style.display = 'block';
            return;
        }

        // Validate ZIP code
        if (!/^\d{5}$/.test(zipCode)) {
            messageEl.className = 'error';
            messageEl.innerText = 'Invalid ZIP code (must be 5 digits)';
            messageEl.style.display = 'block';
            return;
        }

        proceedBtn.disabled = true;
        proceedBtn.innerText = 'Placing order...';
        try{
            const useShipping = addressSelect.value === 'shipping';
            const shippingAddID = userAddressInfo.shippingAdd;
            const billingAddID = useShipping ? userAddressInfo.shippingAdd : userAddressInfo.billingAdd;
            const res = await fetch('../../../backend/checkout.php', {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ shippingAddID, billingAddID })
            });
            const result = await res.json();
            if(result.success){
                // redirect to confirmation
                window.location.href = '../order-confirmation/order-confirmation.html?orderID=' + encodeURIComponent(result.orderID);
            } else {
                messageEl.className='error';
                messageEl.innerText = result.message || 'Failed to place order';
                messageEl.style.display = 'block';
            }
        }catch(err){
            messageEl.className='error';
            messageEl.innerText = 'Network error: ' + err.message;
            messageEl.style.display = 'block';
        }finally{
            proceedBtn.disabled = false;
            proceedBtn.innerText = 'Place Order';
        }
    });

});
