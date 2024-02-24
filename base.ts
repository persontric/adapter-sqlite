import type {
	Adapter,
	DatabaseSession,
	RegisterDatabaseSessionAttributes,
	DatabasePerson,
	RegisterDatabasePersonAttributes
} from 'persontric'
export class SQLiteAdapter implements Adapter {
	private controller:Controller
	private escape_person_tbl_name:string
	private escape_session_tbl_name:string
	constructor(controller:Controller, tableNames:TableNames) {
		this.controller = controller
		this.escape_session_tbl_name = name__escape(tableNames.session)
		this.escape_person_tbl_name = name__escape(tableNames.person)
	}
	public async session__delete(sessionId:string):Promise<void> {
		await this.controller.execute(`DELETE
																	 FROM ${this.escape_session_tbl_name}
																	 WHERE id = ?`, [
			sessionId
		])
	}
	public async person_session_all__delete(person_id:string):Promise<void> {
		await this.controller.execute(
			`DELETE
			 FROM ${this.escape_session_tbl_name}
			 WHERE person_id = ?`,
			[person_id]
		)
	}
	public async session_person_pair_(
		sessionId:string
	):Promise<[session:DatabaseSession|null, person:DatabasePerson|null]> {
		const [databaseSession, database_person] = await Promise.all([
			this.session_(sessionId),
			this.session_id__person_(sessionId)
		])
		return [databaseSession, database_person]
	}
	public async person_session_all_(person_id:string):Promise<DatabaseSession[]> {
		const result = await this.controller.getAll<SessionSchema>(
			`SELECT *
			 FROM ${this.escape_session_tbl_name}
			 WHERE person_id = ?`,
			[person_id]
		)
		return result.map((val)=>{
			return transformIntoDatabaseSession(val)
		})
	}
	public async session__set(database_session:DatabaseSession):Promise<void> {
		const value:SessionSchema = {
			id: database_session.id,
			person_id: database_session.person_id,
			expire_dts: database_session.expire_dts,
			...database_session.attributes
		}
		const entries = Object.entries(value).filter(([_, v])=>v !== undefined)
		const columns = entries.map(([k])=>name__escape(k))
		const placeholders = Array(columns.length).fill('?')
		const values = entries.map(([_, v])=>v)
		await this.controller.execute(
			`INSERT INTO ${this.escape_session_tbl_name} (${columns.join(
				', '
			)})
			 VALUES (${placeholders.join(', ')})`,
			values
		)
	}
	public async session_expiration__update(session_id:string, expire_dts:Date):Promise<void> {
		await this.controller.execute(
			`UPDATE ${this.escape_session_tbl_name}
			 SET expire_dts = ?
			 WHERE id = ?`,
			[expire_dts.getTime(), session_id]
		)
	}
	public async expired_session_all__delete():Promise<void> {
		await this.controller.execute(
			`DELETE
			 FROM ${this.escape_session_tbl_name}
			 WHERE expire_dts <= ?`,
			[Date.now()]
		)
	}
	private async session_(sessionId:string):Promise<DatabaseSession|null> {
		const result = await this.controller.get<SessionSchema>(
			`SELECT *
			 FROM ${this.escape_session_tbl_name}
			 WHERE id = ?`,
			[sessionId]
		)
		if (!result) return null
		return transformIntoDatabaseSession(result)
	}
	private async session_id__person_(sessionId:string):Promise<DatabasePerson|null> {
		const result = await this.controller.get<UserSchema>(
			`SELECT ${this.escape_person_tbl_name}.*
			 FROM ${this.escape_session_tbl_name}
							INNER JOIN ${this.escape_person_tbl_name} ON ${this.escape_person_tbl_name}.id = ${this.escape_session_tbl_name}.person_id
			 WHERE ${this.escape_session_tbl_name}.id = ?`,
			[sessionId]
		)
		if (!result) return null
		return transformIntoDatabaseUser(result)
	}
}
export interface TableNames {
	person:string
	session:string
}
export interface Controller {
	execute(sql:string, args:any[]):Promise<void>
	get<T>(sql:string, args:any[]):Promise<T|null>
	getAll<T>(sql:string, args:any[]):Promise<T[]>
}
interface SessionSchema extends RegisterDatabaseSessionAttributes {
	id:string
	person_id:string
	expire_dts:Date
}
interface UserSchema extends RegisterDatabasePersonAttributes {
	id:string
}
function transformIntoDatabaseSession(raw:SessionSchema):DatabaseSession {
	const { id, person_id, expire_dts, ...attributes } = raw
	return {
		person_id,
		id,
		expire_dts,
		attributes
	}
}
function transformIntoDatabaseUser(raw:UserSchema):DatabasePerson {
	const { id, ...attributes } = raw
	return {
		id,
		attributes
	}
}
function name__escape(val:string):string {
	return '`' + val + '`'
}
