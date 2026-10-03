// Control Tower entry. Lesson 4 adds the theme switcher and the contrast panel.
import { browserThemeController, mountThemeSwitcher } from "@pulse/design-system";
import { mountBuildBoard } from "./panels/build-board.js";
import { mountOwnershipGraph } from "./panels/ownership-graph.js";
import { mountContrastAudit } from "./panels/contrast-audit.js";
import { mountTypeScale } from "./panels/type-scale.js";

const theme = browserThemeController();
mountThemeSwitcher(/** @type {HTMLElement} */ (document.querySelector("[data-theme-slot]")), theme);

const panel = (name) => /** @type {HTMLElement} */ (document.querySelector(`[data-panel="${name}"]`));
await Promise.all([
  mountBuildBoard(panel("build")),
  mountOwnershipGraph(panel("owners")),
  mountContrastAudit(panel("contrast")),
  mountTypeScale(panel("type-scale")),
]);
document.body.dataset.ready = "true";
