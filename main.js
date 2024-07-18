const moment = require('moment');

class MyPlugin extends Plugin {
    onload() {
        this.registerMarkdownCodeBlockProcessor("dataviewjs", this.processShortcode.bind(this));
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

    async processShortcode(source, el, ctx) {
        const params = this.parseParameters(source);

        const startDate = moment(params.start_date).toDate();
        const endDate = moment(params.end_date).toDate();
        const tags = params.tags.split(",").map(tag => tag.trim());
        const folderFilter = params.folder_filter;

        const pages = dv.pages(folderFilter)
            .where(p => {
                const hasTags = tags.some(tag => p[tag]);
                const isWithinDateRange = new Date(p.file.ctime) >= startDate && new Date(p.file.ctime) <= endDate;
                return isWithinDateRange && hasTags;
            })
            .sort((a, b) => new Date(a.file.ctime) - new Date(b.file.ctime));

        let promises = [];
        const resultList = pages.map(p => {
            let found = [`[[${p.file.name}]]`, []];
            tags.forEach(tag => {
                if (p[tag]) {
                    promises.push(this.getLinesWithTag(p, tag).then(linesWithTag => {
                        found[1].push(linesWithTag.join("\n\r"));
                    }).catch(() => {
                        found[1].push(`No lines found with tag: ${tag}`);
                    }));
                } else {
                    found[1].push(`No metadata field found for tag: ${tag}`);
                }
            });
            return found;
        });

        Promise.allSettled(promises).then(() => {
            const results = resultList.map(v => `${v[0]}\n - ${v[1].join("\n  ")}`);
            dv.list(results);
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
