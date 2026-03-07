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

function TractateRedirect() {
  const { tractate, folio } = useParams<{ tractate: string; folio: string }>();
  return <Redirect to={`/talmud/${tractate}/${folio}${window.location.hash}`} />;
}

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
const SegmentationReviewPage = lazy(() => import("@/pages/segmentation-review"));
const Home = lazy(() => import("@/pages/home"));
const BlogReader = lazy(() => import("@/pages/blog-reader"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
      <Route path="/bible/:book" component={BibleBookPage} />
      <Route path="/bible/:book/:chapter" component={BibleChapterPage} />
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
      <Route path="/segmentation-review" component={SegmentationReviewPage} />
      <Route path="/talmud" component={Contents} />
      <Route path="/talmud/:tractate" component={TractateContents} />
      <Route path="/talmud/:tractate/:folio" component={TractateView} />
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
