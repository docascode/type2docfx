import { RepoConfig } from "../interfaces/RepoConfig";

export class Context {
    private parentUid: string;
    private parentKind: string;
    private repo: RepoConfig;
    private packageName: string;
    private namespaceName: string;
    private moduleName: string;
    private references: Map<string, string[]>

    constructor(
        repo: RepoConfig,
        parentUid: string,
        parentKind: string,
        packageName: string,
        namespaceName: string,
        moduleName: string,
        references: Map<string, string[]>) {
        this.repo = repo;
        this.packageName = packageName;
        this.namespaceName = namespaceName;
        this.moduleName = moduleName;
        this.parentUid = parentUid;
        this.parentKind = parentKind;
        this.references = references;
    }

    public get PackageName() {
        return this.packageName;
    }

    public get NamespaceName() {
        return this.namespaceName;
    }

    public get ModuleName() {
        return this.moduleName;
    }

    public get References() {
        return this.references;
    }

    public get Repo(): RepoConfig {
        return this.repo;
    }

    public get ParentUid(): string {
        if (this.parentUid === '') {
            return this.PackageName;
        }
        
        return this.parentUid;
    }

    public set ParentUid(uid: string) {
        this.parentUid = uid;
    }

    public get ParentKind(): string {
        return this.parentKind;
    }
}