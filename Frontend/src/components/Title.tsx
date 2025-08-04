// === Title ===================================================================
//
// Title bar component to display in header of misc. pages.
//
// =============================================================================

import { Link } from 'react-router';

import config from '@/app.config';

const Title = (): React.JSX.Element => {
  return (
    <div>
      <Link to={config.routes.index}>
        <h1 className="text-center text-4xl font-bold font-serif">Table Editor</h1>
      </Link>
    </div>
  );
};

export default Title;
