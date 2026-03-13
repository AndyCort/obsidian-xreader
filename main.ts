import { Plugin, WorkspaceLeaf } from 'obsidian';
import { XReaderView, VIEW_TYPE_XREADER } from './view';

interface XReaderSettings {
    progress: Record<string, string>;
}

const DEFAULT_SETTINGS: XReaderSettings = {
    progress: {}
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

        this.registerExtensions(["epub"], VIEW_TYPE_XREADER);
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
