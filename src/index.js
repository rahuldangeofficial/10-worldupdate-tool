import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline/promises';
import { homedir } from 'os';
import { getEnabledSources, listSources, config } from './config.js';
import { fetchAllSources } from './crawlers/index.js';
import { analyzeNews, analyzeDigest, deduplicateNews } from './llm/analyzer.js';
import { formatSourceList, formatWarning, formatInfo, formatError } from './output/formatter.js';
import { formatNewsToMarkdown, formatDigestToMarkdown } from './output/markdown_formatter.js';

export async function run(options) {
    // Handle --list-sources
    if (options.listSources) {
        formatSourceList(listSources());
        process.exit(0);
    }

    const limit = parseInt(options.limit) || config.defaults.limit;
    const verbose = options.verbose || false;
    const skipLLM = options.raw || false;
    const digestMode = options.digest || false;

    // Get enabled sources based on filters
    const enabledSources = getEnabledSources(options.sources, options.category);

    if (enabledSources.length === 0) {
        formatWarning('No sources enabled. Use --list-sources to see available sources.');
        process.exit(1);
    }

    console.log();

    // Step 1: Fetch from all sources
    let spinner;
    if (!verbose) {
        spinner = ora({
            text: digestMode
                ? `Crawling ${enabledSources.length} sources for weekly digest...`
                : `Crawling ${enabledSources.length} sources...`,
            color: 'cyan',
            spinner: 'dots',
        }).start();
    } else {
        console.log(chalk.cyan('  Fetching from sources:\n'));
    }

    const { items, errors, successCount, totalSources } = await fetchAllSources(
        enabledSources,
        verbose,
        (msg) => console.log(msg)
    );

    if (!verbose && spinner) {
        if (items.length > 0) {
            spinner.succeed(`Fetched ${items.length} items (${successCount}/${totalSources} sources)`);
        } else {
            spinner.fail('No items fetched');
        }
    } else if (verbose) {
        console.log(chalk.gray(`\n  Total: ${items.length} items from ${successCount}/${totalSources} sources`));
    }

    if (items.length === 0) {
        formatWarning('No items fetched. Check your network connection.');
        process.exit(1);
    }

    // Step 2: Deduplicate
    if (!verbose) {
        spinner = ora('Removing duplicates...').start();
    }

    const uniqueItems = await deduplicateNews(items);
    const dupeCount = items.length - uniqueItems.length;

    if (!verbose && spinner) {
        spinner.succeed(`${uniqueItems.length} unique items (${dupeCount} duplicates removed)`);
    } else if (verbose) {
        formatInfo(`Deduplicated: ${uniqueItems.length} unique (removed ${dupeCount})`);
    }

    // Step 3: LLM Analysis
    let finalItems = [];
    if (skipLLM) {
        finalItems = uniqueItems.slice(0, limit).map(item => ({
            ...item,
            impact: 'NOTABLE',
            insight: null,
        }));
        formatInfo('Skipping LLM analysis (--raw mode)');
    } else if (!config.openai.apiKey) {
        formatWarning('OPENAI_API_KEY not set. Running in raw mode.');
        formatInfo('Set the environment variable or create a .env file.');
        finalItems = uniqueItems.slice(0, limit).map(item => ({
            ...item,
            impact: 'NOTABLE',
            insight: null,
        }));
    }

    // Step 4: Output and Save Report
    let reportContent = '';
    let reportName = digestMode ? 'weekly_digest' : 'daily_news';
    
    if (digestMode) {
        if (!verbose) {
            spinner = ora(`Creating weekly digest with AI (${config.openai.model})...`).start();
        }

        const digest = await analyzeDigest(uniqueItems, limit + 5);

        if (!verbose && spinner) {
            spinner.succeed(`Digest ready: ${digest.themes?.length || 0} themes, ${digest.items?.length || 0} items`);
        }

        reportContent = formatDigestToMarkdown(digest);
    } else {
        if (finalItems.length === 0) {
            if (!verbose) {
                spinner = ora(`Analyzing with AI (${config.openai.model})...`).start();
            }

            finalItems = await analyzeNews(uniqueItems, limit);

            if (!verbose && spinner) {
                spinner.succeed(`Analyzed and filtered to ${finalItems.length} impactful items`);
            }
        }

        reportContent = formatNewsToMarkdown(finalItems);
    }

    // Interactive Prompt for Save Location
    console.log();
    const isMac = process.platform === 'darwin';
    const defaultDir = isMac ? path.join(homedir(), 'Documents') : homedir();
    const defaultPath = path.join(defaultDir, `worldupdate_${reportName}_${new Date().toISOString().split('T')[0]}.md`);

    console.log(chalk.cyan(`  Suggesting save location (${isMac ? 'macOS' : 'Linux'}):`));
    console.log(chalk.gray(`  ${defaultPath}`));
    console.log();

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    try {
        const answer = await rl.question(chalk.bold.white('  Enter path to save Markdown report (or press Enter for default): '));
        const savePath = answer.trim() || defaultPath;
        const absolutePath = path.isAbsolute(savePath) ? savePath : path.resolve(process.cwd(), savePath);

        // Ensure directory exists
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        
        await fs.writeFile(absolutePath, reportContent);
        
        console.log();
        console.log(chalk.green.bold(`  ✔ Report successfully saved to: `) + chalk.white.underline(absolutePath));
        console.log(chalk.gray(`  You can open this file in any Markdown viewer or text editor to access clickable links.`));
        console.log();
    } catch (err) {
        formatError(`Failed to save report: ${err.message}`);
    } finally {
        rl.close();
    }

    // Show errors in verbose mode
    if (verbose && errors.length > 0) {
        console.log(chalk.gray('  Source errors:'));
        for (const err of errors) {
            console.log(chalk.gray(`    - ${err.source}: ${err.error}`));
        }
        console.log();
    }

    process.exit(0);
}
