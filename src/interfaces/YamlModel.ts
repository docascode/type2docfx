export interface YamlModel {
    uid: string;
    name: string;
    children: Array<YamlModel> | Array<string>;
    type?: string;
    summary?: string;
}
