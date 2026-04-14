document.addEventListener('DOMContentLoaded', async () => {
    const ordersList = document.getElementById('ordersList');
    const noOrders = document.getElementById('noOrders');

    async function loadOrders(){
        try{
            const res = await fetch('../../../backend/orderHistory.php?action=list');
            const data = await res.json();
            if(!data.success || !data.orders || data.orders.length===0){
                noOrders.style.display='block';
                return;
            }
            noOrders.style.display='none';
            ordersList.innerHTML = '';
            data.orders.forEach(order => {
                const el = document.createElement('div');
                el.className = 'order-card';
                const meta = document.createElement('div');
                meta.className = 'order-meta';
                meta.innerHTML = `<div><strong>Order #${order.OrderUUID}</strong><div style="font-size:0.9rem;color:#666">${order.OrderDateTime}</div></div><div class="order-total">${order.TotalPrice ? '$'+Number(order.TotalPrice).toFixed(2): ''}</div>`;
                el.appendChild(meta);

                const items = document.createElement('div');
                items.className = 'order-items';
                (order.items||[]).forEach(it =>{
                    const r = document.createElement('div'); r.className='item-row';
                    r.innerHTML = `<div>${it.DesignName} <small>(${it.SizeName} - ${it.ColorName})</small> x${it.Quantity}</div><div>${'$'+Number(it.PricePerUnit).toFixed(2)}</div>`;
                    items.appendChild(r);
                });
                el.appendChild(items);

                const view = document.createElement('div');
                view.style.marginTop='0.5rem';
                view.innerHTML = `<a href="/UI/dashboard/order-confirmation/order-confirmation.html?orderID=${order.OrderUUID}">View Receipt</a>`;
                el.appendChild(view);

                ordersList.appendChild(el);
            });
        }catch(err){
            ordersList.innerHTML = '<div style="color:#c00">Failed to load orders: '+err.message+'</div>';
        }
    }

    loadOrders();
});
