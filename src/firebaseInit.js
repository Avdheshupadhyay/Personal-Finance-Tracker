// This file ensures Firebase is initialized only once

import app from './firebase';
import { db, auth, provider, analytics } from './firebase';

// Export the initialized Firebase instances
export { db, auth, provider, analytics };

// Export default app
export default app;
