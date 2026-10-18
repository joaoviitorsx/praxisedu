import { ScrollView } from 'react-native';

// Kept for the existing in-page carousels. The parent tabs now use the native
// pager, so no competing JS pan gesture or release-time navigation is needed.
export function TabSwipeProtectedScroll({ children, ...props }) {
  return <ScrollView {...props} horizontal directionalLockEnabled>{children}</ScrollView>;
}
