//deploy.js
import config from './config.json' with { type: 'json' };
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name : 'start',
    description : 'Set an automatic weekly chapter reminder',
    options: [
        {
            name: `series`,
            description : `Name of the series (e.g Killer Peter)`,
            type : 3,
            required : true,
        },
        {
            name: `current_chapter`,
            description : `Current Available chapter (e.g 42)`,
            type : 4,
            required : true,
        },
        {
            name :`day`,
            description:`Day of the week`,
            type : 4,
            required : true,
            choices: [
                {name:`Monday`, value:1},
                {name:`Tuesday`, value:2},
                {name:`Wednesday`, value:3},
                {name:`Thursday`, value:4},
                {name:`Friday`, value:5},
                {name:`Saturday`, value:6},
                {name:`Sunday`, value:0},
            ],
        }
    ]
  },
  {
    name : 'update',
    description : 'Update an automatic weekly chapter reminder',
    options: [
        {
            name :`status`,
            description:`Status of the series`,
            type : 4,
            required : true,
            choices: [
                {name:`Ongoing`, value:1},
                {name:`Hiatus`, value:0},
                {name:`Remove`,value:-1},
            ],
        }
    ]
  },
  {
    name : `check`,
    description : `Output current chapter`
  }
];

const rest = new REST({ version: '10' }).setToken(config.token);

try {
  console.log('Started refreshing application (/) commands.');

  await rest.put(
    Routes.applicationCommands(config.clientId), 
    { body: commands }
  );

  console.log('Successfully reloaded application (/) commands.');
} catch (error) {
  console.error(error);
}