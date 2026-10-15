// Pure rule for when the floating menu pill should be tucked away.

export interface BarVisibilityInput {
  /** User is scrolling down the page. */
  scrollDown: boolean;
  /** A video watch page is open. */
  videoActive: boolean;
  /** The Settings screen is focused (it has its own scroll view, not a page). */
  onSettings: boolean;
  /** The search overlay / keyboard is open. */
  searchOpen: boolean;
}

export function shouldHideBar(i: BarVisibilityInput): boolean {
  if (i.searchOpen) {
    return true;
  }
  if (i.onSettings) {
    return false;
  }
  return i.scrollDown || i.videoActive;
}
