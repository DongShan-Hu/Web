const app = document.querySelector('#app');
const header = document.querySelector('#site-header');
const menuButton = document.querySelector('#menu-button');
const mainNav = document.querySelector('#main-nav');
const drawer = document.querySelector('#detail-drawer');
const drawerBackdrop = document.querySelector('#drawer-backdrop');
const modal = document.querySelector('#modal');
const modalBackdrop = document.querySelector('#modal-backdrop');
const toast = document.querySelector('#toast');

const STORAGE_KEY = 'mayeji-client-mvp';

const CASES = [
  {
    id: 'zhang-hong',
    title: '游戏灯光师 Z 女士 · 灯光与合成作品集',
    role: '视觉设计与影视制作',
    type: '设计作品集',
    image: 'sites/zhang-hong/assets/wuwa-hiyuki.webp',
    alt: '游戏灯光师 Z 女士参与制作的角色宣传影像',
    summary: '用真实作品、职责说明与制作过程，讲清楚视觉判断和执行能力。',
    background: '将 UE 灯光、Nuke 合成与角色宣传项目整理为一条完整的专业叙事。',
    focus: '代表作品、项目职责、制作方法和个人简历。',
    audience: '视觉设计师、灯光师、合成师和影视制作岗位。',
    href: 'sites/zhang-hong/'
  },
  {
    id: 'graduate',
    title: '互联网应届生 · 网页简历',
    role: '产品方向应届生',
    type: '网页简历',
    concept: 'graduate',
    image: '',
    alt: '打开的纸质职业作品集与项目图片',
    summary: '把校园经历与项目成果组织成清晰的成长路径，让招聘方快速找到重点。',
    background: '从课程、实习和校园项目中提取与目标岗位真正相关的内容。',
    focus: '教育背景、项目结果、求职方向和可验证的个人优势。',
    audience: '应届生、转行求职者和缺少作品集入口的人。'
  },
  {
    id: 'engineering',
    title: '工程项目 · 项目成果展示',
    role: '工程与技术岗位',
    type: '工程项目',
    concept: 'engineering',
    image: '',
    alt: '工程类项目成果演示画面',
    summary: '把复杂的技术方案转成非技术面试官也能快速理解的项目故事。',
    background: '从项目目标、技术路线、个人职责和最终结果四个层次重组信息。',
    focus: '问题定义、方案选择、协作过程和可验证成果。',
    audience: '程序员、工程师、数据与技术项目岗位。'
  }
];

const PLANS = [
  {
    id: 'display',
    name: '网页展示版',
    tone: 'violet',
    audience: '适合已经准备好内容，想快速拥有专业个人入口的人。',
    items: ['网页简历与基础模板', '专属展示链接', '响应式页面', '6 个月托管'],
    delivery: '预计 5-7 个工作日',
    revisions: '1 次内容修改'
  },
  {
    id: 'optimize',
    name: '简历优化版',
    tone: 'blue',
    featured: true,
    audience: '适合经历不少，但不知道怎样突出重点和说服力的人。',
    items: ['网页展示全部内容', '经历与项目梳理', '通用 HR 视角建议', '专属链接与访问码'],
    delivery: '预计 7-10 个工作日',
    revisions: '1 次集中修改'
  },
  {
    id: 'custom',
    name: '深度定制版',
    tone: 'cyan',
    audience: '适合需要完整呈现作品、方法与个人风格的创作者。',
    items: ['个性化视觉设计', '多套页面模块', '项目作品重点展示', '行业顾问按需审核'],
    delivery: '预计 10-15 个工作日',
    revisions: '按项目范围确认'
  }
];

const defaultState = {
  selectedPlan: 'optimize',
  intakeStep: 1,
  draft: {
    name: '林知夏',
    city: '上海',
    contact: 'linzhixia@example.com',
    school: '江南大学',
    major: '工业设计',
    graduation: '2025 年',
    direction: '产品设计师',
    supportNeed: '梳理经历重点并制作网页作品集',
    deadline: '两周内',
    workExperience: '参与校园创新实验室产品体验研究，负责访谈、信息整理与交互原型。',
    projectExperience: '城市公共空间导视系统；效率工具体验改版。',
    strengths: '善于把复杂信息整理成清晰、温和且可执行的产品体验。',
    videoLink: '',
    projectLink: '',
    pageStyle: 'minimal',
    color: 'violet',
    privacy: true,
    avatarName: '',
    workNames: []
  },
  revision: '',
  revisionsLeft: 2,
  published: false,
  accessCode: 'LZX-2026'
};

let state = loadState();
let uploadedPreview = '';
let toastTimer;
let disposeGlassFlow;
let disposeShowcase;
let disposeProcess;
let disposeStudioMotion;
let disposeResponsivePreview;
let renderedRoute = null;
let renderFrame = 0;
let overlayOrigin;

function setOverlayFocus(overlay) {
  if (overlay) {
    overlayOrigin = document.activeElement;
    for (const element of [app, header, document.querySelector('.site-footer')]) element.inert = true;
    overlay.querySelector('button, a, input, textarea')?.focus();
  } else if (!drawer.classList.contains('is-open') && !modal.classList.contains('is-open')) {
    for (const element of [app, header, document.querySelector('.site-footer')]) element.inert = false;
    if (overlayOrigin?.isConnected) overlayOrigin.focus({ preventScroll: true });
    overlayOrigin = null;
  }
}

function cloneDefault() {
  return JSON.parse(JSON.stringify(defaultState));
}

