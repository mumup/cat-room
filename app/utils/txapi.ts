import got from 'got'

export default function(api: string, options?: any) {
  return new Promise((resolve, reject) => {
    got(`http://api.tianapi.com/txapi/${api}/index`, {
      searchParams: Object.assign({
        key: process.env.TIANX_API_KEY
      }, options),
      responseType: 'json'
    })
      .then(res => {
        console.log(res.body)
        const { body, statusCode }: { body: any, statusCode: number } = res
        if (statusCode === 200 && body.code === 200) {
          resolve(body.newslist)
        } else {
          reject(new Error(body.msg))
        }
      })
      .catch(err => {
        reject(err)
      })
  })
}