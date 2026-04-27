(function(){
  // Detect nesting depth and construct proper path prefixes
  const pathname = window.location.pathname;
  const isHomePage = pathname.endsWith('home.html') || pathname.endsWith('/') || !pathname.includes('/src/');
  const cartPage = 'UI/dashboard/dashboard/dashboard.html';
  
  let rootPrefix, srcPrefix;
  
  if (isHomePage) {
    rootPrefix = './';
    srcPrefix = './';
  } else {
    // Count the number of directory levels after '/src/UI/'
    const uiMatch = pathname.match(/\/src\/UI\//);
    if (uiMatch) {
      const afterUI = pathname.substring(uiMatch.index + uiMatch[0].length);
      const depth = (afterUI.match(/\//g) || []).length; // Count remaining slashes
      // depth + 3: current dir (1) + UI dir (1) + src dir (1) = 3
      rootPrefix = '../'.repeat(depth + 3);
      // For srcPrefix, we go to /src folder (depth + 2)
      srcPrefix = '../'.repeat(depth + 2);
    } else {
      // Fallback for pages not in /src/UI/
      rootPrefix = '../';
      srcPrefix = './';
    }
  }
  
  async function fetchJson(path, opts={}){
    opts.credentials = 'include';
    try{ const r = await fetch(path, opts); return r; } catch(e){ throw e; }
  }

  function ensureHeaderStyles(){
    if (document.getElementById('app-header-dynamic-styles')) return;

    const style = document.createElement('style');
    style.id = 'app-header-dynamic-styles';
    style.textContent = `
      header {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        gap: 24px;
        padding: 20px 50px !important;
        background: #fff;
        border-bottom: 1px solid #eee !important;
      }

      .logo {
        font-size: 28px !important;
        font-weight: 900 !important;
        line-height: 1.1 !important;
        color: #111;
      }

      nav ul {
        display: flex !important;
        list-style: none !important;
        gap: 30px !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      nav a {
        text-decoration: none !important;
        color: #111 !important;
        font-size: 14px !important;
        font-weight: 700 !important;
      }

      nav a:hover {
        opacity: 0.7;
      }

      .header-right {
        display: flex !important;
        align-items: center !important;
        gap: 20px !important;
        font-size: 14px !important;
        font-weight: 700 !important;
      }

      .header-right a {
        color: #111 !important;
        text-decoration: none !important;
      }

      .header-right #cart-link {
        color: #111 !important;
      }

      .header-right #account-btn,
      .header-right #logout-link {
        border: 1px solid #111;
        background: #111;
        color: #fff;
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        border-radius: 999px;
        cursor: pointer;
        transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
      }

      .header-right #account-btn:hover,
      .header-right #logout-link:hover {
        background: #fff;
        color: #111;
        border-color: #111;
      }

      .header-right #dashboard-link {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
      }

      @media (max-width: 768px) {
        header {
          flex-direction: column !important;
          text-align: center;
          padding: 16px 20px !important;
        }

        nav ul {
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px 22px !important;
        }

        .header-right {
          gap: 14px !important;
          flex-wrap: wrap;
          justify-content: center;
        }
      }

      .header-right #account-btn {
        margin: 0;
      }

      .header-right #account-btn:hover {
        opacity: 1;
      }
    `;

    document.head.appendChild(style);
  }

  async function initHeader(){
    ensureHeaderStyles();

    let header = document.querySelector('header');
    if (!header){
      header = document.createElement('header');
      document.body.insertBefore(header, document.body.firstChild);
    }

    // Normalize all pages to one shared header structure.
    header.innerHTML = `
      <div class="logo">Tanka Jahari's<br>T-Shirts</div>
      <nav>
        <ul>
          <li><a href="${rootPrefix}home.html">Home</a></li>
          <li><a href="${srcPrefix}UI/design-page/design-page.html">Products</a></li>
          <li><a href="${srcPrefix}UI/Our story page/Our story page.html">About Us</a></li>
          <li><a href="${srcPrefix}UI/Contact Us/Contact.html">Contact Us</a></li>
        </ul>
      </nav>
      <div class="header-right">
        <span id="search-placeholder">Search</span>
        <span id="login-status">Guest</span>
        <a id="cart-link" href="${srcPrefix}${cartPage}"><span id="cart-count">Cart (0)</span></a>
        <button id="account-btn" class="account-btn">Login</button>
      </div>
    `;

    const accountBtn = document.getElementById('account-btn');
    const cartCountEl = document.getElementById('cart-count');
    const loginStatusEl = document.getElementById('login-status');

    async function refreshSession(){
      try{
        const res = await fetchJson(`${srcPrefix}backend/dashboard.php`);
        if (!res.ok){
          if (loginStatusEl) loginStatusEl.innerText = 'Guest';
          accountBtn.style.display = 'block';
          accountBtn.innerText = 'Login';
          accountBtn.onclick = ()=> { window.location.href = `${srcPrefix}UI/login-page/login.html`; };
          
          const dashLink = document.getElementById('dashboard-link');
          if (dashLink) dashLink.remove();
          const logoutLink = document.getElementById('logout-link');
          if (logoutLink) logoutLink.remove();
        } else {
          const data = await res.json();
          if (data && data.success){
            const uname = data.user && data.user.Username ? data.user.Username : 'Account';
            if (loginStatusEl) loginStatusEl.innerText = `Signed in: ${uname}`;
            
            // Replace button with dashboard link
            accountBtn.style.display = 'none';
            
            if (!document.getElementById('dashboard-link')){
              const link = document.createElement('a'); 
              link.id='dashboard-link'; 
              link.href=`${srcPrefix}${cartPage}`; 
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
                  const r = await fetchJson(`${srcPrefix}backend/logout.php`, { method: 'POST' });
                  if (r.ok){ location.reload(); }
                }catch(e){ console.error('Logout failed', e); location.reload(); }
              };
              accountBtn.parentNode.appendChild(l);
            }
          } else {
            if (loginStatusEl) loginStatusEl.innerText = 'Guest';
            accountBtn.style.display = 'block';
            accountBtn.innerText = 'Login';
            accountBtn.onclick = ()=> { window.location.href = `${srcPrefix}UI/login-page/login.html`; };
            
            const dashLink = document.getElementById('dashboard-link');
            if (dashLink) dashLink.remove();
            const logoutLink = document.getElementById('logout-link');
            if (logoutLink) logoutLink.remove();
          }
        }
      }catch(err){
        console.debug('Session check failed', err);
        if (loginStatusEl) loginStatusEl.innerText = 'Guest';
        accountBtn.style.display = 'block';
        accountBtn.innerText = 'Login';
        accountBtn.onclick = ()=> { window.location.href = `${srcPrefix}UI/login-page/login.html`; };
        
        const dashLink = document.getElementById('dashboard-link');
        if (dashLink) dashLink.remove();
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) logoutLink.remove();
      }
    }

    async function refreshCartCount(){
      try{
        const res = await fetchJson(`${srcPrefix}backend/cart.php?action=view`);
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

    function simplifyFooter(){
      const footer = document.querySelector('footer');
      if (!footer || footer.dataset.footerSimplified === 'true') return;

      footer.dataset.footerSimplified = 'true';
      footer.querySelectorAll('.footer-col').forEach((column) => column.remove());
      footer.style.gridTemplateColumns = '1fr';
      footer.style.justifyItems = 'center';
      footer.style.textAlign = 'center';

      const logo = footer.querySelector('.footer-logo');
      if (logo) logo.style.marginBottom = '12px';

      const credits = footer.querySelector('.credits');
      if (credits) {
        credits.style.gridColumn = '1';
        credits.style.marginTop = '12px';
      }
    }

    await refreshSession();
    await refreshCartCount();
    simplifyFooter();

    window.__appHeader = { refreshSession, refreshCartCount };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHeader); else initHeader();
})();
