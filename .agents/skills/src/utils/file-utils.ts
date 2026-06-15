/**
 * File system utilities for skills
 */

import { promises as fs } from 'fs';
import { join, relative } from 'path';
import { glob } from 'glob';

export class FileUtils {
  /**
   * Get project root directory
   */
  static getProjectRoot(): string {
    // Assuming skills are in .claude/skills
    return join(process.cwd());
  }

  /**
   * Find files matching pattern
   */
  static async findFiles(pattern: string, cwd?: string): Promise<string[]> {
    const searchDir = cwd || this.getProjectRoot();
    return glob(pattern, {
      cwd: searchDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/build/**']
    });
  }

  /**
   * Read file content
   */
  static async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get relative path from project root
   */
  static getRelativePath(filePath: string): string {
    return relative(this.getProjectRoot(), filePath);
  }

  /**
   * Parse TypeScript/JavaScript file to AST
   */
  static parseCode(content: string): { hasImport: (name: string) => boolean; hasFunction: (name: string) => boolean; getExports: () => string[] } {
    return {
      hasImport: (name: string) => content.includes(`import`) && content.includes(name),
      hasFunction: (name: string) => {
        const patterns = [
          new RegExp(`function\\s+${name}\\s*\\(`),
          new RegExp(`const\\s+${name}\\s*=.*=>`),
          new RegExp(`export\\s+.*function\\s+${name}`)
        ];
        return patterns.some(p => p.test(content));
      },
      getExports: () => {
        const exportMatches = content.match(/export\s+(const|function|class|interface|type)\s+(\w+)/g) || [];
        return exportMatches.map(m => m.split(/\s+/).pop() || '');
      }
    };
  }

  /**
   * Extract line content from file
   */
  static getLineContent(content: string, lineNumber: number): string {
    const lines = content.split('\n');
    return lines[lineNumber - 1] || '';
  }

  /**
   * Count lines in file
   */
  static countLines(content: string): number {
    return content.split('\n').length;
  }
}
