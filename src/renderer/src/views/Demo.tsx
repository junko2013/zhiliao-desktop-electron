import {Button} from "@nextui-org/button";
import { IpcEvents } from "@shared/ipc-events";
import { database } from "../db/api"
import {user} from "@shared/db/schema/user"

export default function Demo() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send(IpcEvents.EV_PING)
  const changeWinSize = (): void => window.electron.ipcRenderer.send(IpcEvents.EV_CHANGE_WINDOWS_SIZE, [{w: 320, h: 488}])
  
  const load = ()=>{
    database.query.user.findMany().then(result => {
      console.log(result)
    });
  }
  const add = async()=>{
     var result = await database.insert(user).values({
      id: Math.floor(Math.random() * 1000),
      nickname:"test",
      account:"test",
      age:Math.floor(Math.random() * 100)
    })
    console.log(result)
  }

  changeWinSize();
  return (
    <div>
      <Button onClick={add}>添加</Button>
      <Button onClick={load}>查询</Button>
    </div>
  )
}