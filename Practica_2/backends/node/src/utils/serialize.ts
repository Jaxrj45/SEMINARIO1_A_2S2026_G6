export interface UserRow {
  id: number;
  username: string;
  email: string;
  profile_image_url: string | null;
}

export interface TaskRow {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
}

export interface FileRow {
  id: number;
  name: string;
  type: string;
  url: string;
  created_at: string;
}

export const userToDict = (row: UserRow) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  profileImageUrl: row.profile_image_url,
});

export const taskToDict = (row: TaskRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  completed: row.completed,
  createdAt: row.created_at,
});

export const fileToDict = (row: FileRow) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  url: row.url,
  createdAt: row.created_at,
});

// image | text | other, a partir del mimetype
export function fileCategory(mimetype: string | undefined): string {
  const m = mimetype || '';
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('text/')) return 'text';
  return 'other';
}
