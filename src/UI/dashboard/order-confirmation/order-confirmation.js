document.addEventListener('DOMContentLoaded', async ()=>{
    const params = new URLSearchParams(window.location.search);
    const orderID = params.get('orderID');
    const container = document.getElementById('confirmation');
    if(!orderID){ container.innerHTML = '<div style="color:#c00">No order ID provided.</div>'; return; }
    try{
        const res = await fetch('../../../backend/orderHistory.php?action=get&orderID=' + encodeURIComponent(orderID));
        const data = await res.json();
        if(!data.success || !data.order){ container.innerHTML = '<div style="color:#c00">'+(data.message||'Order not found.')+'</div>'; return; }
        const order = data.order;
        
        // Calculate breakdown from total (working backwards from total with shipping)
        // Total = subtotal + tax + shipping where tax = subtotal * 0.08 and shipping = (subtotal + tax) * 0.15
        // Total = subtotal + subtotal*0.08 + (subtotal + subtotal*0.08)*0.15
        // Total = subtotal + subtotal*0.08 + subtotal*0.15 + subtotal*0.08*0.15
        // Total = subtotal * (1 + 0.08 + 0.15 + 0.012) = subtotal * 1.242
        const totalPrice = parseFloat(order.TotalPrice);
        const subtotal = Math.round(totalPrice / 1.242 * 100) / 100;
        const tax = Math.round(subtotal * 0.08 * 100) / 100;
        const shipping = Math.round((subtotal + tax) * 0.15 * 100) / 100;
        
        let html = `
            <div class="confirm-card">
                <div class="confirm-header">
                    <h2>Order Confirmed!</h2>
                    <p>Thank you for your purchase.</p>
                </div>
                
                <div class="confirm-meta">
                    <div>
                        <h3>Order #${order.OrderUUID}</h3>
                        <div class="order-date">${new Date(order.OrderDateTime).toLocaleDateString()} at ${new Date(order.OrderDateTime).toLocaleTimeString()}</div>
                        <div class="order-status">Status: <strong>${order.OrderStatus}</strong></div>
                    </div>
                </div>
                
                <div class="items-section">
                    <h3>Order Items</h3>
                    <div class="items-list">`;
        
        let itemsSubtotal = 0;
        (order.items||[]).forEach(it=>{
            const itemTotal = parseFloat(it.Subtotal);
            itemsSubtotal += itemTotal;
            html += `<div class="item-row">
                        <div class="item-details">
                            <div class="item-name">${it.DesignName}</div>
                            <div class="item-specs"><small>${it.SizeName} - ${it.ColorName}</small></div>
                        </div>
                        <div class="item-qty">x${it.Quantity}</div>
                        <div class="item-price">$${Number(it.PricePerUnit).toFixed(2)}</div>
                        <div class="item-total">$${itemTotal.toFixed(2)}</div>
                    </div>`;
        });
        
        html += `    </div>
                </div>
                
                <div class="price-breakdown">
                    <h3>Order Summary</h3>
                    <div class="breakdown-row">
                        <span>Subtotal:</span>
                        <span>$${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-row">
                        <span>Tax (8%):</span>
                        <span>$${tax.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-row">
                        <span>Shipping (15%):</span>
                        <span>$${shipping.toFixed(2)}</span>
                    </div>
                    <div class="breakdown-row total">
                        <span>Total:</span>
                        <span>$${Number(order.TotalPrice).toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="shipping-address">
                    <h3>Shipping Address</h3>
                    <div class="address">
                        <div>${order.AddressLine1}</div>
                        ${order.AddressLine2 ? '<div>'+order.AddressLine2+'</div>' : ''}
                        <div>${order.City}, ${order.State} ${order.ZipCode}</div>
                    </div>
                </div>
                
                <div class="confirm-actions">
                    <a href="../dashboard/dashboard.html" class="btn-primary">Back to Dashboard</a>
                </div>
            </div>`;
        
        container.innerHTML = html;
    }catch(err){
        container.innerHTML = '<div style="color:#c00">Failed to load order: '+err.message+'</div>';
    }
});
