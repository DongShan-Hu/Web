(() => {
  const labels = { company: '公司介绍', resume: '个人简历', portfolio: '作品集', engineering: '工程展示' };
  const grid = document.getElementById('site-grid');
  const state = document.getElementById('state');
  const message = document.getElementById('state-message');
  const search = document.getElementById('search');
  const reset = document.getElementById('reset');
  const retry = document.getElementById('retry');
  const filters = [...document.querySelectorAll('[data-category]')];
  let sites = [];
  let category = 'all';
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  function card(site) {
    const article = make('article', 'site-card');
    const domain = window.SHOWCASE_CONFIG?.customerDomain;
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname) || location.protocol === 'file:';
    const href = !local && typeof domain === 'string' && /^[a-z0-9.-]+$/.test(domain)
      ? `${location.protocol}//${site.slug}.${domain}${location.port ? `:${location.port}` : ''}/`
      : `sites/${site.slug}/`;
    const cover = make('a', 'card-cover');
    cover.href = href;
    cover.setAttribute('aria-label', `进入${site.name}`);
    if (site.cover) {
      const img = make('img');
      img.src = site.cover;
      img.alt = site.coverAlt || `${site.name}封面`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 1280;
      img.height = 720;
      cover.append(img);
    } else {
      const fallback = make('div', 'cover-placeholder', site.name);
      fallback.append(make('small', '', labels[site.category]));
      cover.append(fallback);
    }
    const body = make('div', 'card-body');
    const top = make('div', 'card-top');
    const time = make('time', '', `更新于 ${site.updated}`);
    time.dateTime = site.updated;
    top.append(make('span', 'card-category', labels[site.category]), time);
    const heading = make('h3', 'card-title');
    const titleLink = make('a', '', site.name);
    titleLink.href = href;
    heading.append(titleLink);
    const bottom = make('div', 'card-bottom');
    const tags = make('div', 'tags');
    (site.tags || []).forEach(tag => tags.append(make('span', 'tag', tag)));
    const visit = make('a', 'card-visit', '进入站点');
    visit.href = href;
    visit.setAttribute('aria-label', `进入${site.name}`);
    visit.append(make('span', '', '↗'));
    bottom.append(tags, visit);
    body.append(top, heading, make('p', 'card-summary', site.summary), bottom);
    article.append(cover, body);
    return article;
  }
  function render() {
    const query = search.value.trim().toLocaleLowerCase();
    const visible = sites.filter(site => (category === 'all' || category === site.category) &&
      [site.name, site.summary, ...(site.tags || [])].join(' ').toLocaleLowerCase().includes(query));
    grid.replaceChildren(...visible.map(card));
    document.getElementById('total-count').textContent = String(sites.length);
    document.getElementById('result-status').textContent = `显示 ${visible.length} 个站点，共 ${sites.length} 个`;
    state.hidden = visible.length > 0;
    reset.hidden = sites.length === 0;
    retry.hidden = true;
    message.textContent = sites.length === 0 ? '暂时没有公开收录的展示站点。' : query ? '没有找到匹配的站点，试试其他名称或标签。' : '这个分类还没有收录站点。';
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
  }
  async function load() {
    state.hidden = false;
    message.textContent = '正在加载展示站点…';
    reset.hidden = retry.hidden = true;
    grid.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('sites.json', { cache: 'no-cache' });
      if (!response.ok) throw new Error('目录读取失败');
      const data = await response.json();
      if (!Array.isArray(data) || !data.every(site => site && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(site.slug) && labels[site.category] && typeof site.name === 'string' && typeof site.summary === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(site.updated) && Array.isArray(site.tags) && site.tags.every(tag => typeof tag === 'string') && (!site.cover || /^sites\/[a-z0-9-]+\/[a-zA-Z0-9/_.-]+$/.test(site.cover)))) throw new Error('目录格式错误');
      sites = data.filter(site => site.listed !== false);
      render();
    } catch {
      grid.replaceChildren();
      state.hidden = false;
      message.textContent = location.protocol === 'file:' ? '请通过本地预览服务打开主站（运行 npm run dev）。' : '暂时无法加载站点目录，请稍后重试。';
      retry.hidden = false;
    } finally {
      grid.setAttribute('aria-busy', 'false');
    }
  }
  filters.forEach(button => button.addEventListener('click', () => { category = button.dataset.category; render(); }));
  search.addEventListener('input', render);
  reset.addEventListener('click', () => { category = 'all'; search.value = ''; render(); });
  retry.addEventListener('click', load);
  load();
})();
