const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactLayout = window.matchMedia('(max-width: 1040px)');
const ease = 'cubic-bezier(.22,.7,.18,1)';
function animate(element, frames, duration = 450, delay = 0) {
  if (reducedMotion.matches) return null;
  return element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) document.getAnimations().forEach((animation) => animation.cancel());
});

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');
const navLinks = [...navigation.querySelectorAll('a')];
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
  navigation.inert = compactLayout.matches && !open;
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', (event) => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});
compactLayout.addEventListener('change', () => setMenu(false));
setMenu(false);

const header = document.querySelector('[data-header]');
new IntersectionObserver(([entry]) => {
  header.classList.toggle('is-scrolled', !entry.isIntersecting);
}).observe(document.querySelector('[data-header-sentinel]'));

const sectionStates = new Map();
const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href')));
// One observer tracks the current reading section without scroll event handlers.
const navigationObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => sectionStates.set(entry.target.id, entry.isIntersecting));
  const active = sections.find((section) => sectionStates.get(section.id));
  navLinks.forEach((link) => {
    const selected = Boolean(active && link.getAttribute('href') === '#' + active.id);
    link.classList.toggle('is-active', selected);
    if (selected) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}, { rootMargin: '-16% 0px -58% 0px', threshold: 0 });
sections.forEach((section) => navigationObserver.observe(section));

