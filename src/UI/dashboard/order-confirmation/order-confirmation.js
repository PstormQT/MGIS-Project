document.addEventListener('DOMContentLoaded', async ()=>{
    const params = new URLSearchParams(window.location.search);
    const orderID = params.get('orderID');
    const container = document.getElementById('confirmation');
    if(!orderID){ container.innerHTML = '<div style="color:#c00">No order ID provided.</div>'; return; }
    try{
        const res = await fetch('/backend/orderHistory.php?action=get&orderID=' + encodeURIComponent(orderID));
        const data = await res.json();
        if(!data.success){ container.innerHTML = '<div style="color:#c00">'+(data.message||'Order not found.')+'</div>'; return; }
        const order = data.order;
        let html = `<div class="confirm-card"><div class="confirm-meta"><div><h3>Order #${order.OrderUUID}</h3><div>${order.OrderDateTime}</div></div><div><strong>Total: $${Number(order.TotalPrice).toFixed(2)}</strong></div></div>`;
        html += '<div class="items-list">';
        (order.items||[]).forEach(it=>{
            html += `<div class="item-row"><div>${it.DesignName} <small>(${it.SizeName} - ${it.ColorName})</small> x${it.Quantity}</div><div>$${Number(it.PricePerUnit).toFixed(2)}</div></div>`;
        });
        html += '</div></div>';
        container.innerHTML = html;
    }catch(err){
        container.innerHTML = '<div style="color:#c00">Failed to load order: '+err.message+'</div>';
    }
});
