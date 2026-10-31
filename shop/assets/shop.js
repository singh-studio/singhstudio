(() => {
  'use strict';
  const grid = document.getElementById('product-grid');
  if (grid) {
    const cards = [...grid.querySelectorAll('[data-card]')];
    const categories = [...document.querySelectorAll('[data-category]')];
    const search = document.getElementById('product-search');
    const sort = document.getElementById('product-sort');
    const counter = document.getElementById('result-count');
    const empty = document.querySelector('.empty-state');
    const params = new URLSearchParams(location.search);
    let category = ['all','templates','plugins'].includes(params.get('category')) ? params.get('category') : 'all';
    search.value = params.get('q') || '';
    function update(syncURL = true) {
      const query = search.value.trim().toLowerCase();
      const ordered = [...cards].sort((a,b) => sort.value==='low' ? +a.dataset.price-+b.dataset.price : sort.value==='high' ? +b.dataset.price-+a.dataset.price : sort.value==='name' ? a.dataset.name.localeCompare(b.dataset.name) : cards.indexOf(a)-cards.indexOf(b));
      let count = 0;
      ordered.forEach(card => {
        card.hidden = (category !== 'all' && card.dataset.type !== category) || !card.dataset.search.includes(query);
        if (!card.hidden) count++;
        grid.append(card);
      });
      categories.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.category===category)));
      counter.textContent = `${count} ${count===1?'product':'products'}`;
      empty.hidden = count>0;
      if (syncURL) {
        const url = new URL(location.href);
        category==='all' ? url.searchParams.delete('category') : url.searchParams.set('category',category);
        query ? url.searchParams.set('q',search.value.trim()) : url.searchParams.delete('q');
        history.replaceState(null,'',url);
      }
    }
    categories.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;update();}));
    search.addEventListener('input',()=>update());
    sort.addEventListener('change',()=>update());
    document.getElementById('clear-filters').addEventListener('click',()=>{category='all';search.value='';sort.value='featured';update();search.focus();});
    addEventListener('popstate',()=>{const p=new URLSearchParams(location.search);category=['templates','plugins'].includes(p.get('category'))?p.get('category'):'all';search.value=p.get('q')||'';update(false);});
    update(false);
  }
  if(document.querySelector('.lemonsqueezy-button')) {
    const script=document.createElement('script');
    script.src='https://app.lemonsqueezy.com/js/lemon.js';script.defer=true;document.head.append(script);
  }
})();
