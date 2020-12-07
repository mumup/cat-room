/**
 * 青客云
 * http://api.qingyunke.com/
 */
import got from 'got'
import config from '../config'

export default function (msg: string) {
  return new Promise((resolve, reject) => {
    got('http://api.qingyunke.com/api.php', {
      searchParams: {
        key: process.env.QYK_API_KEY,
        appid: 0,
        msg
      },
      responseType: 'json'
    })
      .then(res => {
        const { body, statusCode }: { body: any, statusCode: number } = res
        if (statusCode === 200 && body.result === 0) {
          body.content = replaceBotName(body.content)
          body.content = replaceLF(body.content)
          resolve(body.content)
        } else {
          reject(body.content || '调用错误')
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}

//  替换机器人的名字
function replaceBotName(content: string): string {
  return content.replace(/菲菲/, config.botName)
}

//  替换换行符
function replaceLF(content: string): string {
  return content.replace(/{br}/g, '\n')
}

interface ResObject {
  result: number,
  content: string,
}