import { Message, Room } from "wechaty"
import Idiom from '../model/idiom'
import IdiomImg from '../model/idiomImg'
import Riddle from '../model/riddle'
import autoReply from '../model/autoReply'
import config from '../config'

export default async function(message: Message, room: Room, store: [{ id: string, active?: string }]) {
  const talker = message.talker()
  const id = room.id
  const _s = store.filter(x => x.id === id)[0]

  if (_s.active) {
    return
  }

  //  忽略自己的发言
  if (talker.self()) {
    return
  }

  //  @机器人
  if (await message.mentionSelf() || new RegExp(`${config.botName}`).test(message.text())) { 
    let msg = message.text()
		msg = replaceAT(msg)
		if (/成语接龙/.test(msg)) {
      _s.active = 'idiom'
      const game = new Idiom(room)
      game
        .start()
        .then(res => {
          console.log(res, '游戏结束')
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          _s.active = ''
        })
    } else if (/猜谜语/.test(msg)) {
      _s.active = 'riddle'
      const game = new Riddle(room)
      game
        .start()
        .then(res => {
          console.log(res, '游戏结束')
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          _s.active = ''
        })
    } else if (/看图猜成语/.test(msg)) {
      _s.active = 'idiomImg'
      const game = new IdiomImg(room)
      game
        .start()
        .then(res => {
          console.log(res, '游戏结束')
        })
        .catch(err => {
          console.log(err)
        })
        .finally(() => {
          _s.active = ''
        })
    } else{
      const reply = await autoReply(msg)
      if (typeof reply === 'string') {
        await room.say(reply)
      }
    }
  }  
}                                                                                                                                                                                                                                                                                                                                                          

//  替换@机器人名字
function replaceAT(content: string): string {
	const reg = new RegExp(`${config.botName}|@${config.botName}`)
  return content.replace(reg, '')
}