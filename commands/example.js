module.exports = {
  name: 'example',
  description: 'Example command - replace or add your own in the commands folder.',
  execute: async (message, args) => {
    await message.reply('Example command executed! Customize your commands in the commands folder.');
  },
};
