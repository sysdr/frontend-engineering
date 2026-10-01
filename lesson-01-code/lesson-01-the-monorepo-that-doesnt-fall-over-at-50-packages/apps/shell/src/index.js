// @pulse/shell — composes the apps at runtime in Lesson 7 (module federation).
// Today it only depends on shared packages, never on an app directly.
import { tokens } from "@pulse/design-system";

export const navigation = Object.freeze([
  { id: "billing", label: "Billing" },
  { id: "analytics", label: "Analytics" },
  { id: "admin", label: "Admin" },
]);

export const statusTones = Object.keys(tokens.status);
