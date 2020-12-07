import txapi from './txapi'

export default function(question: string) {
  return new Promise(async (resolve, reject) => {
    txapi('tuling', {
      question
    })
      .then(res => {
        if (Array.isArray(res)) {
          resolve(res[0].reply)
        } else {
          reject(new Error('???'))
        }
      })
      .catch(err => {
        reject(new Error(err))
      })
  })
}