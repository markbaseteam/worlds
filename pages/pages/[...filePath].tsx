import cytoscape from "cytoscape";
import dirTree from "directory-tree";
import fs from "fs";
import matter from "gray-matter";
import { marked } from "marked";
import { GetStaticPaths, GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import path from "path";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import styles from "../../styles/Home.module.css";
import { DeepPost, Post } from "../../utils/types";

const Graph = dynamic(() => import("../../components/Graph"), {
  ssr: false,
});

const FilePage = (props: { post: DeepPost }) => {
  const [graphPosts, setGraphPosts] = useState<Post[]>([]);
  const [currentPost, setCurrentPost] = useState<Post>();
  const [graphElements, setGraphElements] = useState<
    cytoscape.ElementDefinition[]
  >([]);

  const getGraphElements = (currentPost: Post) => {
    const elements = [] as cytoscape.ElementDefinition[];

    elements.push({
      data: {
        id: currentPost.url,
        label: currentPost.title,
      },
      selected: true,
    });

    for (const backlinkedPostUrl of currentPost.backlinks) {
      // Get backlinked post from graph posts
      const backlinkedPosts = graphPosts.filter((p) => {
        return p.url === backlinkedPostUrl;
      });

      if (backlinkedPosts.length > 0) {
        elements.push({
          data: {
            id: backlinkedPosts[0].url,
            label: backlinkedPosts[0].url.split("/").pop(),
          },
        });
        elements.push({
          data: {
            source: backlinkedPosts[0].url,
            target: currentPost.url,
          },
        });

        for (const l2link of backlinkedPosts[0].links) {
          elements.push({
            data: {
              id: l2link,
              label: l2link.split("/").pop(),
            },
          });
          elements.push({
            data: { source: l2link, target: backlinkedPosts[0].url },
          });
        }

        for (const l2backlink of backlinkedPosts[0].backlinks) {
          elements.push({
            data: {
              id: l2backlink,
              label: l2backlink.split("/").pop(),
            },
          });
          elements.push({
            data: { source: l2backlink, target: backlinkedPosts[0].url },
          });
        }
      }
    }

    for (const linkedPostUrl of currentPost.links) {
      // Get linked post from graph posts
      const linkedPosts = graphPosts.filter((p) => {
        return p.url === linkedPostUrl;
      });

      if (linkedPosts.length > 0) {
        elements.push({
          data: {
            id: linkedPosts[0].url,
            label: linkedPosts[0].url.split("/").pop(),
          },
        });
        elements.push({
          data: { source: linkedPosts[0].url, target: currentPost.url },
        });

        for (const l2link of linkedPosts[0].links) {
          elements.push({
            data: {
              id: l2link,
              label: l2link.split("/").pop(),
            },
          });
          elements.push({
            data: { source: l2link, target: linkedPosts[0].url },
          });
        }

        for (const l2backlink of linkedPosts[0].backlinks) {
          elements.push({
            data: {
              id: l2backlink,
              label: l2backlink.split("/").pop(),
            },
          });
          elements.push({
            data: { source: l2backlink, target: linkedPosts[0].url },
          });
        }
      }
    }

    setGraphElements(elements);
  };

  const fetcher = (endpoint: string) =>
    fetch(endpoint).then((res) => res.json());

  const { data, isValidating, mutate, error } = useSWR(
    "/api/content-graph",
    fetcher
  );

  useEffect(() => {
    if (
      !sessionStorage.getItem("graph") ||
      sessionStorage.getItem("graph") === "[]"
    ) {
      mutate();
    } else {
      const graphData = JSON.parse(sessionStorage.getItem("graph") ?? "[]");
      setGraphPosts(graphData);

      // Get current post from graph posts
      const currentPosts = graphData.filter((p: Post) => {
        return p.url === props.post.url;
      });

      if (currentPosts.length > 0) {
        setCurrentPost(currentPosts[0]);
      }
    }
  }, [props]);

  useEffect(() => {
    if (data && !error) {
      sessionStorage.setItem("graph", JSON.stringify(data.graph));
      setGraphPosts(data.graph);

      // Get current post from graph posts
      const currentPosts = data.graph.filter((p: Post) => {
        return p.url === props.post.url;
      });

      if (currentPosts.length > 0) {
        setCurrentPost(currentPosts[0]);
      }
    }
  }, [data]);

  useEffect(() => {
    if (currentPost) {
      getGraphElements(currentPost);
    } else {
      setGraphElements([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPost]);

  useEffect(() => {
    setGraphPosts(JSON.parse(sessionStorage.getItem("graph") ?? "[]"));
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>
          {props.post.title} | {process.env.NEXT_PUBLIC_PROJECT_NAME}
        </title>
        <meta
          name="description"
          content={props.post.content.substring(0, 100) + "..."}
        />
      </Head>
      <div className="prose prose-md prose-invert text-gray-300">
        <div dangerouslySetInnerHTML={{ __html: marked(props.post.content) }} />
      </div>
      <div>
        {!isValidating &&
          (graphElements.length > 0 ||
            (currentPost && currentPost.backlinks.length > 0)) && (
            <div>
              <hr className="my-12 w-100 border-2" />
              <div>
                {currentPost && currentPost.backlinks.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold mb-4">Backlinks</h3>
                    <div>
                      {currentPost.backlinks.map((link, i) => {
                        return (
                          <div key={i}>
                            <Link href={link}>
                              <a className="px-1 my-1 rounded-sm bg-neutral-500 hover:bg-neutral-600 text-slate-300 hover:text-slate-400">
                                {link.split("/").pop()}
                              </a>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {graphElements.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold my-4">
                      Interactive Graph
                    </h3>
                    <div className="border-2 rounded-md border-neutral-600 w-100 h-64 mt-4">
                      <Graph elements={graphElements} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  let filePaths = getNavigationPaths();

  filePaths = filePaths?.map((filePath) => {
    return {
      params: {
        filePath: filePath.params.filePath[0].split("/"),
      },
    };
  });

  return {
    paths: filePaths ?? [],
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  if (context.params?.filePath) {
    // const contentGraph = getContentGraph();
    return {
      props: {
        // post: contentGraph.getDeepPostByUrl(
        //   (context.params?.filePath as string[]).join("/")
        // ),
        post: getPost((context.params?.filePath as string[]).join("/")),
      },
    };
  } else {
    return {
      props: {
        post: null,
      },
    };
  }
};

export default FilePage;

// Internal functions
const getPost = (postPath: string) => {
  const resolvedPath = "content/" + postPath + ".md";
  const mdFile = fs.readFileSync(path.resolve(resolvedPath), "utf-8");
  const md = matter(mdFile, {});

  return {
    url: postPath,
    title: postPath.split("/")[postPath.split("/").length - 1],
    content: md.content,
    links: [],
    backlinks: [],
  } as Post;
};

const getNavigationPaths = () => {
  const directoryTree = dirTree("content", { extensions: /\.md/ });

  return directoryTree.children?.flatMap((item) => {
    if (item.hasOwnProperty("children")) {
      // Iterate on it with child function
      return getNavigationChildrenPaths(item, "", 0);
    } else {
      return {
        params: {
          filePath: [item.name.replace(".md", "")],
        },
      };
    }
  });
};

const getNavigationChildrenPaths = (
  item: dirTree.DirectoryTree,
  filePath: string,
  depth: number
):
  | {
      params: {
        filePath: string[];
      };
    }
  | {
      params: {
        filePath: string[];
      };
    }[] => {
  if (item.children) {
    return item.children.flatMap((child) => {
      return getNavigationChildrenPaths(
        child,
        filePath
          ? filePath + "/" + item.name.replace(".md", "")
          : item.name.replace(".md", ""),
        depth + 1
      );
    });
  } else {
    return {
      params: {
        filePath: [
          filePath
            ? filePath + "/" + item.name.replace(".md", "")
            : item.name.replace(".md", ""),
        ],
      },
    };
  }
};
