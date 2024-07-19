const {Plugin} = require('obsidian');
import moment from 'moment';

class MyPlugin extends Plugin {
    async onload() {
        // Wait for Dataview plugin to load
        this.app.workspace.onLayoutReady(this.initialize.bind(this));
    }

    initialize() {
        // Check if Dataview is available
        if (!this.app.plugins.enabledPlugins.has('dataview')) {
            console.error('Dataview plugin is not enabled');
            return;
        }
        this.dv = this.app.plugins.plugins.dataview.api;
        this.registerMarkdownCodeBlockProcessor("customdataviewjs", this.processShortcode.bind(this));
    }

    onunload() {
        // Clean up when the plugin is unloaded
    }

    async getLinesWithTag(p, tag) {
        const file = await this.app.vault.getAbstractFileByPath(p.file.path);
        const content = await this.app.vault.read(file);
        let lines = content?.split("\n");
        return lines?.filter(line => line.includes(tag));
    }

    async processShortcode(source, el, _ctx) {
        const params = this.parseParameters(source);
        console.log("Parsed parameters:", params);

        const startDate = moment(params.start_date).toDate();
        const endDate = moment(params.end_date).toDate();
        const tags = params.tags.split(",").map(tag => tag.trim());
        const folderFilter = params.folder_filter;

        console.log("Filtering pages with params:", { startDate, endDate, tags, folderFilter });

        const allPages = this.dv.pages(folderFilter);
        console.log("All pages:", allPages);
        console.log(Array.isArray(tags), tags);
        const pages = allPages
            .where(p => {
                const hasTags = tags.some(tag => p[tag]);
                const isWithinDateRange = new Date(p.file?.ctime) >= startDate && new Date(p.file?.ctime) <= endDate;
                return isWithinDateRange && hasTags;
            })
            .sort((a, b) => new Date(a.file?.ctime) - new Date(b.file?.ctime));

        console.log("Filtered pages:", pages);

        let promises = [];
        const resultList = pages.map(p => {
            let found = [`[[${p.file.name}]]`, []];
            console.log(`tags: ${tags} for page:`);
            console.dir(p)
            tags.forEach(tag => {
                console.log(`tag: ${tag}, value: ${p.file.tags.values}`);
                if (p.file?.tags?.values) {
                    promises.push(this.getLinesWithTag(p, tag).then(linesWithTag => {
                        found[1].push(linesWithTag);
                    }).catch(() => {
                        console.log(`No lines found with tag: ${tag}`);
                    }));
                } else {
                    console.log(`No metadata field found for tag: ${tag}`);
                }
            });
            return found;
        });

        Promise.allSettled(promises).then(() => {
            const results = resultList.map(v => `${v[0]}\n - ${v[1].join("\n\r   ")}`);
            console.log("Results to be displayed:", results);
            const ul = el.createEl('ul');
            results.forEach(result => {
                ul.createEl('li', { text: result });
            });
        });
    }

    parseParameters(source) {
        const params = {};
        source.split("\n").forEach(line => {
            const [key, value] = line.split(":").map(part => part.trim());
            if (key && value) {
                params[key] = value;
            }
        });
        return params;
    }
}

module.exports = MyPlugin;
