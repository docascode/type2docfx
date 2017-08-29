export interface YamlModel {
    uid: string;
    name: string;
    children: Array<YamlModel> | Array<string>;
    langs: Array<string>;
    type?: string;
    summary?: string;
}
