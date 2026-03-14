import { FileView, WorkspaceLeaf, TFile } from 'obsidian';
import ePub, { Book, Rendition, Location } from 'epubjs';
import XReaderPlugin from './main';

export const VIEW_TYPE_XREADER = "xreader-view";

export class XReaderView extends FileView {
    plugin: XReaderPlugin;
    book: Book | null = null;
    rendition: Rendition | null = null;
    actionEl: HTMLElement;
    currentFontSize: number = 100;

    // Tell Obsidian this view always requires a file to function properly
    allowNoFile: boolean = false;

    constructor(leaf: WorkspaceLeaf, plugin: XReaderPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.setupActions();
    }

    setupActions() {
        this.addAction('arrow-left', 'Previous Page', () => this.rendition?.prev());
        this.addAction('arrow-right', 'Next Page', () => this.rendition?.next());
        this.addAction('minus', 'Decrease Font', () => this.changeFontSize(-10));
        this.addAction('plus', 'Increase Font', () => this.changeFontSize(10));
    }

    changeFontSize(delta: number) {
        this.currentFontSize += delta;
        if (this.rendition && this.rendition.themes) {
            this.rendition.themes.fontSize(`${this.currentFontSize}%`);
        }
    }

    getViewType(): string {
        return VIEW_TYPE_XREADER;
    }

    getDisplayText(): string {
        return this.file ? this.file.basename : "XReader";
    }

    getIcon(): string {
        return "book-open";
    }

