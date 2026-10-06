// Carried forward from Lesson 0: every package has an owning team.
import { listPackages, ownerOf } from "./workspace.mjs";

const pkgs = listPackages();
const missing = pkgs.filter((p) => !ownerOf(p.dir));
if (missing.length) {
  missing.forEach((p) => console.error(`FAIL: ${p.dir} has no CODEOWNERS entry`));
  process.exit(1);
}
console.log(`OK: all ${pkgs.length} packages have CODEOWNERS coverage.`);
