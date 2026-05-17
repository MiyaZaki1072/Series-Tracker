//index.js
import { Client, GatewayIntentBits } from 'discord.js';
import config from './config.json' with { type: 'json' };
import cron from 'node-cron';
import fs from 'fs';

const DATA_FILE = './trackers.json';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const seriesTrackers = fs.existsSync(DATA_FILE)? JSON.parse(fs.readFileSync(DATA_FILE)): {};

function save() {
    const toSave = Object.fromEntries(
        Object.entries(seriesTrackers).map(([id, t]) => [
            id, { name: t.name, chapter: t.chapter, updateDay: t.updateDay, status: t.status }
        ])
    );
    fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2));
}

function buildCron(channelId, dayOfWeek) {
    return cron.schedule(`0 12 * * ${dayOfWeek}`, () => {
        if (seriesTrackers[channelId].status === 0) return;
        seriesTrackers[channelId].chapter++;
        save();
        const targetChannel = client.channels.cache.get(channelId);
        if (targetChannel) {
            targetChannel.send(
                `@everyone **${seriesTrackers[channelId].name}** — Chapter **${seriesTrackers[channelId].chapter}** should be out now!`
            );
        }
    });
}

function getNextChapterDate(dayOfWeek) {
    const now = new Date();
    const todayDay = now.getDay();

    let daysUntil = dayOfWeek - todayDay;
    if (daysUntil <= 0) daysUntil += 7;

    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil);
    nextDate.setHours(12, 0, 0, 0);

    return nextDate;
}

const msg = {
    alreadyTracking:
        `## Already Tracking\n` +
        `A series is already being tracked in this channel.\n` +
        `-# Use /update to change its status or remove it.`,

    startSuccess: (name) =>
        `## Tracker Created\n` +
        `Now tracking **${name}** in this channel.\n` +
        `-# Use /check to see its status at any time.`,

    noTracker:
        `## No Tracker Found\n` +
        `There is no series being tracked in this channel.\n` +
        `-# Use /start to set one up.`,

    removeSuccess: (name) =>
        `## Tracker Removed\n` +
        `**${name}** is no longer being tracked in this channel.`,

    removeNotFound:
        `## Nothing to Remove\n` +
        `There is no series being tracked in this channel.`,

    statusUpdate: (name, statusString) =>
        `## Status Updated\n` +
        `**${name}** has been set to **${statusString}**.`,

    checkOngoing: (name, chapter, timestamp, relative) =>
        `## ${name}\n` +
        `Current chapter — **${chapter}**\n` +
        `Next chapter expected — ${timestamp} *(${relative})*`,

    checkHiatus: (name, chapter) =>
        `## ${name}\n` +
        `Current chapter — **${chapter}**\n` +
        `Status — **On Hiatus**\n` +
        `-# No upcoming chapter scheduled.`,

    error:
        `## Something Went Wrong\n` +
        `An unexpected error occurred. Please try again.`,
};

client.once('ready', () => {
    for (const [channelId, tracker] of Object.entries(seriesTrackers)) {
        seriesTrackers[channelId].alarm = buildCron(channelId, tracker.updateDay);
        console.log(`Restored tracker for "${tracker.name}" in channel ${channelId}`);
    }
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    try {
        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === 'start') {
            const channelId = interaction.channelId;

            if (seriesTrackers[channelId]) {
                return await interaction.reply({ content: msg.alreadyTracking, ephemeral: true });
            }

            const seriesName = interaction.options.getString('series');
            const startPart  = interaction.options.getInteger('current_chapter');
            const dayOfWeek  = interaction.options.getInteger('day');

            seriesTrackers[channelId] = {
                name      : seriesName,
                chapter   : startPart,
                updateDay : dayOfWeek,
                alarm     : buildCron(channelId, dayOfWeek),
                status    : 1,
            };
            save();
            await interaction.reply(msg.startSuccess(seriesName));
        }

        else if (interaction.commandName === 'update') {
            const channelId = interaction.channelId;
            const status    = interaction.options.getInteger('status');

            if (status === -1) {
                if (!seriesTrackers[channelId]) {
                    return await interaction.reply({ content: msg.removeNotFound, ephemeral: true });
                }
                const name = seriesTrackers[channelId].name;
                seriesTrackers[channelId].alarm.stop();
                delete seriesTrackers[channelId];
                save();
                return await interaction.reply(msg.removeSuccess(name));
            }

            if (!seriesTrackers[channelId]) {
                return await interaction.reply({ content: msg.noTracker, ephemeral: true });
            }

            seriesTrackers[channelId].status = status;
            const statusString = status ? 'Ongoing' : 'Hiatus';
            save();
            await interaction.reply(msg.statusUpdate(seriesTrackers[channelId].name, statusString));
        }

        else if (interaction.commandName === 'check') {
            const channelId = interaction.channelId;

            if (!seriesTrackers[channelId]) {
                return await interaction.reply({ content: msg.noTracker, ephemeral: true });
            }

            const tracker   = seriesTrackers[channelId];
            const nextDate  = getNextChapterDate(tracker.updateDay);
            const unix      = Math.floor(nextDate.getTime() / 1000);
            const timestamp = `<t:${unix}:F>`;
            const relative  = `<t:${unix}:R>`;

            if (tracker.status) {
                await interaction.reply(msg.checkOngoing(tracker.name, tracker.chapter, timestamp, relative));
            } else {
                await interaction.reply(msg.checkHiatus(tracker.name, tracker.chapter));
            }
        }

    } catch (error) {
        console.error(error);
        const errMsg = { content: msg.error, ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(errMsg);
        else await interaction.reply(errMsg);
    }
});

client.login(config.token);