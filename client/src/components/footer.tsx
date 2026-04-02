import { Link } from "wouter";
import { ExternalLink, Moon, Sun, FileText, Contrast, Globe } from "lucide-react";
import { SiX, SiGithub } from "react-icons/si";
import { usePreferences, type Theme } from "@/context/preferences-context";
import { trackEvent } from "@/lib/analytics";

export function Footer() {
  const { preferences, setTheme } = usePreferences();

  const handleThemeChange = (theme: Theme) => {
    trackEvent('change_preference', 'settings', `theme_${theme}`);
    setTheme(theme);
  };

  return (
    <footer className="border-t border-border bg-card mt-12 min-h-[280px]">
      <div className="container mx-auto px-4 py-10">
        {/* Theme Picker */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 p-1 bg-secondary rounded-lg" data-testid="footer-theme-picker">
            <button
              onClick={() => handleThemeChange('paper')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                preferences.theme === 'paper'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="button-theme-paper"
            >
              <FileText className="w-4 h-4" />
              Paper
            </button>
            <button
              onClick={() => handleThemeChange('white')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                preferences.theme === 'white'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="button-theme-white"
            >
              <Sun className="w-4 h-4" />
              White
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                preferences.theme === 'dark'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="button-theme-dark"
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
            <button
              onClick={() => handleThemeChange('high-contrast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                preferences.theme === 'high-contrast'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="button-theme-high-contrast"
            >
              <Contrast className="w-4 h-4" />
              High Contrast
            </button>
          </div>
        </div>

        {/* Multi-Column Navigation */}
        <div className="grid grid-cols-[1.4fr_1fr] gap-4 sm:gap-8 max-w-2xl mx-auto mb-8">
          {/* Column 1: Study Resources */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Study Resources</h3>
            <nav className="flex flex-col gap-3">
              <Link 
                href="/talmud"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-contents"
              >
                Talmud - Table of Contents
              </Link>
              <Link 
                href="/sugya-viewer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-sugya-viewer"
              >
                Sugya Viewer - by Custom Range
              </Link>
              <Link 
                href="/suggested-pages"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-suggested-pages"
              >
                Suggested Talmud Pages
              </Link>
              <Link 
                href="/biblical-index"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-biblical-index"
              >
                Bible-Talmud Index
              </Link>
              <Link 
                href="/mishnah"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-mishnah"
              >
                Mishnah (not in Talmud)
              </Link>
              <Link 
                href="/yerushalmi"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-yerushalmi"
              >
                Jerusalem Talmud (Yerushalmi)
              </Link>
              <Link 
                href="/rambam"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-rambam"
              >
                Mishneh Torah (Rambam)
              </Link>
              <Link 
                href="/mishnah-map"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-mishnah-map"
              >
                Mishnah-Talmud Mapping
              </Link>
              <Link 
                href="/blog-posts"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-blog-posts"
              >
                Blog Posts
              </Link>
              <Link 
                href="/dictionary"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-dictionary"
              >
                Jastrow Talmud Dictionary
              </Link>
              <Link 
                href="/term-index"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-term-index"
              >
                Talmud Term Index
              </Link>
              <Link 
                href="/bible"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-bible"
              >
                Bible - Table of Contents
              </Link>
              <Link 
                href="/search"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-search"
              >
                Search - Bible & Talmud
              </Link>
            </nav>
          </div>

          {/* Column 2: About & Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">About & Legal</h3>
            <nav className="flex flex-col gap-3">
              <Link 
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-about"
              >
                About
              </Link>
              <Link 
                href="/sitemap"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-sitemap"
              >
                Sitemap
              </Link>
              <Link 
                href="/contact"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-contact"
              >
                Contact
              </Link>
              <Link 
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-privacy"
              >
                Privacy
              </Link>
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1.5"
                data-testid="footer-link-mit-license"
              >
                MIT License
                <ExternalLink size={13} />
              </a>
              <Link 
                href="/changelog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                data-testid="footer-link-changelog"
              >
                Changelog
              </Link>
              <a 
                href="https://github.com/EzraBrand/chavrutai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1.5"
                data-testid="footer-link-github"
              >
                <SiGithub size={13} />
                GitHub
                <ExternalLink size={13} />
              </a>
              <a
                href="https://x.com/ChavrutAI"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1.5"
                data-testid="footer-link-twitter"
              >
                <SiX size={13} />
                Follow on X
                <ExternalLink size={13} />
              </a>
              <a
                href="https://www.ezrabrand.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 inline-flex items-center gap-1.5"
                data-testid="footer-link-talmud-tech-nav"
              >
                <Globe size={13} />
                Talmud & Tech
                <ExternalLink size={13} />
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-6">
          <div className="flex flex-col items-center gap-4">
            {/* Branding */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ChavrutAI © 2025 by{" "}
                <a 
                  href="https://www.ezrabrand.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-primary transition-colors duration-200 inline-flex items-center gap-1"
                  data-testid="footer-link-talmud-tech"
                >
                  Talmud & Tech
                  <ExternalLink size={12} />
                </a>
              </p>
            </div>

            {/* Sefaria Attribution */}
            <div className="flex items-center gap-3">
              <a 
                href="https://www.sefaria.org/texts/Talmud"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
                aria-label="Powered by Sefaria - Talmud Library"
                data-testid="footer-link-sefaria"
              >
                <img 
                  src="/powered-by-sefaria.png" 
                  alt="Powered by Sefaria" 
                  className="h-8"
                  width={62}
                  height={32}
                  loading="lazy"
                  decoding="async"
                  data-testid="sefaria-powered-by-image"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}