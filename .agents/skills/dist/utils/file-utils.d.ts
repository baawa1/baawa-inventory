/**
 * File system utilities for skills
 */
export declare class FileUtils {
    /**
     * Get project root directory
     */
    static getProjectRoot(): string;
    /**
     * Find files matching pattern
     */
    static findFiles(pattern: string, cwd?: string): Promise<string[]>;
    /**
     * Read file content
     */
    static readFile(filePath: string): Promise<string>;
    /**
     * Check if file exists
     */
    static fileExists(filePath: string): Promise<boolean>;
    /**
     * Get relative path from project root
     */
    static getRelativePath(filePath: string): string;
    /**
     * Parse TypeScript/JavaScript file to AST
     */
    static parseCode(content: string): {
        hasImport: (name: string) => boolean;
        hasFunction: (name: string) => boolean;
        getExports: () => string[];
    };
    /**
     * Extract line content from file
     */
    static getLineContent(content: string, lineNumber: number): string;
    /**
     * Count lines in file
     */
    static countLines(content: string): number;
}
//# sourceMappingURL=file-utils.d.ts.map