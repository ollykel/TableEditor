export interface AppConfig {
  routes: {
    index: string;
    home: string;
    login: string;
    createAccount: string;
    table: string;
  }
}

const APP_ROUTES_ROOT = '/app';

export default {
  routes: {
    index: '/',
    appRoot: APP_ROUTES_ROOT,
    home: `${APP_ROUTES_ROOT}/home`,
    login: `${APP_ROUTES_ROOT}/login`,
    createAccount: `${APP_ROUTES_ROOT}/account`,
    table: `${APP_ROUTES_ROOT}/tables`
  }
};
