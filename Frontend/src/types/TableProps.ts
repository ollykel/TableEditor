// === TableProps ==============================================================
//
// Describes a table object
//
// =============================================================================

import type { UserView } from '@/types/User';

export default interface TableProps {
  id: number;
  name: string;
  timeCreated: Date;
  width: number;
  height: number;
  owner: UserView;
  sharedUsers: UserView[];
};
