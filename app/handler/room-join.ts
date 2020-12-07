import { Message, Room, Contact } from "wechaty"
export default async function(room: Room, inviteeList: Contact[], inviter: Contact) {
  const nameList = inviteeList.map(c => c.name()).join(',')
  await room.say(`欢迎新成员：${nameList}, \n进群的崽子统一昵称格式改为\n地区+猫咪品种+猫咪名字\n例如广州-英短-歪头\n`, ...inviteeList)
}