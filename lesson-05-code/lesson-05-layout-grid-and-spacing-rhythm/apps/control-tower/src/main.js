// Control Tower entry. Lesson 5 puts the board on the 12-column grid and adds
// the spacing overlay (toggle in the top bar) and the Spacing panel.
import { browserThemeController, createSpacingOverlay, mountSpacingToggle, mountThemeSwitcher } from "@pulse/design-system";
import { $ } from "./lib/dom.js";
import { onLive } from "./lib/live.js";
import { mountBuildBoard } from "./panels/build-board.js";
import { mountContrastAudit } from "./panels/contrast-audit.js";
import { mountOwnershipGraph } from "./panels/ownership-graph.js";
import { mountSpacingPanel } from "./panels/spacing-scale.js";
import { mountTypeScale } from "./panels/type-scale.js";

const theme = browserThemeController();
mountThemeSwitcher($("[data-theme-slot]"), theme);

const overlay = createSpacingOverlay();
mountSpacingToggle($("[data-overlay-slot]"), overlay);

/** @param {string} name */
const panel = (name) => $(`[data-panel="${name}"]`);
const [, , , contrast] = await Promise.all([
  mountSpacingPanel(panel("spacing"), overlay),
  mountBuildBoard(panel("build")),
  mountOwnershipGraph(panel("owners")),
  mountContrastAudit(panel("contrast")),
  mountTypeScale(panel("type-scale")),
]);

// A token file changed: the server regenerated the CSS and re-ran the contrast
// gate. Reload the generated sheets in place, then re-measure.
onLive("tokens", async (gate) => {
  const links = /** @type {HTMLLinkElement[]} */ ([...document.querySelectorAll("link[data-token-sheet]")]);
  await Promise.all(
    links.map(
      (link) =>
        new Promise((done) => {
          link.addEventListener("load", done, { once: true });
          link.href = `${link.href.split("?")[0]}?v=${Date.now()}`;
        }),
    ),
  );
  contrast.refresh(gate);
  overlay.refresh();
});

overlay.refresh();
document.body.dataset.ready = "true";
