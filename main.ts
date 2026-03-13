import { App, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';
import { XReaderView, VIEW_TYPE_XREADER } from './view';

interface XReaderSettings {
    progress: Record<string, string>;
    defaultFontSize: number;
    themeMatch: boolean;
}

const DEFAULT_SETTINGS: XReaderSettings = {
    progress: {},
    defaultFontSize: 100,
    themeMatch: true
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
    }
}
