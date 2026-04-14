// Checkout page JS - handles displaying cart, selecting addresses and submitting order

document.addEventListener('DOMContentLoaded', async () => {
    const cartList = document.getElementById('cartItems');
    const totalEl = document.getElementById('totalPrice');
    const proceedBtn = document.getElementById('placeOrderBtn');
    const messageEl = document.getElementById('message');
    const addressSelect = document.getElementById('shippingAddress');

    // Fetch cart from backend (session or DB)
    async function fetchCart() {
        const res = await fetch('../../backend/cart.php?action=view');
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
            right.innerText = formatCurrency(i.Price);
            row.appendChild(left); row.appendChild(right);
            cartList.appendChild(row);
            subtotal += i.Price * i.Quantity;
        });
        // show total only (tax included)
        const tax = +(subtotal * 0.07).toFixed(2);
        totalEl.innerText = formatCurrency(subtotal + tax);
    }

    let userAddressInfo = { shippingAdd: null, billingAdd: null };

    async function loadAddresses(){
        try {
            const res = await fetch('../../backend/dashboard.php', { credentials: 'include' });
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

    proceedBtn.addEventListener('click', async ()=>{
        messageEl.style.display='none';
        proceedBtn.disabled = true;
        proceedBtn.innerText = 'Placing order...';
        try{
            const useShipping = addressSelect.value === 'shipping';
            const shippingAddID = userAddressInfo.shippingAdd;
            const billingAddID = useShipping ? userAddressInfo.shippingAdd : userAddressInfo.billingAdd;
            const res = await fetch('../../backend/checkout.php', {
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
