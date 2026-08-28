/* global document, location, performance, requestAnimationFrame, sessionStorage, window */
const focusKey = "handoff:focus-route";
document.addEventListener("click", (event) => {
  const link = event.target.closest?.("a[href]");
  if (!link || link.origin !== location.origin || link.hash) return;
  sessionStorage.setItem(focusKey, "1");
});
window.addEventListener("pageshow", (event) => {
  const navigation = performance.getEntriesByType("navigation")[0];
  if (
    sessionStorage.getItem(focusKey) !== "1" &&
    !event.persisted &&
    navigation?.type !== "back_forward"
  )
    return;
  sessionStorage.removeItem(focusKey);
  requestAnimationFrame(() => {
    const heading = document.querySelector("h1");
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const status = document.querySelector("#route-status");
    if (status) status.textContent = document.title;
  });
});
