/* Contextual interactions use existing course content; no learning records are changed. */
(function () {
  const stage = document.getElementById("km-stage");
  if (stage) {
    const topics = [...stage.querySelectorAll(".km-topic")];
    const entries = topics.map(link => {
      const url = new URL(link.href);
      const c = +url.searchParams.get("c"), l = +url.searchParams.get("l");
      return {link, c, l, id: c + "-" + l, lesson: Common.findLesson(c,l).ls};
    });
    const pairs = [["1-3","4-2"], ["3-2","5-3"]];
    const preview = document.createElement("section");
    preview.className = "km-preview";
    preview.setAttribute("aria-label", Common.L("概念速览", "Concept quick view"));
    preview.innerHTML = '<div class="km-preview-control"><label for="km-preview-select">' + Common.L("概念速览", "Concept quick view") + '</label><select id="km-preview-select">' + entries.map(e => '<option value="' + e.id + '">' + e.c + '.' + e.l + ' ' + window.esc(I18N.lessonObj(e.lesson).title) + '</option>').join('') + '</select><span>' + Common.L("悬停或聚焦节点，也可切换上方选项。", "Hover or focus a node, or switch the selector above.") + '</span></div><div class="km-preview-body"><h3 id="km-preview-title"></h3><p id="km-preview-text"></p><a id="km-preview-link" class="btn btn-soft btn-sm">' + Common.L("进入对应小节 ↗", "Open the lesson ↗") + '</a></div>';
    stage.after(preview);
    const select = preview.querySelector("select");
    function clearHighlights() {
      stage.querySelectorAll(".is-exploring,.is-related").forEach(e => e.classList.remove("is-exploring","is-related"));
      document.querySelectorAll(".km-relation.is-related").forEach(e => e.classList.remove("is-related"));
    }
    function show(entry, highlight) {
      select.value = entry.id;
      preview.querySelector("h3").textContent = entry.c + '.' + entry.l + ' ' + entry.lesson.title;
      preview.querySelector("p").textContent = entry.lesson.keyPoint;
      preview.querySelector("a").href = entry.link.href;
      clearHighlights();
      if (!highlight) return;
      entry.link.classList.add("is-exploring");
      entry.link.closest(".km-cluster").classList.add("is-exploring");
      pairs.forEach((pair,i) => {
        if (!pair.includes(entry.id)) return;
        entries.filter(e => pair.includes(e.id) && e !== entry).forEach(e => {
          e.link.classList.add("is-related");
          e.link.closest(".km-cluster").classList.add("is-related");
        });
        document.querySelectorAll(".km-relation")[i].classList.add("is-related");
      });
    }
    entries.forEach(entry => {
      entry.link.addEventListener("pointerenter", event => { if (event.pointerType !== "touch") show(entry,true); });
      entry.link.addEventListener("focus", () => show(entry,true));
    });
    stage.addEventListener("pointerleave", () => { if (!stage.contains(document.activeElement)) clearHighlights(); });
    stage.addEventListener("focusout", event => { if (!stage.contains(event.relatedTarget)) clearHighlights(); });
    select.addEventListener("change", () => show(entries.find(e => e.id === select.value),true));
    show(entries.find(e => e.link.classList.contains("is-current")) || entries[0],false);
  }

  const main = document.getElementById("learn-main");
  if (main && main.querySelector(".lesson-head")) {
    const headings = [...main.querySelectorAll(":scope > .content-card > h2")];
    const nav = document.createElement("nav");
    nav.className = "lesson-reading-nav";
    nav.setAttribute("aria-label", Common.L("本节内容导航", "Lesson contents navigation"));
    headings.forEach((heading,i) => {
      const section = heading.parentElement;
      if (!section.id) section.id = "lesson-section-" + i;
      section.classList.add("reading-section");
      const link = document.createElement("a");
      link.href = "#" + section.id;
      link.textContent = [...heading.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join("").trim();
      nav.append(link);
    });
    const position = document.createElement("span");
    position.className = "reading-position";
    position.setAttribute("aria-label", Common.L("文章阅读位置，与掌握进度无关", "Reading position; unrelated to mastery progress"));
    nav.append(position);
    main.querySelector(".lesson-head").after(nav);
    const links = [...nav.querySelectorAll("a")];
    const labJump = document.createElement("a");
    labJump.href = "#lab-pane";
    labJump.className = "reading-lab-jump";
    labJump.textContent = Common.L("操作实验 ↓", "Try the lab ↓");
    nav.insertBefore(labJump, position);
    const sections = headings.map(h => h.parentElement);
    let scheduled = false;
    function updatePosition() {
      scheduled = false;
      const stickyTop = parseFloat(getComputedStyle(nav).top);
      main.style.setProperty("--reading-offset", (stickyTop + nav.offsetHeight + 16) + "px");
      const offset = nav.getBoundingClientRect().bottom + 18;
      let index = 0;
      sections.forEach((section,i) => { if (section.getBoundingClientRect().top <= offset) index = i; });
      const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (atEnd && sections[sections.length-1].getBoundingClientRect().bottom <= window.innerHeight) index = sections.length-1;
      links.forEach((link,i) => {
        link.classList.toggle("active", i === index);
        if (i === index) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      const first = sections[0].getBoundingClientRect().top;
      const last = sections[sections.length-1].getBoundingClientRect().bottom;
      const percent = Math.round(Math.max(0,Math.min(1,(offset-first)/Math.max(1,last-first))) * 100);
      position.textContent = Common.L("阅读位置 ", "Reading position ") + (atEnd ? 100 : percent) + "%";
    }
    function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(updatePosition); } }
    window.addEventListener("scroll",schedule,{passive:true});
    window.addEventListener("resize",schedule);
    new ResizeObserver(schedule).observe(main);
    updatePosition();
  }
})();
