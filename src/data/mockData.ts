import { Bucket, StorageItem } from '@/types/storage';

export const mockBuckets: Bucket[] = [
  {
    id: '1',
    name: 'documents',
    createdAt: new Date('2026-01-05'),
    access: 'PRIVATE',
    itemCount: 12,
  },
  {
    id: '2',
    name: 'images',
    createdAt: new Date('2026-01-03'),
    access: 'PUBLIC',
    itemCount: 45,
  },
  {
    id: '3',
    name: 'backups',
    createdAt: new Date('2026-01-01'),
    access: 'PRIVATE',
    itemCount: 8,
  },
  {
    id: '4',
    name: 'projects',
    createdAt: new Date('2025-12-28'),
    access: 'PRIVATE',
    itemCount: 23,
  },
];

export const mockItems: Record<string, StorageItem[]> = {
  'documents': [
    { id: '1', name: 'reports', type: 'folder', lastModified: new Date('2026-01-07'), path: 'documents' },
    { id: '2', name: 'contracts', type: 'folder', lastModified: new Date('2026-01-06'), path: 'documents' },
    { id: '3', name: 'readme.md', type: 'file', size: 2048, lastModified: new Date('2026-01-07'), path: 'documents' },
    { id: '4', name: 'notes.txt', type: 'file', size: 512, lastModified: new Date('2026-01-05'), path: 'documents' },
  ],
  'documents/reports': [
    { id: '5', name: 'Q4-2025.pdf', type: 'file', size: 1024000, lastModified: new Date('2026-01-07'), path: 'documents/reports' },
    { id: '6', name: 'annual-review.docx', type: 'file', size: 2048000, lastModified: new Date('2026-01-06'), path: 'documents/reports' },
  ],
  'documents/contracts': [
    { id: '7', name: 'client-agreement.pdf', type: 'file', size: 512000, lastModified: new Date('2026-01-04'), path: 'documents/contracts' },
  ],
  'images': [
    { id: '8', name: 'avatars', type: 'folder', lastModified: new Date('2026-01-07'), path: 'images' },
    { id: '9', name: 'banners', type: 'folder', lastModified: new Date('2026-01-06'), path: 'images' },
    { id: '10', name: 'logo.png', type: 'file', size: 45000, lastModified: new Date('2026-01-07'), path: 'images' },
    { id: '11', name: 'hero.jpg', type: 'file', size: 230000, lastModified: new Date('2026-01-05'), path: 'images' },
  ],
  'backups': [
    { id: '12', name: 'db-backup-2026-01.sql', type: 'file', size: 15000000, lastModified: new Date('2026-01-07'), path: 'backups' },
    { id: '13', name: 'config.zip', type: 'file', size: 3500000, lastModified: new Date('2026-01-06'), path: 'backups' },
  ],
  'projects': [
    { id: '14', name: 'webapp', type: 'folder', lastModified: new Date('2026-01-07'), path: 'projects' },
    { id: '15', name: 'mobile-app', type: 'folder', lastModified: new Date('2026-01-05'), path: 'projects' },
    { id: '16', name: 'README.md', type: 'file', size: 4096, lastModified: new Date('2026-01-07'), path: 'projects' },
  ],
};

export function getItemsForPath(bucketName: string, path: string = ''): StorageItem[] {
  const fullPath = path ? `${bucketName}/${path}` : bucketName;
  return mockItems[fullPath] || [];
}
