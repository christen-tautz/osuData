// TODO: Rewrite mapDB.mjs

import {config, osuAPIv1, dbQueue} from "../index.mjs";
import {priorityDB} from "../workers/db.mjs";

let date;
let lastDate;
let update_interval;

export async function mapDB() {
    if (config.modules.maps.fullUpdate === true) {
        console.log("Full Update Enabled, requesting all maps starting 2007-01-01. Please disable this before next launch.");
        date = "2007-01-01"
        update_interval = 1000
    } else {
        let latestMap = await priorityDB('SELECT * FROM beatmaps ORDER BY approved_date DESC LIMIT 1;');
        date = new Date(latestMap[0].approved_date).toISOString().slice(0, 19).replace('T', ' ');
        console.log("Full Update Disabled, requesting all maps starting " + date);
        update_interval = 1000
    }

    await priorityDB("CREATE TABLE IF NOT EXISTS beatmaps (`beatmap_id` INT NOT NULL, `beatmapset_id` INT NOT NULL, `approved` TINYINT NOT NULL DEFAULT 0, `mode` TINYINT NOT NULL DEFAULT 0, `submit_date` DATETIME NOT NULL DEFAULT 0, `approved_date` DATETIME NOT NULL DEFAULT 0, `last_update` DATETIME NOT NULL DEFAULT 0, `creator` VARCHAR(50) NOT NULL DEFAULT '', `creator_id` INT NOT NULL DEFAULT 0, `artist` VARCHAR(1024) NOT NULL DEFAULT '0', `bpm` VARCHAR(50) NOT NULL DEFAULT '0', `difficultyrating` DOUBLE NOT NULL DEFAULT 0, `diff_aim` DOUBLE NOT NULL DEFAULT 0, `diff_speed` DOUBLE NOT NULL DEFAULT 0, `diff_size` FLOAT NOT NULL DEFAULT 0, `diff_overall` FLOAT NOT NULL DEFAULT 0, `diff_approach` FLOAT NOT NULL DEFAULT 0, `diff_drain` FLOAT NOT NULL DEFAULT 0, `hit_length` INT NOT NULL DEFAULT 0, `total_length` INT NOT NULL DEFAULT 0, `max_combo` INT NOT NULL DEFAULT 0, `genre_id` TINYINT NOT NULL DEFAULT 0, `language_id` TINYINT NOT NULL DEFAULT 0, `title` VARCHAR(1024) NOT NULL DEFAULT '0', `source` VARCHAR(1024) NOT NULL DEFAULT '0', `difficulty` VARCHAR(1024) NOT NULL DEFAULT '0', `file_md5` VARCHAR(256) NOT NULL DEFAULT '0', `tags` VARCHAR(1024) NOT NULL DEFAULT '0', `count_normal` INT NOT NULL DEFAULT 0, `count_slider` INT NOT NULL DEFAULT 0, `count_spinner` INT NOT NULL DEFAULT 0, `storyboard` TINYINT(1) NOT NULL DEFAULT 0, `video` TINYINT(1) NOT NULL DEFAULT 0, `download_unavailable` TINYINT(1) NOT NULL DEFAULT 0, `audio_unavailable` TINYINT(1) NOT NULL DEFAULT 0, PRIMARY KEY (`beatmap_id`))");

    async function getScores() {
        await osuAPIv1.get(`/get_beatmaps?k=${config.osu.APIv1}&since=${date}&a=0`).then(async res => {
            if (Number(new Date(res.data[1].approved_date)) > date - 1) {
                date = Date.now();
                console.log("No more maps found. Requesting for new maps in 1 hour.");
                setTimeout(getScores, 1000 * 60 * 60);
            } else {
                await res.data.forEach(map => {
                    if(Number(map.approved) === 2 || Number(map.approved) === 1) {
                        dbQueue.push(["REPLACE INTO beatmaps VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [Number(map.beatmap_id), Number(map.beatmapset_id), Number(map.approved), Number(map.mode), map.submit_date, map.approved_date, map.last_update, String(map.creator), Number(map.creator_id), String(map.artist), String(map.bpm), Number(map.difficultyrating), Number(map.diff_aim), Number(map.diff_speed), Number(map.diff_size), Number(map.diff_overall), Number(map.diff_approach), Number(map.diff_drain), Number(map.hit_length), Number(map.total_length), Number(map.max_combo), Number(map.genre_id), Number(map.language_id), String(map.title), String(map.source), String(map.version), String(map.file_md5), String(map.tags), Number(map.count_normal), Number(map.count_slider), Number(map.count_spinner), Number(map.storyboard), Number(map.video), Number(map.download_unavailable), Number(map.audio_unavailable)]])
                        lastDate = Number(new Date(map.approved_date));
                        date = map.approved_date;
                    }
                });
                await priorityDB("SELECT COUNT(*) FROM beatmaps").then(data => {
                    console.log("Currently indexed beatmaps: " + data[0]['COUNT(*)'])
                });
                setTimeout(getScores, update_interval);
            }
        }).catch(e => { console.log(e) })
    }
    await getScores();

}
