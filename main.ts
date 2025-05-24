import { Plugin, MarkdownPostProcessorContext, TFile } from "obsidian";

export default class CharacterFormPlugin extends Plugin {
  onload() {
    this.registerMarkdownCodeBlockProcessor(
      "character-form",
      (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) =>
        this.renderForm(source, el, ctx)
    );
  }

  async renderForm(
    source: string,
    el: HTMLElement,
    ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    // split into lines, each typed as string
    const lines: string[] = source.split("\n");
    // map each line -> [key, value] tuple
    const data = Object.fromEntries(
      lines.map((line: string): [string, string] => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim()];
      })
    );

    const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
    if (!(file instanceof TFile)) return;

    for (const key of Object.keys(data)) {
      const wrapper = el.createDiv({ cls: "character-input" });
      wrapper.createEl("label", { text: key[0].toUpperCase() + key.slice(1) });
      const input = wrapper.createEl("input", {
        type: "text",
        value: data[key] || ""
      }) as HTMLInputElement;

      input.addEventListener("change", async (): Promise<void> => {
        const newValue: string = input.value;
        const fileContent: string = await this.app.vault.read(file);

        // replace callback also needs types
        const newContent: string = fileContent.replace(
          /```character-form\n([\s\S]*?)\n```/,
          (_match: string, oldBlock: string): string => {
            const updatedLines: string[] = oldBlock
              .split("\n")
              .map((line: string): string => {
                const [lineKey] = line.split(":");
                return lineKey.trim() === key
                  ? `${key}: ${newValue}`
                  : line;
              });
            return "```character-form\n" + updatedLines.join("\n") + "\n```";
          }
        );

        await this.app.vault.modify(file, newContent);
      });
    }
  }
}
