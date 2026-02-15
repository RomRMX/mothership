
import { Category, UserProfile } from './types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Standup Comedy', color: 'bg-rose-500' },
  { id: '2', name: 'DJ Sets', color: 'bg-indigo-500' },
  { id: '3', name: 'Recipes', color: 'bg-emerald-500' },
  { id: '4', name: 'Conspiracy Theories', color: 'bg-amber-500' },
  { id: '5', name: 'Live Performances', color: 'bg-violet-500' },
];

export const INITIAL_PROFILE: UserProfile = {
  name: 'RōMRMX',
  handle: '@romrmx510',
  bio: 'CURATING THE HIGH-FREQUENCY DIGITAL ARCHIVE. SPECIALIZING IN OBSCURE SONIC LANDSCAPES AND VISUAL RECORDS.',
  avatar: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1000&auto=format&fit=crop'
};

export const STORAGE_KEY = 'tubevault_data';
