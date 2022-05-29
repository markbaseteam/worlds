import { DeepPost, Post } from "./types";
import path from "path";
import dirTree from "directory-tree";
import fs from "fs";
import matter from "gray-matter";
const markdownLinkExtractor = require("markdown-link-extractor");

class ContentGraph {
  posts: Post[];

  constructor() {
    this.posts = [];
    dirTree(path.resolve("content"), { extensions: /\.md/ }, (item) => {
      const mdFile = fs.readFileSync(path.resolve(item.path), "utf-8");
      const md = matter(mdFile, {});

      let postPath = item.path.split(path.resolve(""))[1];

      postPath = postPath
        .replace(/\\/g, "/")
        .replace(/.md/g, "")
        .replace("content/", "");

      if (postPath.startsWith("/") || postPath.startsWith("\\")) {
        postPath = postPath.substring(1);
      }

      const links = markdownLinkExtractor(mdFile);

      let absoluteLinks = [] as string[];
      for (const link of links) {
        if ((link as string).endsWith(".md")) {
          absoluteLinks.push(
            this.parsePostLink(postPath, link.replace(/.md/g, ""))
          );
        }
      }

      const post = {
        url: postPath,
        title: item.name.replace(".md", ""),
        content: md.content,
        links: absoluteLinks,
        backlinks: [],
      } as Post;

      // Add to ContentGraph
      this.addPost(post);
    });
  }

  addPost(post: Post) {
    this.posts.push(post);
    this.updateLinks();
  }

  updateLinks() {
    // Go through each post
    for (const post of this.posts) {
      // Go through each link originating from post
      for (const link of post.links) {
        // Find if the link is to another post in the ContentGraph
        const linkedPost = this.getPostByUrl(link);
        // If it is and isn't in that linked post's backlinks:
        if (
          linkedPost &&
          linkedPost.backlinks.filter((b) => b === post.url).length === 0
        ) {
          // Update the linked post's backlinks
          linkedPost.backlinks.push(post.url);
        }
      }
    }
  }

  getPostByUrl(postUrl: string) {
    return this.posts.filter((p) => p.url === postUrl).length > 0
      ? this.posts.filter((p) => p.url === postUrl)[0]
      : null;
  }

  getDeepPostByUrl(postUrl: string) {
    const shallowPost =
      this.posts.filter((p) => p.url === postUrl).length > 0
        ? this.posts.filter((p) => p.url === postUrl)[0]
        : null;

    if (shallowPost) {
      let deepPostLinks = [] as Post[];
      let deepPostBacklinks = [] as Post[];
      for (const link of shallowPost.links) {
        const linkedPost = this.getPostByUrl(link);
        if (linkedPost) {
          deepPostLinks.push(linkedPost);
        }
      }

      for (const backlink of shallowPost.backlinks) {
        const backlinkedPost = this.getPostByUrl(backlink);
        if (backlinkedPost) {
          deepPostBacklinks.push(backlinkedPost);
        }
      }

      return {
        url: shallowPost?.url,
        title: shallowPost?.title,
        content: shallowPost?.content,
        links: deepPostLinks,
        backlinks: deepPostBacklinks,
      } as DeepPost;
    }

    return null;
  }

  parsePostLink = (
    postAbsoluteUrl: string,
    linkRelativeUrl: string
  ): string => {
    if (linkRelativeUrl.substring(0, 2) === "./") {
      const baseUrl = postAbsoluteUrl.split("/").slice(0, -1);
      const urlAddition = linkRelativeUrl.split("/").slice(1);
      return baseUrl.concat(urlAddition).join("/");
    } else if (linkRelativeUrl.substring(0, 3) === "../") {
      let absoluteUrl = "";
      if (postAbsoluteUrl.split("/").length > 2) {
        absoluteUrl = postAbsoluteUrl.split("/").slice(0, -2).join("/");
      }

      let relativeUrl = linkRelativeUrl.split("/")[1];
      if (linkRelativeUrl.split("/").length > 2) {
        relativeUrl = linkRelativeUrl.split("/").slice(1).join("/");
      }

      return this.parsePostLink(absoluteUrl, relativeUrl);
    } else if (linkRelativeUrl[0] === "/") {
      return linkRelativeUrl;
    } else {
      let baseUrl = [] as string[];
      if (postAbsoluteUrl.length > 0) {
        baseUrl = postAbsoluteUrl.split("/").slice(0, -1);
      }

      let urlAddition = [linkRelativeUrl];
      if (linkRelativeUrl.split("/").length > 1) {
        urlAddition = linkRelativeUrl.split("/").slice(1);
      }
      return baseUrl.concat(urlAddition).join("/");
    }
  };
}

export default new ContentGraph();
