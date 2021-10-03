// TODO: Rewrite index.mjs
// TODO: Write example.config.json

import axios from "axios";
import * as mariadb from "mariadb";
import fs from "fs";

export let dbQueue = [];
export let config = JSON.parse(fs.readFileSync('./src/config.json', 'utf-8'));
export let osuAPIv1 = axios.create({ baseURL: 'https://osu.ppy.sh/api', headers: { 'Authorization': config.osu.APIv1 }, json: true });
export let dbPool = mariadb.createPool({
    host: config.mariadb.host,
    user: config.mariadb.user,
    password: config.mariadb.password,
    database: config.mariadb.name,
    connectionLimit: config.mariadb.maxConnections
});

import {mapDB} from "./modules/mapDB.mjs";
import {dbProcessQueue} from "./workers/db.mjs";

async function main() {
    if(config.modules.maps.enabled === true){
        dbProcessQueue().then(() => {});
        mapDB().then(() => {});
        }
}
main().then(() => {});
