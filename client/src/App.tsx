import { Switch, Route, useParams, Redirect } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PreferencesProvider } from "@/context/preferences-context";
import { PageLoading } from "@/components/page-loading";
import { initAnalytics, isOptedOut } from "@/lib/analytics";
import { useAnalytics } from "@/hooks/use-analytics";
import { preloadChapterData } from "@/lib/chapter-data";
import { getTractateSlug, isValidTractate } from "@shared/tractates";
import { getBookBySlug } from "@shared/bible-books";

const Contents = lazy(() => import("@/pages/contents"));
const About = lazy(() => import("@/pages/about"));
const TractateContents = lazy(() => import("@/pages/tractate-contents"));
const TractateView = lazy(() => import("./pages/tractate-view"));
const TractateOutlinePage = lazy(() => import("@/pages/tractate-outline"));
const MishnahMapPage = lazy(() => import("@/pages/mishnah-map"));
const BlogPostsPage = lazy(() => import("@/pages/blog-posts"));
const BiblicalIndexPage = lazy(() => import("@/pages/biblical-index"));
const BiblicalBookPage = lazy(() => import("@/pages/biblical-book"));
const BibleContents = lazy(() => import("@/pages/bible-contents"));
const BibleBookPage = lazy(() => import("@/pages/bible-book"));
const BibleChapterPage = lazy(() => import("@/pages/bible-chapter"));
const SuggestedPages = lazy(() => import("@/pages/suggested-pages"));
const Sitemap = lazy(() => import("@/pages/sitemap"));
const Changelog = lazy(() => import("@/pages/changelog"));
const Contact = lazy(() => import("@/pages/contact"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Dictionary = lazy(() => import("@/pages/dictionary"));
const SugyaViewerPage = lazy(() => import("@/pages/sugya-viewer"));
const ExternalLinksPage = lazy(() => import("@/pages/external-links"));
const SearchPage = lazy(() => import("@/pages/search"));
const Home = lazy(() => import("@/pages/home"));
const BlogReader = lazy(() => import("@/pages/blog-reader"));
const NotFound = lazy(() => import("@/pages/not-found"));
const TermIndexPage = lazy(() => import("@/pages/term-index"));
const MishnahContents = lazy(() => import("@/pages/mishnah-contents"));
const MishnahTractate = lazy(() => import("@/pages/mishnah-tractate"));
const MishnahChapterPage = lazy(() => import("@/pages/mishnah-chapter"));
const YerushalmiContents = lazy(() => import("@/pages/yerushalmi-contents"));
const YerushalmiTractate = lazy(() => import("@/pages/yerushalmi-tractate"));
const YerushalmiChapterPage = lazy(() => import("@/pages/yerushalmi-chapter"));

function TractateRedirect() {
  const { tractate, folio } = useParams<{ tractate: string; folio: string }>();
  return <Redirect to={`/talmud/${tractate}/${folio}${window.location.hash}`} />;
}

function TractateContentsRoute() {
  const { tractate } = useParams<{ tractate: string }>();
  const canonical = getTractateSlug(tractate || '');
  if (tractate && tractate !== canonical && isValidTractate(tractate)) {
    return <Redirect to={`/talmud/${canonical}`} />;
  }
  return <TractateContents />;
}

function TractateViewRoute() {
  const { tractate, folio } = useParams<{ tractate: string; folio: string }>();
  const canonical = getTractateSlug(tractate || '');
  if (tractate && tractate !== canonical && isValidTractate(tractate)) {
    return <Redirect to={`/talmud/${canonical}/${folio}${window.location.hash}`} />;
  }
  return <TractateView />;
}

function BibleBookRoute() {
  const { book } = useParams<{ book: string }>();
  const bookInfo = book ? getBookBySlug(book) : undefined;
  if (bookInfo && book !== bookInfo.slug) {
    return <Redirect to={`/bible/${bookInfo.slug}`} />;
  }
  return <BibleBookPage />;
}

function BibleChapterRoute() {
  const { book, chapter } = useParams<{ book: string; chapter: string }>();
  const bookInfo = book ? getBookBySlug(book) : undefined;
  if (bookInfo && book !== bookInfo.slug) {
    return <Redirect to={`/bible/${bookInfo.slug}/${chapter}`} />;
  }
  return <BibleChapterPage />;
}

function Router() {
  useAnalytics();
  
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/blog-posts" component={BlogPostsPage} />
      <Route path="/blog-reader" component={BlogReader} />
      <Route path="/biblical-index" component={BiblicalIndexPage} />
      <Route path="/biblical-index/book/:bookName" component={BiblicalBookPage} />
      <Route path="/bible" component={BibleContents} />
      <Route path="/bible/:book" component={BibleBookRoute} />
      <Route path="/bible/:book/:chapter" component={BibleChapterRoute} />
      <Route path="/suggested-pages" component={SuggestedPages} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/changelog" component={Changelog} />
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/dictionary" component={Dictionary} />
      <Route path="/mishnah-map" component={MishnahMapPage} />
      <Route path="/sugya-viewer" component={SugyaViewerPage} />
      <Route path="/external-links" component={ExternalLinksPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/term-index" component={TermIndexPage} />
      <Route path="/talmud" component={Contents} />
      <Route path="/talmud/:tractate" component={TractateContentsRoute} />
      <Route path="/talmud/:tractate/:folio" component={TractateViewRoute} />
      <Route path="/mishnah" component={MishnahContents} />
      <Route path="/mishnah/:tractate" component={MishnahTractate} />
      <Route path="/mishnah/:tractate/:chapter" component={MishnahChapterPage} />
      <Route path="/yerushalmi" component={YerushalmiContents} />
      <Route path="/yerushalmi/:tractate" component={YerushalmiTractate} />
      <Route path="/yerushalmi/:tractate/:chapter" component={YerushalmiChapterPage} />
      <Route path="/tractate/:tractate/:folio" component={TractateRedirect} />
      <Route path="/outline/:tractate/:chapter" component={TractateOutlinePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    if (!import.meta.env.VITE_POSTHOG_API_KEY) {
      console.warn('Missing required PostHog key: VITE_POSTHOG_API_KEY');
    } else if (!isOptedOut()) {
      initAnalytics();
    }
    
    const pathMatch = window.location.pathname.match(/^\/talmud\/([^/]+)/);
    if (pathMatch) {
      const tractateFromUrl = decodeURIComponent(pathMatch[1]);
      preloadChapterData(tractateFromUrl).catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<PageLoading />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </PreferencesProvider>
    </QueryClientProvider>
  );
}

export default App;
