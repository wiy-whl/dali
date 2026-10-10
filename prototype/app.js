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
  const tabs = { home: "home", spots: "spots", culture: "culture", mine: "mine" };
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

  /* ---- 返回栈：详情页返回时回到真正来时的地方 ---- */
  const stack = [];
  function go(id, keepStack) {
    const next = document.getElementById(id);
    if (!next) return;
    const cur = document.querySelector(".screen.active");
    if (!keepStack && cur && cur.id !== id) {
      stack.push(cur.id);
      if (stack.length > 30) stack.shift();
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

  function back(fallback) {
    const prev = stack.pop();
    go(prev || fallback, true);
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
    if (fab) fab.hidden = trip.length === 0;
    document.querySelectorAll(".place-add").forEach((btn) => {
      const on = trip.includes(btn.getAttribute("data-add"));
      btn.classList.toggle("on", on);
      btn.textContent = on ? "✓" : "+";
      btn.setAttribute("aria-label", on ? "从行程移除" : "加入行程");
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
