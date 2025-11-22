declare module 'sql.js' {
  export type BindValue = string | number | Uint8Array | null;

  export interface Statement {
    bind(values?: BindValue[] | Record<string, BindValue>): void;
    step(): boolean;
    get(): BindValue[];
    getAsObject(): Record<string, unknown>;
    free(): void;
  }

  export interface Database {
    run(sql: string, params?: BindValue[] | Record<string, BindValue>): void;
    exec(sql: string): Array<{ columns: string[]; values: BindValue[][] }>;
    prepare(sql: string, params?: BindValue[] | Record<string, BindValue>): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
  }

  export type SqlJsConfig = {
    locateFile?: (file: string) => string;
  };

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
