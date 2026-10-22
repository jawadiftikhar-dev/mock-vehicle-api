/* =========================================================
   Fleet Live — dashboard logic
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Element refs ---------- */
  const $ = id => document.getElementById(id);

  const rowsEl   = $('rows');
  const pager    = $('pager');
  const prevBtn  = $('prevPage');
  const nextBtn  = $('nextPage');
  const pageInfo = $('pageInfo');
  const searchEl = $('search');
  const sizeSel  = $('pageSize');
  const feedEl   = $('feed');
  const pauseBtn = $('pauseBtn');
  const pauseLbl = $('pauseLabel');
  const clearBtn = $('clearBtn');
  const connDot  = $('connDot');
  const connText = $('connText');

  const stTotal   = $('stTotal');
  const stActive  = $('stActive');
  const stIdle    = $('stIdle');
  const stUpdates = $('stUpdates');

  const drawer         = $('drawer');
  const drawerBackdrop = $('drawerBackdrop');
  const drawerBody     = $('drawerBody');
  const drawerLocate   = $('drawerLocate');
  const drawerClose    = $('drawerClose');
  const drawerClose2   = $('drawerClose2');
  const toastStack     = $('toastStack');

  /* ---------- State ---------- */
  const state = {
    vehicles: new Map(),     // id -> vehicle
    order: [],               // sorted ids
    filterStatus: 'all',
    filterText: '',
    sortKey: 'id',
    sortDir: 'asc',
    pageSize: 50,
    page: 1,
    updates: 0,
    paused: false,
    activeVehicleId: null,   // drawer content
  };

  /* ---------- Helpers ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const coord = n => Number(n).toFixed(5);
  const plateFor = v => esc(v.plate);

  function toast(message, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast-' + kind : '');
    el.textContent = message;
    toastStack.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      el.style.transition = 'opacity .2s ease, transform .2s ease';
      setTimeout(() => el.remove(), 220);
    }, 2400);
  }

  function relTime(iso) {
    const t = new Date(iso).getTime();
    const d = Math.max(0, (Date.now() - t) / 1000);
    if (d < 5)  return 'just now';
    if (d < 60) return Math.floor(d) + 's ago';
    if (d < 3600) return Math.floor(d / 60) + 'm ago';
    return Math.floor(d / 3600) + 'h ago';
  }

  /* ---------- Filtering / sorting ---------- */
  function matches(v) {
    if (state.filterStatus !== 'all' && v.status !== state.filterStatus) return false;
    if (!state.filterText) return true;
    const f = state.filterText.toLowerCase();
    return String(v.id).includes(f)
        || v.plate.toLowerCase().includes(f)
        || v.driver.toLowerCase().includes(f)
        || v.status.toLowerCase().includes(f);
  }

  function computeOrder() {
    const arr = [...state.vehicles.values()].filter(matches);
    const k = state.sortKey;
    const dir = state.sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      const av = a[k], bv = b[k];
      if (typeof av === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    state.order = arr.map(v => v.id);
  }

  /* ---------- Rendering ---------- */
  function statusBadge(s) {
    return `<span class="badge s-${esc(s)}">${esc(s)}</span>`;
  }

  function rowHTML(v) {
    return `<td class="id">${v.id}</td>
      <td><span class="plate">${plateFor(v)}</span></td>
      <td>${esc(v.driver)}</td>
      <td>${statusBadge(v.status)}</td>
      <td class="coords">${coord(v.lat)}</td>
      <td class="coords">${coord(v.lng)}</td>
      <td><button class="row-action" data-action="open" data-id="${v.id}">Details</button></td>`;
  }

  function renderTable() {
    const { order, page, pageSize } = state;
    const total = order.length;
    const size = pageSize === 'all' ? total : pageSize;
    const pages = Math.max(1, Math.ceil(total / size));
    if (state.page > pages) state.page = pages;
    const start = (state.page - 1) * size;
    const slice = order.slice(start, start + size);

    if (total === 0) {
      rowsEl.innerHTML = '<tr><td colspan="7" class="empty">No vehicles match your filters.</td></tr>';
    } else {
      const frag = document.createDocumentFragment();
      for (const id of slice) {
        const v = state.vehicles.get(id);
        if (!v) continue;
        const tr = document.createElement('tr');
        tr.dataset.id = id;
        tr.innerHTML = rowHTML(v);
        frag.appendChild(tr);
      }
      rowsEl.replaceChildren(frag);
    }

    if (state.pageSize === 'all' || pages <= 1) {
      pager.hidden = true;
    } else {
      pager.hidden = false;
      pageInfo.textContent = `Page ${state.page} of ${pages} · ${total} vehicles`;
      prevBtn.disabled = state.page === 1;
      nextBtn.disabled = state.page === pages;
    }
  }

  function updateStats() {
    const all = [...state.vehicles.values()];
    stTotal.textContent  = all.length;
    stActive.textContent = all.filter(v => v.status === 'active').length;
    stIdle.textContent   = all.filter(v => v.status === 'idle').length;
    stUpdates.textContent = state.updates;
  }

  function refresh() {
    computeOrder();
    renderTable();
    updateStats();
  }

  /* ---------- Row flash ---------- */
  function flashRow(id) {
    const tr = rowsEl.querySelector(`tr[data-id="${id}"]`);
    if (!tr) return;
    tr.classList.add('flash');
    clearTimeout(tr._flashT);
    tr._flashT = setTimeout(() => tr.classList.remove('flash'), 1300);
  }

  /* ---------- Feed ---------- */
  function addFeedItem(v) {
    if (feedEl.firstElementChild?.classList.contains('empty')) feedEl.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'feed-item';
    el.dataset.ts = v.timestamp || new Date().toISOString();
    el.innerHTML = `
      <div class="feed-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 6-9 12-9 12S3 16 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="feed-body">
        <div class="feed-title">
          <span>${esc(v.plate)} · ${esc(v.driver)}</span>
          <span class="t" data-rel>${relTime(v.timestamp)}</span>
        </div>
        <div class="feed-meta">${coord(v.lat)}, ${coord(v.lng)} · ${esc(v.status)}</div>
      </div>`;
    feedEl.prepend(el);
    while (feedEl.children.length > 60) feedEl.lastElementChild.remove();
  }

  function tickRelativeTimes() {
    feedEl.querySelectorAll('[data-rel]').forEach(span => {
      const item = span.closest('.feed-item');
      span.textContent = relTime(item.dataset.ts);
    });
  }
  setInterval(tickRelativeTimes, 1000);

  /* ---------- Drawer ---------- */
  function openDrawer(id) {
    const v = state.vehicles.get(id);
    if (!v) return;
    state.activeVehicleId = id;
    drawerBody.innerHTML = `
      <div class="drawer-row"><span class="k">ID</span><span class="v">#${v.id}</span></div>
      <div class="drawer-row"><span class="k">Plate</span><span class="v"><span class="plate">${esc(v.plate)}</span></span></div>
      <div class="drawer-row"><span class="k">Driver</span><span class="v">${esc(v.driver)}</span></div>
      <div class="drawer-row"><span class="k">Status</span><span class="v">${statusBadge(v.status)}</span></div>
      <div class="drawer-row"><span class="k">Latitude</span><span class="v">${coord(v.lat)}</span></div>
      <div class="drawer-row"><span class="k">Longitude</span><span class="v">${coord(v.lng)}</span></div>
      <div class="drawer-map" style="--px:${50}%;--py:${50}%">
        <span class="pin" aria-hidden="true">📍</span>
      </div>`;
    drawer.hidden = false;
    drawerBackdrop.hidden = false;
    drawerLocate.disabled = false;
  }

  function closeDrawer() {
    drawer.hidden = true;
    drawerBackdrop.hidden = true;
    state.activeVehicleId = null;
  }

  drawerClose.addEventListener('click', closeDrawer);
  drawerClose2.addEventListener('click', closeDrawer);
  drawerBackdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !drawer.hidden) closeDrawer();
  });

  drawerLocate.addEventListener('click', () => {
    const id = state.activeVehicleId;
    if (!id) return;
    closeDrawer();
    // make sure the row is visible in the current page
    const idx = state.order.indexOf(id);
    if (idx === -1) {
      toast('Vehicle hidden by current filters', 'warn');
      return;
    }
    if (state.pageSize !== 'all') {
      const targetPage = Math.floor(idx / state.pageSize) + 1;
      if (targetPage !== state.page) {
        state.page = targetPage;
        renderTable();
      }
    }
    requestAnimationFrame(() => {
      flashRow(id);
      const tr = rowsEl.querySelector(`tr[data-id="${id}"]`);
      tr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  /* ---------- Table events ---------- */
  rowsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="open"]');
    if (btn) { openDrawer(Number(btn.dataset.id)); return; }
    const tr = e.target.closest('tr[data-id]');
    if (tr) openDrawer(Number(tr.dataset.id));
  });

  /* ---------- Sorting ---------- */
  document.querySelectorAll('.v-table thead th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const k = th.dataset.sort;
      if (state.sortKey === k) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = k;
        state.sortDir = 'asc';
      }
      document.querySelectorAll('.v-table thead th').forEach(h => h.removeAttribute('data-sort-active'));
      th.setAttribute('data-sort-active', state.sortDir);
      state.page = 1;
      refresh();
    });
  });

  /* ---------- Search ---------- */
  let searchT;
  searchEl.addEventListener('input', e => {
    clearTimeout(searchT);
    searchT = setTimeout(() => {
      state.filterText = e.target.value.trim();
      state.page = 1;
      refresh();
    }, 120);
  });

  /* ---------- Status filter chips ---------- */
  document.querySelectorAll('.filter-bar .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar .chip').forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      state.filterStatus = chip.dataset.status;
      state.page = 1;
      refresh();
    });
  });

  /* ---------- Pagination ---------- */
  sizeSel.addEventListener('change', () => {
    const val = sizeSel.value;
    state.pageSize = val === 'all' ? 'all' : Number(val);
    state.page = 1;
    renderTable();
  });
  prevBtn.addEventListener('click', () => {
    if (state.page > 1) { state.page--; renderTable(); }
  });
  nextBtn.addEventListener('click', () => {
    state.page++; renderTable();
  });

  /* ---------- Pause / resume ---------- */
  pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    pauseLbl.textContent = state.paused ? 'Resume' : 'Pause';
    pauseBtn.querySelector('.btn-ico').textContent = state.paused ? '▶' : '⏸';
    toast(state.paused ? 'Live feed paused' : 'Live feed resumed', state.paused ? 'warn' : 'success');
  });

  clearBtn.addEventListener('click', () => {
    feedEl.innerHTML = '<div class="empty">Feed cleared. Waiting for next update…</div>';
    toast('Feed cleared', 'success');
  });

  /* ---------- Load initial data ---------- */
  fetch(apiUrl('/vehicles'))
    .then(r => r.json())
    .then(list => {
      for (const v of list) state.vehicles.set(v.id, v);
      refresh();
    })
    .catch(err => {
      rowsEl.innerHTML = `<tr><td colspan="7" class="empty">Failed to load vehicles: ${esc(err.message)}</td></tr>`;
    });

  /* ---------- SSE stream ---------- */
  const es = new EventSource(apiUrl('/positions'));

  es.addEventListener('open', () => {
    connDot.className = 'conn-dot on';
    connText.textContent = 'Live';
  });
  es.addEventListener('error', () => {
    connDot.className = 'conn-dot off';
    connText.textContent = 'Reconnecting…';
  });
  es.addEventListener('position', ev => {
    let v;
    try { v = JSON.parse(ev.data); } catch { return; }

    state.updates++;
    const prev = state.vehicles.get(v.id) || {};
    state.vehicles.set(v.id, { ...prev, ...v });

    if (!state.paused) {
      addFeedItem(v);
      // update in-place if the row is currently visible & still matches
      const tr = rowsEl.querySelector(`tr[data-id="${v.id}"]`);
      if (tr) {
        if (matches(v)) {
          tr.innerHTML = rowHTML(v);
          flashRow(v.id);
        } else {
          tr.remove();
        }
      }
    }

    // Live stat numbers
    stUpdates.textContent = state.updates;

    // If drawer is showing this vehicle, refresh it
    if (state.activeVehicleId === v.id) openDrawer(v.id);
  });
})();