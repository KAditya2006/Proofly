# Google Search Console Setup & Manual SEO Steps

Now that the automated SEO system is in place for MEIL ESG360, the final phase involves connecting the application to Google Search Console to monitor search performance and indexation.

## 1. Verify Domain Ownership
You must verify the domain ownership before Google will show you search analytics.
1. Log in to [Google Search Console](https://search.google.com/search-console).
2. Add a new property. Use the **Domain** verification method (e.g., `meilesg360.com`).
3. Add the provided TXT record to your DNS configuration.
4. Click **Verify**.

## 2. Submit the XML Sitemap
Once verified, tell Google exactly which pages to index.
1. In Search Console, navigate to **Sitemaps** on the left sidebar.
2. Enter the URL of your sitemap: `https://www.meilesg360.com/sitemap.xml`.
*(Replace with your actual production domain)*.
3. Click **Submit**.

## 3. Inspect Key Pages
Force Google to discover your most important pages quickly.
1. Use the **URL Inspection** bar at the top of Search Console.
2. Enter the homepage URL (`https://www.meilesg360.com/`).
3. If it is not indexed, click **Request Indexing**.
4. Repeat for key landing pages like `/esg-reporting` and `/brsr-reporting`.

## 4. Ongoing Monitoring
- **Index Coverage:** Regularly check the **Pages** report to ensure public pages are indexed and private/application pages (like `/dashboard`) are correctly excluded.
- **Core Web Vitals:** Monitor the **Experience** tab to ensure LCP, CLS, and INP metrics are meeting Google's thresholds.
- **Security & Manual Actions:** Periodically check this tab to ensure the site has no penalties.

> [!WARNING]
> SEO is an ongoing process. While technical SEO and crawlability have been optimized, you cannot guarantee a #1 ranking. Continued relevance of content and domain authority will dictate performance.
