import feedparser
import logging

logger = logging.getLogger(__name__)

# Free RSS feeds for global economics and geopolitics
RSS_FEEDS = [
    "https://news.google.com/rss/search?q=geopolitics+global+economy&hl=en-US&gl=US&ceid=US:en",
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC"
]

def get_latest_news(max_articles: int = 10) -> list[str]:
    """
    Fetches the latest news headlines and descriptions from free RSS feeds.
    Returns a list of strings containing the headline and a short summary.
    """
    articles = []
    
    for feed_url in RSS_FEEDS:
        try:
            feed = feedparser.parse(feed_url)
            for entry in feed.entries:
                title = entry.title
                
                # Some feeds include description/summary
                # Google News usually just has a title or standard blurb.
                # Yahoo Finance might have a brief description.
                summary = getattr(entry, "summary", "")
                
                # keep it brief to save AI tokens
                if summary and len(summary) > 200:
                    summary = summary[:200] + "..."
                
                news_item = f"Title: {title}"
                if summary:
                    # Strip basic HTML tags if any (basic cleanup)
                    clean_summary = summary.replace("<p>", "").replace("</p>", "").replace("<b>", "").replace("</b>", "")
                    news_item += f" | Snippet: {clean_summary}"
                
                articles.append(news_item)
                
                if len(articles) >= max_articles:
                    break
        except Exception as e:
            logger.error(f"Failed to fetch RSS from {feed_url}: {e}")
            
        if len(articles) >= max_articles:
            break
            
    return articles

if __name__ == "__main__":
    news = get_latest_news()
    for n in news:
        print(n)
