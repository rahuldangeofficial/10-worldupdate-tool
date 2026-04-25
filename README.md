# worldupdate

A CLI tool that crawls 20+ tech news sources and uses AI to surface what actually matters. Instead of overwhelming your terminal, it generates a clean, professional **Markdown Report** with perfectly clickable links.

![Weekly Digest](assets/demo-1.png)

## Features

- **20+ Sources**: Hacker News, Reddit, Lobsters, GitHub, The Hacker News, Krebs, and more.
- **AI-Powered Filtering**: GPT-4o analyzes and ranks news by real impact.
- **Markdown Reports**: Generates professional `.md` files that you can read in any editor (VS Code, Obsidian, etc.).
- **Interactive Save**: Prompts you for a save location with OS-specific suggestions.
- **Weekly Digest Mode**: Themes, summaries, and must-know items for weekly check-ins.
- **Opportunity Detection**: Highlights deals, free tiers, and limited-time offers.

## Installation

```bash
git clone https://github.com/rahuldangeofficial/10-worldupdate-CLI.git
cd 10-worldupdate-CLI
./install.sh
```

## Setup

Add your OpenAI API key to a `.env` file or your environment:

```bash
echo "OPENAI_API_KEY=sk-your-key-here" > ~/.worldupdate.env
```

## Usage

Run the tool and follow the prompt to save your report:

```bash
# Daily filtered news report
worldupdate

# Weekly digest report with themes
worldupdate --digest

# Advanced options
worldupdate --limit 25
worldupdate --category security
worldupdate --category ai
worldupdate --raw              # skip AI analysis
worldupdate --list-sources     # see all 20+ sources
```

## How It Works

1. **Fetch**: Crawls 20+ sources in parallel with retry logic.
2. **Deduplicate**: Removes duplicate stories across sources.
3. **Analyze**: GPT-4o filters for genuine impact (not just trending).
4. **Generate**: Creates a structured Markdown file with functional, clickable links.

### Digest Mode

Perfect for weekly check-ins:
- **THIS WEEK IN TECH**: 2-3 sentence overview.
- **MAJOR THEMES**: Recurring topics grouped together.
- **MUST KNOW**: Essential items even if you read nothing else.
- **OPPORTUNITY**: Deals, free tiers, and limited-time offers.

## Sources

| Category | Sources |
|----------|---------|
| Tech | Hacker News, Lobsters, Slashdot, Techmeme |
| Reddit | r/programming, r/technology, r/netsec, r/MachineLearning, r/devops, r/golang, r/rust, r/javascript |
| Developer | DEV.to, Hashnode, DZone |
| GitHub | Trending, Blog |
| Security | The Hacker News, Krebs on Security, Ars Technica |
| AI/ML | Papers With Code |
| Product | Product Hunt |

## Requirements

- Node.js 18+
- OpenAI API key

## License

MIT
