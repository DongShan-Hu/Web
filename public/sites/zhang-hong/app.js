(() => {
  const publicProjects = window.PUBLIC_PROJECTS || [];
  const archiveProjects = window.ARCHIVE_PROJECTS || [];
  const preferredOrder = ['hiyuki', 'carlotta', 'cartethyia', 'jingran', 'aemeath', 'phoebe'];
  const featured = preferredOrder.map(id => publicProjects.find(project => project.id === id)).filter(Boolean);
  const additional = publicProjects.filter(project => !preferredOrder.includes(project.id));
  const allProjects = [...publicProjects, ...archiveProjects];
  const dialog = document.getElementById('project-dialog');
  const visual = document.getElementById('dialog-visual');
  const controls = document.getElementById('gallery-controls');
  const videoStatus = document.getElementById('video-status');
  let activeProject;
  let galleryIndex = 0;
  let openedFrom;

  function make(tag, className, value) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value) element.textContent = value;
    return element;
  }

  function publicName(project) {
    return project.title.match(/「(.+?)」/)?.[1] || project.title;
  }

  function publicSubtitle(project) {
    return project.title.split(/[丨|]/).slice(1).join(' ').trim();
  }

  function projectButton(project, className) {
    const button = make('button', className);
    button.type = 'button';
    button.dataset.project = project.id;
    return button;
  }

  function renderCard(project, archive = false) {
    const card = make('article', 'project-card');
    const coverButton = projectButton(project, 'project-cover');
    coverButton.setAttribute('aria-label', `查看${archive ? project.title : publicName(project)}项目详情`);
    const artwork = make('img');
    artwork.src = project.image || project.cover;
    artwork.alt = archive ? `${project.title}项目作品图` : `${project.title}官方封面`;
    artwork.loading = 'lazy';
    artwork.decoding = 'async';
    const arrow = make('span', 'image-open', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    coverButton.append(artwork, arrow);
    const caption = make('div', 'project-caption');
    const meta = make('p', 'project-meta');
    meta.append(make('span', '', archive ? project.category : project.date.replaceAll('-', '.')), make('span', '', archive ? project.year : 'UE / NUKE'));
    const title = make('h3');
    const titleButton = projectButton(project);
    titleButton.textContent = archive ? project.title : `${publicName(project)} · ${publicSubtitle(project)}`;
    title.append(titleButton);
    caption.append(meta, title, make('p', 'project-subtitle', archive ? project.subtitle : '角色宣传 CG / 灯光与合成'));
    if (archive && project.focus) caption.append(make('p', 'archive-evidence', project.focus));
    card.append(coverButton, caption);
    return card;
  }

  featured.forEach(project => document.getElementById('featured-projects').append(renderCard(project)));
  additional.forEach(project => document.getElementById('more-projects').append(renderCard(project)));
  archiveProjects.forEach(project => document.getElementById('archive-projects').append(renderCard(project, true)));

  document.getElementById('show-more').addEventListener('click', event => {
    const button = event.currentTarget;
    const more = document.getElementById('more-projects');
    const wasOpen = !more.hidden;
    more.hidden = wasOpen;
    button.setAttribute('aria-expanded', String(!wasOpen));
    button.textContent = wasOpen ? '展开更多参与项目 ＋' : '收起更多参与项目 −';
    if (wasOpen) document.getElementById('selected').scrollIntoView({ block: 'start' });
  });

  function clearMedia() {
    visual.querySelector('video')?.pause();
    visual.replaceChildren();
    videoStatus.textContent = '';
  }

  function showArtwork() {
    clearMedia();
    const images = activeProject.gallery || [activeProject.image];
    const artwork = make('img');
    artwork.src = images[galleryIndex];
    artwork.alt = `${activeProject.title}，${activeProject.bvid ? '官方公开封面' : `作品图 ${galleryIndex + 1}`}`;
    visual.append(artwork);
    controls.hidden = images.length < 2;
    document.getElementById('gallery-count').textContent = `${String(galleryIndex + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}`;
  }

  function addExternalLink(container, text, href) {
    const link = make('a', '', text);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    container.append(link);
  }

  function openProject(id, opener) {
    const project = allProjects.find(item => item.id === id);
    if (!project) return;
    activeProject = project;
    galleryIndex = Math.max(0, Math.min(Number(opener?.dataset.galleryIndex) || 0, (project.gallery?.length || 1) - 1));
    openedFrom = opener;
    document.getElementById('dialog-category').textContent = project.bvid ? 'WUTHERING WAVES / CHARACTER CG' : project.category;
    document.getElementById('dialog-date').textContent = project.bvid ? `公开发布 ${project.date.replaceAll('-', '.')} · 库洛游戏` : `${project.year} · ${project.subtitle}`;
    document.getElementById('dialog-title').textContent = project.bvid ? `${publicName(project)} · ${publicSubtitle(project)}` : project.title;
    document.getElementById('dialog-subtitle').textContent = project.bvid ? '《鸣潮》角色宣传 CG' : project.subtitle;
    document.getElementById('dialog-role').textContent = project.bvid ? '参与该角色宣传 CG 的 UE 灯光与 Nuke 合成制作。' : project.role;
    document.getElementById('dialog-pipeline').textContent = project.bvid ? 'UE 灯光制作与渲染，Nuke 合成。三渲二角色宣传 CG，按镜头需求完成画面制作。' : project.pipeline;
    document.getElementById('dialog-credit').textContent = project.bvid ? '封面及影片由《鸣潮》官方发布。此处展示项目级参与经历，完整影片为团队共同成果，非个人独立作品。' : project.credit;
    const detailContainer = document.getElementById('dialog-details');
    detailContainer.replaceChildren();
    const detailBlocks = project.bvid ? [
      { title: '项目定位与个人分工', text: '库洛《鸣潮》三渲二角色宣传影像。2024.10 起持续参与角色宣传 CG，负责 UE 灯光与 Nuke 合成；这里不是游戏研发或底层渲染技术履历。' },
      { title: '个人镜头拆解 / 待补充', text: '本片的个人镜头时间码、氛围目标、具体限制、灯光与合成操作，待本人提供后单独展示。官方封面与完整 PV 只能说明项目，不足以证明某个镜头的个人贡献。' },
    ] : window.ARCHIVE_CASE_DETAILS?.[project.id] || [];
    detailBlocks.forEach(block => detailContainer.append(detailBlock(block)));
    const actions = document.getElementById('dialog-actions');
    actions.replaceChildren();
    if (project.bvid) {
      addExternalLink(actions, 'B 站观看官方 PV ↗', project.url);
      if (project.youtube) addExternalLink(actions, 'YouTube ↗', project.youtube);
      const embed = make('button', '', '站内播放');
      embed.type = 'button';
      embed.addEventListener('click', () => {
        clearMedia();
        const frame = make('iframe');
        frame.src = `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(project.bvid)}&page=1&autoplay=0&danmaku=0`;
        frame.title = `${project.title} B 站官方播放器`;
        frame.allow = 'fullscreen; picture-in-picture';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        visual.append(frame);
        controls.hidden = true;
        videoStatus.textContent = '若播放器未能加载，可点击“B 站观看官方 PV”直接打开原片。';
      });
      actions.append(embed);
    } else if (project.video) {
      const play = make('button', '', '播放项目宣传片 ▶');
      play.type = 'button';
      play.addEventListener('click', () => {
        clearMedia();
        const video = make('video');
        video.src = project.video;
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.setAttribute('aria-label', `${project.title}项目宣传片`);
        video.addEventListener('error', () => { videoStatus.textContent = '视频暂时无法播放，请检查网络，或用下方原视频链接打开。'; });
        visual.append(video);
        controls.hidden = true;
        video.play().catch(() => { videoStatus.textContent = '点击播放器中的播放按钮即可观看。'; });
      });
      actions.append(play);
      addExternalLink(actions, '打开原视频 ↗', project.video);
      const back = make('button', '', '查看作品图');
      back.type = 'button';
      back.addEventListener('click', showArtwork);
      actions.append(back);
    }
    showArtwork();
    dialog.showModal();
    dialog.scrollTop = 0;
    document.body.classList.add('dialog-open');
    document.getElementById('dialog-close').focus();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-project]');
    if (button) openProject(button.dataset.project, button);
  });

  function advanceGallery(direction) {
    const images = activeProject?.gallery || [];
    if (images.length < 2) return;
    galleryIndex = (galleryIndex + direction + images.length) % images.length;
    showArtwork();
  }

  document.getElementById('gallery-prev').addEventListener('click', () => advanceGallery(-1));
  document.getElementById('gallery-next').addEventListener('click', () => advanceGallery(1));
  document.getElementById('dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { clearMedia(); document.body.classList.remove('dialog-open'); openedFrom?.focus(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
  dialog.addEventListener('keydown', event => { if (!controls.hidden && ['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); advanceGallery(event.key === 'ArrowLeft' ? -1 : 1); } });

  function detailBlock(block, caseStudy = false) {
    const section = make('section', caseStudy ? '' : 'detail-block');
    section.append(make(caseStudy ? 'h4' : 'h3', '', block.title));
    if (block.items) {
      const list = make('ul');
      block.items.forEach(item => list.append(make('li', '', item)));
      section.append(list);
    } else section.append(make('p', '', block.text));
    return section;
  }

  const caseTabs = [...document.querySelectorAll('[data-case]')];
  function showCase(id) {
    const study = window.PRODUCTION_STUDIES?.[id];
    const project = archiveProjects.find(item => item.id === id);
    if (!study || !project) return;
    const panel = document.getElementById('case-panel');
    panel.replaceChildren();
    panel.setAttribute('aria-labelledby', `case-tab-${id}`);
    caseTabs.forEach(tab => {
      const selected = tab.dataset.case === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    const figure = make('figure', 'case-visual');
    const pictureButton = projectButton(project, 'case-artwork');
    pictureButton.setAttribute('aria-label', `查看${project.title}完整制作介绍`);
    const artwork = make('img');
    artwork.src = project.cover;
    artwork.alt = `${project.title}项目成片图，非制作前后对比`;
    artwork.loading = 'lazy';
    pictureButton.append(artwork);
    const caption = make('figcaption');
    caption.append(make('span', '', study.caption), make('span', '', '项目成片参考 ↗'));
    const flow = make('div', 'case-pipeline');
    study.flow.forEach((step, index) => { if (index) flow.append(make('span', '', '→')); flow.append(make('div', '', step)); });
    const link = projectButton(project, 'case-project-link');
    link.textContent = '完整职责 / 难点 / 交付说明 ↗';
    figure.append(pictureButton, caption);
    if (project.gallery?.length > 1) {
      const filmstrip = make('div', 'case-filmstrip');
      project.gallery.slice(1, 4).forEach((source, index) => {
        const thumbnailButton = projectButton(project);
        thumbnailButton.dataset.galleryIndex = String(index + 1);
        thumbnailButton.setAttribute('aria-label', `打开${project.title}作品图 ${index + 2}`);
        const thumbnail = make('img');
        thumbnail.src = source;
        thumbnail.alt = `${project.title}作品图 ${index + 2}`;
        thumbnail.loading = 'lazy';
        thumbnailButton.append(thumbnail);
        filmstrip.append(thumbnailButton);
      });
      figure.append(filmstrip);
    }
    figure.append(flow, link);
    if (study.companion) {
      const companion = archiveProjects.find(item => item.id === study.companion);
      if (companion) {
        const related = make('div', 'case-companion');
        const relatedButton = projectButton(companion);
        const thumbnail = make('img');
        thumbnail.src = companion.cover;
        thumbnail.alt = `${companion.title}项目成片`;
        thumbnail.loading = 'lazy';
        const label = make('span');
        label.append(make('strong', '', `${companion.title} ↗`), make('small', '', companion.tools));
        relatedButton.append(thumbnail, label);
        related.append(relatedButton);
        figure.append(related);
      }
    }
    const copy = make('div', 'case-copy');
    copy.append(make('p', 'eyebrow', study.label || 'PROJECT / PRODUCTION NOTES'));
    copy.append(make('h3', '', study.title));
    study.blocks.forEach(block => copy.append(detailBlock(block, true)));
    panel.append(figure, copy);
  }
  caseTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showCase(tab.dataset.case));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? caseTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + caseTabs.length) % caseTabs.length;
      showCase(caseTabs[next].dataset.case);
      caseTabs[next].focus();
    });
  });
  showCase('tiangang');

  let heroSelection = 0;
  document.querySelectorAll('[data-hero]').forEach(button => button.addEventListener('click', async () => {
    const project = publicProjects.find(item => item.id === button.dataset.hero);
    if (!project) return;
    const selection = ++heroSelection;
    const preload = new Image();
    preload.src = project.image;
    try { await preload.decode(); } catch { return; }
    if (selection !== heroSelection) return;
    document.getElementById('hero-image').src = project.image;
    document.getElementById('hero-image').alt = `${project.title}官方 PV 封面，项目参与展示`;
    document.getElementById('hero-source').textContent = `${publicName(project)} · ${publicSubtitle(project)}`;
    document.querySelector('.hero-artwork').dataset.project = project.id;
    document.querySelectorAll('[data-hero]').forEach(item => { const selected = item === button; item.classList.toggle('active', selected); item.setAttribute('aria-pressed', String(selected)); });
  }));

  let scrollScheduled = false;
  const progress = document.querySelector('.reading-progress');
  function updateProgress() {
    const distance = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? Math.min(1, Math.max(0, scrollY / distance)) : 0})`;
    scrollScheduled = false;
  }
  addEventListener('scroll', () => { if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();
})();