const revealObserver = new IntersectionObserver((entries) => {
  const entering = entries.filter((entry) => entry.isIntersecting);
  entering.forEach((entry, index) => {
    revealObserver.unobserve(entry.target);
    animate(entry.target, [
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], 700, Math.min(index * 65, 195));
  });
}, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const works = [...document.querySelectorAll('.work[data-category]')];
const worksGrid = document.querySelector('.works-grid');
const filterIndicator = document.querySelector('.filter-indicator');
const filterCount = document.querySelector('[data-filter-count]');
function positionFilterIndicator() {
  const selected = filterButtons.find((button) => button.classList.contains('is-active'));
  filterIndicator.style.width = selected.offsetWidth + 'px';
  filterIndicator.style.transform = 'translateX(' + selected.offsetLeft + 'px)';
}
function selectFilter(button) {
  if (button.classList.contains('is-active')) return;
  works.forEach((work) => work.getAnimations().forEach((animation) => animation.cancel()));
  const previous = new Map(works.filter((work) => !work.hidden).map((work) => [work, work.getBoundingClientRect()]));
  const filter = button.dataset.filter;
  filterButtons.forEach((item) => {
    item.classList.toggle('is-active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  worksGrid.classList.toggle('is-filtered', filter !== 'all');
  works.forEach((work) => { work.hidden = filter !== 'all' && work.dataset.category !== filter; });
  const visible = works.filter((work) => !work.hidden);
  filterCount.textContent = visible.length + ' 件作品';
  positionFilterIndicator();
  visible.forEach((work, index) => {
    const before = previous.get(work);
    const after = work.getBoundingClientRect();
    revealObserver.unobserve(work);
    animate(work, [
      { opacity: before ? 1 : 0, transform: before ? 'translate(' + (before.left - after.left) + 'px,' + (before.top - after.top) + 'px)' : 'translateY(14px)' },
      { opacity: 1, transform: 'translate(0,0)' }
    ], 420, before ? 0 : Math.min(index * 35, 105));
  });
}
filterButtons.forEach((button) => button.addEventListener('click', () => selectFilter(button)));
document.querySelectorAll('[data-select-filter]').forEach((link) => {
  link.addEventListener('click', () => {
    const button = filterButtons.find((item) => item.dataset.filter === link.dataset.selectFilter);
    if (button) selectFilter(button);
  });
});
new ResizeObserver(positionFilterIndicator).observe(document.querySelector('.filters'));
document.fonts.ready.then(positionFilterIndicator);
positionFilterIndicator();

const lightbox = document.querySelector('[data-lightbox]');
const lightboxImage = document.querySelector('[data-lightbox-image]');
const lightboxCaption = document.querySelector('[data-lightbox-caption]');
const lightboxDetail = document.querySelector('[data-lightbox-detail]');
const lightboxNote = document.querySelector('[data-lightbox-note]');
const lightboxReading = document.querySelector('[data-lightbox-reading]');
const lightboxBody = document.querySelector('.lightbox-body');
const lightboxPoints = document.querySelector('[data-lightbox-points]');
const lightboxTip = document.querySelector('[data-lightbox-tip]');
const lightboxAnnouncement = document.querySelector('[data-lightbox-announcement]');
const lightboxCount = document.querySelector('[data-lightbox-count]');
const lightboxStatus = document.querySelector('[data-lightbox-status]');
const lightboxStage = document.querySelector('[data-lightbox-stage]');
const zoomButton = document.querySelector('[data-lightbox-zoom]');
const previousButton = document.querySelector('[data-lightbox-prev]');
const nextButton = document.querySelector('[data-lightbox-next]');
const closeButton = document.querySelector('[data-lightbox-close]');
let gallery = [];
let galleryIndex = 0;
let imageRequest = 0;
let lightboxTrigger = null;
let closing = false;
let dragging = null;
let zoomed = false;
function resetZoom() {
  zoomed = false;
  dragging = null;
  lightboxStage.classList.remove('is-zoomed', 'is-dragging');
  lightboxImage.style.width = '';
  lightboxImage.style.height = '';
  lightboxStage.scrollLeft = 0;
  lightboxStage.scrollTop = 0;
  zoomButton.textContent = '放大细节';
  zoomButton.setAttribute('aria-pressed', 'false');
}
function toggleZoom() {
  if (lightboxImage.hidden || zoomButton.disabled) return;
  if (zoomed) { resetZoom(); return; }
  const width = lightboxImage.getBoundingClientRect().width;
  const height = lightboxImage.getBoundingClientRect().height;
  zoomed = true;
  lightboxStage.classList.add('is-zoomed');
  lightboxImage.style.width = (width * 2) + 'px';
  lightboxImage.style.height = (height * 2) + 'px';
  zoomButton.textContent = '适应画面';
  zoomButton.setAttribute('aria-pressed', 'true');
  lightboxStage.scrollLeft = (lightboxStage.scrollWidth - lightboxStage.clientWidth) / 2;
  lightboxStage.scrollTop = (lightboxStage.scrollHeight - lightboxStage.clientHeight) / 2;
}
async function showImage(index, direction = 0) {
  const request = ++imageRequest;
  galleryIndex = (index + gallery.length) % gallery.length;
  const item = gallery[galleryIndex];
  resetZoom();
  lightboxCaption.textContent = item.dataset.caption || '图片';
  lightboxDetail.textContent = item.dataset.detail || '';
  const notes = artworkNotes.get(item.dataset.image);
  lightbox.classList.toggle('has-notes', Boolean(notes));
  lightboxReading.hidden = !notes;
  lightboxReading.scrollTop = 0;
  lightboxBody.scrollTop = 0;
  lightboxPoints.replaceChildren();
  lightboxNote.textContent = notes?.summary || '';
  lightboxTip.textContent = notes?.tip || '';
  notes?.points.forEach((point) => {
    const group = document.createElement('div');
    const title = document.createElement('dt');
    const text = document.createElement('dd');
    title.textContent = point.title;
    text.textContent = point.text;
    group.append(title, text);
    lightboxPoints.append(group);
  });
  lightboxCount.textContent = (galleryIndex + 1) + ' / ' + gallery.length;
  lightboxAnnouncement.textContent = lightboxCaption.textContent + '，第 ' + (galleryIndex + 1) + ' 件，共 ' + gallery.length + ' 件';
  previousButton.hidden = nextButton.hidden = gallery.length < 2;
  zoomButton.disabled = true;
  lightboxImage.hidden = true;
  lightboxStatus.hidden = false;
  lightboxStatus.textContent = '正在展开图片…';
  const loaded = new Image();
  loaded.src = item.dataset.image;
  try {
    await loaded.decode();
    if (request !== imageRequest || !lightbox.open) return;
    lightboxImage.src = loaded.src;
    lightboxImage.alt = item.querySelector('img')?.alt || item.dataset.caption || '图片';
    lightboxImage.hidden = false;
    lightboxStatus.hidden = true;
    zoomButton.disabled = false;
    animate(lightboxImage, [
      { opacity: 0, transform: 'translateX(' + direction * 16 + 'px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ], 320);
  } catch {
    if (request !== imageRequest || !lightbox.open) return;
    lightboxStatus.textContent = '图片未能加载，请关闭后重试。';
  }
}
function openLightbox(trigger, target = trigger) {
  lightboxTrigger = trigger;
  closing = false;
  const group = target.dataset.gallery;
  const candidates = group
    ? [...document.querySelectorAll('[data-gallery="' + group + '"][data-image]')].filter((item) => trigger.dataset.galleryScope === 'all' || !item.hidden)
    : [target];
  const unique = new Map(candidates.map((item) => [item.dataset.image, item]));
  gallery = [...unique.values()];
  document.body.classList.add('is-locked');
  lightbox.showModal();
  showImage(Math.max(0, gallery.findIndex((item) => item.dataset.image === target.dataset.image)));
  animate(lightbox, [{ opacity: 0, transform: 'translateY(12px) scale(.988)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], 320);
  closeButton.focus({ preventScroll: true });
}
async function closeLightbox() {
  if (!lightbox.open || closing) return;
  closing = true;
  const animation = animate(lightbox, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(8px)' }], 160);
  if (animation) await animation.finished.catch(() => {});
  lightbox.close();
  closing = false;
}
document.querySelectorAll('[data-image]').forEach((trigger) => trigger.addEventListener('click', () => openLightbox(trigger)));
document.querySelectorAll('[data-open-work]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const work = works.find((item) => item.dataset.image === trigger.dataset.openWork);
    if (!work) return;
    if (work.hidden && trigger.dataset.galleryScope !== 'all') selectFilter(filterButtons.find((button) => button.dataset.filter === 'all'));
    openLightbox(trigger, work);
  });
});
closeButton.addEventListener('click', closeLightbox);
lightbox.addEventListener('cancel', (event) => { event.preventDefault(); closeLightbox(); });
lightbox.addEventListener('click', (event) => {
  if (event.target !== lightbox) return;
  const rect = lightbox.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeLightbox();
});
lightbox.addEventListener('close', () => {
  imageRequest++;
  document.body.classList.remove('is-locked');
  resetZoom();
  lightboxImage.removeAttribute('src');
  lightboxTrigger?.focus({ preventScroll: true });
});
previousButton.addEventListener('click', () => showImage(galleryIndex - 1, -1));
nextButton.addEventListener('click', () => showImage(galleryIndex + 1, 1));
zoomButton.addEventListener('click', toggleZoom);
lightboxImage.addEventListener('dblclick', toggleZoom);
lightboxImage.addEventListener('dragstart', (event) => event.preventDefault());
lightbox.addEventListener('keydown', (event) => {
  if (zoomed && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const horizontal = event.key === 'ArrowLeft' ? -90 : event.key === 'ArrowRight' ? 90 : 0;
    const vertical = event.key === 'ArrowUp' ? -90 : event.key === 'ArrowDown' ? 90 : 0;
    lightboxStage.scrollBy({ left: horizontal, top: vertical, behavior: 'instant' });
    return;
  }
  if (gallery.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  const direction = event.key === 'ArrowRight' ? 1 : -1;
  showImage(galleryIndex + direction, direction);
});
lightboxStage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || lightboxImage.hidden) return;
  dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, left: lightboxStage.scrollLeft, top: lightboxStage.scrollTop, type: event.pointerType };
  if (zoomed) {
    lightboxStage.setPointerCapture(event.pointerId);
    lightboxStage.classList.add('is-dragging');
  }
});
lightboxStage.addEventListener('pointermove', (event) => {
  if (!dragging || dragging.id !== event.pointerId || !zoomed) return;
  event.preventDefault();
  lightboxStage.scrollLeft = dragging.left - (event.clientX - dragging.x);
  lightboxStage.scrollTop = dragging.top - (event.clientY - dragging.y);
});
function finishPointer(event) {
  if (!dragging || event.pointerId !== dragging.id) return;
  const deltaX = event.clientX - dragging.x;
  const deltaY = event.clientY - dragging.y;
  if (!zoomed && dragging.type === 'touch' && Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && gallery.length > 1) {
    const direction = deltaX < 0 ? 1 : -1;
    showImage(galleryIndex + direction, direction);
  }
  dragging = null;
  lightboxStage.classList.remove('is-dragging');
}
lightboxStage.addEventListener('pointerup', finishPointer);
lightboxStage.addEventListener('pointercancel', () => { dragging = null; lightboxStage.classList.remove('is-dragging'); });
new ResizeObserver(() => { if (zoomed) resetZoom(); }).observe(lightbox);

const copyButton = document.querySelector('[data-copy-profile]');
const copyStatus = document.querySelector('[data-copy-status]');
const profileText = '胡海燕｜齐鲁理工学院书法专业本科生｜2027年6月毕业｜已取得高中教师资格证｜求职方向：书法教育与公共美育';
let copyTimeout;
copyButton.addEventListener('click', async () => {
  clearTimeout(copyTimeout);
  copyStatus.textContent = '正在复制…';
  try {
    // Synchronous copying keeps the click gesture on static, HTTP-hosted resumes too.
    const field = document.createElement('textarea');
    field.value = profileText;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;opacity:0;left:0;top:0';
    document.body.appendChild(field);
    let copied = false;
    try {
      field.select();
      copied = document.execCommand('copy');
    } finally {
      field.remove();
      copyButton.focus({ preventScroll: true });
    }
    if (!copied) {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error('Copy unavailable');
      let deadline;
      try {
        await Promise.race([
          navigator.clipboard.writeText(profileText),
          new Promise((resolve, reject) => { deadline = window.setTimeout(() => reject(new Error('Copy timed out')), 1800); })
        ]);
      } finally {
        clearTimeout(deadline);
      }
    }
    copyStatus.textContent = '个人简介已复制';
  } catch {
    copyStatus.textContent = '复制未成功，请手动选取简介文字。';
  }
  copyTimeout = window.setTimeout(() => { copyStatus.textContent = ''; }, 3000);
});
