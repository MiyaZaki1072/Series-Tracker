# Series Tracker

A Discord bot that sends automatic weekly reminders when your favorite manga, webtoon, or any series releases a new chapter.

---

## Features

- Set a weekly reminder for any series with a single command
- Tracks the current chapter and increments it automatically each week
- Supports pausing reminders when a series goes on hiatus
- Shows the exact date of the next expected chapter
- Persists all data across restarts — nothing is lost if the bot goes down

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- A Discord bot token — get one from the [Discord Developer Portal](https://discord.com/developers/applications)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/series-tracker.git
cd series-tracker
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the config file

Create a file named `config.json` in the root of the project with the following content:

```json
{
    "token": "your_bot_token_here",
    "clientId": "your_client_id_here"
}
```

- **token** — your Discord bot token from the Developer Portal
- **clientId** — your bot's application ID, found on the General Information page

### 4. Register the slash commands

Run this once to register the bot's commands with Discord:

```bash
node deploy.js
```

### 5. Start the bot

```bash
node index.js
```

The bot is now online. Invite it to your server and use `/start` in any channel to begin tracking a series.

---

## Commands

| Command | Description |
|---|---|
| `/start` | Set up a weekly chapter reminder in the current channel |
| `/update` | Change the status of the tracked series or remove it |
| `/check` | Show the current chapter and the next expected release date |

### `/start` options

| Option | Type | Description |
|---|---|---|
| `series` | Text | Name of the series (e.g. Killer Peter) |
| `current_chapter` | Number | The latest available chapter number |
| `day` | Choice | Day of the week the chapter usually drops |

### `/update` options

| Option | Type | Description |
|---|---|---|
| `status` | Choice | `Ongoing` to resume, `Hiatus` to pause, `Remove` to delete the tracker |

---

## How It Works

Once `/start` is set up in a channel, the bot schedules a weekly reminder that fires every week on the chosen day at **12:00 UTC**. When the reminder fires, it automatically increments the chapter count and sends a ping to the channel. All tracker data is saved to a local `trackers.json` file so everything is restored automatically if the bot restarts.

---

## Project Structure

```
series-tracker/
├── index.js        — main bot logic and command handlers
├── deploy.js       — registers slash commands with Discord
├── config.json     — your bot token and client ID (do not share this)
├── trackers.json   — auto-generated file that stores active trackers
└── package.json
```

---

## Notes

- Each channel can only track one series at a time
- Reminders fire at **12:00 UTC** — keep time zones in mind
- `config.json` and `trackers.json` should be added to your `.gitignore` to avoid accidentally leaking your bot token

### Recommended `.gitignore`

```
node_modules/
config.json
trackers.json
```

---

## License

MIT
