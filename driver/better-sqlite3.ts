import type { Database } from 'better-sqlite3'
import type { Controller, TableNames } from '../base.js'
import { SQLiteAdapter } from '../base.js'
export class BetterSqlite3Adapter extends SQLiteAdapter {
	constructor(db:Database, tableNames:TableNames) {
		super(new BetterSqlite3Controller(db), tableNames)
	}
}
class BetterSqlite3Controller implements Controller {
	private db:Database
	constructor(db:Database) {
		this.db = db
	}
	public async get<T>(sql:string, args:any[]) {
		return this.db.prepare(sql).get(...args) as T|null
	}
	public async getAll<T>(sql:string, args:any[]) {
		return this.db.prepare(sql).all(...args) as T[]
	}
	public async execute(sql:string, args:any[]):Promise<void> {
		await this.db.prepare(sql).run(...args)
	}
}
