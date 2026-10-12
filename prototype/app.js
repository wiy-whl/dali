(function () {
  const toast = document.getElementById("toast");
  const favCount = document.getElementById("fav-count");
  const tabbar = document.getElementById("tabbar");
  const saved = new Set();
  const thumbs = {
    洱海: "./assets/spot-erhai.jpg",
    喜洲古镇: "./assets/spot-xizhou.jpg",
    双廊: "./assets/spot-shuanglang.jpg",
    苍山: "./assets/spot-cangshan.jpg",
    崇圣寺三塔: "./assets/spot-pagoda.jpg",
    湖上拱桥: "./assets/spot-bridge.jpg",
  };
  const favScreen = {
    洱海: "spot-erhai",
    喜洲古镇: "spot-xizhou",
    双廊: "spot-shuanglang",
    苍山: "spot-cangshan",
    崇圣寺三塔: "spot-pagoda",
    湖上拱桥: "spot-bridge",
  };
  const tabs = { home: "home", spots: "spots", culture: "culture", ai: "ai", mine: "mine" };
  const zoneName = { east: "东岸", north: "城北", west: "城西", far: "北段", south: "城南" };
  const visitMeta = {
    "spot-erhai": { name: "洱海", img: "./assets/spot-erhai.jpg" },
    "spot-xizhou": { name: "喜洲古镇", img: "./assets/spot-xizhou.jpg" },
    "spot-shuanglang": { name: "双廊", img: "./assets/spot-shuanglang.jpg" },
    "spot-cangshan": { name: "苍山", img: "./assets/spot-cangshan.jpg" },
    "spot-pagoda": { name: "崇圣寺三塔", img: "./assets/spot-pagoda.jpg" },
    "spot-bridge": { name: "湖上拱桥", img: "./assets/spot-bridge.jpg" },
    "culture-dye": { name: "扎染", img: "./assets/craft-dye.jpg" },
    "culture-wamao": { name: "瓦猫", img: "./assets/craft-shelf.jpg" },
    "culture-house": { name: "白族民居", img: "./assets/culture-town.jpg" },
    "culture-tea": { name: "三道茶", img: "./assets/craft-tea.jpg" },
    "culture-fire": { name: "火把节", img: "./assets/craft-fire.jpg" },
    "culture-tower": { name: "古城楼阁", img: "./assets/culture-temple.jpg" },
    exhibit: { name: "云上特展", img: "./assets/exhibit-tower.jpg" },
  };
  const recent = [];

  function showToast(text) {
    toast.textContent = text;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1500);
  }

  function refreshFavUI() {
    const n = saved.size;
    if (favCount) favCount.textContent = n ? n + " 个 ›" : "还没有 ›";
    document.querySelectorAll(".fav-btn").forEach((btn) => {
      btn.classList.toggle("on", saved.has(btn.getAttribute("data-fav")));
    });
    document.querySelectorAll(".add-fav").forEach((btn) => {
      const on = saved.has(btn.getAttribute("data-fav"));
      btn.classList.toggle("on", on);
      btn.textContent = on ? "已加入想去 · 再点取消" : "加入想去";
    });
    const box = document.getElementById("fav-items");
    if (!box) return;
    if (!saved.size) {
      box.innerHTML = '<p class="trip-empty">都取消掉了。去首页再逛逛。</p>';
      return;
    }
    box.innerHTML = [...saved]
      .map((name) => {
        return (
          '<div class="row static"><button class="fav-main" type="button" data-go="' +
          (favScreen[name] || "home") +
          '"><img src="' +
          (thumbs[name] || "./assets/spot-erhai.jpg") +
          '" alt="" /><div class="grow"><b>' +
          name +
          "</b><p>已加入想去</p></div></button>" +
          '<button class="fav-del" type="button" data-unfav="' +
          name +
          '">移除</button></div>'
        );
      })
      .join("");
  }

  function syncTab(id) {
    const key = tabs[id] || "";
    tabbar.style.display = document.getElementById(id)?.classList.contains("no-tab") ? "none" : "grid";
    tabbar.querySelectorAll("button").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-go") === key);
    });
    document.querySelectorAll("#screen-nav button").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-go") === id);
    });
  }

  /* ---- 列表首屏加载：让骨架屏成为真实路径上的一环 ----
     第一次进入「景点」时先接管显示骨架屏（loading），
     真实内容加载完后自动落到列表。这是真实网络下的正常时序，
     不是为展示而展示的假跳转。第二次进入不再重复。 */
  const loadedOnce = new Set();
  let loadingTimer = null;

  function withSkeleton(targetId) {
    /* 只有「景点列表」走骨架屏；fail / loading 等自身不做二次接管 */
    if (targetId !== "spots") return false;
    if (loadedOnce.has(targetId)) return false;
    const skel = document.getElementById("loading");
    const next = document.getElementById(targetId);
    if (!skel || !next) return false;
    loadedOnce.add(targetId);
    document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
    skel.classList.add("active");
    skel.scrollTo(0, 0);
    clearTimeout(loadingTimer);
    loadingTimer = setTimeout(() => {
      /* 用户若在等待期间已切走，就不要再强行接管画面 */
      const stillLoading = document.getElementById("loading").classList.contains("active");
      if (!stillLoading) return;
      document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
      next.classList.add("active");
      next.scrollTo(0, 0);
      syncTab(targetId);
      if (location.hash.slice(1) !== targetId) history.replaceState(null, "", "#" + targetId);
    }, 1100);
    return true;
  }

  /* ---- 返回栈 ----
     两类跳转语义不同，不能混进同一个栈：
     ① 层级跳转（列表→详情、详情→相关）—— 进栈，返回时逐层退回；
     ② 同级 tab 切换（首页/景点/文化/AI/我的）—— 不进栈，并把栈清空，
        因为切 tab 等于换了一条路，之前的层级上下文不再成立。
     这样「首页→景点→文化→我的→返回」不会倒带，而是回到确定的位置。 */
  const TAB_IDS = new Set(Object.values(tabs));
  const stack = [];

  function go(id, opts) {
    const next = document.getElementById(id);
    if (!next) return;
    /* 首次进景点列表：先走骨架屏，加载完成自动落到列表 */
    if (withSkeleton(id)) return;
    const keepStack = opts === true || (opts && opts.keepStack === true);
    const cur = document.querySelector(".screen.active");
    if (!keepStack && cur && cur.id !== id) {
      if (TAB_IDS.has(id)) {
        /* 切到另一个 tab：重置层级上下文 */
        stack.length = 0;
      } else {
        stack.push(cur.id);
        if (stack.length > 30) stack.shift();
      }
    }
    document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
    next.classList.add("active");
    next.scrollTo(0, 0);
    syncTab(id);
    if (location.hash.slice(1) !== id) history.replaceState(null, "", "#" + id);
    if (visitMeta[id]) {
      const at = recent.indexOf(id);
      if (at >= 0) recent.splice(at, 1);
      recent.unshift(id);
      if (recent.length > 8) recent.pop();
      renderRecent();
    }
  }

  /* 返回：优先退回上一层；栈空则回该屏声明的 data-back 落点，再兜底首页。
     绝不出现「按了没反应」。 */
  function back(fallback) {
    const prev = stack.pop();
    if (prev) {
      go(prev, true);
      return;
    }
    const target = document.getElementById(fallback) ? fallback : "home";
    go(target, true);
  }

  function renderRecent() {
    const box = document.getElementById("history-list");
    if (box) {
      box.innerHTML = recent.length
        ? recent
            .map((id, i) => {
              const m = visitMeta[id];
              return (
                '<button class="row" type="button" data-go="' +
                id +
                '"><img src="' +
                m.img +
                '" alt="" /><div class="grow"><b>' +
                m.name +
                "</b><p>" +
                (i === 0 ? "今天看过" : "刚刚之前") +
                "</p></div><span class=\"arrow\">›</span></button>"
              );
            })
            .join("")
        : '<p class="trip-empty">还没有足迹。逛过的地方会出现在这里。</p>';
    }
    const mine = document.getElementById("mine-recent");
    if (mine) {
      const top = recent.slice(0, 3);
      mine.innerHTML = top.length
        ? top
            .map((id) => {
              const m = visitMeta[id];
              return '<button type="button" data-go="' + id + '"><img src="' + m.img + '" alt="" /><b>' + m.name + "</b></button>";
            })
            .join("")
        : '<p class="trip-empty">逛过的地方会出现在这里。</p>';
    }
  }

  function toggleFav(name) {
    if (!name) return;
    if (saved.has(name)) {
      saved.delete(name);
      showToast("已从想去移除");
    } else {
      saved.add(name);
      showToast("已加入想去");
    }
    refreshFavUI();
  }

  /* ---- 列表筛选：标签 + 片区，统一计算并给出空态 ---- */
  const activeTag = { spots: "all", culture: "all" };
  let zoneFilter = "";

  function applyFilters(scope) {
    const root = document.getElementById(scope === "spots" ? "spots" : "culture");
    if (!root) return;
    const tag = activeTag[scope];
    let shown = 0;
    root.querySelectorAll("[data-tags]").forEach((row) => {
      const tags = row.getAttribute("data-tags") || "";
      const okTag = tag === "all" || tags.includes(tag);
      const okZone = scope !== "spots" || !zoneFilter || row.getAttribute("data-zone") === zoneFilter;
      const show = okTag && okZone;
      row.style.display = show ? "" : "none";
      if (show) shown += 1;
    });
    const empty = document.getElementById(scope === "spots" ? "spot-filter-empty" : "cult-filter-empty");
    if (empty) empty.hidden = shown > 0;
    const bar = document.getElementById("zone-chipbar");
    if (bar && scope === "spots") {
      bar.hidden = !zoneFilter;
      const label = document.getElementById("zone-chip-name");
      if (label) label.textContent = zoneName[zoneFilter] || "";
    }
  }

  function setZoneFilter(zone, scroll) {
    zoneFilter = zoneFilter === zone ? "" : zone;
    applyFilters("spots");
    if (scroll) document.getElementById("spot-list").scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function toggleSearchEmpty() {
    const input = document.getElementById("search-input");
    const empty = document.getElementById("search-empty");
    if (!input || !empty) return;
    const q = input.value.trim();
    let shown = 0;
    document.querySelectorAll("#search-result .row").forEach((row) => {
      const show = !q || row.innerText.includes(q);
      row.style.display = show ? "flex" : "none";
      if (show) shown += 1;
    });
    const word = document.getElementById("search-empty-word");
    if (word) word.textContent = "“" + q + "”";
    empty.hidden = shown > 0;
  }

  function lockSheet() {
    const open = !document.getElementById("trip-sheet").hidden || !document.getElementById("cult-sheet").hidden;
    document.body.classList.toggle("sheet-open", open);
  }

  function openTrip(open) {
    document.getElementById("trip-mask").hidden = !open;
    document.getElementById("trip-sheet").hidden = !open;
    if (open) showTripView("main");
    lockSheet();
  }

  function showTripView(name) {
    ["main", "cal", "loc"].forEach((id) => {
      document.getElementById("trip-" + id).hidden = id !== name;
    });
    if (name === "cal") renderCal();
    if (name === "loc") renderLoc();
  }

  function openCult(open) {
    document.getElementById("cult-mask").hidden = !open;
    document.getElementById("cult-sheet").hidden = !open;
    lockSheet();
  }

  /* ---- 行程数据与排程 ---- */
  const catalog = {
    "spot-erhai": { name: "洱海", hours: 3.5, zone: "east", where: "东岸 · 才村一带" },
    "spot-xizhou": { name: "喜洲古镇", hours: 4, zone: "north", where: "城北" },
    "spot-shuanglang": { name: "双廊", hours: 3, zone: "far", where: "东岸北段" },
    "spot-pagoda": { name: "崇圣寺三塔", hours: 1.5, zone: "west", where: "城西北" },
    "spot-cangshan": { name: "苍山", hours: 5, zone: "west", where: "城西" },
    "spot-bridge": { name: "湖上拱桥", hours: 0.5, zone: "far", where: "双廊岸边" },
  };
  const places = [
    { id: "here", name: "当前位置", addr: "大理古城 · 南城门附近", zone: "west", dist: "已定位", q: "当前 定位 古城" },
    { id: "oldtown", name: "大理古城", addr: "一塔路南城门", zone: "west", dist: "0.4 km", q: "古城 南门" },
    { id: "caicun", name: "才村码头", addr: "洱海东岸 · 才村", zone: "east", dist: "8 km", q: "才村 码头 洱海" },
    { id: "xizhou", name: "喜洲古镇", addr: "喜洲镇 · 市户街", zone: "north", dist: "18 km", q: "喜洲" },
    { id: "station", name: "大理站", addr: "下关 · 人民路", zone: "south", dist: "14 km", q: "火车站 大理站 下关" },
    { id: "airport", name: "大理凤仪机场", addr: "凤仪镇机场路", zone: "south", dist: "28 km", q: "机场 凤仪" },
    { id: "park", name: "下关洱海公园", addr: "下关 · 滨海路", zone: "south", dist: "12 km", q: "下关 公园 洱海" },
    { id: "shuanglang", name: "双廊古镇", addr: "双廊镇 · 玉几岛", zone: "far", dist: "42 km", q: "双廊" },
  ];
  const modeName = { bus: "公交", car: "包车", bike: "骑行" };
  const weekName = ["日", "一", "二", "三", "四", "五", "六"];
  const trip = [];
  const planPref = { y: 2026, m: 10, d: 5, placeId: "oldtown", days: 1 };
  let calCursor = { y: 2026, m: 10 };

  function placeById(id) {
    return places.find((p) => p.id === id) || places[1];
  }

  function dateLabel(y, m, d) {
    const w = weekName[new Date(y, m - 1, d).getDay()];
    return m + "月" + d + "日 周" + w;
  }

  function shiftDate(y, m, d, add) {
    const dt = new Date(y, m - 1, d + add);
    return { y: dt.getFullYear(), m: dt.getMonth() + 1, d: dt.getDate() };
  }

  function travelHours(a, b, mode) {
    const key = [a, b].sort().join("|");
    const table = {
      "west|west": 0.3,
      "east|east": 0.3,
      "north|north": 0.2,
      "far|far": 0.3,
      "south|south": 0.4,
      "east|west": 0.7,
      "north|west": 0.8,
      "south|west": 0.6,
      "east|north": 1,
      "east|south": 0.9,
      "north|south": 1.3,
      "east|far": 1.2,
      "far|west": 2,
      "far|north": 1.6,
      "far|south": 2.2,
    };
    let h = table[key] == null ? 1 : table[key];
    if (mode === "car") h *= 0.65;
    if (mode === "bike") h *= 1.2;
    return Math.round(h * 10) / 10;
  }

  function clock(hour) {
    const mins = Math.round(hour * 60);
    const hh = String(Math.floor(mins / 60)).padStart(2, "0");
    const mm = String(mins % 60).padStart(2, "0");
    return hh + ":" + mm;
  }

  function syncTrip() {
    const fab = document.getElementById("trip-fab");
    const count = document.getElementById("trip-count");
    const box = document.getElementById("trip-picks");
    if (count) count.textContent = String(trip.length);
    if (fab) {
      fab.hidden = trip.length === 0;
      fab.classList.toggle("pulse", trip.length > 0 && trip.justAdded === true);
    }
    /* 列表页的 + 号：图标态 */
    document.querySelectorAll(".place-add").forEach((btn) => {
      const on = trip.includes(btn.getAttribute("data-add"));
      btn.classList.toggle("on", on);
      btn.textContent = on ? "✓" : "+";
      btn.setAttribute("aria-label", on ? "从行程移除" : "加入行程");
    });
    /* 详情页底部的文字按钮：文案态 */
    document.querySelectorAll(".btn-ghost-dock[data-add]").forEach((btn) => {
      const on = trip.includes(btn.getAttribute("data-add"));
      btn.classList.toggle("on", on);
      btn.textContent = on ? "已加入行程" : "加入行程";
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (!box) return;
    if (!trip.length) {
      box.innerHTML = '<p class="trip-empty">还没有景点。在列表里点 + 。</p>';
      return;
    }
    box.innerHTML = trip
      .map((id) => {
        const spot = catalog[id];
        return (
          '<div class="trip-pick"><div><b>' +
          spot.name +
          "</b><span>" +
          spot.where +
          " · " +
          spot.hours +
          ' 小时</span></div><button type="button" data-remove="' +
          id +
          '">移除</button></div>'
        );
      })
      .join("");
  }

  function paintPrefs() {
    const place = placeById(planPref.placeId);
    document.getElementById("trip-date-label").textContent = dateLabel(planPref.y, planPref.m, planPref.d);
    document.getElementById("trip-loc-label").textContent = place.name;
    document.getElementById("trip-loc-addr").textContent = place.addr;
    document.getElementById("trip-days-label").textContent = planPref.days + " 天";
    const slider = document.getElementById("trip-days");
    slider.value = String(planPref.days);
    const p = ((planPref.days - 1) / 29) * 100;
    slider.style.setProperty("--p", p + "%");
  }

  function renderCal() {
    const y = calCursor.y;
    const m = calCursor.m;
    const count = new Date(y, m, 0).getDate();
    const lead = new Date(y, m - 1, 1).getDay();
    const today = new Date(2026, 9, 5);
    let cells = "";
    for (let i = 0; i < lead; i += 1) cells += "<i></i>";
    for (let d = 1; d <= count; d += 1) {
      const past = new Date(y, m - 1, d) < today;
      const on = planPref.y === y && planPref.m === m && planPref.d === d;
      const isToday = y === 2026 && m === 10 && d === 5;
      const cls = on ? "on" : isToday ? "today" : "";
      cells += '<button type="button" data-day="' + d + '"' + (cls ? ' class="' + cls + '"' : "") + (past ? " disabled" : "") + ">" + d + "</button>";
    }
    document.getElementById("cal-grid").innerHTML = cells;
    document.getElementById("cal-title").textContent = y + "年" + m + "月";
  }

  function shiftCal(delta) {
    let y = calCursor.y;
    let m = calCursor.m + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (y < 2026 || (y === 2026 && m < 10) || y > 2027) return;
    calCursor = { y: y, m: m };
    renderCal();
  }

  function renderLoc() {
    const q = (document.getElementById("loc-q").value || "").trim();
    const place = placeById(planPref.placeId);
    const pin = document.getElementById("loc-pin");
    pin.setAttribute("data-zone", place.zone);
    document.getElementById("loc-pin-name").textContent = place.name;
    const list = places.filter((item) => !q || item.q.includes(q) || item.name.includes(q) || item.addr.includes(q));
    const box = document.getElementById("loc-list");
    if (!list.length) {
      box.innerHTML = '<p class="loc-empty">没有这个地点</p>';
      return;
    }
    box.innerHTML = list
      .map((item) => {
        return (
          '<button class="loc-item' +
          (item.id === planPref.placeId ? " on" : "") +
          '" type="button" data-place="' +
          item.id +
          '"><div><b>' +
          item.name +
          "</b><small>" +
          item.addr +
          "</small></div><em>" +
          item.dist +
          "</em></button>"
        );
      })
      .join("");
  }

  function chooseMode(pool, fromZone) {
    const zones = new Set(pool.map((s) => s.zone));
    zones.add(fromZone);
    const hasFar = zones.has("far");
    const hasMountain = pool.some((s) => s.id === "spot-cangshan");
    if (hasFar || zones.size >= 3 || hasMountain) {
      return { mode: "car", why: "这几处隔得开，按包车排，少把白天耗在换乘上。" };
    }
    const lakeside = [...zones].every((z) => z === "east" || z === "west");
    if (lakeside) {
      return { mode: "bike", why: "都在湖边，按骑行排，停下来的时间比赶路多。" };
    }
    return { mode: "bus", why: "距离不远，按公交排就够，不必包车。" };
  }

  function planTrip() {
    const out = document.getElementById("trip-result");
    if (!trip.length) {
      out.innerHTML = '<p class="trip-empty">先加入至少一个景点。</p>';
      return;
    }
    const from = placeById(planPref.placeId);
    let pool = trip.map((id) => catalog[id] && Object.assign({ id: id }, catalog[id])).filter(Boolean);
    const picked = chooseMode(pool, from.zone);
    const mode = picked.mode;
    const dayCap = 8.5;
    if (pool.some((s) => s.id === "spot-shuanglang") && pool.some((s) => s.id === "spot-bridge")) {
      pool = pool.map((s) => (s.id === "spot-bridge" ? Object.assign({}, s, { hours: 0.4, glue: "spot-shuanglang" }) : s));
    }
    const days = [];
    let cursorZone = from.zone;
    let guard = 0;
    while (pool.length && days.length < planPref.days && guard < 40) {
      guard += 1;
      const slots = [];
      let used = 0;
      let zone = cursorZone;
      let clockH = 9;
      const remain = pool.slice().sort((a, b) => travelHours(zone, a.zone, mode) - travelHours(zone, b.zone, mode));
      remain.forEach((spot) => {
        if (!pool.includes(spot)) return;
        const ride = travelHours(zone, spot.zone, mode);
        if (used + ride + spot.hours > dayCap + 0.2) return;
        slots.push({ kind: "ride", text: "前往 " + spot.name, hours: ride, at: clockH });
        clockH += ride;
        slots.push({ kind: "stay", name: spot.name, where: spot.where, hours: spot.hours, at: clockH });
        clockH += spot.hours;
        used += ride + spot.hours;
        zone = spot.zone;
        pool = pool.filter((s) => s !== spot);
        if (spot.id === "spot-shuanglang") {
          const bridge = pool.find((s) => s.glue === "spot-shuanglang");
          if (bridge && used + 0.2 + bridge.hours <= dayCap + 0.2) {
            slots.push({ kind: "ride", text: "沿湖走到拱桥", hours: 0.2, at: clockH });
            clockH += 0.2;
            slots.push({ kind: "stay", name: bridge.name, where: bridge.where, hours: bridge.hours, at: clockH });
            clockH += bridge.hours;
            used += 0.2 + bridge.hours;
            pool = pool.filter((s) => s !== bridge);
          }
        }
      });
      if (!slots.length) break;
      cursorZone = zone;
      days.push(slots);
    }
    let html = '<p class="plan-note">' + picked.why + "</p>";
    html += days
      .map((slots, i) => {
        const day = shiftDate(planPref.y, planPref.m, planPref.d, i);
        const rows = slots
          .map((slot) => {
            if (slot.kind === "ride") {
              return '<div class="plan-slot"><i>' + clock(slot.at) + "</i><div>" + slot.text + "<span>约 " + slot.hours + " 小时 · " + modeName[mode] + "</span></div></div>";
            }
            return '<div class="plan-slot"><i>' + clock(slot.at) + "</i><div><b>" + slot.name + "</b><span>" + slot.where + " · 停留 " + slot.hours + " 小时</span></div></div>";
          })
          .join("");
        const fromText = i === 0 ? from.name : "昨晚住的地方";
        return '<section class="plan-day"><b>' + day.m + "月" + day.d + "日 · 从" + fromText + "出发</b>" + rows + "</section>";
      })
      .join("");
    if (pool.length) {
      html += '<p class="plan-left">这几天排不下：' + pool.map((s) => s.name).join("、") + "。可以把可用时间往后拖，或先拿掉最远的一处。</p>";
    } else {
      html += '<p class="plan-left">已按出发地和可用时间排完。交通方式由行程自己决定。这是原型里的规则排程，不是在线模型。</p>';
    }
    out.innerHTML = html;
    out.scrollIntoView({ block: "nearest" });
  }

  const cultCat = {
    "culture-dye": { name: "扎染", where: "喜洲、周城", hours: "1 小时", place: "喜洲" },
    "culture-wamao": { name: "瓦猫", where: "喜洲、古城屋脊", hours: "路过", place: "喜洲" },
    "culture-house": { name: "白族民居", where: "喜洲严家大院", hours: "2 小时", place: "喜洲" },
    "culture-tea": { name: "三道茶", where: "喜洲、古城茶馆", hours: "40 分钟", place: "古城" },
    "culture-fire": { name: "火把节", where: "古城、喜洲", hours: "晚上", place: "古城" },
    "culture-tower": { name: "古城楼阁", where: "大理古城", hours: "路过", place: "古城" },
  };
  const cult = [];

  function syncCult() {
    const fab = document.getElementById("cult-fab");
    const count = document.getElementById("cult-count");
    const box = document.getElementById("cult-picks");
    if (count) count.textContent = String(cult.length);
    if (fab) fab.hidden = cult.length === 0;
    document.querySelectorAll("[data-cult-add]").forEach((btn) => {
      const on = cult.includes(btn.getAttribute("data-cult-add"));
      if (btn.classList.contains("cult-add")) {
        btn.classList.toggle("on", on);
        btn.textContent = on ? "✓" : "+";
        btn.setAttribute("aria-label", on ? "从体验单移除" : "加入体验单");
      } else {
        btn.textContent = on ? "已加入体验 · 再点取消" : "加入体验";
      }
    });
    if (!box) return;
    if (!cult.length) {
      box.innerHTML = '<p class="trip-empty">还没有体验。在文化列表里点 + 。</p>';
      return;
    }
    box.innerHTML = cult
      .map((id) => {
        const item = cultCat[id];
        return (
          '<div class="trip-pick"><div><b>' +
          item.name +
          "</b><span>" +
          item.where +
          " · " +
          item.hours +
          '</span></div><button type="button" data-cult-remove="' +
          id +
          '">移除</button></div>'
        );
      })
      .join("");
  }

  function planCult() {
    const out = document.getElementById("cult-result");
    if (!cult.length) {
      out.innerHTML = '<p class="trip-empty">先加入至少一项体验。</p>';
      return;
    }
    const groups = {};
    cult.forEach((id) => {
      const item = cultCat[id];
      if (!item) return;
      if (!groups[item.place]) groups[item.place] = [];
      groups[item.place].push(item);
    });
    const order = ["喜洲", "古城", "周城"];
    const names = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));
    let html = '<p class="plan-note">同一地点的体验放在一起，少来回折返。</p>';
    html += names
      .map((place) => {
        const rows = groups[place]
          .map((item) => '<div class="plan-slot"><i>' + item.hours + "</i><div><b>" + item.name + "</b><span>" + item.where + "</span></div></div>")
          .join("");
        return '<section class="plan-day"><b>' + place + "</b>" + rows + "</section>";
      })
      .join("");
    out.innerHTML = html;
  }

  /* ---- 全局点击分发 ---- */
  document.body.addEventListener("click", (e) => {
    const cultAdd = e.target.closest("[data-cult-add]");
    if (cultAdd) {
      const id = cultAdd.getAttribute("data-cult-add");
      const at = cult.indexOf(id);
      if (at >= 0) {
        cult.splice(at, 1);
        showToast("已从体验单移除");
        document.getElementById("cult-result").innerHTML = "";
      } else {
        cult.push(id);
        showToast("已加入体验单");
      }
      syncCult();
      return;
    }
    const cultRemove = e.target.closest("[data-cult-remove]");
    if (cultRemove) {
      const at = cult.indexOf(cultRemove.getAttribute("data-cult-remove"));
      if (at >= 0) cult.splice(at, 1);
      syncCult();
      document.getElementById("cult-result").innerHTML = "";
      return;
    }
    if (e.target.closest("#cult-fab")) {
      openCult(true);
      return;
    }
    if (e.target.closest("#cult-close") || e.target.id === "cult-mask") {
      openCult(false);
      return;
    }
    if (e.target.closest("#cult-plan")) {
      planCult();
      return;
    }
    const unfav = e.target.closest("[data-unfav]");
    if (unfav) {
      toggleFav(unfav.getAttribute("data-unfav"));
      if (!saved.size && document.getElementById("fav-list").classList.contains("active")) go("empty", true);
      return;
    }
    const add = e.target.closest("[data-add]");
    if (add) {
      const id = add.getAttribute("data-add");
      const at = trip.indexOf(id);
      if (at >= 0) {
        trip.splice(at, 1);
        showToast("已从行程移除");
      } else {
        trip.push(id);
        showToast("已加入行程");
      }
      syncTrip();
      document.getElementById("trip-result").innerHTML = "";
      return;
    }
    const remove = e.target.closest("[data-remove]");
    if (remove) {
      const id = remove.getAttribute("data-remove");
      const at = trip.indexOf(id);
      if (at >= 0) trip.splice(at, 1);
      syncTrip();
      document.getElementById("trip-result").innerHTML = "";
      return;
    }
    if (e.target.closest("#trip-fab")) {
      openTrip(true);
      return;
    }
    if (e.target.closest("#trip-close") || e.target.id === "trip-mask") {
      openTrip(false);
      return;
    }
    if (e.target.closest("#trip-open-date")) {
      calCursor = { y: planPref.y, m: planPref.m };
      showTripView("cal");
      return;
    }
    if (e.target.closest("#trip-open-loc")) {
      showTripView("loc");
      return;
    }
    if (e.target.closest("[data-trip-back]")) {
      showTripView("main");
      return;
    }
    if (e.target.closest("#cal-prev")) {
      shiftCal(-1);
      return;
    }
    if (e.target.closest("#cal-next")) {
      shiftCal(1);
      return;
    }
    const dayBtn = e.target.closest("[data-day]");
    if (dayBtn && !dayBtn.disabled) {
      planPref.y = calCursor.y;
      planPref.m = calCursor.m;
      planPref.d = Number(dayBtn.getAttribute("data-day"));
      paintPrefs();
      document.getElementById("trip-result").innerHTML = "";
      showTripView("main");
      return;
    }
    const placeBtn = e.target.closest("[data-place]");
    if (placeBtn) {
      planPref.placeId = placeBtn.getAttribute("data-place");
      paintPrefs();
      document.getElementById("trip-result").innerHTML = "";
      showTripView("main");
      return;
    }
    if (e.target.closest("#trip-plan")) {
      planTrip();
      return;
    }
    const zoneCard = e.target.closest("[data-zone-go]");
    if (zoneCard) {
      setZoneFilter(zoneCard.getAttribute("data-zone-go"), true);
      return;
    }
    if (e.target.closest("#zone-clear")) {
      zoneFilter = "";
      applyFilters("spots");
      return;
    }
    if (e.target.closest("#zone-all")) {
      zoneFilter = "";
      applyFilters("spots");
      document.getElementById("spot-list").scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (e.target.closest(".share-btn")) {
      const link = location.href.split("#")[0] + "#" + (document.querySelector(".screen.active") || {}).id;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(link)
          .then(() => showToast("链接已复制，发给朋友就能打开"))
          .catch(() => showToast("把这个页面的链接发给朋友即可"));
      } else {
        showToast("把这个页面的链接发给朋友即可");
      }
      return;
    }
    const backBtn = e.target.closest("[data-back]");
    if (backBtn) {
      back(backBtn.getAttribute("data-back"));
      return;
    }
    const goBtn = e.target.closest("[data-go]");
    if (goBtn && !goBtn.classList.contains("fav-btn") && !goBtn.classList.contains("add-fav")) {
      go(goBtn.getAttribute("data-go"));
      return;
    }
    const fav = e.target.closest(".fav-btn, .add-fav");
    if (fav) toggleFav(fav.getAttribute("data-fav"));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!document.getElementById("cult-sheet").hidden) openCult(false);
    else if (!document.getElementById("trip-sheet").hidden) openTrip(false);
  });

  document.getElementById("open-fav-list")?.addEventListener("click", () => {
    go(saved.size ? "fav-list" : "empty");
  });

  document.querySelectorAll(".tags[data-filter]").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-tag]");
      if (!btn) return;
      group.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      const scope = group.getAttribute("data-filter");
      activeTag[scope] = btn.getAttribute("data-tag");
      applyFilters(scope);
      /* 嵌入式 AI 入口的文案跟着筛选走 —— 用户选了什么，它就说从什么里挑 */
      if (typeof inlineHint === "function") inlineHint(scope);
    });
  });

  const input = document.getElementById("search-input");
  input?.addEventListener("input", toggleSearchEmpty);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      input.value = "";
      toggleSearchEmpty();
    }
  });

  const nav = document.getElementById("screen-nav");
  document.querySelectorAll(".screen[data-name]").forEach((el) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = el.getAttribute("data-name");
    b.setAttribute("data-go", el.id);
    nav.appendChild(b);
  });

  if (new URLSearchParams(location.search).has("shot")) {
    document.documentElement.classList.add("shot");
    document.body.classList.add("shot");
  }

  document.getElementById("trip-days").addEventListener("input", (e) => {
    planPref.days = Number(e.target.value);
    paintPrefs();
    document.getElementById("trip-result").innerHTML = "";
  });
  document.getElementById("loc-q").addEventListener("input", () => renderLoc());

  /* ============================================================
     问问 · 行程顾问
     界面覆盖通用 AI 产品的六个状态：空态 / 输入 / 思考 / 流式 /
     结构化结果 / 溯源引用。回答由本地知识条目拼装，
     不外呼模型 —— 与页面底部的说明保持一致。
     ============================================================ */
  const aiStream = document.getElementById("ai-stream");
  const aiEmpty = document.getElementById("ai-empty");
  const aiInput = document.getElementById("ai-input");
  const aiSend = document.getElementById("ai-send");
  let aiBusy = false;
  let lastPicks = [];   /* 最近一轮带进 AI 的景点上下文（keys），供「采纳」复写回行程 */

  /* 知识条目：每条都有可跳转的落点，供结果卡与溯源引用复用 */
  const KB = {
    erhai: { name: "洱海", screen: "spot-erhai", hours: "3–4 小时", where: "东岸 · 才村一带" },
    xizhou: { name: "喜洲古镇", screen: "spot-xizhou", hours: "3 小时", where: "城北 18 km" },
    shuanglang: { name: "双廊", screen: "spot-shuanglang", hours: "2.5 小时", where: "东岸北段 42 km" },
    cangshan: { name: "苍山", screen: "spot-cangshan", hours: "4–5 小时", where: "城西" },
    pagoda: { name: "崇圣寺三塔", screen: "spot-pagoda", hours: "1.5 小时", where: "城西北" },
    bridge: { name: "湖上拱桥", screen: "spot-bridge", hours: "半小时", where: "双廊岸边" },
    dye: { name: "扎染", screen: "culture-dye", hours: "1 小时", where: "喜洲 · 周城" },
    wamao: { name: "瓦猫", screen: "culture-wamao", hours: "路过看", where: "屋脊上" },
    house: { name: "白族民居", screen: "culture-house", hours: "1.5 小时", where: "喜洲严家大院" },
    tea: { name: "三道茶", screen: "culture-tea", hours: "40 分钟", where: "古城茶馆" },
  };

  /* 意图识别：按关键词命中，命中越多权重越高；
     没命中就走通用兜底，绝不给一个空回答 */
  const INTENTS = [
    {
      id: "one-day-lake-dye",
      keys: ["一天半", "一天", "想看湖", "摸", "布", "扎染", "古城"],
      need: 3,
      lead: "一天半够走一条不折返的线。第一天沿湖，第二天把扎染收掉。",
      mode: "包车 + 步行",
      days: [
        { label: "第一天 · 从古城出发", items: [
          { k: "erhai", note: "到才村看水色，沿廊道走三四公里就回" },
          { k: "pagoda", note: "回城顺路，一小时出头" },
        ]},
        { label: "第二天 · 半天往北", items: [
          { k: "xizhou", note: "先看严家大院，再进扎染作坊" },
          { k: "dye", note: "一小时能亲手染一块方巾带走" },
        ]},
      ],
      tips: ["扎染要提前问作坊当天开不开", "喜洲回古城的车傍晚就没那么密了"],
    },
    {
      id: "parents",
      keys: ["爸妈", "父母", "老人", "走不动", "小孩", "孩", "带"],
      need: 1,
      lead: "把步子放慢，一天只安排一到处，中间留够坐下来的时间。",
      mode: "包车",
      days: [
        { label: "第一天 · 只走湖", items: [
          { k: "erhai", note: "车停才村，湖边平路，想停就停" },
          { k: "tea", note: "回古城喝茶，三道茶坐得住" },
        ]},
        { label: "第二天 · 平地收尾", items: [
          { k: "xizhou", note: "古镇是平地，慢慢逛不累" },
          { k: "house", note: "院子里有座位，可以歇够再走" },
        ]},
      ],
      tips: ["苍山和双廊路程远，这次先不去", "把包车师傅电话提前存好"],
    },
    {
      id: "first-time",
      keys: ["第一次", "第一次来", "半天", "只有半天", "最值得", "必去"],
      need: 1,
      lead: "只有半天就别贪。一处湖、一条老街，印象最牢。",
      mode: "公交 + 步行",
      days: [
        { label: "半天", items: [
          { k: "erhai", note: "才村看湖，两小时够" },
          { k: "wamao", note: "回古城路上抬头找屋脊上的瓦猫" },
        ]},
      ],
      tips: ["留半小时在古城走一圈，收尾比赶点舒服"],
    },
    {
      id: "rain",
      keys: ["下雨", "雨天", "天气不好", "阴天"],
      need: 1,
      lead: "下雨天就把户外的换成屋里的，反而更看得进去。",
      mode: "步行",
      days: [
        { label: "雨天一天", items: [
          { k: "dye", note: "作坊有顶，越是潮气重越出颜色" },
          { k: "house", note: "院子走廊长，避雨看雕花刚好" },
          { k: "tea", note: "最后烤火喝茶，等雨停" },
        ]},
      ],
      tips: ["雨后苍山云最好看，值得抬头看一眼"],
    },
  ];

  function matchIntent(text) {
    let best = null;
    let bestScore = 0;
    INTENTS.forEach((it) => {
      const score = it.keys.reduce((n, k) => (text.includes(k) ? n + 1 : n), 0);
      if (score >= it.need && score > bestScore) {
        best = it;
        bestScore = score;
      }
    });
    return best;
  }

  function bubble(role, html) {
    const el = document.createElement("div");
    el.className = "ai-msg " + role;
    el.innerHTML = html;
    return el;
  }

  function renderAnswer(intent) {
    const citeSet = new Set();
    const daysHtml = intent.days
      .map((d) => {
        const rows = d.items
          .map((it) => {
            const p = KB[it.k];
            citeSet.add(it.k);
            return (
              '<li class="ai-stop"><button type="button" data-go="' + p.screen + '">' +
              "<b>" + p.name + "</b><em>" + p.hours + "</em>" +
              "<span>" + it.note + "</span>" +
              "</button></li>"
            );
          })
          .join("");
        return '<section class="ai-day"><header>' + d.label + "<i>" + intent.mode + "</i></header><ul>" + rows + "</ul></section>";
      })
      .join("");
    const tipsHtml = intent.tips.map((t) => "<li>" + t + "</li>").join("");
    const citeHtml = [...citeSet]
      .map((k) => {
        const p = KB[k];
        return '<button type="button" data-go="' + p.screen + '"><b>' + p.name + "</b><span>" + p.where + "</span></button>";
      })
      .join("");
    return (
      '<p class="ai-lead">' + intent.lead + "</p>" +
      daysHtml +
      '<aside class="ai-tips"><b>临场提醒</b><ul>' + tipsHtml + "</ul></aside>" +
      '<div class="ai-cites"><span class="ai-cites-label">依据</span><div class="ai-cites-row">' + citeHtml + "</div></div>" +
      '<div class="ai-actions">' +
        '<button class="ai-act-primary" type="button" data-ai-adopt="' + intent.id + '">把这些放进我的行程</button>' +
        '<button class="ai-act-ghost" type="button" data-ask="换个排法：少走路，多点坐下来的时间">换个排法</button>' +
      "</div>"
    );
  }

  function renderFallback() {
    const cites = ["erhai", "xizhou", "dye"]
      .map((k) => {
        const p = KB[k];
        return '<button type="button" data-go="' + p.screen + '"><b>' + p.name + "</b><span>" + p.where + "</span></button>";
      })
      .join("");
    return (
      '<p class="ai-lead">这次没听懂太细的偏好，先按最常见的排法给个底子。你可以补充天数、同行的人、住哪，我再收一收。</p>' +
      '<section class="ai-day"><header>一天 · 从古城出发<i>包车 + 步行</i></header><ul>' +
        '<li class="ai-stop"><button type="button" data-go="spot-erhai"><b>洱海</b><em>3–4 小时</em><span>才村看水色，廊道走一段</span></button></li>' +
        '<li class="ai-stop"><button type="button" data-go="spot-xizhou"><b>喜洲古镇</b><em>3 小时</em><span>看严家大院，进扎染作坊</span></button></li>' +
        '<li class="ai-stop"><button type="button" data-go="culture-dye"><b>扎染</b><em>1 小时</em><span>亲手染一块带走</span></button></li>' +
      "</ul></section>" +
      '<div class="ai-cites"><span class="ai-cites-label">依据</span><div class="ai-cites-row">' + cites + "</div></div>" +
      '<div class="ai-actions"><button class="ai-act-primary" type="button" data-ai-adopt="fallback">把这些放进我的行程</button></div>'
    );
  }

  /* 从别处带着已选景点进来时：不再追问偏好，直接照这些排。
     用户已经用「加号」表达过取舍，这里要尊重那个取舍 —— 不重新挑一遍。 */
  const SCREEN_TO_K = {
    "spot-erhai": "erhai", "spot-xizhou": "xizhou", "spot-shuanglang": "shuanglang",
    "spot-cangshan": "cangshan", "spot-pagoda": "pagoda", "spot-bridge": "bridge",
    "culture-dye": "dye", "culture-wamao": "wamao", "culture-house": "house", "culture-tea": "tea",
  };
  /* 缓步优先级：先把耗时的、离城远的排掉，再补城内短点 */
  const WEIGHT = { cangshan: 5, shuanglang: 4, erhai: 3, xizhou: 3, bridge: 2, house: 2, dye: 1, pagoda: 1, tea: 1, wamao: 0 };
  const DAY_CAP = 8.5;

  function renderPicks(keys, from) {
    const list = keys.filter((k) => KB[k]);
    if (!list.length) return renderFallback();
    const ordered = list.slice().sort((a, b) => WEIGHT[b] - WEIGHT[a]);

    /* 「3–4 小时」取区间中值；「半小时」= 0.5；「路过看」= 0。
       直接抽数字会把「3–4」读成 34，必须按小时文案逐条解。 */
    const HOUR_FIX = { "半小时": 0.5, "路过看": 0 };
    function hoursOf(h) {
      const s = String(h);
      if (s in HOUR_FIX) return HOUR_FIX[s];
      const nums = s.match(/\d+(?:\.\d+)?/g);
      if (!nums || !nums.length) return 1.5;
      if (nums.length === 1) return parseFloat(nums[0]);
      return (parseFloat(nums[0]) + parseFloat(nums[1])) / 2;   /* 区间取中值 */
    }

    /* 按天装桶：一天最多 8.5 小时，不折返靠「先重后轻」近似 */
    const days = [];
    let cur = { items: [], load: 0 };
    ordered.forEach((k) => {
      const h = hoursOf(KB[k].hours);
      if (cur.load + h > DAY_CAP && cur.items.length) { days.push(cur); cur = { items: [], load: 0 }; }
      cur.items.push({ k: k, note: "按你选进来的顺序排" });
      cur.load += h;
    });
    if (cur.items.length) days.push(cur);

    /* 桶空 → 说明用户只选了零星几个；用最近的一处补齐半天 */
    const dayNames = ["第一天", "第二天", "第三天", "第四天", "第五天"];
    const daysHtml = days.map((d, i) => {
      const label = (dayNames[i] || "第 " + (i + 1) + " 天") + " · 共 " + d.items.length + " 处";
      const rows = d.items.map((it) => {
        const p = KB[it.k];
        return '<li class="ai-stop"><button type="button" data-go="' + p.screen + '">' +
          "<b>" + p.name + "</b><em>" + p.hours + "</em><span>" + p.where + "</span></button></li>";
      }).join("");
      return '<section class="ai-day"><header>' + label + "<i>包车 + 步行</i></header><ul>" + rows + "</ul></section>";
    }).join("");

    const citeHtml = ordered.map((k) => {
      const p = KB[k];
      return '<button type="button" data-go="' + p.screen + '"><b>' + p.name + "</b><span>" + p.where + "</span></button>";
    }).join("");

    const src = from === "trip" ? "你放进行程的那几处" : "你刚筛出来的那几处";
    return (
      '<p class="ai-lead">照 ' + src + "排，一共 " + list.length + " 处，分成 " + days.length + " 天走完。重的先排，轻的垫在半天里，尽量不来回跑。</p>" +
      daysHtml +
      '<aside class="ai-tips"><b>临场提醒</b><ul>' +
        "<li>远点之间建议包车，城内短点步行就能接上</li>" +
        (list.includes("dye") ? "<li>扎染要提前问作坊当天开不开</li>" : "<li>出发前一天再确认一次各点开放时间</li>") +
      "</ul></aside>" +
      '<div class="ai-cites"><span class="ai-cites-label">依据</span><div class="ai-cites-row">' + citeHtml + "</div></div>" +
      '<div class="ai-actions">' +
        '<button class="ai-act-primary" type="button" data-ai-adopt="picks">把这些放进我的行程</button>' +
        '<button class="ai-act-ghost" type="button" data-ask="换个排法：少走路，多点坐下来的时间">换个排法</button>' +
      "</div>"
    );
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function streamInto(el, html, done) {
    if (reduceMotion) {
      el.innerHTML = html;
      el.classList.add("settled");
      if (done) done();
      return;
    }
    const holder = document.createElement("div");
    holder.className = "ai-stream-holder";
    el.appendChild(holder);
    const blocks = html.split(/(?=<(?:p|section|aside|div)\b)/).filter((s) => s.trim());
    let i = 0;
    const step = () => {
      if (i >= blocks.length) {
        el.classList.add("settled");
        if (done) done();
        return;
      }
      const frag = document.createElement("div");
      frag.className = "ai-block-in";
      frag.innerHTML = blocks[i];
      holder.appendChild(frag);
      requestAnimationFrame(() => frag.classList.add("in"));
      i += 1;
      setTimeout(step, 150);
    };
    step();
  }

  function ask(text, ctx) {
    if (!text || aiBusy) return;
    aiBusy = true;
    if (aiEmpty && aiEmpty.parentNode) aiEmpty.remove();

    aiStream.appendChild(bubble("me", "<p>" + String(text).replace(/[<>]/g, "") + "</p>"));

    /* 思考态：呼吸点 + 骨架卡。骨架卡预示「结果是分段的」，
       比转圈更能告诉用户接下来会出现什么形状的答案。 */
    const thinking = bubble("ai", '<div class="ai-thinking"><i></i><i></i><i></i><span>正在排路线</span></div>' +
      '<div class="ai-skel"><span></span><span></span><span style="width:62%"></span></div>');
    aiStream.appendChild(thinking);
    aiStream.scrollTop = aiStream.scrollHeight;

    /* 上下文优先：带进来的已选景点 > 关键词意图 > 通用兜底 */
    const picks = ctx && Array.isArray(ctx.picks) ? ctx.picks.filter((k) => KB[k]) : [];
    const intent = picks.length ? null : matchIntent(text);
    const delay = 780 + Math.random() * 420;

    setTimeout(() => {
      thinking.remove();
      const answer = bubble("ai", "");
      aiStream.appendChild(answer);
      const html = picks.length
        ? renderPicks(picks, ctx.from)
        : intent ? renderAnswer(intent) : renderFallback();
      streamInto(answer, html, () => {
        aiBusy = false;
        aiStream.scrollTop = aiStream.scrollHeight;
      });
      aiStream.scrollTop = aiStream.scrollHeight;
    }, delay);
  }

  function syncComposer() {
    if (!aiInput || !aiSend) return;
    aiInput.style.height = "auto";
    aiInput.style.height = Math.min(aiInput.scrollHeight, 108) + "px";
    aiSend.disabled = !aiInput.value.trim() || aiBusy;
  }
  aiInput?.addEventListener("input", syncComposer);
  aiInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!aiSend.disabled) { ask(aiInput.value.trim()); aiInput.value = ""; syncComposer(); }
    }
  });
  aiSend?.addEventListener("click", () => {
    if (!aiInput.value.trim()) return;
    ask(aiInput.value.trim());
    aiInput.value = "";
    syncComposer();
  });
  syncComposer();

  function clearAi() {
    if (!aiStream) return;
    aiStream.innerHTML = "";
    aiStream.appendChild(aiEmpty);
    aiEmpty.hidden = false;
    aiBusy = false;
    lastPicks = [];   /* 清空也清上下文，避免下一轮误用上一次带进来的 picks */
    syncComposer();
  }
  document.getElementById("ai-clear")?.addEventListener("click", clearAi);

  function showTripFabPulse() {
    const fab = document.getElementById("trip-fab");
    if (!fab || fab.hidden) return;
    fab.classList.add("pulse");
    setTimeout(() => fab.classList.remove("pulse"), 1600);
  }

  /* 采纳方案 → 真的把景点写进行程，与行程浮层共用同一份数据 */
  document.addEventListener("click", (e) => {
    const adopt = e.target.closest("[data-ai-adopt]");
    if (!adopt) return;
    const kind = adopt.getAttribute("data-ai-adopt");
    let ids;
    if (kind === "picks") {
      ids = lastPicks.map((k) => KB[k] && KB[k].screen).filter(Boolean);
    } else if (kind === "fallback") {
      ids = ["spot-erhai", "spot-xizhou"];
    } else {
      ids = ["spot-erhai", "spot-pagoda", "spot-xizhou"];
    }
    ids.forEach((id) => { if (!trip.includes(id)) trip.push(id); });
    syncTrip();
    document.getElementById("trip-result").innerHTML = "";
    showToast("已放进「想去」，去行程里看");
    showTripFabPulse();
  });

  /* 快捷问题：空态与「换个排法」共用同一个委托 */
  document.addEventListener("click", (e) => {
    const q = e.target.closest("[data-ask]");
    if (!q) return;
    ask(q.getAttribute("data-ask"));
  });

  /* ------------------------------------------------------------
     嵌入式 AI 入口：列表页 / 行程浮层里的「让 AI 帮我挑」
     原则：AI 不另起一套上下文，而是接管用户眼前已经做过的那次筛选。
     用户点了「湖岸」，AI 就从湖岸里挑；用户自己加了 3 个点，
     AI 就照这 3 个排 —— 不重新问一遍偏好。
     ------------------------------------------------------------ */
  const FILTER_TEXT = {
    "湖岸": "湖边这几处", "半日": "半天能走完的", "古镇": "古镇这几处", "第一次": "第一次来值得的",
    "工艺": "手上有活的这几样", "民俗": "民俗这几样", "饮食": "吃的这几样", "all": "这一页",
  };
  const TAG_PICKS = {
    "湖岸": ["erhai", "shuanglang", "bridge"],
    "半日": ["erhai", "pagoda", "bridge"],
    "古镇": ["xizhou", "house"],
    "第一次": ["erhai", "pagoda", "wamao"],
    "工艺": ["dye", "wamao"],
    "民俗": ["wamao", "house", "tea"],
    "饮食": ["tea"],
    "all": ["erhai", "xizhou", "dye"],
  };

  /* 当前生效的筛选 tag（复用上方 applyFilters 用的同一份 activeTag，
     这里只负责把它读出来变成一句人话，不再另起一份状态） */

  function inlineHint(scope) {
    const bar = document.querySelector('.ai-inline[data-ai-inline="' + scope + '"]');
    if (!bar) return;
    const tag = activeTag[scope] || "all";
    const label = bar.querySelector("span");
    if (label) label.textContent = "让 AI 从" + (FILTER_TEXT[tag] || "这一页里的") + "里挑一条能走完的线";
  }
  inlineHint("spots");
  inlineHint("culture");

  /* 嵌入式入口：跳 AI 页 + 带着上下文提问 */
  document.addEventListener("click", (e) => {
    const entry = e.target.closest("[data-ai-inline]");
    if (!entry) return;
    const scope = entry.getAttribute("data-ai-inline");

    if (scope === "trip") {
      /* 行程浮层：用用户自己收进来的点 */
      const picks = trip.map((id) => SCREEN_TO_K[id]).filter(Boolean);
      lastPicks = picks;
      openTrip(false);
      go("ai");
      ask(picks.length ? "照我收进来的这几处排一下" : "还没有加入行程的景点，先给我一条一天半的线", { picks: picks, from: "trip" });
      return;
    }
    const tag = activeTag[scope] || "all";
    const picks = TAG_PICKS[tag] || TAG_PICKS.all;
    lastPicks = picks;
    go("ai");
    ask("从「" + (tag === "all" ? "全部" : tag) + "」里挑一条能走完的线", { picks: picks, from: "list" });
  });

  /* 清空时把上下文也清掉，避免下一轮误用上一次的 picks */

  refreshFavUI();
  syncTrip();
  syncCult();
  paintPrefs();
  renderCal();
  renderRecent();
  applyFilters("spots");
  applyFilters("culture");
  const start = location.hash.slice(1);
  go(document.getElementById(start) ? start : "splash");
})();
