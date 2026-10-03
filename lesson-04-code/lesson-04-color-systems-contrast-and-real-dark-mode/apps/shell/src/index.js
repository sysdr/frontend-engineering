// The Pulse shell. Becomes the micro-frontend host in Lesson 7; for now it
// only applies the shared theme so any page it hosts is themed.
import { browserThemeController } from "@pulse/design-system";
export const theme = browserThemeController();
