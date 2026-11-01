// ===== 主页 影视筛选板块：按 类型/地区/年份 筛选（采集源驱动，经 /proxy/ 代理）=====
// 数据源：bfzy（苹果CMS 采集源），参数 t=类型ID / year=年份 / area=地区
const FILTER_SOURCE = 'https://bfzyapi.com/api.php/provide/vod';

let filterState = { t: '', area: '', year: '', pg: 1 };

// 常用类型（type_id 来自 bfzy 分类树；已剔除理论片/福利等成人分类）
const filterTypeOptions = [
    { id: '', name: '全部类型' },
    { id: '22', name: '喜剧片' },
    { id: '21', name: '动作片' },
    { id: '25', name: '爱情片' },
    { id: '24', name: '科幻片' },
    { id: '23', name: '恐怖片' },
    { id: '26', name: '剧情片' },
    { id: '27', name: '战争片' },
    { id: '28', name: '纪录片' },
    { id: '50', name: '动画片' },
    { id: '39', name: '动漫片' },
    { id: '31', name: '国产剧' },
    { id: '32', name: '欧美剧' },
    { id: '58', name: '短剧' },
];
const filterAreaOptions = ['', '中国大陆', '香港', '台湾', '日本', '韩国', '美国', '英国', '法国', '泰国', '印度'];
const filterYearOptions = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

function initFilter() {
    renderFilterRow('filter-types', filterTypeOptions, 't', o => (typeof o === 'object' ? o.id : o));
    renderFilterRow('filter-areas', filterAreaOptions, 'area', o => o);
    renderFilterRow('filter-years', filterYearOptions, 'year', o => o);
    loadFilterResults();
}

function renderFilterRow(containerId, items, key, valueOf) {
    const c = document.getElementById(containerId);
    if (!c) return;
    c.innerHTML = '';
    items.forEach((it, i) => {
        const val = valueOf(it);
        const label = typeof it === 'object' ? it.name : (it || '全部');
        const active = filterState[key] === val;
        const b = document.createElement('button');
        b.className = 'px-3 py-1.5 rounded-full text-xs border transition-all ' +
            (active ? 'bg-pink-600 text-white border-pink-400 shadow' : 'bg-[#1a1a1a] text-gray-300 hover:bg-pink-700 hover:text-white border-[#333]');
        b.textContent = label;
        b.setAttribute('data-key', key);
        b.onclick = () => {
            filterState[key] = val;
            filterState.pg = 1;
            // 重渲染三行，同步高亮
            renderFilterRow('filter-types', filterTypeOptions, 't', o => (typeof o === 'object' ? o.id : o));
            renderFilterRow('filter-areas', filterAreaOptions, 'area', o => o);
            renderFilterRow('filter-years', filterYearOptions, 'year', o => o);
            loadFilterResults();
        };
        c.appendChild(b);
    });
}

async function loadFilterResults() {
    const c = document.getElementById('filter-results');
    if (!c) return;
    c.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400">正在加载...</div>';
    const params = new URLSearchParams();
    params.set('ac', 'videolist');
    params.set('wd', '');
    params.set('pg', filterState.pg);
    if (filterState.t) params.set('t', filterState.t);
    if (filterState.area) params.set('area', filterState.area);
    if (filterState.year) params.set('year', filterState.year);
    const url = FILTER_SOURCE + '?' + params.toString();
    try {
        const res = await fetch(PROXY_URL + encodeURIComponent(url), { headers: { 'User-Agent': 'Mozilla/5.0' } });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        renderFilterCards(data.list || [], c);
    } catch (e) {
        c.innerHTML = '<div class="col-span-full text-center py-10 text-red-400">筛选加载失败：' + (e.message || '未知错误') + '</div>';
    }
}

function renderFilterCards(list, c) {
    if (!list || !list.length) { c.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400">暂无匹配内容，试试放宽筛选条件</div>'; return; }
    c.innerHTML = '';
    list.forEach(item => {
        const safeName = (item.vod_name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const pic = item.vod_pic ? PROXY_URL + encodeURIComponent(item.vod_pic) : 'image/logo.png';
        const meta = [item.vod_year, item.vod_area].filter(Boolean).join(' · ');
        const remarks = item.vod_remarks ? String(item.vod_remarks).replace(/</g, '&lt;') : '';
        const card = document.createElement('div');
        card.className = 'bg-[#151515] hover:bg-[#222] transition-all rounded-lg overflow-hidden flex flex-col cursor-pointer transform hover:scale-[1.02] shadow-md hover:shadow-lg border border-[#222]';
        card.innerHTML = `
          <div class="relative w-full aspect-[2/3] overflow-hidden">
            <img src="${pic}" alt="${safeName}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" onerror="this.onerror=null;this.src='image/logo.png';" loading="lazy" referrerpolicy="no-referrer">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            ${meta ? `<div class="absolute bottom-1 left-1 text-[11px] text-gray-200 bg-black/60 px-1.5 py-0.5 rounded">${meta}</div>` : ''}
            ${remarks ? `<div class="absolute top-1 right-1 text-[11px] text-yellow-300 bg-black/60 px-1.5 py-0.5 rounded">${remarks}</div>` : ''}
          </div>
          <div class="p-2 text-center">
            <div class="text-sm text-white truncate" title="${safeName}">${safeName}</div>
          </div>`;
        card.addEventListener('click', () => {
            if (typeof fillAndSearch === 'function') { fillAndSearch(safeName); return; }
            const si = document.getElementById('searchInput');
            if (si) { si.value = safeName; if (typeof search === 'function') search(); }
        });
        c.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', initFilter);
