export interface Bucket {
  id: string;
  name: string;
  createdAt: Date;
  access: 'PRIVATE' | 'PUBLIC';
  itemCount: number;
}

export interface StorageItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified: Date;
  path: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}
