import { Dialog, Transition } from "@headlessui/react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  MenuAlt2Icon,
  XIcon,
} from "@heroicons/react/outline";
import { SearchIcon } from "@heroicons/react/solid";
import dirTree from "directory-tree";
import fs from "fs";
import matter from "gray-matter";
import lunr from "lunr";
import type { AppContext, AppProps } from "next/app";
import App from "next/app";
import Link from "next/link";
import { useRouter } from "next/router";
import path from "path";
import { Fragment, MouseEvent, useEffect, useState } from "react";
import "../styles/output.css";
import { SearchableDocument } from "../utils/types";
const removeMd = require("remove-markdown");

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<lunr.Index.Result[]>([]);
  const searchIndex = lunr(function () {
    this.ref("url");
    this.field("name");
    this.field("content");

    for (const document of pageProps.documentList) {
      this.add(document);
    }
  });

  const toggleCollapseFolder = (
    event: MouseEvent<HTMLDivElement, globalThis.MouseEvent>
  ) => {
    if (openFolders.filter((f) => f === event.currentTarget.id).length === 0) {
      // Open folder
      setOpenFolders([...openFolders, event.currentTarget.id]);
    } else {
      // Collapse folder
      setOpenFolders(openFolders.filter((f) => f !== event.currentTarget.id));
    }
  };

  const getNavigation = () => {
    return pageProps.directoryTree.children.map(
      (item: dirTree.DirectoryTree) => {
        if (item.children) {
          // Iterate on it with child function
          return getNavigationChildren(item, "pages", 0);
        } else {
          return (
            <Link
              key={item.path}
              href={`/pages/${item.name.replace(".md", "")}`}
            >
              <a
                className={classNames(
                  "text-gray-300 hover:text-white",
                  "group flex items-center px-2 py-2 text-base font-medium ml-auto border-r-4"
                )}
              >
                <span className="ml-auto">{item.name.replace(".md", "")}</span>
              </a>
            </Link>
          );
        }
      }
    );
  };

  const getNavigationChildren = (
    item: dirTree.DirectoryTree,
    path: string,
    depth: number
  ): JSX.Element => {
    if (item.children) {
      return (
        <div key={item.name} className="border-r-4">
          <div
            id={item.path}
            onClick={toggleCollapseFolder}
            className={classNames(
              "cursor-pointer text-gray-300 hover:text-white ",
              `group flex items-center px-2 py-2 text-base font-extrabold mr-${
                2 * depth
              } `
            )}
          >
            <a className="flex ml-auto">
              <span className="h-full">{item.name}</span>
              <span className="inset-y-0 left-0 flex items-center">
                {openFolders.filter((f) => f === item.path).length === 0 ? (
                  <ChevronLeftIcon className="h-4 w-4 ml-1" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 ml-1" />
                )}
              </span>
            </a>
          </div>
          <div
            key={item.name + "-children"}
            className={
              openFolders.filter((f) => f === item.path).length === 0
                ? "hidden ml-2"
                : " ml-2"
            }
          >
            {item.children.map((child) => {
              return getNavigationChildren(
                child,
                path + "/" + item.name.replace(".md", ""),
                depth + 1
              );
            })}
          </div>
        </div>
      );
    } else {
      return (
        <div className="">
          <Link
            key={item.path}
            href={`/${path}/${item.name.replace(".md", "")}`}
          >
            <a
              className={classNames(
                "text-gray-300 hover:text-white",
                `group flex items-center px-2 py-2 text-base font-medium  ml-auto border-r-4`
              )}
            >
              <span className={`ml-auto mr-${2 * depth}`}>
                {item.name.replace(".md", "")}
              </span>
            </a>
          </Link>
        </div>
      );
    }
  };

  const search = (query: string) => {
    setSearchResults(searchIndex.search(query));
  };

  const goToPage = (pageUrl: string) => {
    router.push("/pages/" + pageUrl).then(() => {
      setSearchQuery("");
    });
  };

  useEffect(() => {
    search(searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  return (
    <>
      <div className="mx-auto my-auto">
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 flex z-40 md:hidden"
            onClose={setSidebarOpen}
          >
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Dialog.Overlay className="fixed inset-0 bg-neutral-600 bg-opacity-75" />
            </Transition.Child>
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <div className="relative flex-1 flex flex-col max-w-xs w-full pt-5 pb-4 bg-neutral-800 border-2 border-b-neutral-900 border-x-transparent border-t-transparent">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-shrink-0 flex items-center px-4 text-2xl font-extrabold cursor-pointer">
                  <Link href="/">{process.env.NEXT_PUBLIC_PROJECT_NAME}</Link>
                </div>
                <div className="mt-5 flex-1 h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-neutral-800">
                  <nav className="px-2 space-y-1">{getNavigation()}</nav>
                </div>
              </div>
            </Transition.Child>
            <div className="flex-shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </Dialog>
        </Transition.Root>
        <div className="flex flex-col">
          <div className="flex flex-row sm:hidden px-4 py-6">
            <button
              type="button"
              className="px-4 border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <MenuAlt2Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div>{process.env.NEXT_PUBLIC_PROJECT_NAME}</div>
          </div>

          <main className="flex-1 flex flex-row text-left mx-auto w-100 px-4 md:w-2/3 md:px-0">
            <div className="text-right hidden sm:block sm:w-1/3 h-screen sticky top-0 py-4 sm:py-16 ">
              <div className="flex-1 flex flex-col min-h-0 ">
                <div className="flex items-center flex-shrink-0 px-4 text-2xl font-extrabold ml-auto mb-2">
                  <Link href="/">
                    <h2 className="hover:text-violet-600 text-violet-500 text-right cursor-pointer">
                      {process.env.NEXT_PUBLIC_PROJECT_NAME}
                    </h2>
                  </Link>
                </div>
                <div className="sticky top-0 z-10 flex-shrink-0 flex">
                  <div className="flex-1 px-2 flex my-2">
                    <div className="flex-1 flex">
                      <label htmlFor="search-field" className="sr-only">
                        Search
                      </label>
                      <div className="h-fit w-full sm:w-full md:w-2/3 text-gray-400 focus-within:text-gray-400 ml-auto">
                        <div className="absolute inset-y-0 right-0 flex items-center pointer-events-none pr-4">
                          <SearchIcon className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <input
                          id="search-field"
                          className=" block w-full pl-10 pr-6 border-transparent text-gray-400 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm rounded-md text-right"
                          placeholder="Search"
                          type="search"
                          name="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="">
                  <div
                    style={{ maxHeight: "80vh" }}
                    className="flex-1 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-neutral-800 mt-2"
                  >
                    <nav className="flex-1 px-2 py-4">{getNavigation()}</nav>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-100 sm:w-2/3 pl-0 sm:pl-4 py-4 sm:py-16">
              <div className="max-w-7xl px-4">
                {searchQuery !== "" ? (
                  searchResults.length > 0 ? (
                    <div>
                      {searchResults.map((result, i) => (
                        <div
                          key={i}
                          className="cursor-pointer my-2 rounded-md border-2 border-neutral-700 p-4 hover:bg-neutral-700"
                          onClick={() => goToPage(result.ref)}
                        >
                          <div className="text-lg font-bold">
                            {
                              (
                                pageProps.documentList as SearchableDocument[]
                              ).filter((d) => d.url === result.ref)[0].name
                            }
                          </div>
                          <div>
                            {removeMd(
                              (
                                pageProps.documentList as SearchableDocument[]
                              ).filter((d) => d.url === result.ref)[0].content
                            ).substring(0, 50) + "..."}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p>No results could be found.</p>
                    </div>
                  )
                ) : (
                  <Component {...pageProps} />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  // calls page's `getInitialProps` and fills `appProps.pageProps`
  const appProps = await App.getInitialProps(appContext);

  const documentList = [] as SearchableDocument[];

  const directoryTree = dirTree("content", { extensions: /\.md/ }, (item) => {
    documentList.push({
      name: item.name.replace(".md", ""),
      url: item.path
        .replace(/\\/g, "/")
        .replace(/.md/g, "")
        .replace("content/", ""),
      content: matter(fs.readFileSync(path.resolve(item.path), "utf-8"), {})
        .content,
    });
  });

  appProps.pageProps.directoryTree = directoryTree;
  appProps.pageProps.documentList = documentList;

  return { ...appProps };
};

export default MyApp;
