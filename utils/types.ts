export type Post = {
  url: string;
  title: string;
  content: string;
  links: string[];
  backlinks: string[];
};

export type DeepPost = {
  url: string;
  title: string;
  content: string;
  links: Post[];
  backlinks: Post[];
};

export type SearchableDocument = {
  name: string;
  url: string;
  content: string;
};
