// Integer values match discord.js's ApplicationCommandOptionType in v14.
// Discord's REST API rejects the v13-era string values with
// "type must be one of (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11)".
export enum MoreCommandTypes {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  CHANNEL = 7,
  ROLE = 8,
  MENTIONABLE = 9,
  NUMBER = 10,
  ATTACHMENT = 11,
}
