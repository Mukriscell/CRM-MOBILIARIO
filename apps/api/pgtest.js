const { Client } = require("pg");
const client = new Client({
  host: "127.0.0.1",
  port: 5432,
  user: "clientra",
  password: "clientra",
  database: "clientra"
});
client.connect()
  .then(() => { console.log("Connected OK"); return client.query("SELECT 1"); })
  .then(r => { console.log("Query OK:", r.rows[0]); client.end(); })
  .catch(e => { console.log("Error:", e.message); });