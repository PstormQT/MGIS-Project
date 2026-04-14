(function(){
  // Detect nesting depth and construct proper path prefixes
  const pathname = window.location.pathname;
  const isHomePage = pathname.endsWith('home.html') || pathname.endsWith('/') || !pathname.includes('/src/');
  
  let basePrefix, apiPrefix;
  
  if (isHomePage) {
    basePrefix = './src';
    apiPrefix = './src';
  } else {
    // Count the number of directory levels after '/src/UI/'
    const uiMatch = pathname.match(/\/src\/UI\//);
    if (uiMatch) {
      const afterUI = pathname.substring(uiMatch.index + uiMatch[0].length);
      const depth = (afterUI.match(/\//g) || []).length; // Count remaining slashes
      basePrefix = '../'.repeat(depth + 1); // +1 for the current file
      apiPrefix = '../'.repeat(depth + 2); // +2 to get to root
    } else {
      basePrefix = '../..';
      apiPrefix = '../../..';
    }
  }
  
  async function fetchJson(path, opts={}){
    opts.credentials = 'include';
    try{ const r = await fetch(path, opts); return r; } catch(e){ throw e; }
  }

  async function initHeader(){
    let header = document.querySelector('header');
    if (!header){
      header = document.createElement('header');
      header.innerHTML = `
        <div class="logo">Tanka Jahari's<br>T-Shirts</div>
        <nav>
          <ul>
            <li><a href="${basePrefix}home.html">Home</a></li>
            <li><a href="${basePrefix}UI/design-page/design-page.html">Products</a></li>
            <li><a href="${basePrefix}UI/Our story page/Our story page.html">About Us</a></li>
          </ul>
        </nav>
        <div class="header-right">
          <span id="search-placeholder">Search</span>
          <a id="cart-link" href="${basePrefix}UI/dashboard/dashboard/dashboard.html"><span id="cart-count">Cart (0)</span></a>
          <button id="account-btn" class="account-btn">Login</button>
        </div>
      `;
      document.body.insertBefore(header, document.body.firstChild);
    } else {
      // ensure account button exists
      let hr = header.querySelector('.header-right');
      if(!hr){ hr = document.createElement('div'); hr.className='header-right'; header.appendChild(hr); }
      if(!hr.querySelector('#cart-count')){
        const cartLink = document.createElement('a'); cartLink.id='cart-link'; cartLink.href=`${basePrefix}UI/dashboard/dashboard/dashboard.html`; cartLink.innerHTML='<span id="cart-count">Cart (0)</span>';
        hr.appendChild(cartLink);
      }
      if(!hr.querySelector('#account-btn')){
        const btn = document.createElement('button'); btn.id='account-btn'; btn.className='account-btn'; btn.innerText='Login'; hr.appendChild(btn);
      }
    }

    const accountBtn = document.getElementById('account-btn');
    const cartCountEl = document.getElementById('cart-count');

    async function refreshSession(){
      try{
        const res = await fetchJson(`${apiPrefix}backend/dashboard.php`);
        if (!res.ok){
          accountBtn.style.display = 'block';
          accountBtn.innerText = 'Login';
          accountBtn.onclick = ()=> { window.location.href = `${basePrefix}UI/login-page/login.html`; };
          
          const dashLink = document.getElementById('dashboard-link');
          if (dashLink) dashLink.remove();
        } else {
          const data = await res.json();
          if (data && data.success){
            const uname = data.user && data.user.Username ? data.user.Username : 'Account';
            
            // Replace button with dashboard link
            accountBtn.style.display = 'none';
            
            if (!document.getElementById('dashboard-link')){
              const link = document.createElement('a'); 
              link.id='dashboard-link'; 
              link.href=`${basePrefix}UI/dashboard/dashboard/dashboard.html`; 
              link.innerText='Dashboard';
              link.style.marginRight='8px';
              link.style.textDecoration='none';
              link.style.color='inherit';
              accountBtn.parentNode.insertBefore(link, accountBtn);
            }

            if (!document.getElementById('logout-link')){
              const l = document.createElement('button'); l.id='logout-link'; l.className='logout-link'; l.innerText='Logout';
              l.style.marginLeft='0px';
              l.onclick = async ()=>{
                try{
                  const r = await fetchJson(`${apiPrefix}backend/logout.php`, { method: 'POST' });
                  if (r.ok){ location.reload(); }
                }catch(e){ console.error('Logout failed', e); location.reload(); }
              };
              accountBtn.parentNode.appendChild(l);
            }
          } else {
            accountBtn.style.display = 'block';
            accountBtn.innerText = 'Login';
            accountBtn.onclick = ()=> { window.location.href = `${basePrefix}UI/login-page/login.html`; };
            
            const dashLink = document.getElementById('dashboard-link');
            if (dashLink) dashLink.remove();
          }
        }
      }catch(err){
        console.debug('Session check failed', err);
        accountBtn.style.display = 'block';
        accountBtn.innerText = 'Login';
        accountBtn.onclick = ()=> { window.location.href = `${basePrefix}UI/login-page/login.html`; };
        
        const dashLink = document.getElementById('dashboard-link');
        if (dashLink) dashLink.remove();
      }
    }

    async function refreshCartCount(){
      try{
        const res = await fetchJson(`${apiPrefix}backend/cart.php?action=view`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.cart){
          let count = 0;
          if (Array.isArray(data.cart)){
            data.cart.forEach(i=> count += (i.Quantity || i.quantity || 1));
          } else if (typeof data.cart === 'object'){
            for (const k in data.cart) count += parseInt(data.cart[k]||0);
          }
          cartCountEl.innerText = `Cart (${count})`;
        }
      }catch(e){ console.debug('Cart refresh failed', e); }
    }

    await refreshSession();
    await refreshCartCount();

    window.__appHeader = { refreshSession, refreshCartCount };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeader); else initHeader();
})();
