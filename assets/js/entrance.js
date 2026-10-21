/* Opening is skippable, never changes scroll or learning state, and cleans up for bfcache. */
(function () {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const navigation = performance.getEntriesByType("navigation")[0];
  if (preference.matches || document.body.classList.contains("reduce-motion") ||
      (window.Store && Store.getReduceMotion()) || location.hash || window.scrollY > 100 ||
      (navigation && navigation.type === "back_forward")) return;

  const opening = document.createElement("div");
  opening.className = "cinema-intro";
  opening.innerHTML = '<div class="cinema-shutter cinema-shutter-top" aria-hidden="true"></div><div class="cinema-shutter cinema-shutter-bottom" aria-hidden="true"></div><div class="cinema-seam" aria-hidden="true"></div><button class="cinema-skip" type="button" aria-label="' + Common.L("跳过开场动画", "Skip opening animation") + '">' + Common.L("跳过开场 · Esc", "Skip · Esc") + '</button>';
  document.body.append(opening);
  document.body.classList.add("cinema-enter");
  let timer;
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    document.body.classList.remove("cinema-enter");
    opening.remove();
    document.removeEventListener("keydown", onKey, true);
    document.removeEventListener("focusin", finish);
    document.removeEventListener("pointerdown", finish);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("wheel", finish);
    window.removeEventListener("touchstart", finish);
    window.removeEventListener("pagehide", finish);
    preference.removeEventListener("change", onPreference);
  }
  function onKey(event) { if (event.key === "Escape" || event.key === "Tab") finish(); }
  function onVisibility() { if (document.hidden) finish(); }
  function onPreference() { if (preference.matches) finish(); }
  opening.querySelector("button").addEventListener("click", finish);
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("focusin", finish);
  document.addEventListener("pointerdown", finish);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("wheel", finish, {passive:true});
  window.addEventListener("touchstart", finish, {passive:true});
  window.addEventListener("pagehide", finish);
  preference.addEventListener("change", onPreference);
  if (window.Store) Store.onChange(() => { if (Store.getReduceMotion()) finish(); });
  timer = setTimeout(finish, 1500);
})();
