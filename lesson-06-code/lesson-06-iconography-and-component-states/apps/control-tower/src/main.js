// Control Tower entry. Lesson 6 adds the State gallery and Icons panels, and
// draws every icon on the board from the one hand-built set.
import { browserThemeController, createSpacingOverlay, mountSpacingToggle, mountThemeSwitcher } from "@pulse/design-system";
import { $ } from "./lib/dom.js";
import { onLive } from "./lib/live.js";
import { mountBuildBoard } from "./panels/build-board.js";
import { mountContrastAudit } from "./panels/contrast-audit.js";
import { mountIconSet } from "./panels/icon-set.js";
import { mountOwnershipGraph } from "./panels/ownership-graph.js";
import { mountSpacingPanel } from "./panels/spacing-scale.js";
import { mountStateGallery } from "./panels/state-gallery.js";
import { mountTypeScale } from "./panels/type-scale.js";

const theme = browserThemeController();
mountThemeSwitcher($("[data-theme-slot]"), theme);

const overlay = createSpacingOverlay();
mountSpacingToggle($("[data-overlay-slot]"), overlay);

/** @param {string} name */
const panel = (name) => $(`[data-panel="${name}"]`);
const [gallery, , , , , , contrast] = await Promise.all([
  mountStateGallery(panel("states")),
  mountIconSet(panel("icons")),
  mountSpacingPanel(panel("spacing"), overlay),
  mountBuildBoard(panel("build")),
  mountOwnershipGraph(panel("owners")),
  mountTypeScale(panel("type-scale")),
  mountContrastAudit(panel("contrast")),
]);

// A theme switch changes every role at once: re-check that the five states
// still look different from each other in the new theme.
theme.subscribe(() => requestAnimationFrame(() => gallery.refresh()));

// A token or icon file changed: the server regenerated the CSS and re-ran the
// contrast gate. Reload the generated sheets in place, then re-measure.
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
  gallery.refresh();
  overlay.refresh();
});

overlay.refresh();
document.body.dataset.ready = "true";
