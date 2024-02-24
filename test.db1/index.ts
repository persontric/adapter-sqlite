import { D1Database, D1DatabaseAPI } from '@miniflare/d1'
import { database_person, test_adapter } from '@persontric/adapter-test'
import sqlite from 'better-sqlite3'
import { D1Adapter } from '../driver/d1.js'
const db = sqlite(':memory:')
const d1 = new D1Database(new D1DatabaseAPI(db))
// @formatter:off
await d1.exec(
	`CREATE TABLE person (id TEXT NOT NULL PRIMARY KEY,login TEXT NOT NULL UNIQUE)`)
await d1.exec(
	`CREATE TABLE person_session (id TEXT NOT NULL PRIMARY KEY, person_id TEXT NOT NULL, expire_dts INTEGER NOT NULL, country TEXT, FOREIGN KEY (person_id) REFERENCES person (id))`)
await d1
	.prepare(`INSERT INTO person (id, login) VALUES (?, ?)`)
	.bind(database_person.id, database_person.attributes.login)
	.run()
// @formatter:on
const adapter = new D1Adapter(d1, {
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
