import { Application, ProjectReflection } from 'typedoc';
import * as path from 'path';

export function generate(file: string): ProjectReflection {
    const app = new Application({
        mode: 'Modules',
        logger: 'none',
        target: 'ES5',
        module: 'CommonJS',
        includeDeclarations: true,
        ignoreCompilerErrors: true,
        excludeExternals: true
    });

    file = path.resolve(file);
    return app.convert(app.expandInputFiles([file]));
}