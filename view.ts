import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import ePub, { Book, Rendition, Location } from 'epubjs';
import XReaderPlugin from './main';

export const VIEW_TYPE_XREADER = "xreader-view";

export class XReaderView extends ItemView {
    plugin: XReaderPlugin;
    book: Book | null = null;
    rendition: Rendition | null = null;
    file: TFile | null = null;
    actionEl: HTMLElement;
    currentFontSize: number = 100;

    constructor(leaf: WorkspaceLeaf, plugin: XReaderPlugin) {
        super(leaf);
        this.plugin = plugin;
        this.setupActions();
    }

    setupActions() {
        this.addAction('arrow-left', 'Previous Page', () => this.rendition?.prev());
        this.addAction('arrow-right', 'Next Page', () => this.rendition?.next());
        this.addAction('search', 'Increase Font', () => this.changeFontSize(10));
        this.addAction('minus', 'Decrease Font', () => this.changeFontSize(-10));
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
        this.file = file;
        this.leaf.tabHeaderInnerTitleEl.innerText = file.basename;

        const buffer = await this.app.vault.readBinary(file);

        const container = this.contentEl;
        container.empty();

        const readerDiv = container.createDiv({ cls: 'xreader-container' });

        this.book = ePub(buffer, { encoding: "binary" });
        this.rendition = this.book.renderTo(readerDiv, {
            width: "100%",
            height: "100%",
            spread: "none"
        });

        this.currentFontSize = this.plugin.settings.defaultFontSize;

        // Apply Theme
        if (this.plugin.settings.themeMatch) {
            this.rendition.themes.register("obsidian", {
                "body": {
                    "background": "transparent !important",
                    "color": "var(--text-normal) !important",
                    "font-family": "var(--font-text) !important",
                    "line-height": "1.6 !important"
                },
                "p": {
                    "color": "var(--text-normal) !important",
                },
                "h1, h2, h3, h4, h5, h6": {
                    "color": "var(--text-normal) !important",
                },
                "a": {
                    "color": "var(--text-accent) !important",
                }
            });
            this.rendition.themes.select("obsidian");
        }

        this.rendition.themes.fontSize(`${this.currentFontSize}%`);

        // Listen to progress
        this.rendition.on("relocated", (location: Location) => {
            if (this.file && location && location.start) {
                this.plugin.settings.progress[this.file.path] = location.start.cfi;
                this.plugin.saveSettings();
            }
        });

        // Load saved progress
        try {
            const savedCfi = this.plugin.settings.progress[file.path];
            if (savedCfi) {
                await this.rendition.display(savedCfi);
            } else {
                await this.rendition.display();
            }
            console.log("XReader: EPUB rendered successfully.");
        } catch (error) {
            console.error("XReader: Failed to display EPUB:", error);
            const errorDiv = container.createDiv({ cls: 'xreader-error' });
            errorDiv.setText(`Error loading EPUB: ${error.message || error}`);
        }
    }

    async onClose() {
        if (this.book) {
            this.book.destroy();
            this.book = null;
        }
    }
}
