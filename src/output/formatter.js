import chalk from 'chalk';

// Use basic ANSI colors for cross-terminal compatibility
const COLORS = {
    red: chalk.red,
    yellow: chalk.yellow,
    green: chalk.green,
    blue: chalk.blue,
    magenta: chalk.magenta,
    cyan: chalk.cyan,
    white: chalk.white,
    gray: chalk.gray,
    bold: chalk.bold,
};

const IMPACT_CONFIG = {
    CRITICAL: { label: 'CRITICAL', color: COLORS.red },
    MUST_KNOW: { label: 'MUST KNOW', color: COLORS.red },
    IMPORTANT: { label: 'IMPORTANT', color: COLORS.yellow },
    OPPORTUNITY: { label: 'OPPORTUNITY', color: COLORS.magenta },
    NOTABLE: { label: 'NOTABLE', color: COLORS.cyan },
    HIGH: { label: 'CRITICAL', color: COLORS.red },
    MEDIUM: { label: 'IMPORTANT', color: COLORS.yellow },
    LOW: { label: 'NOTABLE', color: COLORS.cyan },
    UNKNOWN: { label: 'UNRANKED', color: COLORS.gray },
};

function wrapText(text, width) {
    if (!text || text.length <= width) return [text || ''];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    for (const word of words) {
        if ((currentLine + ' ' + word).trim().length <= width) {
            currentLine = (currentLine + ' ' + word).trim();
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

function formatTimestamp(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
}

function shortenUrl(url, maxLen = 80) {
    if (!url) return '';
    try {
        const u = new URL(url);
        const protocol = u.protocol + '//';
        const domain = u.hostname.replace(/^www\./, '');
        const path = u.pathname;
        const full = protocol + domain + path;
        if (full.length <= maxLen) return full;
        
        // Ensure we at least have protocol + domain
        const base = protocol + domain;
        const avail = maxLen - base.length - 4;
        if (avail > 10) return base + path.slice(0, avail) + '...';
        return base + '/...';
    } catch {
        if (url.length <= maxLen) return url;
        return url.slice(0, maxLen - 3) + '...';
    }
}

function terminalLink(text, url) {
    if (!url) return text;
    
    // Apple Terminal doesn't support OSC 8 hyperlinks and can be confused by the escape sequences.
    // For Terminal.app, we just return the text and rely on its built-in URL detection.
    if (process.env.TERM_PROGRAM === 'Apple_Terminal') {
        return text;
    }
    
    // Use \u0007 (BEL) as the terminator for OSC 8 links for better compatibility in modern terminals
    return `\u001b]8;;${url}\u0007${text}\u001b]8;;\u0007`;
}

export function formatDigest(digest, verbose = false) {
    const width = 76;
    const line = '-'.repeat(width - 2);

    console.log();
    console.log(COLORS.bold.white('  WORLDUPDATE WEEKLY DIGEST'));
    console.log(COLORS.gray('  Your week in tech - everything you need to know'));
    console.log(COLORS.gray('  ' + line));

    if (digest.weekSummary) {
        console.log();
        console.log(COLORS.bold.white('  THIS WEEK IN TECH'));
        console.log();
        const summaryLines = wrapText(digest.weekSummary, width - 6);
        for (const l of summaryLines) {
            console.log(COLORS.white(`  ${l}`));
        }
    }

    if (digest.themes && digest.themes.length > 0) {
        console.log();
        console.log(COLORS.gray('  ' + line));
        console.log(COLORS.bold.yellow('\n  MAJOR THEMES\n'));

        for (let i = 0; i < digest.themes.length; i++) {
            const theme = digest.themes[i];
            console.log(COLORS.yellow(`  ${i + 1}. ${theme.name}`));
            const descLines = wrapText(theme.description, width - 6);
            for (const l of descLines) {
                console.log(COLORS.gray(`     ${l}`));
            }
            console.log();
        }
    }

    if (digest.items && digest.items.length > 0) {
        console.log(COLORS.gray('  ' + line));

        const impactOrder = ['MUST_KNOW', 'CRITICAL', 'OPPORTUNITY', 'IMPORTANT', 'NOTABLE'];
        const grouped = {};

        for (const impact of impactOrder) {
            const group = digest.items.filter(i => i.impact === impact);
            if (group.length > 0) grouped[impact] = group;
        }

        for (const [impact, group] of Object.entries(grouped)) {
            const cfg = IMPACT_CONFIG[impact] || IMPACT_CONFIG.NOTABLE;
            console.log(cfg.color(`\n  [ ${cfg.label} ] (${group.length})\n`));

            for (let i = 0; i < group.length; i++) {
                const item = group[i];
                const num = String(i + 1).padStart(2, ' ');

                const titleLines = wrapText(item.title, width - 8);
                console.log(cfg.color(`  ${num}.`) + COLORS.bold.white(` ${titleLines[0]}`));
                for (let j = 1; j < titleLines.length; j++) {
                    console.log(COLORS.bold.white(`      ${titleLines[j]}`));
                }

                const meta = [item.source];
                if (item.score > 0) meta.push(`+${item.score}`);
                meta.push(formatTimestamp(item.timestamp));
                console.log(COLORS.gray(`      ${meta.join('  |  ')}`));

                // Display full URL for maximum clickability
                const displayUrl = item.url;
                console.log(COLORS.gray(`      `) + COLORS.cyan(terminalLink(displayUrl, item.url)));

                if (item.insight) {
                    console.log();
                    const insightLines = wrapText(item.insight, width - 8);
                    for (const l of insightLines) {
                        console.log(COLORS.green(`      ${l}`));
                    }
                }
                console.log();
            }
        }
    }

    console.log(COLORS.gray('  ' + line));
    console.log(COLORS.gray(`  ${digest.items?.length || 0} items curated for you`));
    console.log(COLORS.gray(`  ${new Date().toLocaleString()}`));
    console.log();
}

export function formatNews(items, verbose = false) {
    const width = 76;

    if (items.length === 0) {
        console.log(COLORS.yellow('\n  No news items found.\n'));
        return;
    }

    console.log();
    console.log(COLORS.bold.white('  WORLDUPDATE'));
    console.log(COLORS.gray('  Filtered tech news that matters'));
    console.log(COLORS.gray('  ' + '-'.repeat(width - 2)));
    console.log();

    const impactOrder = ['CRITICAL', 'MUST_KNOW', 'IMPORTANT', 'OPPORTUNITY', 'NOTABLE', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
    const grouped = {};

    for (const impact of impactOrder) {
        const group = items.filter(i => i.impact === impact);
        if (group.length > 0) grouped[impact] = group;
    }

    for (const [impact, group] of Object.entries(grouped)) {
        const cfg = IMPACT_CONFIG[impact] || IMPACT_CONFIG.NOTABLE;
        console.log(cfg.color(`  [ ${cfg.label} ]`) + COLORS.gray(` (${group.length})`));
        console.log();

        for (let i = 0; i < group.length; i++) {
            const item = group[i];
            const num = String(i + 1).padStart(2, ' ');

            const titleLines = wrapText(item.title, width - 8);
            console.log(cfg.color(`  ${num}.`) + COLORS.bold.white(` ${titleLines[0]}`));
            for (let j = 1; j < titleLines.length; j++) {
                console.log(COLORS.bold.white(`      ${titleLines[j]}`));
            }

            const meta = [item.source];
            if (item.score > 0) meta.push(`+${item.score}`);
            if (item.comments > 0) meta.push(`${item.comments} comments`);
            meta.push(formatTimestamp(item.timestamp));
            console.log(COLORS.gray(`      ${meta.join('  |  ')}`));

            // Display full URL for maximum clickability, especially in basic terminals
            const displayUrl = item.url;
            console.log(COLORS.gray(`      `) + COLORS.cyan(terminalLink(displayUrl, item.url)));

            if (item.insight && item.insight.length > 0) {
                console.log();
                const insightLines = wrapText(item.insight, width - 8);
                for (const line of insightLines) {
                    console.log(COLORS.green(`      ${line}`));
                }
            }

            if (verbose) {
                if (item.author) console.log(COLORS.gray(`      by ${item.author}`));
                if (item.tags?.length) console.log(COLORS.gray(`      tags: ${item.tags.join(', ')}`));
            }
            console.log();
        }
    }

    console.log(COLORS.gray('  ' + '-'.repeat(width - 2)));
    const sourceCount = new Set(items.map(i => i.source)).size;
    console.log(COLORS.gray(`  ${items.length} items from ${sourceCount} sources`));
    console.log(COLORS.gray(`  ${new Date().toLocaleString()}`));
    console.log();
}

export function formatSourceList(categories) {
    console.log();
    console.log(COLORS.bold.white('  AVAILABLE SOURCES'));
    console.log(COLORS.gray('  ' + '-'.repeat(50)));
    console.log();

    const categoryNames = { dev: 'Development', security: 'Security', ai: 'AI / Machine Learning' };

    for (const [category, sources] of Object.entries(categories)) {
        console.log(COLORS.yellow(`  ${categoryNames[category] || category.toUpperCase()}`));
        console.log();
        for (const source of sources) {
            console.log(COLORS.cyan(`    ${source.id.padEnd(22)}`), COLORS.white(source.name));
        }
        console.log();
    }

    console.log(COLORS.gray('  ' + '-'.repeat(50)));
    console.log(COLORS.gray('  Usage: --sources hackernews,github_trending'));
    console.log(COLORS.gray('         --category security'));
    console.log(COLORS.gray('         --digest (weekly summary mode)'));
    console.log();
}

export function formatError(message) {
    console.log();
    console.log(COLORS.bold.red('  ERROR: ') + COLORS.red(message));
    console.log();
}

export function formatWarning(message) {
    console.log();
    console.log(COLORS.bold.yellow('  WARNING: ') + COLORS.yellow(message));
    console.log();
}

export function formatInfo(message) {
    console.log(COLORS.gray(`  ${message}`));
}
