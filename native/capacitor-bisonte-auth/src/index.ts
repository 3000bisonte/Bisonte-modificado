import { registerPlugin } from '@capacitor/core';
import type { BisonteAuthPlugin } from './definitions';

export const BisonteAuth = registerPlugin<BisonteAuthPlugin>('BisonteAuth');
