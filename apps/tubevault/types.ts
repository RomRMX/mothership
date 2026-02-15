
export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface Video {
  id: string;
  url: string;
  title: string;
  subtitle: string;
  category_id: string;
  thumbnail: string;
  created_at?: string;
}

export interface UserProfile {
  name: string;
  handle: string;
  bio: string;
  avatar: string;
}
