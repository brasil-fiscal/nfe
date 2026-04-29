import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  SchemaValidator,
  ValidationResult,
  ValidationError
} from '@nfe/contracts/SchemaValidator';

const DEFAULT_SCHEMAS_DIR = resolve(__dirname, '..', '..', '..', 'schemas');

export class XsdSchemaValidator implements SchemaValidator {
  private readonly schemaPath: string;

  constructor(schemasDir?: string) {
    const dir = schemasDir ?? DEFAULT_SCHEMAS_DIR;
    this.schemaPath = resolve(dir, 'nfe_v4.00.xsd');
  }

  validate(xml: string): ValidationResult {
    try {
      execFileSync(
        'xmllint',
        ['--noout', '--schema', this.schemaPath, '-'],
        {
          input: xml,
          stdio: ['pipe', 'pipe', 'pipe'],
          encoding: 'utf-8'
        }
      );

      return { valid: true, errors: [] };
    } catch (error: unknown) {
      const stderr = this.extractStderr(error);

      if (!stderr) {
        throw error;
      }

      const errors = this.parseErrors(stderr);

      if (errors.length === 0 && !stderr.includes('validates')) {
        throw error;
      }

      return { valid: false, errors };
    }
  }

  private extractStderr(error: unknown): string | null {
    if (
      error !== null &&
      typeof error === 'object' &&
      'stderr' in error &&
      typeof (error as Record<string, unknown>).stderr === 'string'
    ) {
      return (error as Record<string, unknown>).stderr as string;
    }
    return null;
  }

  private parseErrors(stderr: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = stderr.split('\n');

    for (const line of lines) {
      const match = line.match(
        /^-:(\d+):\s*element\s+(\S+):\s*Schemas validity error\s*:\s*(.+)$/
      );

      if (match) {
        errors.push({
          field: match[2],
          message: match[3].trim()
        });
      }
    }

    return errors;
  }
}
