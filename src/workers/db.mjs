// TODO: Rewrite db.mjs

import {dbQueue, dbPool} from "../index.mjs";

let permanentConn = undefined;

async function createPermanentConnection() {
    permanentConn = await dbPool.getConnection().catch(err => console.log(err));
}

function logCurrentQueue () {
    console.log("Current Queue Length: " + dbQueue.length + "\nNext Entry: " + dbQueue[0])
}
setInterval(logCurrentQueue, 1000*5);

export async function dbProcessQueue() {
    if (permanentConn === undefined) {
        await createPermanentConnection();
    }

    if (dbQueue.length > 0) {
        let entry = dbQueue[0];
        dbQueue.shift();

        await permanentConn.query(entry[0], entry[1]).then(() => {
            dbProcessQueue();
        });
    } else {
        setTimeout(dbProcessQueue, 1000);
    }
}

export async function priorityDB(query, params) {
    if(permanentConn === undefined) {
        await createPermanentConnection();
    }

    return new Promise(async (resolve) => {
        let response  = await permanentConn.query(query, params);
        resolve(response);
    });
}
