import { Client, Message, MessageEmbed, MessageEmbedOptions } from "discord.js"
import { ICommand } from "../../shared/types/types"
import { random as getRandom } from '../../shared/utils/helpers';

const pull: ICommand = {
  name: "poke",
  category: "fun",
  description: "Genera un Pokémon aleatorio",
  run: async (client: Client, message: Message, args: string[]) => {
    const types = [
      "bug", "dark", "dragon", "electric", "fairy",
      "fighting", "fire", "flying", "ghost", "grass",
      "ground", "ice", "normal", "poison",
      "psychic", "rock", "steel", "water"
    ]

    if (args[0]) {
      if (args[0] === "types") {
        let s = ""
        for (let i = 0; i < types.length; i++) {
          s += `\`${types[i]}\` `
          if (i + 1 % 5 === 0 && i !== 0)
            s += "\n"
        }
        const myEmbed = {
          color: 0x0099ff,
          title: `Types`,
          description: s
        }
        message.channel.send({ embed: myEmbed })
      } else if (args[0] === "shiny") {
        message.channel.send(`No seas marik ${message.member!.user} >:v`)
      } else if (args[0] === "battle") {
        if (args[1]) {
        } else {
        }
      } else if (types.includes(args[0])) {
        fetchType(args[0], message, client)
      } else {
        message.channel.send("Tipo no encontrado\nUsa el comando \`b!poke types\` para ver la lista de tipos")
      }
    } else {
      fetchData(getRandom(1, 898), message, client)
    }

  },
  usage: null,
  aliases: []
}

const fetchData = async (id: number, message: Message, client: Client) => {
    try{
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        const data = await res.json()
        pintarCard(modelData(data, id), message)
    }catch(error){
        console.log(error)
    }
}

const fetchType = async (id: string, message: Message, client: Client) => {
    try{
        const res = await fetch(`https://pokeapi.co/api/v2/type/${id}`)
        const dat = await res.json()
        fetchData(dat.pokemon[getRandom(0, Object.keys(dat.pokemon).length-1)].pokemon.name, message, client)
    }catch(error){
        console.log(error)
    }
}

function pintarCard(poke: any, message: Message){
    let type = ""
    if(poke.type[1] === undefined){
      type = `\`${poke.type[0]}\``
    }else{
      type = `\`${poke.type[0]}\` \`${poke.type[1]}\``
    }

    const exampleEmbed: MessageEmbed | MessageEmbedOptions | undefined = {
        color: 0x0099ff,
        title: `${poke.name}${poke.shiny} #${poke.order}`,
        description: type,
        /*author: {
          name: message.member.displayName, 
          icon_url: message.author.avatarURL(),
        },*/
        fields: [
          {
            name: 'HP',
            value: `\`${poke.stats.hp}\``,
            inline: true,
          },
          {
            name: 'Attack',
            value: `\`${poke.stats.attack}\``,
            inline: true,
          },
          {
            name: 'Defense',
            value: `\`${poke.stats.defense}\``,
            inline: true,
          },
          /*{
            name: '\u200b',
            value: '\u200b',
            inline: false,
          },*/
          {
            name: 'Speed',
            value: `\`${poke.stats.speed}\``,
            inline: true,
          },
          {
            name: 'Sp. Atk',
            value: `\`${poke.stats.spatk}\``,
            inline: true,
          },
          {
            name: 'Sp. Def',
            value: `\`${poke.stats.spdef}\``,
            inline: true,
          }
        ],
        image: {
          url: poke.img,
        },
        footer: {
          text: `Pokémon para ${message.member!.displayName}`,
          icon_url:  message.author.avatarURL()!,
        },
  };
  if (message.channel?.isText()) message.channel.send({ embed: exampleEmbed });
}

function modelData(data: any, id: number){
    const sprites = [
        data.sprites.front_default,
        data.sprites.front_female,
        data.sprites.front_shiny,
        data.sprites.front_shiny_female
    ]
    let img
    let name = capitalizeFirstLetter(data.name)
    let order = ""
    const type = []
    let shiny = ""
    const stats = {
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        speed: data.stats[5].base_stat,
        spatk: data.stats[3].base_stat,
        spdef: data.stats[4].base_stat,
    }

    //IMG
    if(getRandom(0, 49) === 1){
        img = sprites[getRandom(0, sprites.length-1)]
    }else{
        img = sprites[getRandom(0, 1)]
    }
    if(img === null)
        img = data.sprites.front_default
    if(img === sprites[2] || img === sprites[3]){
      shiny = " ⭐️"
    }

    //TYPE
    for (let i = 0; i <= data.types.length-1; i++) {
        type[i] = capitalizeFirstLetter(data.types[i].type.name)
    }

    //ORDER
    if(data.order === null || data.order === -1 || data.order === 0){
      order = id.toString()
    }else{
      order = data.order
    }
    
    return {
        img,
        name,
        order,
        type,
        stats,
        shiny
    }
}

function capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export default pull