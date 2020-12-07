import { Message, Room } from 'wechaty' 
import txapi from '../utils/txapi'

class RiddleGame {

  private globalTimer?: NodeJS.Timeout

  private currentRiddle: Array<Riddle> = []

  private currentIndex = 1

  //  排名
  private rankList: Array<RankList> = []

  private defaultOptions = {
    rounds: 10,
    roundTimes: 60 * 1000
  }

  private fn: any = () => {}

  private room: Room

  private _resolve: any

  private _reject: any

  constructor(room: Room, options?: IdiomGameOptions) {
    this.defaultOptions = Object.assign(this.defaultOptions, options)
    this.room = room
  }

  /**
   * name
   */
  public async start() {
    this.room.say(
      `开始猜谜语喽！每题限时1分钟，总共5题，用心想哦！`
    )
    
    this.newRound()

    this.fn = this.riddleRound.bind(this)

    this.room.addListener('message', this.fn)

    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  private async riddleRound(message: Message) {
    const talker = message.talker()
    //  跳过自己的发言
    if (talker.self()) {
      return
    }
    
    const msg = message.text()
    const name = talker.name()
    console.log(`${name}: ${msg}`)

    if (msg === 'stop all motor functions') {
      this.gameOver(true)
    }

    //  文字信息就随便查查
    if (message.type() === 7) {
      if (msg === this.currentRiddle[0].answer) {
        await this.room.say(`恭喜${name} 猜对了！谜底就是【${this.currentRiddle[0].answer}】`)
        //  排名
        this.rankList.push({
          name,
          id: talker.id,
        })
        this.reset()
        this.currentIndex++
        //  大于5条
        if (this.currentIndex > this.defaultOptions.rounds) {
          this.gameOver(true)
        } else {
          this.newRound()
        }
      }
    }
  }

  private async newRound() {
    try {
      this.currentRiddle = await this.getRandomRiddle() as Array<Riddle>
    } catch (error) {
      this.gameOver(true)
    }
    await this.room.say(`第${this.currentIndex}条：\n${this.currentRiddle[0].quest}`)
    this.reset()
  }

  private getRandomRiddle() {
    return txapi('riddle')
  }

  private reset() {
    clearTimeout(this.globalTimer as NodeJS.Timeout)
    this.globalTimer = setTimeout(() => {
      this.gameOver()
    }, this.defaultOptions.roundTimes)
  }

  private genRankList() {
    const temp: rankTemp = {}
  
    this.rankList.map(x => {
      if (Object.hasOwnProperty.call(temp, x.id)) {
        temp[x.id] = {
          name: x.name,
          count: temp[x.id].count + 1
        }
      } else {
        temp[x.id] = {
          name: x.name,
          count: 1
        }
      }
    })
  
    return Object
      .entries(temp)
      .sort((a, b) => b[1].count - a[1].count)
      .map(x => {
        return {
          id: x[0],
          data: x[1]
        }
      })
      .splice(0, 3)
      .map((item, index) => {
        if (item && index === 0) {
          return `🥇 第1名：${item.data.name}  （猜对${item.data.count}次）`
        }
        if (item && index === 1) {
          return `🥈 第2名：${item.data.name}  （猜对${item.data.count}次）`
        }
        if (item && index === 2) {
          return `🥉 第3名：${item.data.name}  （猜对${item.data.count}次）`
        }
      })
  }

  /**
   * 游戏结束
   */
  private gameOver(force?: boolean) {
    //  轮数还没到
    if (this.currentIndex < this.defaultOptions.rounds && !force) {
      this.room.say(`答案是：【${this.currentRiddle[0].answer}】。`)
      this.currentIndex++
      return this.newRound()
    }
    this.room.removeListener('message', this.fn)
    clearTimeout(this.globalTimer as NodeJS.Timeout)
    const result = this.genRankList()
    this.room.say([
      '游戏结束，现在公布成绩',
      ...result
    ].join('\n'))
    //  清除一波
    this._resolve('game over')
  }
}

export default RiddleGame

interface IdiomGameOptions {
  rounds?: number,
  roundTimes?: number
}

interface RankList {
  name: string,
  id: string
}

interface Riddle {
  quest: string,
  answer: string
}

interface rankTemp {
  [propName: string]: {
    name: string,
    count: number
  }
} 