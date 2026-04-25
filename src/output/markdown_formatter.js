
export function formatNewsToMarkdown(items) {
    let md = `# WORLDUPDATE Report\n`;
    md += `*Generated on ${new Date().toLocaleString()}*\n\n`;
    md += `Filtered tech news that matters.\n\n`;

    const impactOrder = ['CRITICAL', 'MUST_KNOW', 'IMPORTANT', 'OPPORTUNITY', 'NOTABLE', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'];
    const grouped = {};

    for (const impact of impactOrder) {
        const group = items.filter(i => i.impact === impact);
        if (group.length > 0) grouped[impact] = group;
    }

    for (const [impact, group] of Object.entries(grouped)) {
        md += `## [ ${impact} ]\n\n`;
        for (let i = 0; i < group.length; i++) {
            const item = group[i];
            md += `### ${i + 1}. ${item.title}\n`;
            md += `**Source:** ${item.source} | **Time:** ${new Date(item.timestamp).toLocaleString()}\n\n`;
            md += `[Read More](${item.url})\n\n`;
            if (item.insight) {
                md += `> **AI Insight:** ${item.insight}\n\n`;
            }
            md += `---\n\n`;
        }
    }

    const sourceCount = new Set(items.map(i => i.source)).size;
    md += `\n*${items.length} items from ${sourceCount} sources*\n`;
    
    return md;
}

export function formatDigestToMarkdown(digest) {
    let md = `# WORLDUPDATE Weekly Digest\n`;
    md += `*Generated on ${new Date().toLocaleString()}*\n\n`;
    md += `Your week in tech - everything you need to know.\n\n`;

    if (digest.weekSummary) {
        md += `## THIS WEEK IN TECH\n\n`;
        md += `${digest.weekSummary}\n\n`;
    }

    if (digest.themes && digest.themes.length > 0) {
        md += `## MAJOR THEMES\n\n`;
        for (let i = 0; i < digest.themes.length; i++) {
            const theme = digest.themes[i];
            md += `### ${i + 1}. ${theme.name}\n`;
            md += `${theme.description}\n\n`;
        }
    }

    if (digest.items && digest.items.length > 0) {
        md += `## CURATED ITEMS\n\n`;
        const impactOrder = ['MUST_KNOW', 'CRITICAL', 'OPPORTUNITY', 'IMPORTANT', 'NOTABLE'];
        const grouped = {};

        for (const impact of impactOrder) {
            const group = digest.items.filter(i => i.impact === impact);
            if (group.length > 0) grouped[impact] = group;
        }

        for (const [impact, group] of Object.entries(grouped)) {
            md += `### [ ${impact} ]\n\n`;
            for (let i = 0; i < group.length; i++) {
                const item = group[i];
                md += `#### ${i + 1}. ${item.title}\n`;
                md += `**Source:** ${item.source} | **Time:** ${new Date(item.timestamp).toLocaleString()}\n\n`;
                md += `[Read More](${item.url})\n\n`;
                if (item.insight) {
                    md += `> **AI Insight:** ${item.insight}\n\n`;
                }
                md += `---\n\n`;
            }
        }
    }

    md += `\n*${digest.items?.length || 0} items curated for you*\n`;
    
    return md;
}