    async onLoadFile(file: TFile): Promise<void> {
        this.leaf.tabHeaderInnerTitleEl.innerText = file.basename;

        const url = this.app.vault.getResourcePath(file);
        const buffer = await this.app.vault.readBinary(file);

        const container = this.contentEl;
        container.empty();

        const debugDiv = container.createDiv({ cls: 'xreader-debug', text: `Loading ${file.basename}... (Buffer size: ${buffer.byteLength} bytes)` });
        debugDiv.setAttribute("style", "padding: 10px; color: orange; z-index: 100; position: absolute; font-weight: bold;");

        const readerWrapper = container.createDiv({ cls: 'xreader-wrapper' });
        const readerDiv = readerWrapper.createDiv({ cls: 'xreader-container' });

        try {
            this.book = ePub(buffer);
            this.rendition = this.book.renderTo(readerDiv, {
                width: "100%",
                height: "100%",
                flow: "scrolled",
                manager: "continuous"
            });

            this.currentFontSize = this.plugin.settings.defaultFontSize;

            // Inject Obsidian CSS variables into the iframe
            this.rendition.hooks.content.register((contents: any) => {
                const doc = contents.window.document;
                const styleEl = doc.createElement("style");

                // Function to get current Obsidian styles
                const getObsidianStyles = () => {
                    const bodyStyle = getComputedStyle(document.body);
                    return `
                    :root {
                        --text-normal: ${bodyStyle.getPropertyValue('--text-normal')};
                        --text-muted: ${bodyStyle.getPropertyValue('--text-muted')};
                        --text-faint: ${bodyStyle.getPropertyValue('--text-faint')};
                        --text-accent: ${bodyStyle.getPropertyValue('--text-accent')};
                        --background-primary: ${bodyStyle.getPropertyValue('--background-primary')};
                        --background-secondary: ${bodyStyle.getPropertyValue('--background-secondary')};
                        --interactive-accent: ${bodyStyle.getPropertyValue('--interactive-accent')};
                        --text-selection: ${bodyStyle.getPropertyValue('--text-selection')};
                        --font-text: ${bodyStyle.getPropertyValue('--font-text')};
                        --font-monospace: ${bodyStyle.getPropertyValue('--font-monospace')};
                        --hr-color: ${bodyStyle.getPropertyValue('--hr-color')};
                        --blockquote-border-color: ${bodyStyle.getPropertyValue('--blockquote-border-color')};
                        --code-background: ${bodyStyle.getPropertyValue('--code-background')};
                        --code-normal: ${bodyStyle.getPropertyValue('--code-normal')};
                    }
                    ::selection {
                        background-color: var(--text-selection) !important;
                    }
                `;
                };

                styleEl.textContent = getObsidianStyles();
                doc.head.appendChild(styleEl);

                // Update styles when Obsidian theme changes
                this.plugin.registerEvent(
                    this.app.workspace.on('css-change', () => {
                        styleEl.textContent = getObsidianStyles();
                    })
                );
            });

            // Apply Theme
            if (this.plugin.settings.themeMatch) {
                this.rendition.themes.register("obsidian", {
                    "body": {
                        "background": "var(--background-primary) !important",
                        "color": "var(--text-normal) !important",
                        "font-family": "var(--font-text), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important",
                        "line-height": "1.6 !important",
                        "padding": "20px 10% !important",
                        "font-size": "1em !important"
                    },
                    "p": {
                        "color": "var(--text-normal) !important",
                        "margin-bottom": "1.2em !important"
                    },
                    "h1, h2, h3, h4, h5, h6": {
                        "color": "var(--text-normal) !important",
                        "font-weight": "600 !important",
                        "line-height": "1.3 !important",
                        "margin-top": "1.5em !important",
                        "margin-bottom": "0.5em !important"
                    },
                    "h1": { "font-size": "1.8em !important", "border-bottom": "1px solid var(--hr-color) !important", "padding-bottom": "0.3em !important" },
                    "h2": { "font-size": "1.5em !important", "border-bottom": "1px solid var(--hr-color) !important", "padding-bottom": "0.2em !important" },
                    "h3": { "font-size": "1.3em !important" },
                    "a": {
                        "color": "var(--text-accent) !important",
                        "text-decoration": "none !important"
                    },
                    "a:hover": {
                        "text-decoration": "underline !important"
                    },
                    "hr": {
                        "background-color": "var(--hr-color) !important",
                        "height": "1px !important",
                        "border": "none !important",
                        "margin": "2em 0 !important"
                    },
                    "blockquote": {
                        "border-left": "4px solid var(--blockquote-border-color) !important",
                        "margin": "1em 0 !important",
                        "padding": "0.5em 1em !important",
                        "color": "var(--text-muted) !important",
                        "background-color": "var(--background-secondary) !important"
                    },
                    "code": {
                        "background-color": "var(--code-background) !important",
                        "color": "var(--code-normal) !important",
                        "padding": "0.2em 0.4em !important",
                        "border-radius": "3px !important",
                        "font-family": "var(--font-monospace) !important",
                        "font-size": "0.9em !important"
                    },
                    "pre": {
                        "background-color": "var(--code-background) !important",
                        "padding": "1em !important",
                        "border-radius": "4px !important",
                        "overflow-x": "auto !important",
                        "margin": "1em 0 !important"
                    },
                    "pre code": {
                        "padding": "0 !important",
                        "background-color": "transparent !important"
                    },
                    "ul, ol": {
                        "padding-left": "2em !important",
                        "margin-bottom": "1em !important"
                    },
                    "li": {
                        "margin-bottom": "0.5em !important"
                    },
                    "img": {
                        "max-width": "100% !important",
                        "height": "auto !important"
                    }
                });
                this.rendition.themes.select("obsidian");
            } else {
                const customThemes: Record<string, any> = {
                    light: {
                        body: { background: "#ffffff !important", color: "#333333 !important" },
                        p: { color: "#333333 !important" },
                        "h1, h2, h3, h4, h5, h6": { color: "#333333 !important" },
                        a: { color: "#0066cc !important" }
                    },
                    dark: {
                        body: { background: "#1e1e1e !important", color: "#e0e0e0 !important" },
                        p: { color: "#e0e0e0 !important" },
                        "h1, h2, h3, h4, h5, h6": { color: "#e0e0e0 !important" },
                        a: { color: "#4da6ff !important" }
                    },
                    sepia: {
                        body: { background: "#f4ecd8 !important", color: "#5b4636 !important" },
                        p: { color: "#5b4636 !important" },
                        "h1, h2, h3, h4, h5, h6": { color: "#5b4636 !important" },
                        a: { color: "#8b6b53 !important" }
                    }
                };
                this.rendition.themes.register("custom", customThemes[this.plugin.settings.themeColor] || customThemes.light);
                this.rendition.themes.select("custom");
            }

            this.rendition.themes.fontSize(`${this.currentFontSize}%`);

            // Listen to selection
            this.rendition.on("selected", (cfiRange: string, contents: any) => {
                const range = contents.range(cfiRange);
                const selection = contents.window.getSelection();
                const selectedText = selection.toString();

                if (selectedText) {
                    // Create a small floating button/menu near the selection
                    const rect = range.getBoundingClientRect();
                    const menu = document.body.createDiv({ cls: 'xreader-selection-menu' });
                    menu.style.position = 'fixed';
                    menu.style.top = `${rect.top - 40}px`;
                    menu.style.left = `${rect.left + rect.width / 2 - 50}px`;
                    menu.style.zIndex = '1000';

                    const copyBtn = menu.createEl('button', { text: 'Copy as Quote', cls: 'mod-cta' });
                    copyBtn.onclick = () => {
                        const bookPath = this.file?.path || "";
                        const quote = `> ${selectedText.replace(/\n/g, '\n> ')}\n\n[Reference](${encodeURI(`obsidian://xreader?path=${bookPath}&cfi=${cfiRange}`)})`;

                        navigator.clipboard.writeText(quote).then(() => {
                            // @ts-ignore
                            new Notice("Quote copied to clipboard!");
                            menu.remove();
                            this.rendition?.annotations.add("highlight", cfiRange, {}, (e: any) => {
                                console.log("highlight clicked", e.target);
                            }, "hl", { "fill": "yellow", "fill-opacity": "0.3" });
                        });
                    };

                    // Remove menu when clicking elsewhere
                    const removeMenu = (e: MouseEvent) => {
                        if (!menu.contains(e.target as Node)) {
                            menu.remove();
                            document.removeEventListener('mousedown', removeMenu);
                        }
                    };
                    document.addEventListener('mousedown', removeMenu);
                }
            });

            // Listen to progress
            this.rendition.on("relocated", (location: Location) => {
                if (this.file && location && location.start) {
                    this.plugin.settings.progress[this.file.path] = location.start.cfi;
                    this.plugin.saveSettings();
                }
            });

            // Load saved progress
            try {
                debugDiv.innerText += "\nCalling rendition.display()...";
                const savedCfi = this.plugin.settings.progress[file.path];
                if (savedCfi) {
                    await this.rendition.display(savedCfi);
                } else {
                    await this.rendition.display();
                }
                debugDiv.innerText += "\nEPUB rendered successfully!";
                setTimeout(() => { debugDiv.style.display = 'none'; }, 3000);
            } catch (error) {
                console.error("XReader: Failed to display EPUB:", error);
                debugDiv.style.color = 'red';
                debugDiv.innerText += `\nError loading EPUB: ${error.message || error}`;
            }
        } catch (globalError) {
            console.error("XReader: Global EPUB error:", globalError);
            debugDiv.style.color = 'red';
            debugDiv.innerText += `\nGlobal Exception: ${globalError.message || globalError}`;
        }
    }

    async onClose() {
        if (this.book) {
            this.book.destroy();
            this.book = null;
        }
    }

    // Required by FileView to confirm which files it can render
    canAcceptExtension(extension: string) {
        return extension === "epub";
    }
}
