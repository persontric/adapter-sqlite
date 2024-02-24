import { createClient } from '@libsql/client'
import { database_person, test_adapter } from '@persontric/adapter-test'
import { rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { LibSQLAdapter } from '../driver/libsql.js'
const dir = dirname(new URL(import.meta.url).pathname)
await rm(join(dir, 'test.db'), { force: true })
const client = createClient({
	url: 'file:' + join(dir, 'test.db')
})
await client.execute(
	`CREATE TABLE person (
		id    TEXT NOT NULL PRIMARY KEY,
		login TEXT NOT NULL UNIQUE)`
)
await client.execute(
	`CREATE TABLE person_session (
		id         TEXT    NOT NULL PRIMARY KEY,
		person_id  TEXT    NOT NULL,
		expire_dts INTEGER NOT NULL,
		country    TEXT,
		FOREIGN KEY (person_id) REFERENCES person (id))`)
await client.execute({
	sql: `INSERT INTO person (id, login)
				VALUES (?, ?)`,
	args: [database_person.id, database_person.attributes.login]
})
const adapter = new LibSQLAdapter(client, {
	person: 'person',
	session: 'person_session'
})
try {
	await test_adapter(adapter)
} finally {
	await rm(join(dir, 'test.db'), { force: true })
}
declare module 'persontric' {
	interface Register {
		Persontric:typeof adapter
		DatabasePersonAttributes:{
			login:string
		}
	}
}
