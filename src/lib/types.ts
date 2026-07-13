export interface Tag {
  id: number;
  name: string;
}

export interface Entry {
  id: number;
  type: string;
  title: string;
  meaning: string | null;
  source: string | null;
  author: string | null;
  example: string | null;
  tags: Tag[];
}

export interface AdminEntry {
  id: number;
  type: string;
  title: string;
  meaning: string | null;
  source: string | null;
  author: string | null;
  example: string | null;
  hidden: boolean;
  tagIds: number[];
  updated_at?: string;
}

export interface AdminTag {
  id: number;
  name: string;
}

export interface AdminType {
  id: number;
  name: string;
}