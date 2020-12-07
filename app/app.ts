import { Wechaty, Contact } from 'wechaty'
import { ScanStatus } from 'wechaty-puppet'
import QrcodeTerminal from 'qrcode-terminal'
import { config } from 'dotenv'
import _config from './config'

import roomMessageHandler from './handler/room-message'
import roomJoinHandler from './handler/room-join'

//  加载env
config()

const token = process.env.WECHATY_TOKEN

const bot = new Wechaty({
  puppet: 'wechaty-puppet-hostie',
  puppetOptions: {
    token,
  }
});

bot
  .on('scan', (qrcode, status) => {
    if (status === ScanStatus.Waiting) {
      QrcodeTerminal.generate(qrcode, {
        small: true
      })
    }
  })
  .on('login', async user => {
    console.log(`user: ${JSON.stringify(user)}`)
  })
  .on('error', (error) => {
    console.error(error)
  })

async function main() {
  await bot.start()

  //  储存一波数据
  let store: any = []

  _config.activeRoomIds.forEach(async item => {
    const room = await bot.Room.find({topic: item})
    if (room) {
      store.push({
        id: room.id,
        active: ''
      })
  
      // 群信息
      room.on('message', async (message) => {
        roomMessageHandler(message, room, store)
      })
      room.on('join', (inviteeList, inviter) => {
        roomJoinHandler(room, inviteeList, inviter)
      })
    }
  })
}

main()