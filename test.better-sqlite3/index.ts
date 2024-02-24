import { database_person, test_adapter } from '@persontric/adapter-test'
import sqlite from 'better-sqlite3'
import { BetterSqlite3Adapter } from '../driver/better-sqlite3.js'
const db = sqlite(':memory:')
// @formatter:off
db.exec(
	`CREATE TABLE person (id TEXT NOT NULL PRIMARY KEY, login TEXT NOT NULL UNIQUE)`
).exec(
	`CREATE TABLE person_session (id TEXT NOT NULL PRIMARY KEY, person_id TEXT NOT NULL, expire_dts INTEGER NOT NULL,country TEXT, FOREIGN KEY (person_id) REFERENCES person (id))`)
db.prepare(
	`INSERT INTO person (id, login) VALUES (?, ?)`
).run(
	database_person.id,
	database_person.attributes.login)
// @formatter:on
const adapter = new BetterSqlite3Adapter(db, {
	person: 'person',
	session: 'person_session'
})
await test_adapter(adapter)
declare module 'persontric' {
	interface Register {
		Persontric:typeof adapter
		DatabasePersonAttributes:{
			login:string
		}
	}
}
