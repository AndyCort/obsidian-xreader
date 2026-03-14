import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, TFile } from 'obsidian';
import { XReaderView, VIEW_TYPE_XREADER } from './view';

interface XReaderSettings {
    progress: Record<string, string>;
    defaultFontSize: number;
    themeMatch: boolean;
    themeColor: string;
}

const DEFAULT_SETTINGS: XReaderSettings = {
    progress: {},
    defaultFontSize: 100,
    themeMatch: true,
    themeColor: 'light'
}

export default class XReaderPlugin extends Plugin {
    settings: XReaderSettings;

    async onload() {
        console.log('loading XReader plugin');

        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_XREADER,
            (leaf: WorkspaceLeaf) => new XReaderView(leaf, this)
        );

        try {
            // Unregister any existing view handling epub (e.g. from Obsidian or other plugins)
            // @ts-ignore: Obsidian internal API
            this.app.viewRegistry.unregisterExtensions(["epub"]);
        } catch (e) {
            console.log("No existing epub extension to unregister.", e);
        }

        this.registerExtensions(["epub"], VIEW_TYPE_XREADER);

        this.addSettingTab(new XReaderSettingTab(this.app, this));

        // Register deep link handler: obsidian://xreader?path=...&cfi=...
        this.registerObsidianProtocolHandler("xreader", async (data) => {
            const path = data.path;
            const cfi = data.cfi;

            if (path) {
                const file = this.app.vault.getAbstractFileByPath(path);
                if (file instanceof TFile) {
                    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_XREADER);
                    let leaf = leaves.find(l => (l.view as XReaderView).file?.path === path);

                    if (!leaf) {
                        leaf = this.app.workspace.getLeaf('tab');
                        await leaf.openFile(file);
                    } else {
                        this.app.workspace.setActiveLeaf(leaf);
                    }

                    if (cfi && leaf.view instanceof XReaderView) {
                        leaf.view.rendition?.display(cfi);
                    }
                }
            }
        });
    }

    onunload() {
        console.log('unloading XReader plugin');
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class XReaderSettingTab extends PluginSettingTab {
    plugin: XReaderPlugin;

    constructor(app: App, plugin: XReaderPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName('Default Font Size')
            .setDesc('Set the default font size (percentage) for reading.')
            .addSlider(slider => slider
                .setLimits(50, 200, 10)
                .setValue(this.plugin.settings.defaultFontSize)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.defaultFontSize = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Match Obsidian Theme')
            .setDesc('Automatically match the e-book theme to Obsidian\'s Dark or Light mode.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.themeMatch)
                .onChange(async (value) => {
                    this.plugin.settings.themeMatch = value;
                    await this.plugin.saveSettings();
                }));
        new Setting(containerEl)
            .setName('Background Theme')
            .setDesc('Select the background theme (only applies if "Match Obsidian Theme" is off).')
            .addDropdown(dropdown => dropdown
                .addOption('light', 'Light')
                .addOption('dark', 'Dark')
                .addOption('sepia', 'Sepia')
                .setValue(this.plugin.settings.themeColor)
                .onChange(async (value) => {
                    this.plugin.settings.themeColor = value;
                    await this.plugin.saveSettings();
                }));
    }
}
