export interface TocItem {
    uid: string;
    name: string;
    items?: Array<TocItem>;
}
