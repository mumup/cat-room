import { Message, Room } from 'wechaty'
import pinyin from 'pinyin'
import fs from 'fs'
import path from 'path'

class IdiomGame {

  private defaultOptions = {
    rounds: 12,
    roundTimes: 60 * 1000
  }

  private fn: any = () => {}

  private room: Room

  private idiomList: Array<wordObj> = JSON.parse(fs.readFileSync(path.join(__dirname, '../../static/word.json'), 'utf-8'))

  private _resolve: any

  private _reject: any

  //  当前进行到第几条
  private currentIndex: number = 1
  //  当前单词
  private currentIdiom: string = ''
  //  接过的成语
  private idiomHistory: Array<string> = []
  //  排名
  private rankList:Array<RankList> = []
  //  全局定时器
  private globalTimer?: NodeJS.Timeout
  //  四字中文正则
  private wordRegExp = new RegExp(/^(?:[\u3400-\u4DB5\u4E00-\u9FEA\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]){4}$/)

  constructor(room: Room, options?: IdiomGameOptions) {
    this.defaultOptions = Object.assign(this.defaultOptions, options)
    this.room = room
  }

  /**
   * name
   */
  public async start() {
    this.room.say(
      `‼️成语接龙规则：直到接满12条或者无法再继续则游戏结束。每次接龙时间为⏱${this.defaultOptions.roundTimes / (60 * 1000)}分钟。可以同音字接龙`
    )
    this.currentIdiom = this.getRandomWord().word
    this.room.say(`第${this.currentIndex}条：👉${this.currentIdiom}👈`)

    this.reset()

    this.fn = this.idiomRound.bind(this)

    this.room.addListener('message', this.fn)

    return new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
  }

  //  成语比对
  private wordComparison(w1: string, w2: string) {
    const p1 = this.py(w1.substring(3))[0]
    const p2 = this.py(w2.substring(0, 1))[0]
    for (let i = 0; i< p2.length; i++) {
      if (p1.indexOf(p2[i]) > -1) {
        return true
      }
    }
    return false
  }

  /**
   * 返回拼音
   * @param str 
   */
  private py(str: string) {
    return pinyin(str, {
      heteronym: true // 启用多音字模式
    })
  }

  private getRandomWord() {
    const index = Math.floor(Math.random() * (this.idiomList.length - 0)) + 0
    return this.idiomList[index]
  }

  private reset() {
    clearTimeout(this.globalTimer as NodeJS.Timeout)
    this.globalTimer = setTimeout(() => {
      this.gameOver()
    }, this.defaultOptions.roundTimes)
  }

  private idiomRound(message: Message) {
    const talker = message.talker()
    //  跳过自己的发言
    if (talker.self()) {
      return
    }
    
    const msg = message.text()
    if (msg === 'stop all motor functions') {
      this.gameOver()
    }
    const name = talker.name()
    console.log(`${name}: ${msg}`)

    //  文字信息且四个字的就随便查查
    if (message.type() === 7 && this.wordRegExp.test(msg)) {
      //  查询是否成语
      if (this.idiomList.find(x => x.word === msg)) {
        //  比对成功, 且没有接龙过的词
        if (this.wordComparison(this.currentIdiom, msg) && this.idiomHistory.indexOf(msg) === -1) {
          //  已接龙过的词放进数组
          this.idiomHistory.push(msg)
          this.room.say(`🎊 恭喜 @${name}  接龙成功！`)
          //  排名
          this.rankList.push({
            name,
            id: talker.id,
          })
          this.reset()
          //  赋值新词
          this.currentIdiom = msg
          this.currentIndex++
          //  大于12条
          if (this.currentIndex > this.defaultOptions.rounds) {
            this.gameOver()
          } else {
            this.room.say(`第${this.currentIndex}条：👉${this.currentIdiom}👈`)
          }
        }
      } else {
        this.room.say(`【${msg}】不是成语哦`)
      }
    }    
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
          return `🥇 第1名：${item.data.name}  （接龙${item.data.count}次）`
        }
        if (item && index === 1) {
          return `🥈 第2名：${item.data.name}  （接龙${item.data.count}次）`
        }
        if (item && index === 2) {
          return `🥉 第3名：${item.data.name}  （接龙${item.data.count}次）`
        }
      })
  }

  /**
   * 游戏结束
   */
  private gameOver() {
    this.room.removeListener('message', this.fn)
    clearTimeout(this.globalTimer as NodeJS.Timeout)
    const result = this.genRankList()
    this.room.say([
      '游戏结束，现在公布成绩',
      ...result
    ].join('\n'))
    //  清除一波
    this.idiomHistory = []
    this.rankList = []
    this._resolve('game over')
  }
}

export default IdiomGame

interface IdiomGameOptions {
  rounds?: number,
  roundTimes?: number
}

interface RankList {
  name: string,
  id: string
}

interface wordObj {
  word: string,
  pinyin: string
}

interface rankTemp {
  [propName: string]: {
    name: string,
    count: number
  }
}