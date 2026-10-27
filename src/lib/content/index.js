import { homeContent } from "./schema";
import { homeFixture } from "./fixtures/home";

// Content adapter. UI asks for content here and never imports fixtures
// directly, so a CMS source can be swapped in behind the same function.
export async function getHomeContent() {
  return homeContent.parse(homeFixture);
}

export const statusLabels = {
  verified: "Verified: Ray's own published words",
  "needs-confirmation": "Needs Ray's confirmation",
  "editorial-draft": "Draft copy, pending Ray's approval",
  "future-possibility": "Future possibility, not an achievement",
};
