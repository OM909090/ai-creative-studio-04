export const ROUTES = {
  HOME: '/',
  EDITOR: {
    IMAGE: '/editor/image',
    VIDEO: '/editor/video',
  },
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  ABOUT: '/about',
  HELP: '/help',
} as const;

export const EXTERNAL_LINKS = {
  DOCS: 'https://docs.example.com',
  GITHUB: 'https://github.com',
  SUPPORT: 'https://support.example.com',
  DISCORD: 'https://discord.gg/example',
} as const;

export const isValidRoute = (path: string): boolean => {
  const allRoutes = Object.values(ROUTES).flat();
  return allRoutes.includes(path as any);
};
