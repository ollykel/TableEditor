// === TableProps ==============================================================
//
// Describes a table object
//
// =============================================================================

import type UserView from '@/types/UserView';

export default interface TableProps {
  id: number;
  name: string;
  width: number;
  height: number;
  owner: UserView;
  sharedUsers: UserView[];
};