function loadState() {
  const fallback = cloneDefault();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return fallback;
    return {
      ...fallback,
      ...saved,
      draft: { ...fallback.draft, ...(saved.draft || {}), color: ({forest:'violet',oxide:'blue'})[saved.draft?.color] || saved.draft?.color || 'violet' }
    };
  } catch {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function routeInfo() {
  const raw = location.hash.replace(/^#\/?/, '') || 'home';
  const [route, queryString = ''] = raw.split('?');
  return { route, query: new URLSearchParams(queryString) };
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function setActiveNav(route, query) {
  document.querySelectorAll('[data-route]').forEach((link) => {
    const active = (link.dataset.route === route && !(route === 'home' && query.get('section') === 'process')) || (link.dataset.route === 'process' && route === 'home' && query.get('section') === 'process');
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function closeMenu() {
  mainNav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}

function pageHeader(eyebrow, title, body) {
  return `
    <section class="page-heading shell">
      ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
      <h1>${title}</h1>
      <p>${body}</p>
    </section>`;
}

function caseVisual(item) {
  if (item.image) return `<img src="${item.image}" alt="${item.alt}" loading="lazy">`;
  const engineering = item.concept === 'engineering';
  return `<div class="concept-visual concept-${item.concept}" aria-label="展示方向示意，非客户作品">
    <div class="concept-sheet"><small>${engineering ? 'PROJECT NOTES / 01' : 'MY NEXT CHAPTER'}</small>
    <strong>${engineering ? '让过程与结果<br>一样清楚。' : '第一份工作，<br>从认识你开始。'}</strong>

    <p>${engineering ? '目标 / 方法 / 个人职责 / 成果' : '教育背景 / 实习经历 / 代表项目'}</p></div></div>`;
}

function caseCard(item, size = '') {
  return `
    <article class="case-card ${size}">
      <button class="case-image" type="button" data-case="${item.id}" aria-label="查看${item.title}案例详情">
        ${caseVisual(item)}
        <span>${item.href ? '真实交付' : '服务示意 · 非交付案例'}</span>
      </button>
      <div class="case-content">
        <div><p>${item.type} / ${item.role}</p><h3>${item.title}</h3></div>
        <p>${item.summary}</p>
        <button class="inline-action" type="button" data-case="${item.id}">${item.href ? '查看案例' : '了解展示方向'} <span aria-hidden="true">↗</span></button>
      </div>
    </article>`;
}

function homeTemplate() {
  return `
    <div class="page home-page studio-home">
      <section class="studio-hero">
        <canvas class="glass-flow" aria-hidden="true"></canvas>
        <div class="studio-hero-inner shell">
          <div class="studio-hero-copy">
            <p class="eyebrow">为认真准备下一步的你</p>
            <h1>让你的实力，<br>有更好的开场<span>。</span></h1>
            <p class="studio-lede">内容梳理、视觉设计与前端制作，<br>为你做一个真正拿得出手的个人网站。</p>
            <div class="button-row"><a class="button" href="#/cases">浏览作品 <span aria-hidden="true">↗</span></a><a class="button button-secondary" href="#/plans">了解服务</a></div>
          </div>
          <div class="studio-scene">
            <a class="studio-desktop" href="sites/zhang-hong/" aria-label="打开游戏灯光师 Z 女士作品集实际网站">
              <div class="device-toolbar"><span>Z 女士 / 游戏灯光与合成作品集</span><span aria-hidden="true">↗</span></div>
              <img src="assets/zhang-hong-site-preview.png" alt="已交付的游戏灯光师 Z 女士作品集桌面端首页" width="1440" height="1000" fetchpriority="high">
            </a>
            <a class="studio-phone" href="sites/zhang-hong/" aria-label="打开游戏灯光师 Z 女士作品集"><img src="assets/zhang-hong-mobile-preview.png" alt="同一作品集的真实移动端页面" width="390" height="844"></a>
          </div>
        </div>
        <div class="scene-caption shell"><span>实际交付页面展示</span><p>游戏灯光师 Z 女士 · 灯光与合成作品集</p><a href="sites/zhang-hong/">打开完整网站 ↗</a></div>
      </section>

      <section class="service-proof shell" aria-label="服务范围">
        <div><span>内容梳理</span><p>找准重点，不夸大经历</p></div>
        <div><span>视觉设计</span><p>让风格服务于你的内容</p></div>
        <div><span>前端制作</span><p>电脑、手机，都值得细看</p></div>
        <div><span>上线交付</span><p>确认公开边界，再分享</p></div>
      </section>

      <section class="section shell showcase-section" id="work">
        <div class="studio-section-heading editorial-heading"><p class="section-index"><span>01 / 精选项目</span><span>SELECTED WORK</span></p><h2>先看作品<span class="quiet-period">。</span></h2><p>一位灯光与合成师的个人网站。<br>从第一眼的画面，到每个项目背后的职责，都有自己的位置。</p></div>
        <div class="showcase-case-head"><div><span class="case-kicker">已交付作品集</span><h3>Z 女士 <span>游戏灯光与合成</span></h3></div><a class="inline-action" href="sites/zhang-hong/">打开完整网站 ↗</a></div>
        <div class="craft-showcase" data-view="desktop">
          <div class="showcase-tabs" role="tablist" aria-label="案例呈现方式">
            <button id="view-tab-desktop" role="tab" aria-selected="true" aria-controls="craft-panel" data-showcase-view="desktop" type="button">首屏设计</button>
            <button id="view-tab-works" role="tab" aria-selected="false" aria-controls="craft-panel" data-showcase-view="works" tabindex="-1" type="button">作品编排</button>
            <button id="view-tab-mobile" role="tab" aria-selected="false" aria-controls="craft-panel" data-showcase-view="mobile" tabindex="-1" type="button">移动体验</button>
          </div>
          <div class="craft-body" id="craft-panel" role="tabpanel" aria-labelledby="view-tab-desktop">
            <div class="craft-screen"><img id="craft-image" src="assets/zhang-hong-site-preview.png" width="1440" height="1000" alt="游戏灯光师 Z 女士作品集首屏实际截图" loading="lazy"></div>
            <div class="craft-description"><span>呈现重点</span><h4 id="craft-title">先让作品，<br>建立第一印象。</h4><p id="craft-copy">用代表作建立页面气质，再交代专业方向与个人职责。画面有分量，信息也有先后。</p><div class="craft-detail-list" id="craft-details"><span>沉浸式作品首屏</span><span>清晰的专业定位</span><span>可直接进入项目详情</span></div><a class="inline-action" href="sites/zhang-hong/">亲自体验 ↗</a></div>
          </div>
        </div>
        <section class="responsive-lab" data-responsive-lab aria-label="真实网站的多屏体验"><div class="responsive-intro"><div><span class="case-kicker">从设计稿，到可以使用的网站</span><h3>换一块屏幕，细节依然成立。</h3><p>亲手调整页面宽度，看内容如何重新排列。</p></div><button class="responsive-launch" type="button" data-preview-launch aria-expanded="false">亲手试试不同屏幕 <span aria-hidden="true">↔</span></button></div><div class="responsive-workbench" data-preview-workbench hidden></div></section>
        <p class="source-note">网页设计与实现：一页映。页面内影视、游戏作品为客户项目经历，版权与具体职责见原案例。</p>
      </section>

      <section class="section shell craft-section" id="details">
        <div class="studio-section-heading editorial-heading"><p class="section-index"><span>02 / 设计细节</span><span>THE DETAILS</span></p><h2>画面之外，<br><span class="editorial-serif">有据可读。</span></h2><p>好的作品集，既让人停下来，<br>也让人知道你在项目里具体做了什么。</p></div>
        <div class="craft-grid">
          <article class="craft-feature-media"><div class="media-slices"><a href="sites/zhang-hong/" aria-label="进入 Z 女士作品集查看绯雪项目"><img src="sites/zhang-hong/assets/wuwa-hiyuki.webp" alt="客户作品集中绯雪项目的官方封面" loading="lazy"><span class="project-image-caption">绯雪 <span aria-hidden="true">↗</span></span></a><a href="sites/zhang-hong/" aria-label="进入 Z 女士作品集查看珂莱塔项目"><img src="sites/zhang-hong/assets/wuwa-carlotta.webp" alt="同一客户作品集中珂莱塔项目的官方封面" loading="lazy"><span class="project-image-caption">珂莱塔 <span aria-hidden="true">↗</span></span></a></div><div class="craft-tile-copy"><span>01 — 作品呈现</span><h3>让画面充分展开。</h3><p>大图、影像和项目细节按阅读顺序展开。<br>先看到作品，再了解过程。</p></div></article>
          <article class="craft-feature-type"><span>02 — 内容表达</span><h3>把个人贡献，<br>写在作品旁边。</h3><p>不让漂亮封面替代真实能力。</p><div class="content-evidence"><div><small>专业定位</small><strong>游戏灯光与合成</strong></div><div><small>代表项目</small><strong>角色宣传 CG / 动画电影</strong></div><div><small>个人职责</small><strong>UE 灯光、Nuke 合成</strong></div></div><p class="tile-footnote">内容摘自 Z 女士作品集。</p></article>
        </div>
      </section>

      <section class="section shell studio-process" id="process">
        <div class="studio-section-heading"><p class="eyebrow">03 / 一起完成</p><h2>三个阶段，<br>一起做好。</h2><p>从已有的材料开始。内容、设计与交付，每个阶段都先给你看，再往下做。</p></div>
        <figure class="process-preview"><div class="process-preview-label"><span>交付视角</span><span id="process-preview-count">01 / 03</span></div><div class="process-preview-image"><img id="process-preview-image" src="assets/zhang-hong-work-preview.png" alt="游戏灯光师 Z 女士作品集中的项目编排实例" loading="lazy"></div><figcaption><span id="process-preview-title">找到经历中的重点</span><small>已交付案例 · Z 女士作品集</small></figcaption></figure>
        <div class="process-accordion">
          <article class="process-step is-open" data-process="0"><h3><button class="process-trigger" id="process-trigger-0" aria-expanded="true" aria-controls="process-body-0" type="button"><span class="process-stage"><span>01</span>内容梳理</span><span class="process-title">找到值得展开的经历</span><span class="details-symbol" aria-hidden="true">−</span></button></h3><div class="process-body" id="process-body-0" role="region" aria-labelledby="process-trigger-0"><div class="process-body-clip"><div class="process-body-content"><p>结合目标岗位，确认代表项目、你的职责与可公开材料。需要专业判断时，再确定 HR 或行业审核范围。</p><div class="process-deliverable"><small>这一阶段，你会拿到</small><div class="process-outcomes"><span>内容提纲</span><span>素材清单</span></div></div></div></div></div></article>
          <article class="process-step" data-process="1"><h3><button class="process-trigger" id="process-trigger-1" aria-expanded="false" aria-controls="process-body-1" type="button"><span class="process-stage"><span>02</span>视觉设计</span><span class="process-title">让你的特点被看见</span><span class="details-symbol" aria-hidden="true">+</span></button></h3><div class="process-body" id="process-body-1" role="region" aria-labelledby="process-trigger-1" aria-hidden="true" inert><div class="process-body-clip"><div class="process-body-content"><p>从版式、字体到色彩与动效，先一起确认视觉方向，再完成桌面与移动端制作。</p><div class="process-deliverable"><small>这一阶段，你会拿到</small><div class="process-outcomes"><span>视觉方案</span><span>可操作的网页预览</span></div></div></div></div></div></article>
          <article class="process-step" data-process="2"><h3><button class="process-trigger" id="process-trigger-2" aria-expanded="false" aria-controls="process-body-2" type="button"><span class="process-stage"><span>03</span>检查交付</span><span class="process-title">每个细节都确认好</span><span class="details-symbol" aria-hidden="true">+</span></button></h3><div class="process-body" id="process-body-2" role="region" aria-labelledby="process-trigger-2" aria-hidden="true" inert><div class="process-body-clip"><div class="process-body-content"><p>检查内容、链接、手机适配和公开范围。按确认的方案完成修改与部署，不把未确认的内容直接上线。</p><div class="process-deliverable"><small>这一阶段，你会拿到</small><div class="process-outcomes"><span>展示网站</span><span>交付说明</span></div></div></div></div></div></article>
        </div>
      </section>

      <section class="section shell service-decision"><div class="decision-heading"><p class="eyebrow">04 / 合作的起点</p><h2>你准备到哪一步了？</h2><p>按实际需要，选择这次合作的范围。</p></div><div class="service-options">
        <a class="service-design" href="#/plans?focus=display"><div class="service-option-copy"><span class="service-tag">资料已经备好</span><h3>直接<span class="service-title-accent">做网站。</span></h3><p>简历与作品已经定稿？<br>把视觉设计、前端制作和手机适配交给我们。</p><strong class="service-cta">查看网页制作方案 <span aria-hidden="true">↗</span></strong></div><div class="service-option-art"><img src="assets/zhang-hong-site-preview.png" alt="网页设计交付实例：游戏灯光师 Z 女士作品集" loading="lazy"><small>实际交付页面</small></div></a>
        <a class="service-content" href="#/plans?focus=optimize"><div class="service-option-copy"><span class="service-tag">经历还需要整理</span><h3>先<span class="service-title-accent">梳理内容。</span></h3><p>不知道该突出哪段经历？<br>先找准重点，再决定用怎样的页面呈现。</p><strong class="service-cta">查看内容梳理方案 <span aria-hidden="true">↗</span></strong></div><div class="service-content-topics"><span>目标岗位</span><span>代表项目</span><span>个人贡献</span><p>把零散经历，整理成有重点的职业叙事。</p></div></a>
      </div></section>
      <section class="studio-final shell"><div><p class="eyebrow">下一个页面 / YOURS, NEXT</p><h2>留一个位置，<br>给<span class="editorial-serif">你的作品。</span></h2><p>带上已有的简历或作品，我们从这里开始。</p><a class="button" href="#/intake">开始你的页面 <span aria-hidden="true">↗</span></a></div><span class="final-colophon" aria-hidden="true">内容 · 设计 · 制作<br>一页映</span></section>
    </div>`;
}

function bindShowcase() {
  const tabs = [...app.querySelectorAll('[data-showcase-view]')];
  const indicator = mountShowcaseIndicator(tabs);
  const showcase = app.querySelector('.craft-showcase');
  const panel = showcase.querySelector('#craft-panel');
  const image = panel.querySelector('#craft-image');
  const description = panel.querySelector('.craft-description');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const animations = new Set();
  let activeKey = showcase.dataset.view;
  let requestId = 0;
  let disposed = false;
  const views = {
    desktop: {src:'assets/zhang-hong-site-preview.png',alt:'游戏灯光师 Z 女士作品集首屏实际截图',title:'先让作品，<br>建立第一印象。',copy:'用代表作建立页面气质，再交代专业方向与个人职责。画面有分量，信息也有先后。',details:['沉浸式作品首屏','清晰的专业定位','可直接进入项目详情']},
    works: {src:'assets/zhang-hong-work-preview.png',alt:'游戏灯光师 Z 女士作品集作品编排实际截图',title:'不只放图片，<br>也交代你做过什么。',copy:'按项目组织图像、视频与制作说明，把团队作品与个人参与的边界讲清楚。',details:['代表项目优先呈现','图集与视频按需展开','职责说明与内容对应']},
    mobile: {src:'assets/zhang-hong-mobile-preview.png',alt:'游戏灯光师 Z 女士作品集手机端实际截图',title:'换一块屏幕，<br>体验仍然完整。',copy:'重新安排窄屏上的阅读顺序、触控区域和画面比例，不是把电脑页面简单缩小。',details:['适配手机的内容布局','触控友好的浏览入口','重要信息优先可见']}
  };
  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function animateElement(element, distance, duration, opacity) {
    const animation = element.animate([
      { opacity, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
    animations.add(animation);
    animation.onfinish = animation.oncancel = () => animations.delete(animation);
  }
  async function selectView(button) {
    const key = button.dataset.showcaseView;
    const currentRequest = ++requestId;
    if (key === activeKey) {
      delete showcase.dataset.pending;
      panel.removeAttribute('aria-busy');
      return;
    }
    showcase.dataset.pending = key;
    panel.setAttribute('aria-busy', 'true');
    const view = views[key];
    const preload = new Image(); preload.src = view.src;
    try { await preload.decode(); } catch {
      if (disposed || currentRequest !== requestId || !showcase.isConnected) return;
      delete showcase.dataset.pending;
      panel.removeAttribute('aria-busy');
      showToast('图片暂未加载，请稍后重试');
      return;
    }
    if (disposed || currentRequest !== requestId || !showcase.isConnected) return;
    cancelAnimations();
    image.src = view.src;
    image.alt = view.alt;
    panel.querySelector('#craft-title').innerHTML = view.title;
    panel.querySelector('#craft-copy').textContent = view.copy;
    panel.querySelector('#craft-details').innerHTML = view.details.map(text => `<span>${text}</span>`).join('');
    tabs.forEach(tab => {
      tab.setAttribute('aria-selected', String(tab === button));
      tab.tabIndex = tab === button ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', button.id);
    showcase.dataset.view = key;
    activeKey = key;
    delete showcase.dataset.pending;
    panel.removeAttribute('aria-busy');
    indicator.select(button);
    if (!reducedMotion.matches) {
      animateElement(image, 8, 420, .65);
      animateElement(description, 4, 300, .8);
    }
  }
  tabs.forEach((button,index)=>{
    button.addEventListener('click',()=>selectView(button), { signal: events.signal });
    button.addEventListener('keydown',event=>{
      let next;
      if(event.key==='ArrowRight') next=(index+1)%tabs.length;
      if(event.key==='ArrowLeft') next=(index+tabs.length-1)%tabs.length;
      if(event.key==='Home') next=0;
      if(event.key==='End') next=tabs.length-1;
      if(next!==undefined){event.preventDefault();tabs[next].focus();selectView(tabs[next]);}
    }, { signal: events.signal });
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) cancelAnimations();
  }, { signal: events.signal });
  return () => {
    disposed = true;
    requestId++;
    events.abort();
    cancelAnimations();
    indicator.dispose();
  };
}

// Ease out to the target once; deformation happens only during travel.
function mountShowcaseIndicator(tabs) {
  const track = tabs[0].parentElement;
  const glass = document.createElement('span');
  glass.className = 'showcase-tab-indicator';
  glass.setAttribute('aria-hidden', 'true');
  track.prepend(glass);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0];
  let animation;
  let initialized = false;

  function place(animate = false) {
    const target = selected.offsetLeft;
    const width = selected.offsetWidth;
    if (!width) return;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(glass).transform);
    const oldWidth = parseFloat(glass.style.width) || width;
    const startX = initialized ? matrix.m41 : target;
    const startScale = initialized ? matrix.a * oldWidth / width : 1;
    const startScaleY = initialized ? matrix.d : 1;
    animation?.cancel();
    glass.style.width = `${width}px`;
    glass.style.transform = `translateX(${target}px)`;
    track.classList.add('has-tab-indicator');
    initialized = true;
    if (!animate || reducedMotion.matches) return;
    if (Math.abs(target - startX) < .5 && Math.abs(startScale - 1) < .005 && Math.abs(startScaleY - 1) < .005) return;

    const frames = Array.from({length: 41}, (_, index) => {
      const t = index / 40;
      const progress = 1 - Math.pow(1 - t, 3);
      const stretch = .055 * Math.min(1, Math.abs(target - startX) / width) * Math.pow(Math.sin(Math.PI * t), 2) * (1 - t);
      const x = startX + (target - startX) * progress;
      const scaleX = Math.min(startScale + (1 - startScale) * progress + stretch, (track.clientWidth - x - 1) / width);
      const scaleY = startScaleY + (1 - startScaleY) * progress - stretch * .6;
      return {offset:t,transform: index === 40 ? `translateX(${target}px) scale(1)` : `translateX(${x}px) scale(${scaleX},${scaleY})`};
    });
    animation = glass.animate(frames, {duration:380,easing:'linear'});
  }

  place();
  const resizeObserver = new ResizeObserver(() => place());
  resizeObserver.observe(track);
  tabs.forEach(tab => resizeObserver.observe(tab));
  const onMotionPreference = () => place();
  reducedMotion.addEventListener('change', onMotionPreference);
  return {
    select(button) { selected = button; place(true); },
    dispose() {
      animation?.cancel();
      resizeObserver.disconnect();
      reducedMotion.removeEventListener('change', onMotionPreference);
    }
  };
}

function casesTemplate() {
  return `
    <div class="page cases-page">
      ${pageHeader('作品与方向 / SELECTED WORK', '让经历，有自己的表达。', '看看已经完成的作品，也了解不同岗位可以怎样呈现。')}
      <section class="shell case-catalog">
        <div class="filter-row" role="group" aria-label="筛选案例">
          <button type="button" class="filter is-active" data-filter="all">全部</button>
          <button type="button" class="filter" data-filter="网页简历">网页简历</button>
          <button type="button" class="filter" data-filter="设计作品集">设计作品集</button>
          <button type="button" class="filter" data-filter="工程项目">工程项目</button>
        </div>
        <div class="case-grid catalog-grid" id="case-catalog">
          ${CASES.map((item, index) => `<div data-case-type="${item.type}" class="catalog-item ${index === 0 ? 'catalog-wide' : ''}">${caseCard(item)}</div>`).join('')}
        </div>
      </section>
      <section class="quote-band"><div class="shell"><p>好的展示不会替你夸大经历，只会让真正重要的内容更早被看见。</p><a href="#/plans">查看服务套餐</a></div></section>
    </div>`;
}

function planCard(plan) {
  const index = PLANS.findIndex((item) => item.id === plan.id) + 1;
  return `
    <article class="plan-card plan-${plan.tone} ${plan.featured ? 'is-featured' : ''}">
      <div class="plan-top"><div class="plan-index"><span class="plan-number">0${index}</span><span>${['DESIGN & BUILD','CONTENT & DESIGN','BESPOKE EXPERIENCE'][index - 1]}</span>${plan.featured ? '<span class="plan-badge">含内容梳理</span>' : ''}</div><h2>${plan.name}</h2><p>${plan.audience}</p></div>
      <div class="plan-content"><h3>服务内容</h3><ul>${plan.items.map((item) => `<li>${item}</li>`).join('')}</ul></div>
      <div class="plan-action"><dl class="plan-meta"><div><dt>制作周期</dt><dd>${plan.delivery.replace('预计 ', '')}</dd></div><div><dt>修改范围</dt><dd>${plan.revisions}</dd></div></dl><div class="plan-price"><strong>按需求确认报价</strong><small>范围确认后，再开始制作</small></div><button class="button ${plan.featured ? '' : 'button-secondary'}" type="button" data-plan="${plan.id}">选择${plan.name} <span aria-hidden="true">↗</span></button></div>
    </article>`;
}

function plansTemplate() {
  return `
    <div class="page plans-page">
      ${pageHeader('合作方式 / SERVICES', '不同起点，同样认真。', '从网页制作到内容梳理，选择你需要的支持。服务范围与报价，开始前一起确认。')}
      <section class="shell plan-grid">${PLANS.map(planCard).join('')}</section>
      <section class="shell plan-note">
        <header class="plan-note-heading"><span>合作约定</span><h2>先说清楚，<br>再认真做好。</h2></header>
        <div class="plan-agreements"><div><h3>范围先确认</h3><p>托管周期、修改次数和交付时间，都会写进确认单。</p></div><div><h3>审核按需增加</h3><p>陌生行业需要专业判断时，可增加按单审核。</p></div><div><h3>页面属于你</h3><p>客户展示页保持中性，不强制显示服务品牌。</p></div></div>
      </section>
    </div>`;
}

function progressTemplate(step) {
  const labels = ['目标与现状', '基本资料', '经历重点', '作品素材', '展示偏好'];
  return `<ol class="form-progress">${labels.map((label, index) => {
    const number = index + 1;
    const status = number < step ? 'is-done' : number === step ? 'is-current' : '';
    return `<li class="${status}"><button type="button" data-step="${number}" ${number > step + 1 ? 'disabled' : ''}><span>${number < step ? '✓' : number}</span><strong>${label}</strong></button></li>`;
  }).join('')}</ol>`;
}

function field(id, label, placeholder, type = 'text', required = false) {
  return `<label class="field"><span>${label}${required ? '<b>必填</b>' : ''}</span><input id="${id}" name="${id}" type="${type}" value="${escapeHtml(state.draft[id] || '')}" placeholder="${placeholder}" ${required ? 'required' : ''}></label>`;
}

function textarea(id, label, placeholder) {
  return `<label class="field field-full"><span>${label}</span><textarea id="${id}" name="${id}" placeholder="${placeholder}">${escapeHtml(state.draft[id] || '')}</textarea></label>`;
}

function intakeStepTemplate(step) {
  if (step === 1) return `
    <div class="step-copy"><p>01 / 先确认目标</p><h2>你准备把这份展示用在哪里？</h2><span>目标越具体，我们越容易判断哪些经历应该被优先看见。</span></div>
    <div class="form-grid">${field('direction', '目标岗位或展示方向', '例如：产品设计师', 'text', true)}${field('deadline', '希望何时完成', '例如：两周内')}${textarea('supportNeed', '目前最需要解决的问题', '例如：经历比较散，不知道怎样突出项目结果')}</div>`;
  if (step === 2) return `
    <div class="step-copy"><p>02 / 基本资料</p><h2>补充必要的个人信息</h2><span>公开范围会在发布前再次确认，正式上线前会与你确认；当前内容仅在本机预览。</span></div>
    <div class="form-grid">${field('name', '姓名', '请输入姓名', 'text', true)}${field('contact', '联系方式', '手机号或邮箱', 'text', true)}${field('city', '所在城市', '例如：上海')}${field('school', '学校', '请输入学校名称')}${field('major', '专业', '请输入专业')}${field('graduation', '毕业时间', '例如：2025 年')}<label class="field field-full upload-field"><span>头像或个人照片（可稍后补充）</span><input id="avatar" type="file" accept="image/*"><span class="upload-box">${state.draft.avatarName ? escapeHtml(state.draft.avatarName) : '选择图片'}</span></label></div>`;
  if (step === 3) return `
    <div class="step-copy"><p>03 / 经历重点</p><h2>先记录事实，不必急着润色</h2><span>写清时间、角色、负责内容和结果，后续会根据目标岗位重新组织。</span></div>
    <div class="form-grid">${textarea('workExperience', '工作或实习经历', '写下时间、角色、负责内容和结果')}${textarea('projectExperience', '项目经历', '写下项目目标、你的职责和最终成果')}${textarea('strengths', '个人优势', '你最希望别人记住什么')}</div>`;
  if (step === 4) return `
    <div class="step-copy"><p>04 / 作品素材</p><h2>用作品证明你做过什么</h2><span>先选择最有代表性的图片、视频或项目链接，不需要一次上传全部内容。</span></div>
    <div class="form-grid"><label class="field field-full upload-field"><span>作品图片</span><input id="works" type="file" accept="image/*" multiple><span class="upload-box upload-large">${state.draft.workNames.length ? state.draft.workNames.map(escapeHtml).join('、') : '选择一张或多张作品图片'}</span></label>${field('videoLink', '视频链接', '粘贴公开视频链接', 'url')}${field('projectLink', '项目链接', '粘贴项目或仓库链接', 'url')}</div>`;
  return `
    <div class="step-copy"><p>05 / 展示偏好</p><h2>确认页面气质与公开边界</h2><span>这些选择用于理解偏好，最终设计会结合内容与岗位方向判断。</span></div>
    <div class="choice-group"><h3>页面气质</h3><div class="choice-grid">${[['minimal','克制简洁'],['editorial','编辑叙事'],['visual','视觉突出']].map(([value, label]) => `<label class="choice-card"><input type="radio" name="pageStyle" value="${value}" ${state.draft.pageStyle === value ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></div>
    <div class="choice-group"><h3>颜色倾向</h3><div class="color-grid">${[['violet','柔雾紫'],['blue','晴空蓝'],['ink','午夜蓝'],['slate','冷调灰']].map(([value, label]) => `<label class="color-choice color-${value}"><input type="radio" name="color" value="${value}" ${state.draft.color === value ? 'checked' : ''}><span aria-hidden="true"></span>${label}</label>`).join('')}</div></div>
    <label class="privacy-choice"><span><strong>希望使用访问码</strong><small>记录交付偏好；当前本地预览不设密码</small></span><input type="checkbox" id="privacy" ${state.draft.privacy ? 'checked' : ''}></label>
    <div class="privacy-note">资料只用于本次页面制作。任何个人信息与项目素材，公开前都会再次确认。</div>`;
}

function draftSummary() {
  const plan = PLANS.find((item) => item.id === state.selectedPlan) || PLANS[1];
  return `
    <aside class="draft-summary">
      <div><span>本次整理</span><strong>${escapeHtml(state.draft.direction || '尚未确认方向')}</strong></div>
      <dl>
        <div><dt>协作方案</dt><dd>${plan.name}</dd></div>
        <div><dt>预计填写</dt><dd>6-8 分钟</dd></div>
        <div><dt>期望完成</dt><dd>${escapeHtml(state.draft.deadline || '待确认')}</dd></div>
        <div><dt>已选作品</dt><dd>${state.draft.workNames.length ? `${state.draft.workNames.length} 个` : '可稍后补充'}</dd></div>
      </dl>
      <p>输入会自动保存在当前浏览器。当前含示例资料，可直接替换；文件仅记录名称，未上传。</p>
    </aside>`;
}

function intakeTemplate() {
  const step = Math.min(5, Math.max(1, state.intakeStep));
  return `
    <div class="page intake-page">
      <section class="shell intake-heading"><div><p class="eyebrow">资料整理 / INTAKE</p><h1>从认识你开始。</h1><p>从真实经历开始。填不完整也没关系，后续会一起补齐。</p></div><button class="text-button" type="button" id="reset-draft">重新填写</button></section>
      <section class="shell">${progressTemplate(step)}</section>
      <section class="shell intake-layout">
        <form class="intake-card" id="intake-form" novalidate>
          <div id="form-error" class="form-error" role="alert" hidden></div>
          ${intakeStepTemplate(step)}
          <div class="form-actions">
            <button class="button button-quiet" type="button" id="previous-step" ${step === 1 ? 'disabled' : ''}>返回修改</button>
            <button class="button" type="submit">${step === 5 ? '保存资料并查看预览' : '保存并继续'}</button>
          </div>
        </form>
        ${draftSummary()}
      </section>
    </div>`;
}

function profilePreview(publicMode = false) {
  const d = state.draft;
  const name = escapeHtml(d.name || '你的名字');
  const projects = String(d.projectExperience || '在这里展示最能证明能力的项目经历。').split(/[；;\n]/).filter(Boolean).slice(0, 2);
  return `
    <article class="profile-preview ${publicMode ? 'profile-public' : ''}" data-color="${escapeHtml(d.color)}">
      <header class="profile-head">
        <div><p>${escapeHtml(d.direction || '目标岗位')}</p><h2>${name}</h2><span>${escapeHtml([d.city, d.school, d.major].filter(Boolean).join(' · '))}</span></div>
      </header>
      <section class="profile-intro"><h3>${escapeHtml(d.strengths || '用一句话说明你最希望别人记住的能力。')}</h3><p>${escapeHtml(d.workExperience || '在这里介绍你的经历和负责内容。')}</p></section>
      <section class="profile-projects"><div class="profile-section-title"><h3>精选项目</h3><span>PROJECTS</span></div><div class="profile-project-grid">${projects.map((project, index) => `<article><div class="project-placeholder"><span>0${index + 1}</span><small>作品图片待补充</small></div><div><strong>${escapeHtml(project.trim() || `项目 ${index + 1}`)}</strong><p>项目目标、个人职责与结果将在正式制作时进一步整理。</p></div></article>`).join('')}</div></section>
      <footer class="profile-contact"><strong>联系方式</strong><span>${escapeHtml(d.contact || '确认后显示联系方式')}</span></footer>
    </article>`;
}

function previewTemplate(query) {
  const publicMode = query.get('public') === '1';
  if (publicMode) return `
    <div class="page public-preview-page"><div class="shell public-preview-top"><a class="inline-action" href="#/published">返回发布页</a><span>本地访客视图 · 未上线</span></div><div class="shell public-preview-wrap">${profilePreview(true)}</div></div>`;
  return `
    <div class="page preview-page">
      <section class="shell preview-heading"><div><p class="eyebrow">交付确认 / REVIEW</p><h1>看看你的第一版。</h1><p>确认内容顺序、作品重点和联系方式，也可以先记录修改意见。</p></div><span class="version-chip">本地样稿</span></section>
      <section class="shell preview-layout">
        <div class="browser-frame"><div class="browser-bar"><span></span><span></span><span></span><strong>页面结构预览 · 非正式交付稿</strong></div>${profilePreview()}</div>
        <aside class="delivery-panel">
          <h2>预览与确认</h2>
          <ol class="status-list"><li class="is-complete">资料已整理</li><li class="is-current">本地结构预览</li><li>定制设计 · 待安排</li><li>正式交付 · 待确认</li></ol>
          <dl class="delivery-meta"><div><dt>当前版本</dt><dd>结构样稿</dd></div><div><dt>剩余修改</dt><dd>${state.revisionsLeft} 次</dd></div><div><dt>正式交付</dt><dd>沟通后确认</dd></div></dl>
          <label class="field"><span>提交修改意见</span><textarea id="revision" placeholder="例如：希望第一个项目的图片更突出">${escapeHtml(state.revision)}</textarea></label>
          <button class="button button-secondary" type="button" id="save-revision">保存修改意见</button>
          <button class="button" type="button" id="publish-page">确认本地预览</button>
          <p class="panel-note">当前为本地样稿，未连接服务端，也不会自动发布。</p>
          <a class="inline-action" href="#/intake">返回资料收集</a>
        </aside>
      </section>
    </div>`;
}

function slugFromName() {
  const source = String(state.draft.name || 'my-page').trim();
  const ascii = source.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return ascii || 'lin-zhixia';
}

function publishedTemplate() {
  return `
    <div class="page published-page">
      <section class="published-intro shell"><span class="success-mark">LOCAL PREVIEW</span><h1>资料就绪，<br>下一步，一起打磨。</h1><p>本地预览已准备好。正式设计、公开范围和上线时间，沟通后再确认。</p></section>
      <section class="published-card shell">
        <div class="published-details">
          <div class="mini-profile"><div><strong>${escapeHtml(state.draft.name || '你的名字')}</strong><span>${escapeHtml(state.draft.direction || '目标岗位')}</span></div></div>
          <div class="share-field"><span>当前状态</span><strong>仅当前浏览器可查看，尚未上线</strong></div>
          <div class="share-field"><span>隐私偏好</span><strong>${state.draft.privacy ? '希望设置访问码 · 正式交付时配置' : '希望公开访问 · 正式交付前再次确认'}</strong></div>
          <div class="privacy-note">正式上线后再提供专属链接和可扫描二维码。当前预览不具备访问码保护，请勿将本地地址作为交付链接。</div>
        </div>
        <div class="delivery-next"><span class="delivery-orbit" aria-hidden="true">↗</span><h2>你的下一步</h2><p>先检查内容是否准确，<br>再确定你喜欢的表达方式。</p><a class="button" href="#/preview?public=1">打开本地预览 ↗</a></div>
      </section>
      <div class="published-footer-actions shell"><a class="inline-action" href="#/preview">返回预览与修改</a><a class="button button-secondary" href="#/intake">继续完善资料</a></div>
    </div>`;
}

function notFoundTemplate() {
  return `<section class="empty-page shell"><span>404</span><h1>这个页面还没有准备好</h1><p>返回主页继续了解一页映的服务方式。</p><a class="button" href="#/home">返回主页</a></section>`;
}

function render() {
  cancelAnimationFrame(renderFrame);
  const { route, query } = routeInfo();
  const previousRoute = renderedRoute;
  closeDrawer();
  closeModal();
  closeMenu();
  setActiveNav(route, query);
  const section = route === 'home' && query.has('section') ? document.getElementById(query.get('section')) : null;
  if (route === 'home' && previousRoute === 'home' && app.querySelector('.studio-home')) {
    const destination = section && app.contains(section) ? section : app.querySelector('.studio-hero');
    const heading = destination.querySelector('h1, h2') || destination;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    renderFrame = requestAnimationFrame(() => {
      renderFrame = 0;
      if (section && app.contains(section)) section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
      else window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });
    return;
  }
  disposeShowcase?.();
  disposeShowcase = null;
  disposeProcess?.();
  disposeProcess = null;
  disposeGlassFlow?.();
  disposeGlassFlow = null;
  disposeStudioMotion?.();
  disposeStudioMotion = null;
  disposeResponsivePreview?.();
  disposeResponsivePreview = null;
  const templates = {
    home: homeTemplate,
    cases: casesTemplate,
    plans: plansTemplate,
    intake: intakeTemplate,
    preview: () => previewTemplate(query),
    published: publishedTemplate
  };
  app.innerHTML = (templates[route] || notFoundTemplate)();
  document.body.dataset.route = route;
  renderedRoute = route;
  bindPage(route, query);
  renderFrame = requestAnimationFrame(() => {
    renderFrame = 0;
    const nextSection = route === 'home' && query.has('section') ? document.getElementById(query.get('section')) : null;
    const targetPlan = route === 'plans' ? app.querySelector('.is-targeted') : null;
    let focusTarget = targetPlan?.querySelector('[data-plan]');
    if (!focusTarget && nextSection && app.contains(nextSection)) focusTarget = nextSection.querySelector('h2') || nextSection;
    if (!focusTarget && previousRoute === route && route === 'intake') focusTarget = app.querySelector('.step-copy h2');
    if (!focusTarget) focusTarget = app.querySelector('h1') || app;
    if (previousRoute !== null || targetPlan || nextSection) {
      if (!focusTarget.matches('button, a, input, textarea')) focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    }
    if (nextSection && app.contains(nextSection)) nextSection.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    else if (targetPlan) targetPlan.scrollIntoView({ block: 'center', behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
  });
}

function bindPage(route) {
  if (route === 'home') {
    disposeShowcase = bindShowcase();
    disposeProcess = bindProcess();
    disposeGlassFlow = window.mountGlassFlow?.(app.querySelector('.studio-hero'));
    disposeResponsivePreview = window.mountResponsivePreview?.(app);
  }
  disposeStudioMotion = window.mountStudioMotion?.(app);
  app.querySelectorAll('[data-case]').forEach((button) => button.addEventListener('click', () => openCase(button.dataset.case)));
  if (route === 'cases') bindCaseFilters();
  if (route === 'plans') {
    app.querySelectorAll('[data-plan]').forEach((button) => button.addEventListener('click', () => choosePlan(button.dataset.plan)));
    const selected = PLANS.find(plan => plan.id === routeInfo().query.get('focus'));
    if (selected) {
      const button = app.querySelector(`[data-plan="${selected.id}"]`);
      button.closest('.plan-card').classList.add('is-targeted');
      button.focus({preventScroll:true});
    }
  }
  if (route === 'intake') bindIntake();
  if (route === 'preview') bindPreview();

}

function bindProcess() {
  const views = [
    ['assets/zhang-hong-work-preview.png', '找到经历中的重点', 'Z 女士作品集中的项目编排实例'],
    ['assets/zhang-hong-site-preview.png', '让内容有自己的视觉表达', 'Z 女士作品集桌面端实际交付页面'],
    ['assets/zhang-hong-mobile-preview.png', '每一种屏幕，都认真适配', 'Z 女士作品集手机端实际交付页面']
  ];
  const preview = app.querySelector('.process-preview');
  const steps = [...app.querySelectorAll('[data-process]')];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const animations = new Set();
  let requestId = 0;
  let displayedIndex = Number(preview.dataset.stage || 0);
  let disposed = false;
  function cancelAnimations() {
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function animateElement(element, frames, duration) {
    if (reducedMotion.matches) return;
    const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
    animations.add(animation);
    animation.onfinish = animation.oncancel = () => animations.delete(animation);
  }
  async function updatePreview(index) {
    const currentRequest = ++requestId;
    if (index === displayedIndex) {
      delete preview.dataset.pending;
      preview.removeAttribute('aria-busy');
      return;
    }
    preview.dataset.pending = String(index);
    preview.setAttribute('aria-busy', 'true');
    const [src, title, alt] = views[index];
    const preload = new Image(); preload.src = src;
    try { await preload.decode(); } catch {
      if (disposed || currentRequest !== requestId || !preview.isConnected) return;
      delete preview.dataset.pending;
      preview.removeAttribute('aria-busy');
      showToast('案例预览暂未加载，请稍后重试');
      return;
    }
    if (disposed || currentRequest !== requestId || !preview.isConnected) return;
    const image = preview.querySelector('img'); image.src = src; image.alt = alt;
    preview.dataset.stage = String(index);
    displayedIndex = index;
    preview.querySelector('#process-preview-count').textContent = `0${index + 1} / 03`;
    preview.querySelector('#process-preview-title').textContent = title;
    delete preview.dataset.pending;
    preview.removeAttribute('aria-busy');
    image.getAnimations().forEach(animation => animation.cancel());
    animateElement(image, [{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}], 360);
  }
  function setExpanded(step, expanded) {
    if (step.classList.contains('is-open') === expanded) return;
    step.classList.toggle('is-open', expanded);
    step.querySelector('.process-trigger').setAttribute('aria-expanded', String(expanded));
    const body = step.querySelector('.process-body');
    body.setAttribute('aria-hidden', String(!expanded));
    body.inert = !expanded;
    const symbol = step.querySelector('.details-symbol');
    symbol.textContent = expanded ? '−' : '+';
    symbol.getAnimations().forEach(animation => animation.cancel());
    animateElement(symbol, [{opacity:.5,transform:'scale(.85)'},{opacity:1,transform:'scale(1)'}], 220);
  }
  steps.forEach((step,index) => {
    const trigger = step.querySelector('.process-trigger');
    trigger.addEventListener('click', () => {
      const expand = !step.classList.contains('is-open');
      steps.forEach(other => setExpanded(other, other === step && expand));
      if (expand) updatePreview(index);
      else {
        requestId++;
        delete preview.dataset.pending;
        preview.removeAttribute('aria-busy');
      }
    }, { signal: events.signal });
    trigger.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown') next = (index + 1) % steps.length;
      if (event.key === 'ArrowUp') next = (index + steps.length - 1) % steps.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = steps.length - 1;
      if (next !== undefined) { event.preventDefault(); steps[next].querySelector('.process-trigger').focus(); }
    }, { signal: events.signal });
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) cancelAnimations();
  }, { signal: events.signal });
  return () => {
    disposed = true;
    requestId++;
    events.abort();
    cancelAnimations();
  };
}

function bindCaseFilters() {
  const filters = app.querySelectorAll('[data-filter]');
  filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter.classList.contains('is-active'))));
  filters.forEach((filter) => filter.addEventListener('click', () => {
    filters.forEach(item => {
      item.classList.toggle('is-active', item === filter);
      item.setAttribute('aria-pressed', String(item === filter));
    });
    app.querySelectorAll('[data-case-type]').forEach((item) => {
      item.hidden = filter.dataset.filter !== 'all' && item.dataset.caseType !== filter.dataset.filter;
    });
  }));
}

function openCase(id) {
  const item = CASES.find((entry) => entry.id === id);
  if (!item) return;
  drawer.innerHTML = `
    <div class="drawer-head"><div><p>${item.type}</p><h2>${item.title}</h2></div><button type="button" id="close-drawer" aria-label="关闭案例详情">关闭</button></div>
    <div class="drawer-visual">${caseVisual(item)}</div>${item.href ? '' : '<p class="panel-note">这是展示方向示意，不是真实客户交付案例。</p>'}
    <div class="drawer-copy"><section><h3>项目背景</h3><p>${item.background}</p></section><section><h3>展示重点</h3><p>${item.focus}</p></section><section><h3>适合人群</h3><p>${item.audience}</p></section></div>
    <div class="drawer-actions">${item.href ? `<a class="button button-secondary" href="${item.href}">打开完整案例</a>` : ''}<a class="button" href="#/intake">开始制作同类页面</a></div>`;
  drawerBackdrop.hidden = false;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overlay-open');
  drawer.querySelector('#close-drawer').addEventListener('click', closeDrawer);
  setOverlayFocus(drawer);
}

function closeDrawer() {
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  drawerBackdrop.hidden = true;
  document.body.classList.remove('overlay-open');
  setOverlayFocus(null);
}

function choosePlan(id) {
  const plan = PLANS.find((item) => item.id === id);
  if (!plan) return;
  state.selectedPlan = id;
  saveState();
  openModal(`
    <div class="modal-head"><div><p>套餐选择</p><h2 id="modal-title">确认选择${plan.name}</h2></div><button type="button" data-close-modal>关闭</button></div>
    <p>${plan.audience}</p>
    <div class="modal-summary"><strong>价格待确认</strong><span>${plan.delivery}</span><span>${plan.revisions}</span></div>
    <div class="privacy-note">我们会根据资料复杂度和定制范围确认价格，不会自动扣款。</div>
    <div class="modal-actions"><button class="button button-quiet" type="button" data-close-modal>继续比较</button><a class="button" href="#/intake">填写资料</a></div>`);
}

function openModal(content) {
  modal.innerHTML = content;
  modalBackdrop.hidden = false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('overlay-open');
  modal.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));
  setOverlayFocus(modal);
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modalBackdrop.hidden = true;
  document.body.classList.remove('overlay-open');
  setOverlayFocus(null);
}

function bindIntake() {
  const form = app.querySelector('#intake-form');
  form.addEventListener('input', () => { collectForm(form); saveState(); });
  app.querySelectorAll('[data-step]').forEach((button) => button.addEventListener('click', () => {
    collectForm(form);
    state.intakeStep = Number(button.dataset.step);
    saveState();
    render();
  }));
  app.querySelector('#previous-step')?.addEventListener('click', () => {
    collectForm(form);
    state.intakeStep = Math.max(1, state.intakeStep - 1);
    saveState();
    render();
  });
  app.querySelector('#reset-draft')?.addEventListener('click', () => {
    openModal('<div class="modal-head"><h2 id="modal-title">重新填写资料？</h2><button type="button" data-close-modal>取消</button></div><p>当前浏览器中的草稿将被清空。已完成的独立客户网站不受影响。</p><div class="modal-actions"><button class="button button-secondary" data-close-modal>保留草稿</button><button class="button" id="confirm-reset">清空并重新填写</button></div>');
    modal.querySelector('#confirm-reset').addEventListener('click', () => {
      const next = cloneDefault().draft;
      for (const key of Object.keys(next)) if (typeof next[key] === 'string' && !['pageStyle','color'].includes(key)) next[key] = '';
      next.workNames = [];
      state.draft = next;
      state.intakeStep = 1;
      state.published = false;
      uploadedPreview = '';
      saveState();
      render();
      showToast('草稿已清空，可以重新填写');
    });
  });
  app.querySelector('#avatar')?.addEventListener('change', (event) => {
    state.draft.avatarName = event.target.files?.[0]?.name || '';
    saveState();
    showToast('头像已选择');
  });
  app.querySelector('#works')?.addEventListener('change', (event) => {
    const files = Array.from(event.target.files || []);
    state.draft.workNames = files.map((file) => file.name);
    saveState();
    if (files[0]) {
      const reader = new FileReader();
      reader.onload = () => { uploadedPreview = String(reader.result || ''); };
      reader.readAsDataURL(files[0]);
    }
    showToast(`已选择 ${files.length} 个作品文件`);
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    collectForm(form);
    const error = validateStep(state.intakeStep);
    const errorBox = app.querySelector('#form-error');
    if (error) {
      errorBox.textContent = error;
      errorBox.hidden = false;
      errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    errorBox.hidden = true;
    saveState();
    if (state.intakeStep < 5) {
      state.intakeStep += 1;
      saveState();
      render();
    } else {
      location.hash = '#/preview';
      showToast('资料已保存，可以开始预览');
    }
  });
}

function collectForm(form) {
  if (!form) return;
  const data = new FormData(form);
  for (const key of ['name','city','contact','school','major','graduation','direction','supportNeed','deadline','workExperience','projectExperience','strengths','videoLink','projectLink']) {
    if (data.has(key)) state.draft[key] = String(data.get(key) || '').trim();
  }
  if (data.has('pageStyle')) state.draft.pageStyle = String(data.get('pageStyle'));
  if (data.has('color')) state.draft.color = String(data.get('color'));
  const privacy = form.querySelector('#privacy');
  if (privacy) state.draft.privacy = privacy.checked;
}

function validateStep(step) {
  if (step === 1 && !state.draft.direction) return '请填写目标岗位或展示方向。';
  if (step === 2 && !state.draft.name) return '请填写姓名。';
  if (step === 2 && !state.draft.contact) return '请填写联系方式。';
  return '';
}

function bindPreview() {
  app.querySelector('#save-revision')?.addEventListener('click', () => {
    state.revision = app.querySelector('#revision').value.trim();
    saveState();
    showToast(state.revision ? '修改意见已保存' : '当前没有填写修改意见');
  });
  app.querySelector('#publish-page')?.addEventListener('click', () => {
    state.revision = app.querySelector('#revision').value.trim();
    state.published = true;
    saveState();
    location.hash = '#/published';
  });
}

menuButton.addEventListener('click', () => {
  const open = mainNav.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
document.addEventListener('pointerdown', (event) => {
  if (mainNav.classList.contains('is-open') && !mainNav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
document.addEventListener('click', (event) => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target.closest?.('a[href^="#/home"]');
  if (link && link.getAttribute('href') === location.hash && renderedRoute === 'home') {
    event.preventDefault();
    render();
  }
});

drawerBackdrop.addEventListener('click', closeDrawer);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const menuWasOpen = mainNav.classList.contains('is-open');
    closeDrawer(); closeModal(); closeMenu();
    if (menuWasOpen) menuButton.focus({ preventScroll: true });
  }
  if (event.key === 'Tab') {
    const overlay = document.querySelector('.modal.is-open, .detail-drawer.is-open');
    if (!overlay) return;
    const controls = [...overlay.querySelectorAll('a[href], button:not(:disabled), input, textarea')];
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
});
document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  app.focus();
  app.scrollIntoView({ behavior: 'instant' });
});
window.addEventListener('hashchange', render);

if (!location.hash) location.hash = '#/home';
else render();
